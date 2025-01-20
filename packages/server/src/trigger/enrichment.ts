import { configure, task } from "@trigger.dev/sdk/v3"
import { z } from "zod"
import { prisma, LeadStatus, EmailType } from '@graham/db'
import axios from 'axios'
import { Stagehand } from '@browserbasehq/stagehand'

configure({
    secretKey: process.env.TRIGGER_SECRET_KEY
})

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

// Helper functions moved from server
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

// Clay API client setup
const clayClient = axios.create({
  baseURL: 'https://api.clay.run/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.CLAY_API_KEY}`
  }
})

// Clay enrichment function
async function getClayData(email: string, fullName?: string) {
  try {
    const { data } = await clayClient.post('/enrich', {
      email,
      name: fullName,
      enrich_person: true,
      enrich_company: true
    })

    if (!data.person) {
      throw new Error('Person not found in Clay')
    }

    const { person, company } = data

    return {
      company: company?.name,
      title: person.title,
      industry: company?.industry,
      companySize: company?.employee_count,
      location: person.location,
      linkedInUrl: person.linkedin_url,
      twitterUrl: person.twitter_url,
      githubUrl: person.github_url,
      enrichmentData: {
        person,
        company,
        sources: ['clay']
      }
    }
  } catch (error) {
    console.error('Error getting Clay data:', error)
    throw error
  }
}

async function processCompanyEmailPipeline(email: string) {
  const [apolloData, clayData, linkedInData] = await Promise.all([
    getApolloData(email),
    getClayData(email),
    findLinkedInProfile(email)
  ])

  return {
    ...apolloData,
    ...clayData,
    ...linkedInData,
    sources: ['apollo', 'clay', 'linkedin'],
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
    // First try Clay enrichment
    try {
      const clayData = await getClayData(email, fullName)
      if (clayData.linkedInUrl) {
        const [apolloData, linkedInData] = await Promise.all([
          getApolloData(email),
          findLinkedInProfile(clayData.linkedInUrl)
        ])

        return {
          ...apolloData,
          ...clayData,
          ...linkedInData,
          sources: ['clay', 'apollo', 'linkedin'],
          enrichedAt: new Date()
        }
      }
    } catch (error) {
      console.log('Clay enrichment failed, falling back to other methods:', error)
    }

    // If Clay fails, try Google dork search
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