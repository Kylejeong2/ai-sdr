import fastify from 'fastify'
import cors from '@fastify/cors'
import { sdrRoutes } from './routes/sdr'
import './workers/queueWorker'

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

// Health check
server.get('/health', async () => {
  return { status: 'ok' }
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