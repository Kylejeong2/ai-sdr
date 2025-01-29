import { configure, task } from "@trigger.dev/sdk/v3"
import { z } from "zod"
import { prisma, LeadStatus, EmailType } from '@graham/db'
import axios from 'axios'
import { Stagehand } from '@browserbasehq/stagehand'
import type { CompanyResearchPayload, NewsItem, Video, RedditPost, Founder, Competitor } from '../types/company-search'

configure({
    secretKey: process.env.TRIGGER_SECRET_KEY
})

// add clay to the enrichment task

// Define enrichment task schema
const enrichmentSchema = z.object({
  userId: z.string(),
  teamId: z.string(),
  email: z.string(),
  metadata: z.record(z.any())
})

type EnrichmentPayload = z.infer<typeof enrichmentSchema>

// Create enrichment task (v3 syntax)
export const enrichUserTask = task({
  id: "enrich-user",
  run: async (payload: EnrichmentPayload) => {
    const { userId, email, metadata } = payload
    try {
      // Get the lead for this user
      const teamMember = await prisma.teamMember.findFirst({
        where: { userId },
        include: { leads: true }
      })

      if (!teamMember || !teamMember.leads[0]) {
        throw new Error('No lead found for user')
      }

      const lead = teamMember.leads[0]

      // Process enrichment
      const isCompanyEmail = lead.emailType === EmailType.COMPANY
      const enrichmentData = isCompanyEmail 
        ? await processCompanyEmailPipeline(email)
        : await processNonCompanyEmailPipeline(email, `${lead.firstName} ${lead.lastName}`.trim())

      // Update lead with enriched data
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          linkedInUrl: enrichmentData.linkedInUrl,
          company: enrichmentData.company,
          title: enrichmentData.title,
          industry: enrichmentData.industry,
          companySize: enrichmentData.companySize,
          location: enrichmentData.location,
          enrichmentData,
          status: LeadStatus.ENRICHED
        }
      })

      // Log success activity
      await prisma.activity.create({
        data: {
          type: 'enrichment_success',
          description: `Successfully enriched data for ${email}`,
          leadId: lead.id,
          teamMemberId: teamMember.id,
          metadata: {
            enrichmentSource: enrichmentData.sources,
            foundData: {
              company: !!enrichmentData.company,
              title: !!enrichmentData.title,
              industry: !!enrichmentData.industry
            }
          }
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error in enrichment job:', error)
      
      const teamMember = await prisma.teamMember.findFirst({
        where: { userId },
        include: { leads: true }
      })

      if (teamMember && teamMember.leads[0]) {
        // Log failure activity
        await prisma.activity.create({
          data: {
            type: 'enrichment_failed',
            description: `Enrichment failed for ${email}: ${(error as Error).message}`,
            leadId: teamMember.leads[0].id,
            teamMemberId: teamMember.id,
            metadata: {
              ...metadata,
              error: (error as Error).message
            }
          }
        })

        // Update lead status
        await prisma.lead.update({
          where: { id: teamMember.leads[0].id },
          data: {
            status: LeadStatus.ENRICHED,
            enrichmentData: {
              error: (error as Error).message,
              failedAt: new Date()
            }
          }
        })
      }

      throw error
    }
  }
})

const apolloClient = axios.create({
  baseURL: 'https://api.apollo.io/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Api-Key ${process.env.APOLLO_API_KEY}`
  }
})

const exaLabsClient = axios.create({
  baseURL: 'https://api.exalabs.ai',
  headers: {
    'Authorization': `Bearer ${process.env.EXALABS_API_KEY}`,
    'Content-Type': 'application/json'
  }
})

async function processCompanyEmailPipeline(email: string) {
  const [apolloData, linkedInData] = await Promise.all([
    getApolloData(email),
    findLinkedInProfile(email)
  ])

  return {
    ...apolloData,
    ...linkedInData,
    sources: ['apollo', 'linkedin'],
    enrichedAt: new Date()
  }
}

