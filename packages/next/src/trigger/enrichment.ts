import { configure, task } from "@trigger.dev/sdk/v3"
import { z } from "zod"
import type { Team } from '@graham/db';
import { prisma, LeadStatus, EmailType } from '@graham/db'
import { Stagehand } from '@browserbasehq/stagehand'
import { companyResearch } from './functions/company-research'
import { getApolloData, findLinkedInProfile } from './functions/google-dork'

configure({
    secretKey: process.env.TRIGGER_SECRET_KEY
})

// TODO: add clay to the enrichment task 

const enrichmentSchema = z.object({
  teamId: z.string(),
  email: z.string(),
  leadId: z.string(),
  metadata: z.record(z.any())
})

/**
 testing 

 {
  "teamId": "org_2sNcZhdY370JIWGbQQjmPggk9Ta",
  "email": "khalil@pear.vc",
  "leadId": "asdf",
  "metadata": {}
 }
 */

type EnrichmentPayload = z.infer<typeof enrichmentSchema>

// Create enrichment task (v3 syntax)
export const enrichUserTask = task({
  id: "enrich-user",
  run: async (payload: EnrichmentPayload) => {
    const { teamId, email, metadata, leadId } = payload; 
    try {
      // Get the lead for this user
      const team = await prisma.team.findFirst({
        where: { id: teamId },
        include: { leads: true }
      })

      const lead = await prisma.lead.findFirst({
        where: { id: leadId }
      })

      if(!lead) {
        throw new Error('No lead found')
      }

      if(!team) {
        throw new Error('No team found')
      }

      // Process enrichment
      const isCompanyEmail = lead.emailType === EmailType.COMPANY
      const enrichmentData = isCompanyEmail 
        ? await processCompanyEmailPipeline(email, team, leadId)
        : await processNonCompanyEmailPipeline(email, `${lead.firstName} ${lead.lastName}`.trim(), team, leadId)
      
      // Update lead with enriched data
      await prisma.lead.update({
        where: { id: leadId },
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
          leadId: leadId,
          teamId: teamId,
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
      
      const team = await prisma.team.findFirst({
        where: { id: teamId },
        include: { leads: true }
      })

      if (team && leadId) {
        // Log failure activity
        await prisma.activity.create({
          data: {
            type: 'enrichment_failed',
            description: `Enrichment failed for ${email}: ${(error as Error).message}`,
            leadId: leadId,
            teamId: teamId,
            metadata: {
              ...metadata,
              error: (error as Error).message
            }
          }
        })

        // Update lead status
        await prisma.lead.update({
          where: { id: leadId },
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
//https://api.apollo.io/api/v1/mixed_people/search

async function processCompanyEmailPipeline(email: string, team: Team, leadId: string) {
  const [apolloData, linkedInData] = await Promise.all([
    getApolloData(email),
    findLinkedInProfile(email),
  ])

  const companyData = await getOrUpdateCompanyData(linkedInData, team.id, leadId)

  return {
    ...apolloData,
    ...linkedInData,
    sources: ['apollo', 'linkedin'],
    enrichedAt: new Date(),
    companyData
  }
}

async function processNonCompanyEmailPipeline(email: string, fullName: string, team: Team, leadId: string) {
  // Try Apollo + ExaLabs combination first
  const [apolloResults, exaResults] = await Promise.all([
    searchApollo(fullName),
    searchExaLabs(fullName)
  ])

  // Find matching profiles from Exa + Apollo
  const matchedProfile = findMatchingProfile(apolloResults, exaResults)
  if (matchedProfile) {
    const linkedInData = await findLinkedInProfile(matchedProfile.linkedInUrl)
    const companyData = await getOrUpdateCompanyData(linkedInData, team.id, leadId);

    return {
      ...matchedProfile,
      ...linkedInData,
      sources: ['apollo', 'exalabs', 'linkedin'],
      enrichedAt: new Date(),
      companyData
    }
  }

  // If ExaLabs failed, try Google dork search as fallback
  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    enableCaching: true
  })

  try {
    await stagehand.init()
    const googleResults = await googleDorkSearch(stagehand, email, fullName)
    
    if (googleResults.found && googleResults.linkedInUrl) {
      const [apolloData, linkedInData] = await Promise.all([
        getApolloData(email),
        findLinkedInProfile(googleResults.linkedInUrl)
      ])

      const companyData = await getOrUpdateCompanyData(linkedInData, team.id, leadId);

      return {
        ...apolloData,
        ...linkedInData,
        sources: ['google', 'apollo', 'linkedin'],
        enrichedAt: new Date(),
        companyData
      }
    }

    throw new Error('Could not find matching profile')
  } finally {
    await stagehand.close()
  }
}

async function getOrUpdateCompanyData(linkedInData: any, teamId: string, leadId: string) {
  let companyData;

  if (linkedInData.companyUrl) {
    companyData = await prisma.companyData.findFirst({
      where: { companyUrl: linkedInData.companyUrl }
    });

    // Update if older than 30 days or doesn't exist
    if (!companyData || companyData.updatedAt < new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)) {
      companyData = await companyResearch({
        companyUrl: linkedInData.companyUrl,
        teamId,
        metadata: {},
        leadId
      });

      if (companyData) {
        await prisma.companyData.upsert({
          where: { companyUrl: linkedInData.companyUrl },
          create: {
            companyName: linkedInData.companyName || '',
            companyUrl: linkedInData.companyUrl,
            ...companyData
          },
          update: {
            updatedAt: new Date(),
            ...companyData
          }
        });
      }
    }
  }
  return companyData;
}

async function googleDorkSearch(stagehand: Stagehand, email: string, fullName: string) {
  const searchQuery = `site:linkedin.com/in/ "${fullName}" OR "${email.split('@')[0]}"`
  await stagehand.page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`)
  
  const linkedInUrl = await stagehand.page.extract({
    instruction: "extract the first LinkedIn profile URL from the search results",
    schema: z.object({
      url: z.string().url()
    })
  })

  return {
    found: !!linkedInUrl.url,
    linkedInUrl: linkedInUrl.url
  }
}

async function searchApollo(fullName: string) {
  const response = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Api-Key ${process.env.APOLLO_API_KEY}`
    },
    body: JSON.stringify({
      q_person_name: fullName,
      page: 1,
      per_page: 5
    })
  })

  if (!response.ok) {
    throw new Error(`Apollo API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.people || []
}

async function searchExaLabs(fullName: string) {
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EXALABS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: fullName,
      limit: 5,
      useAutoprompt: true
    })
  })

  if (!response.ok) {
    throw new Error(`ExaLabs API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  if (data.results) {
    return data.results;
  }
  else {
    console.error('No results found for ExaLabs search');
    return [];
  }
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