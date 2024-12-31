import { type FastifyInstance } from 'fastify'
import { Webhook } from 'svix'
import { prisma, LeadStatus } from '@graham/db'
import { EnrichmentService } from '../services/enrichment'
import { detectEmailType } from '../utils/emailUtils'

const enrichmentService = new EnrichmentService()
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

type ClerkWebhookPayload = {
  type: string
  data: {
    id: string
    email_addresses: Array<{
      email_address: string
      id: string
      verification: { status: string }
    }>
    first_name: string | null
    last_name: string | null
    created_at: number
  }
}

export async function webhookRoutes(fastify: FastifyInstance) {
  fastify.post('/clerk', async (request, reply) => {
    const headers = request.headers
    const payload = request.body as ClerkWebhookPayload

    // Verify webhook signature
    const wh = new Webhook(CLERK_WEBHOOK_SECRET!)
    try {
      wh.verify(
        JSON.stringify(payload),
        {
          'svix-id': headers['svix-id'] as string,
          'svix-timestamp': headers['svix-timestamp'] as string,
          'svix-signature': headers['svix-signature'] as string,
        }
      )
    } catch (err) {
      reply.code(400).send('Invalid webhook signature')
      return
    }

    // Handle user.created event
    if (payload.type === 'user.created') {
      const { id, email_addresses, first_name, last_name } = payload.data
      const primaryEmail = email_addresses[0]?.email_address

      if (!primaryEmail) {
        reply.code(400).send('No primary email found')
        return
      }

      try {
        const team = await prisma.team.create({
          data: {
            name: `${first_name || 'New'}'s Team`,
          }
        })

        // Create user in our database
        const user = await prisma.user.create({
          data: {
            clerkId: id,
            email: primaryEmail,
            firstName: first_name || undefined,
            lastName: last_name || undefined,
            teamId: team.id
          }
        })

        // Create team member entry
        await prisma.teamMember.create({
          data: {
            userId: user.id,
            teamId: team.id,
            role: 'OWNER'
          }
        })

        // Create lead for tracking
        const emailType = detectEmailType(primaryEmail)
        const lead = await prisma.lead.create({
          data: {
            email: primaryEmail,
            emailType,
            firstName: first_name || undefined,
            lastName: last_name || undefined,
            status: LeadStatus.NEW,
            assignedTo: {
              connect: {
                id: user.id
              }
            }
          }
        })

        // Create activity for the signup
        await prisma.activity.create({
          data: {
            type: 'user_signup',
            description: `New user ${first_name || 'Unknown'} ${last_name || ''} signed up`,
            leadId: lead.id,
            teamMemberId: user.id,
            metadata: {
              source: 'clerk',
              signupTimestamp: new Date(),
              emailType
            }
          }
        })

        // Queue enrichment
        await enrichmentService.addToEnrichmentQueue(
          user.id,
          team.id,
          primaryEmail,
          {
            source: 'clerk_signup',
            firstName: first_name,
            lastName: last_name,
            signupTimestamp: new Date(),
            clerkUserId: id,
            teamId: team.id,
            emailType
          }
        )

        reply.code(200).send({
          status: 'success',
          message: 'User created and enrichment queued',
          data: {
            userId: user.id,
            teamId: team.id,
            leadId: lead.id
          }
        })
      } catch (error) {
        console.error('Error processing webhook:', error)
        reply.code(500).send({
          status: 'error',
          message: 'Failed to process webhook'
        })
      }
    }

    reply.code(200).send('Webhook processed')
  })

  // Enrichment webhook endpoint
  fastify.post('/enrich', async (request, reply) => {
    const { userId, teamId, email, metadata } = request.body as { 
      userId: string
      teamId: string
      email: string
      metadata: any
    }
    
    try {
      // Get the lead for this user
      const teamMember = await prisma.teamMember.findFirst({
        where: { userId, teamId },
        include: { leads: true }
      })

      if (!teamMember || !teamMember.leads[0]) {
        throw new Error('No lead found for user')
      }

      const lead = teamMember.leads[0]

      // Process the enrichment
      await enrichmentService.processEnrichment(userId)

      // Create activity for enrichment completion
      await prisma.activity.create({
        data: {
          type: 'enrichment_completed',
          description: `Enrichment completed for ${email}`,
          leadId: lead.id,
          teamMemberId: teamMember.id,
          metadata
        }
      })

      reply.code(200).send({ status: 'success' })
    } catch (error) {
      console.error('Error processing enrichment webhook:', error)
      
      // Get the lead and team member even in error case for activity logging
      const teamMember = await prisma.teamMember.findFirst({
        where: { userId, teamId },
        include: { leads: true }
      })

      if (teamMember && teamMember.leads[0]) {
        // Create activity for failed enrichment
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
      }

      reply.code(500).send({ 
        status: 'error',
        message: (error as Error).message 
      })
    }
  })
} 