async function processNonCompanyEmailPipeline(email: string, fullName: string) {
  const stagehand = new Stagehand({
    env: 'LOCAL',
    enableCaching: true
  })

  await stagehand.init()

  try {
    // First try Google dork search
    const googleResults = await googleDorkSearch(stagehand, email, fullName)
    if (googleResults.found && googleResults.linkedInUrl) {
      const [apolloData, linkedInData] = await Promise.all([
        getApolloData(email),
        findLinkedInProfile(googleResults.linkedInUrl)
      ])

      return {
        ...apolloData,
        ...linkedInData,
        sources: ['google', 'apollo', 'linkedin'],
        enrichedAt: new Date()
      }
    }

    // If Google search fails, try Apollo + ExaLabs combination
    const [apolloResults, exaResults] = await Promise.all([
      searchApollo(fullName),
      searchExaLabs(fullName)
    ])

    // Find matching profiles
    const matchedProfile = findMatchingProfile(apolloResults, exaResults)
    if (matchedProfile) {
      const linkedInData = await findLinkedInProfile(matchedProfile.linkedInUrl)
      return {
        ...matchedProfile,
        ...linkedInData,
        sources: ['apollo', 'exalabs', 'linkedin'],
        enrichedAt: new Date()
      }
    }

    throw new Error('Could not find matching profile')
  } finally {
    await stagehand.close()
  }
}

