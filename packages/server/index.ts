import cors from '@fastify/cors';
import Fastify from "fastify";
// import { serverLogger } from '@graham/server/src/lib/winston';
import dotenv from 'dotenv';

dotenv.config();

const server = Fastify({ 
//   logger: serverLogger as any, 
  logger: true,
  keepAliveTimeout: 60000,
});

server.register(cors);

// Health check route
server.get('/health', async () => {
  return { status: 'ok' };
});

server.listen({ port: parseInt(process.env.PORT as string), host: "0.0.0.0" }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`Server listening on ${address}`);
});

const cleanup = (eventType: string, origin: any) => {
    server.log.info(`Received event ${eventType}`, { origin });
    process.exit();
  };
  [
    `exit`,
    `SIGINT`,
    `SIGUSR1`,
    `SIGUSR2`,
    `uncaughtException`,
    `SIGTERM`,
  ].forEach((eventType) => {
    process.on(eventType, cleanup.bind(null, eventType));
  });