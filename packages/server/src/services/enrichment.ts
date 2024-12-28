import { prisma, LeadStatus } from '@graham/db'
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

    // Find the team member record for this user
    const teamMember = user.team.members.find(m => m.userId === userId)
    if (!teamMember) throw new Error('Team member not found')

    const lead = teamMember.leads[0]
    if (!lead) throw new Error('No lead found for user')

    try {
      // Get enrichment data
      const [linkedInData, apolloData, exaLabsData] = await Promise.all([
        this.scrapeLinkedIn(user.email),
        this.getApolloData(user.email),
        this.getExaLabsData(user.email)
      ])

      // Combine enrichment data
      const enrichmentData = {
        linkedin: linkedInData,
        apollo: apolloData,
        exaLabs: exaLabsData,
        enrichedAt: new Date()
      }

      // Update lead with enriched data
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          linkedInUrl: linkedInData.profileUrl,
          company: linkedInData.company || apolloData.company,
          title: linkedInData.title || apolloData.title,
          industry: linkedInData.industry || apolloData.industry,
          companySize: apolloData.companySize,
          location: apolloData.location,
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
            enrichmentSource: ['linkedin', 'apollo', 'exalabs'],
            foundData: {
              company: !!linkedInData.company || !!apolloData.company,
              title: !!linkedInData.title || !!apolloData.title,
              industry: !!linkedInData.industry || !!apolloData.industry
            }
          }
        }
      })

    } catch (error) {
      console.error('Error in processEnrichment:', error)
      
      // Update lead status to failed
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

  private async scrapeLinkedIn(email: string) {
    try {
      const stagehand = new Stagehand({
        // env: 'BROWSERBASE',
        env: 'LOCAL',
        enableCaching: true
      });

      await stagehand.init();

      await stagehand.page.goto(`https://www.linkedin.com/`);
      
      await stagehand.act({ 
        action: `click on the first profile link that appears ${email}`
      });

      // Extract profile data
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

    } catch (error) {
      console.error('Error scraping LinkedIn:', error);
      throw error;
    }
  }

  private async getApolloData(email: string) {
    try {
      // Search for person in Apollo
      const { data } = await apolloClient.post('/people/search', {
        q_organization_domains: [email.split('@')[1]],
        q_emails: [email]
      })

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
          organization
        }
      }
    } catch (error) {
      console.error('Error getting Apollo data:', error)
      throw error
    }
  }

  private async getExaLabsData(email: string) {
    try {
      const { data } = await exaLabsClient.post('/v1/search', {
        email,
        enrich: true,
        include_social: true
      })

      if (!data.results || data.results.length === 0) {
        throw new Error('Person not found in ExaLabs')
      }

      const person = data.results[0]
      return {
        socialProfiles: person.social_profiles,
        workHistory: person.work_history,
        education: person.education,
        skills: person.skills,
        interests: person.interests
      }
    } catch (error) {
      console.error('Error getting ExaLabs data:', error)
      throw error
    }
  }
}