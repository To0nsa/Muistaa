import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export default async function pingRoute(app: FastifyInstance) {
  const PingResponse = z.literal('pong');

  app.get(
    '/ping',
    {
      schema: {
        summary: 'Ping endpoint',
        description: 'Returns the literal "pong"',
        response: {
          200: PingResponse
        }
      }
    },
    async () => {
      return PingResponse.parse('pong');
    }
  );
}
