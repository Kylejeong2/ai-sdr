import { prisma, LeadStatus } from '@graham/db'
import type { CompanyResearchPayload, NewsItem, Video, RedditPost, Founder, Competitor } from '../../types/company-search'

/*
Company Research Function through exa search 
*/

// Create company research task
export async function companyResearch(payload: CompanyResearchPayload) {
    const { companyUrl, metadata, teamId, leadId } = payload
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
      const team = await prisma.team.findFirst({
        where: { id: teamId },
      })

      let lead = await prisma.lead.findFirst({
        where: { id: leadId }
      })
  
      if (!team) {
        throw new Error('No team found for user')
      }
  
      if (!lead) {
        throw new Error('No lead found')
      }
  
      // Update lead with enriched data
      lead = await prisma.lead.update({
        where: { id: leadId },
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
          leadId: leadId,
          teamId: teamId,
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
      
      const team = await prisma.team.findFirst({
        where: { id: teamId },
        include: { leads: true }
      })
  
      if (team && leadId) {
        // Log failure activity
        await prisma.activity.create({
          data: {
            type: 'company_research_failed',
            description: `Company research failed for ${companyUrl}: ${(error as Error).message}`,
            leadId: leadId,
            teamId: team.id,
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