import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export default async function readinessRoute(app: FastifyInstance) {
  // 1) Define your schema
  const ReadyResponse = z.object({
    status: z.enum(['ok', 'error']),
    postgres: z.enum(['ok', 'error']),
    redis: z.enum(['ok', 'error']),
    details: z.string().optional(),
  });

  // 2) Register GET /ready
  app.get(
    '/ready',
    {
      schema: {
        summary: 'Readiness check',
        description: 'Verifies Postgres and Redis connectivity',
        response: { 200: ReadyResponse, 503: ReadyResponse },
      },
    },
    async (_req, reply) => {
      let pgStatus: 'ok' | 'error' = 'ok';
      let redisStatus: 'ok' | 'error' = 'ok';
      let detailMsg: string | undefined;

      // 3) Check Postgres
      try {
        // Prisma client was decorated on app in index.ts
        await app.prisma.$queryRaw`SELECT 1`; 
      } catch (err: any) {
        pgStatus = 'error';
        detailMsg = `Postgres error: ${err.message}`;
      }

      // 4) Check Redis
      try {
        // fastify-redis registers client at app.redis
        const pong = await app.redis.ping();
        if (pong !== 'PONG') throw new Error(`unexpected pong: ${pong}`);
      } catch (err: any) {
        redisStatus = 'error';
        detailMsg = detailMsg
          ? detailMsg + `; Redis error: ${err.message}`
          : `Redis error: ${err.message}`;
      }

      const overall = pgStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'error';
      const payload = { status: overall, postgres: pgStatus, redis: redisStatus, details: detailMsg };

      if (overall === 'error') {
        reply.code(503);
      }

      return ReadyResponse.parse(payload);
    }
  );
}
