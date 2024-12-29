import { prisma, LeadStatus, EmailType } from '@graham/db'
import axios from 'axios'
import { Stagehand } from '@browserbasehq/stagehand'
import { z } from 'zod'
import { Client } from "@upstash/qstash"

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

const QSTASH = new Client({ token: process.env.QSTASH_TOKEN! });

export class EnrichmentService {
  async addToEnrichmentQueue(
    userId: string,
    teamId: string,
    email: string,
    metadata: any
  ) {
    await QSTASH.publishJSON({
      url: `${process.env.NEXT_PUBLIC_API_URL}/api/webhook/enrich`,
      body: { userId, teamId, email, metadata },
      options: {
        retries: 3,
        deduplicationId: userId,
        delay: 0
      }
    });
  }

  async processEnrichment(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            members: {
              include: {
                leads: true
              }
            }
          }
        }
      }
    })

    if (!user) throw new Error('User not found')

    const teamMember = user.team.members.find(m => m.userId === userId)
    if (!teamMember) throw new Error('Team member not found')

    const lead = teamMember.leads[0]
    if (!lead) throw new Error('No lead found for user')

    try {
      const isCompanyEmail = lead.emailType === EmailType.COMPANY
      const enrichmentData = isCompanyEmail 
        ? await this.processCompanyEmailPipeline(user.email)
        : await this.processNonCompanyEmailPipeline(user.email, `${lead.firstName} ${lead.lastName}`.trim())

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

      await prisma.activity.create({
        data: {
          type: 'enrichment_success',
          description: `Successfully enriched data for ${user.email}`,
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

    } catch (error) {
      console.error('Error in processEnrichment:', error)
      
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: LeadStatus.ENRICHED,
          enrichmentData: {
            error: (error as Error).message,
            failedAt: new Date()
          }
        }
      })

      throw error
    }
  }

  private async processCompanyEmailPipeline(email: string) {
    // For company emails, we can directly find their LinkedIn profile
    const [apolloData, linkedInData] = await Promise.all([
      this.getApolloData(email),
      this.findLinkedInProfile(email)
    ])

    return {
      ...apolloData,
      ...linkedInData,
      sources: ['apollo', 'linkedin'],
      enrichedAt: new Date()
    }
  }

  private async processNonCompanyEmailPipeline(email: string, fullName: string) {
    const stagehand = new Stagehand({
      env: 'LOCAL',
      enableCaching: true
    });

    await stagehand.init();

    // First try Google dork search
    const googleResults = await this.googleDorkSearch(stagehand, email, fullName)
    if (googleResults.found && googleResults.linkedInUrl) {
      const [apolloData, linkedInData] = await Promise.all([
        this.getApolloData(email),
        this.findLinkedInProfile(googleResults.linkedInUrl)
      ])

      await stagehand.close()
      return {
        ...apolloData,
        ...linkedInData,
        sources: ['google', 'apollo', 'linkedin'],
        enrichedAt: new Date()
      }
    }

    // If Google search fails, try Apollo + ExaLabs combination
    const [apolloResults, exaResults] = await Promise.all([
      this.searchApollo(fullName),
      this.searchExaLabs(fullName)
    ])

    // Find matching profiles between Apollo and ExaLabs
    const matchedProfile = this.findMatchingProfile(apolloResults, exaResults)
    if (matchedProfile) {
      const linkedInData = await this.findLinkedInProfile(matchedProfile.linkedInUrl)
      
      await stagehand.close()
      return {
        ...matchedProfile,
        ...linkedInData,
        sources: ['apollo', 'exalabs', 'linkedin'],
        enrichedAt: new Date()
      }
    }

    await stagehand.close()
    throw new Error('Could not find matching profile')
  }

  private async googleDorkSearch(stagehand: Stagehand, email: string, fullName: string) {
    const searchQuery = `site:linkedin.com/in/ "${fullName}" OR "${email.split('@')[0]}"`
    
    await stagehand.page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
    
    const linkedInUrl = await stagehand.extract({
      instruction: "extract the first LinkedIn profile URL from the search results",
      schema: z.object({
        url: z.string().url().optional()
      })
    });

    return {
      found: !!linkedInUrl.url,
      linkedInUrl: linkedInUrl.url
    }
  }

  private async searchApollo(fullName: string) {
    const { data } = await apolloClient.post('/people/search', {
      q_person_name: fullName,
      page: 1,
      per_page: 5
    })
    return data.people || []
  }

  private async searchExaLabs(fullName: string) {
    const { data } = await exaLabsClient.post('/v1/search', {
      query: fullName,
      limit: 5
    })
    return data.results || []
  }

  private findMatchingProfile(apolloResults: any[], exaResults: any[]) {
    // Match profiles based on name, company, title similarity
    for (const apollo of apolloResults) {
      const match = exaResults.find(exa => 
        this.calculateProfileSimilarity(apollo, exa) > 0.8
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

  private calculateProfileSimilarity(apollo: any, exa: any): number {
    let score = 0
    
    // Name similarity
    if (apollo.name.toLowerCase() === exa.name.toLowerCase()) score += 0.4
    
    // Company similarity
    if (apollo.organization?.name?.toLowerCase() === exa.company?.toLowerCase()) score += 0.3
    
    // Title similarity
    if (apollo.title?.toLowerCase() === exa.title?.toLowerCase()) score += 0.3
    
    return score
  }

  private async findLinkedInProfile(linkedInUrl: string) {
    const stagehand = new Stagehand({
      env: 'LOCAL',
      enableCaching: true
    });

    await stagehand.init();
    await stagehand.page.goto(linkedInUrl);
    
    const profileData = await stagehand.extract({
      instruction: "extract the person's current company, title, industry and location from their profile",
      schema: z.object({
        company: z.string().optional(),
        title: z.string().optional(), 
        industry: z.string().optional(),
        location: z.string().optional(),
        profileUrl: z.string()
      })
    });

    await stagehand.close();
    return profileData;
  }

  private async getApolloData(email: string) {
    try {
      const [username, domain] = email.split('@')
      
      if (!username || !domain) {
        throw new Error('Invalid email format')
      }

      // Clean domain by removing common email providers
      const commonEmailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com']
      const isCompanyDomain = !commonEmailProviders.includes(domain)
      
      // Build search params based on available data
      const searchParams: any = {
        q_emails: [email]
      }

      if (isCompanyDomain) {
        // If it's a company domain, add organization search params
        searchParams.q_organization_domains = [domain]
        
        // Try to extract company name from domain
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
}