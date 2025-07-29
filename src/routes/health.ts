import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { performance } from 'node:perf_hooks';

export default async function healthRoute(app: FastifyInstance) {
  const HealthResponse = z.object({
    status: z.literal('ok'),
    uptime: z.number(),
    timestamp: z.string(),
    latencyMs: z.number()
  });

  app.get(
    '/health',
    {
      schema: {
        summary: 'Comprehensive health check',
        description: 'Returns service status, uptime, timestamp, and latency',
        response: {
          200: HealthResponse
        }
      }
    },
    async () => {
      const start = performance.now();

      const result = {
        status: 'ok',
        uptime: +process.uptime().toFixed(2),
        timestamp: new Date().toISOString(),
        latencyMs: 0
      };

      const end = performance.now();
      result.latencyMs = +(end - start).toFixed(2);

      return HealthResponse.parse(result);
    }
  );
}
