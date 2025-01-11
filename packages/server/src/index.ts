import fastify from 'fastify'
import cors from '@fastify/cors'
import { TriggerClient } from "@trigger.dev/sdk"
import { z } from 'zod'
import { prisma } from '@graham/db'
import crypto from 'crypto'

// Extend FastifyRequest type to include team
declare module 'fastify' {
  interface FastifyRequest {
    team?: {
      id: string
      name: string
    }
  }
}

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

// Initialize Trigger.dev client
const client = new TriggerClient({
  id: "graham-sdr",
  apiKey: process.env.TRIGGER_API_KEY!,
})

// API Key authentication middleware
server.addHook('preHandler', async (request, reply) => {
  const authHeader = request.headers.authorization
  
  // Skip auth for health check
  if (request.url === '/health') return
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing or invalid API key' })
    return
  }

  const apiKey = authHeader.split(' ')[1]
  if (!apiKey) {
    reply.code(401).send({ error: 'Invalid API key format' })
    return
  }

  const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex")

  try {
    const key = await prisma.apiKey.findFirst({
      where: { key: hashedKey },
      include: {
        team: true
      }
    })

    if (!key) {
      reply.code(401).send({ error: 'Invalid API key' })
      return
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsed: new Date() }
    })

    // Add team context to request
    request.team = {
      id: key.team.id,
      name: key.team.name
    }
  } catch (error) {
    request.log.error('API key validation error:', error)
    reply.code(500).send({ error: 'Internal server error' })
    return
  }
})

// Schema for signup payload
const SignupSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
})

type SignupPayload = z.infer<typeof SignupSchema>

// Signup webhook endpoint
server.post<{
  Body: SignupPayload
}>('/api/signup', async (request, reply) => {
  try {
    const payload = SignupSchema.parse(request.body)
    
    if (!request.team) {
      reply.code(500).send({ error: 'Team context missing' })
      return
    }

    // Queue enrichment job
    await client.sendEvent({
      name: "user.signup",
      payload: {
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        company: payload.company,
        timestamp: new Date().toISOString(),
        teamId: request.team.id
      },
    })
    
    request.log.info(`🎯 Queued enrichment for user: ${payload.email}`)
    return { success: true }
  } catch (error) {
    request.log.error('Signup error:', error)
    reply.status(400).send({ error: 'Invalid signup payload' })
  }
})

// Health check
server.get('/health', async () => {
  return { status: 'healthy' }
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