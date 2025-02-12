import { configure, task } from "@trigger.dev/sdk/v3"
import { z } from "zod"
import type { Team } from '@graham/db';
import { prisma, LeadStatus, EmailType } from '@graham/db'
import { companyResearch } from './functions/company-research'
import { googleDorkSearch, findLinkedInProfile } from './functions/google-dork'

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
      const updatedLead = await prisma.lead.update({
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

      return { 
        success: true,
        enrichmentData,
        lead: updatedLead
      }
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

async function processCompanyEmailPipeline(email: string, team: Team, leadId: string) {
  const googleResults = await googleDorkSearch(email)

  if (!googleResults.found) {
    console.error("No LinkedIn profile found for email: ", email)
    return {
      sources: ['google'],
      enrichedAt: new Date(),
      companyData: null
    }
  }

  const linkedInData = await findLinkedInProfile(googleResults.linkedInUrl)
  const companyData = await getOrUpdateCompanyData(linkedInData, team.id, leadId)

  return {
    ...linkedInData,
    sources: ['linkedin'],
    enrichedAt: new Date(),
    companyData
  }
}

async function processNonCompanyEmailPipeline(email: string, fullName: string, team: Team, leadId: string) {
  // Try Apollo + ExaLabs combination first
  const [exaResults] = await Promise.all([
    searchExaLabs(fullName)
  ])

  if (exaResults) {
    const linkedInData = await findLinkedInProfile(exaResults.linkedin_url)
    const companyData = await getOrUpdateCompanyData(linkedInData, team.id, leadId);

    return {
      ...exaResults,
      ...linkedInData,
      sources: ['exalabs', 'linkedin'],
      enrichedAt: new Date(),
      companyData
    }
  }

  // If ExaLabs failed, try Google dork search as fallback
  const googleResults = await googleDorkSearch(email, fullName)
  
  if (googleResults.found && googleResults.linkedInUrl) {
    const linkedInData = await findLinkedInProfile(googleResults.linkedInUrl)
    const companyData = await getOrUpdateCompanyData(linkedInData, team.id, leadId);

    return {
      ...linkedInData,
      sources: ['google', 'linkedin'],
      enrichedAt: new Date(),
      companyData
    }
  }

  throw new Error('Could not find matching profile')
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