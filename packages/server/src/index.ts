import fastify from 'fastify'
import cors from '@fastify/cors'
import { sdrRoutes } from './routes/sdr'
import { webhookRoutes } from './routes/webhooks'
import './workers/queueWorker'
import { TriggerClient, type IO } from "@trigger.dev/sdk"
import { enrichUserTask } from './services/enrichment'
import { prisma } from '@graham/db'
import { EnrichmentService } from './services/enrichment'

const server = fastify({
  logger: true,
  ajv: {
    customOptions: {
      removeAdditional: 'all',
      coerceTypes: true,
      useDefaults: true,
    }
  }
})

// Register plugins
server.register(cors, {
  origin: true,
  credentials: true
})

// Register routes
server.register(sdrRoutes, { prefix: '/api/sdr' })
server.register(webhookRoutes, { prefix: '/api/webhooks' })

// Health check
server.get('/health', async () => {
  return { status: 'ok' }
})

type EnrichmentPayload = {
  userId: string
  teamId: string
  email: string
  metadata: {
    source: string
    type: string
    [key: string]: any
  }
}

// Initialize Trigger.dev client
export const trigger = new TriggerClient({
  id: "graham-sdr",
  apiKey: process.env.TRIGGER_API_KEY!,
  apiUrl: process.env.TRIGGER_API_URL
})

// Register background jobs
trigger.defineJob({
  id: "enrich-user-job",
  name: "Enrich User Data",
  version: "1.0.0",
  trigger: enrichUserTask,
  run: async (payload: EnrichmentPayload, io: IO) => {
    const { userId } = payload
    
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

      // Process the enrichment
      await io.runTask("process-enrichment", async () => {
        const enrichmentService = new EnrichmentService()
        await enrichmentService.processEnrichment(userId)
      })

      // Create activity for enrichment completion
      await prisma.activity.create({
        data: {
          type: 'enrichment_completed',
          description: `Enrichment completed for user ${userId}`,
          leadId: lead.id,
          teamMemberId: teamMember.id,
          metadata: payload.metadata
        }
      })
    } catch (error) {
      console.error('Error in enrichment job:', error)
      
      const teamMember = await prisma.teamMember.findFirst({
        where: { userId },
        include: { leads: true }
      })

      if (teamMember && teamMember.leads[0]) {
        // Create activity for failed enrichment
        await prisma.activity.create({
          data: {
            type: 'enrichment_failed',
            description: `Enrichment failed for user ${userId}: ${(error as Error).message}`,
            leadId: teamMember.leads[0].id,
            teamMemberId: teamMember.id,
            metadata: {
              ...payload.metadata,
              error: (error as Error).message
            }
          }
        })
      }

      throw error
    }
  }
})

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001')
    await server.listen({ port, host: '0.0.0.0' })
    server.log.info(`Server listening on port ${port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start() 