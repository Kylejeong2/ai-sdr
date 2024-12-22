import { type FastifyInstance } from 'fastify'
import { Webhook } from 'svix'
import { prisma } from '@graham/db'
import { EnrichmentService } from '../services/enrichment'
import { EmailGenerationService } from '../services/emailGeneration'

const enrichmentService = new EnrichmentService()
const emailGenerationService = new EmailGenerationService()

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

export async function webhookRoutes(fastify: FastifyInstance) {
  fastify.post('/clerk', async (request, reply) => {
    const headers = request.headers
    const payload = request.body as any

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

      // Create user in our database
      const user = await prisma.user.create({
        data: {
          clerkId: id,
          email: email_addresses[0].email_address,
          firstName: first_name,
          lastName: last_name,
        }
      })

      // Create lead for enrichment
      const lead = await prisma.lead.create({
        data: {
          email: email_addresses[0].email_address,
          firstName: first_name,
          lastName: last_name,
          status: 'PENDING',
          userId: user.id
        }
      })

      // Add to enrichment queue
      await prisma.enrichmentQueue.create({
        data: {
          leadId: lead.id,
          priority: 'HIGH'
        }
      })

      // Process enrichment immediately for this high-priority lead
      await enrichmentService.processEnrichmentQueue()

      // Generate personalized email
      await emailGenerationService.generatePersonalizedEmail(lead.id)
    }

    reply.code(200).send('Webhook processed')
  })
} 