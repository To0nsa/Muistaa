import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyRedis from '@fastify/redis';
import formbody from '@fastify/formbody';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler
} from 'fastify-type-provider-zod';

import jwtPlugin from './plugins/jwt.js';
import routes from './routes/index.js';

// Load environment variables from `.env`
dotenv.config();

// Initialize Fastify with logging enabled
const app = Fastify({ logger: true });

// Attach Prisma client to each request
const prisma = new PrismaClient();
app.decorate('prisma', prisma);

// ─── Zod Integration ───────────────────────────────────
// 1) Hook Zod into Fastify’s validation & serialization:
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// 2) Create a "typed" Fastify instance that uses Zod
const zapp = app.withTypeProvider<ZodTypeProvider>();

app.register(fastifyRedis, {
  url: process.env.REDIS_URL  // passed into new Redis({ url })
});

// Register security, auth, and utility plugins
await app.register(formbody);
await app.register(jwtPlugin);
await app.register(helmet);
await app.register(cors, { origin: true });
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

// ─── Docs & API Routes ─────────────────────────────────

// Register *all* your domain routes on the Zod-powered instance:
await zapp.register(routes);

// Start the server
const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });

    const address = app.server.address();
    if (address && typeof address === 'object') {
      app.log.info(`🚀 Server running at http://${address.address}:${address.port}`);
    } else {
      app.log.info(`🚀 Server started on ${address}`);
    }

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
