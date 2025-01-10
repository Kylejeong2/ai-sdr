import fastify from 'fastify'
import cors from '@fastify/cors'
import { TriggerClient } from "@trigger.dev/sdk"
import { z } from 'zod'

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
    
    // Queue enrichment job
    await client.sendEvent({
      name: "user.signup",
      payload: {
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        company: payload.company,
        timestamp: new Date().toISOString(),
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