async function googleDorkSearch(stagehand: Stagehand, email: string, fullName: string) {
  const searchQuery = `site:linkedin.com/in/ "${fullName}" OR "${email.split('@')[0]}"`
  await stagehand.page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`)
  
  const linkedInUrl = await stagehand.extract({
    instruction: "extract the first LinkedIn profile URL from the search results",
    schema: z.object({
      url: z.string().url().optional()
    })
  })

  return {
    found: !!linkedInUrl.url,
    linkedInUrl: linkedInUrl.url
  }
}

async function searchApollo(fullName: string) {
  const { data } = await apolloClient.post('/people/search', {
    q_person_name: fullName,
    page: 1,
    per_page: 5
  })
  return data.people || []
}

async function searchExaLabs(fullName: string) {
  const { data } = await exaLabsClient.post('/v1/search', {
    query: fullName,
    limit: 5
  })
  return data.results || []
}

function findMatchingProfile(apolloResults: any[], exaResults: any[]) {
  for (const apollo of apolloResults) {
    const match = exaResults.find(exa => 
      calculateProfileSimilarity(apollo, exa) > 0.8
    )
    if (match) {
      return {
        ...apollo,
        linkedInUrl: match.linkedin_url
      }
    }
  }
  return null
}

function calculateProfileSimilarity(apollo: any, exa: any): number {
  let score = 0
  
  if (apollo.name.toLowerCase() === exa.name.toLowerCase()) score += 0.4
  if (apollo.organization?.name?.toLowerCase() === exa.company?.toLowerCase()) score += 0.3
  if (apollo.title?.toLowerCase() === exa.title?.toLowerCase()) score += 0.3
  
  return score
}

async function findLinkedInProfile(linkedInUrl: string) {
  const stagehand = new Stagehand({
    env: 'LOCAL',
    enableCaching: true
  })

  await stagehand.init()
  
  try {
    await stagehand.page.goto(linkedInUrl)
    
    return await stagehand.extract({
      instruction: "extract the person's current company, title, industry and location from their profile",
      schema: z.object({
        company: z.string().optional(),
        title: z.string().optional(), 
        industry: z.string().optional(),
        location: z.string().optional(),
        profileUrl: z.string()
      })
    })
  } finally {
    await stagehand.close()
  }
}

async function getApolloData(email: string) {
  try {
    const [username, domain] = email.split('@')
    
    if (!username || !domain) {
      throw new Error('Invalid email format')
    }

    const commonEmailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com']
    const isCompanyDomain = !commonEmailProviders.includes(domain)
    
    const searchParams: any = {
      q_emails: [email]
    }

    if (isCompanyDomain) {
      searchParams.q_organization_domains = [domain]
      const [companyName] = domain.split('.')
      if (companyName) {
        searchParams.q_organization_name = companyName
      }
    }

    const { data } = await apolloClient.post('/people/search', searchParams)

    if (!data.people || data.people.length === 0) {
      throw new Error('Person not found in Apollo')
    }

    const person = data.people[0]
    const organization = person.organization

    return {
      company: organization.name,
      title: person.title,
      industry: organization.industry,
      companySize: organization.employee_count,
      location: `${person.city}, ${person.state}`,
      enrichmentData: {
        person,
        organization,
        domain,
        isCompanyDomain
      }
    }
  } catch (error) {
    console.error('Error getting Apollo data:', error)
    throw error
  }
}

// Create company research task
export const companyResearchTask = task({
  id: "company-research",
  run: async (payload: CompanyResearchPayload) => {
    const { userId, companyUrl, metadata } = payload
    try {
      // Extract domain name
      const domainName = extractDomain(companyUrl)
      if (!domainName) {
        throw new Error('Invalid company URL')
      }

      // Run all API calls in parallel
      const [
        mainPageData,
        linkedinData,
        newsData,
        twitterData,
        youtubeData,
        redditData,
        githubUrl,
        fundingData,
        financialReport,
        tiktokData,
        wikipediaData,
        crunchbaseData,
        pitchbookData,
        tracxnData,
        foundersData
      ]: [
        any[],
        any,
        NewsItem[],
        any,
        Video[],
        RedditPost[],
        string | null,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        Founder[]
      ] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/scrapewebsiteurl`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteurl: domainName })
        }).then(res => res.json()).then(data => data.results),

        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/scrapelinkedin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteurl: domainName })
        }).then(res => res.json()).then(data => data.results[0]),

        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/findnews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteurl: domainName })
        }).then(res => res.json()).then(data => data.results),

        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/scrapetwitterprofile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteurl: domainName })
        }).then(res => res.json()).then(data => data.results[0]),

        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/fetchyoutubevideos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteurl: domainName })
        }).then(res => res.json()).then(data => data.results),

        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/scrapereddit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteurl: domainName })
        }).then(res => res.json()).then(data => data.results),

        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/fetchgithuburl`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteurl: domainName })
        }).then(res => res.json()).then(data => data.results[0]?.url),

        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/fetchfunding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteurl: domainName })
        }).then(res => res.json()).then(data => data.results[0]),

        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/fetchfinancialreport`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteurl: domainName })
        }).then(res => res.json()).then(data => data.results),

        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/fetchtiktok`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteurl: domainName })
        }).then(res => res.json()).then(data => data.results[0]),

        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/fetchwikipedia`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteurl: domainName })
        }).then(res => res.json()).then(data => data.results[0]),

        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/fetchcrunchbase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteurl: domainName })
        }).then(res => res.json()).then(data => data.results[0]),

        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/fetchpitchbook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteurl: domainName })
        }).then(res => res.json()).then(data => data.results[0]),

        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/fetchtracxn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteurl: domainName })
        }).then(res => res.json()).then(data => data.results[0]),

        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/fetchfounders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteurl: domainName })
        }).then(res => res.json()).then(data => data.results)
      ])

      // Get additional data that depends on main page data
      let competitors = null
      let companySummary = null
      let companyMap = null

      if (mainPageData && mainPageData[0]?.summary) {
        // const [companyDetails, competitorsData] = await Promise.all([ // for when we export 
        await Promise.all([
          // Company details
          (async () => {
            const subpagesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/scrapewebsitesubpages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ websiteurl: domainName })
            })
            const subpagesData = await subpagesResponse.json()

            const [summaryResponse, mapResponse] = await Promise.all([
              fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/companysummary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  subpages: subpagesData.results,
                  mainpage: mainPageData,
                  websiteurl: domainName
                })
              }),
              fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/companymap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  mainpage: mainPageData,
                  websiteurl: domainName
                })
              })
            ])

            companySummary = (await summaryResponse.json()).result
            companyMap = (await mapResponse.json()).result
          })(),

          // Competitors
          fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/findcompetitors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              websiteurl: domainName,
              summaryText: mainPageData[0].summary
            })
          }).then(res => res.json()).then(data => {
            competitors = data.results
          })
        ])
      }

      // Get recent tweets if Twitter profile exists
      let recentTweets = null
      if (twitterData?.author) {
        const tweetsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-search/scraperecenttweets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: twitterData.author })
        })
        recentTweets = (await tweetsResponse.json()).results
      }

      // Compile all data
      const enrichedData = {
        mainPage: mainPageData ? JSON.parse(JSON.stringify(mainPageData)) : null,
        linkedin: linkedinData ? JSON.parse(JSON.stringify(linkedinData)) : null,
        news: newsData ? JSON.parse(JSON.stringify(newsData)) : null,
        twitter: {
          profile: twitterData ? JSON.parse(JSON.stringify(twitterData)) : null,
          recentTweets: recentTweets ? JSON.parse(JSON.stringify(recentTweets)) : null
        },
        youtube: youtubeData ? JSON.parse(JSON.stringify(youtubeData)) : null,
        reddit: redditData ? JSON.parse(JSON.stringify(redditData)) : null,
        github: githubUrl,
        funding: fundingData ? JSON.parse(JSON.stringify(fundingData)) : null,
        financial: financialReport ? JSON.parse(JSON.stringify(financialReport)) : null,
        tiktok: tiktokData ? JSON.parse(JSON.stringify(tiktokData)) : null,
        wikipedia: wikipediaData ? JSON.parse(JSON.stringify(wikipediaData)) : null,
        crunchbase: crunchbaseData ? JSON.parse(JSON.stringify(crunchbaseData)) : null,
        pitchbook: pitchbookData ? JSON.parse(JSON.stringify(pitchbookData)) : null,
        tracxn: tracxnData ? JSON.parse(JSON.stringify(tracxnData)) : null,
        founders: foundersData ? JSON.parse(JSON.stringify(foundersData)) : null,
        competitors: competitors ? JSON.parse(JSON.stringify(competitors)) : null,
        companySummary: companySummary ? JSON.parse(JSON.stringify(companySummary)) : null,
        companyMap: companyMap ? JSON.parse(JSON.stringify(companyMap)) : null,
        enrichedAt: new Date().toISOString()
      } as const;

      // Store enriched data
      const teamMember = await prisma.teamMember.findFirst({
        where: { userId },
        include: { leads: true }
      })

      if (!teamMember) {
        throw new Error('No team member found for user')
      }

      if (!teamMember.leads[0]) {
        throw new Error('No lead found for team member')
      }

      // Update lead with enriched data
      const lead = await prisma.lead.update({
        where: { id: teamMember.leads[0].id },
        data: {
          enrichmentData: enrichedData as any,
          status: LeadStatus.ENRICHED
        }
      })

      // Log success activity
      await prisma.activity.create({
        data: {
          type: 'company_research_success',
          description: `Successfully researched company data for ${domainName}`,
          leadId: lead.id,
          teamMemberId: teamMember.id,
          metadata: {
            foundData: {
              linkedin: !!linkedinData,
              news: newsData && (newsData as NewsItem[]).length > 0,
              twitter: !!twitterData,
              youtube: youtubeData && (youtubeData as Video[]).length > 0,
              reddit: redditData && (redditData as RedditPost[]).length > 0,
              github: !!githubUrl,
              funding: !!fundingData,
              financial: !!financialReport,
              tiktok: !!tiktokData,
              wikipedia: !!wikipediaData,
              crunchbase: !!crunchbaseData,
              pitchbook: !!pitchbookData,
              tracxn: !!tracxnData,
              founders: foundersData && (foundersData as Founder[]).length > 0,
              competitors: competitors && (competitors as Competitor[]).length > 0,
              summary: !!companySummary,
              map: !!companyMap
            }
          }
        }
      })

      return { success: true, data: enrichedData }

    } catch (error) {
      console.error('Error in company research job:', error)
      
      const teamMember = await prisma.teamMember.findFirst({
        where: { userId },
        include: { leads: true }
      })

      if (teamMember && teamMember.leads[0]) {
        // Log failure activity
        await prisma.activity.create({
          data: {
            type: 'company_research_failed',
            description: `Company research failed for ${companyUrl}: ${(error as Error).message}`,
            leadId: teamMember.leads[0].id,
            teamMemberId: teamMember.id,
            metadata: {
              ...metadata,
              error: (error as Error).message
            }
          }
        })
      }

      throw error
    }
  }
})

// Helper function to extract domain from URL
function extractDomain(url: string): string | null {
  try {
    let cleanUrl = url.trim().toLowerCase()
    
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl
    }

    const parsedUrl = new URL(cleanUrl)
    const domain = parsedUrl.hostname.replace(/^www\./, '')
    
    if (!domain.includes('.') || domain.includes(' ')) {
      return null
    }

    return domain
  } catch {
    return null
  }
}