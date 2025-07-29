import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';

const registerSchema = z.object({
  name:   z.string().min(3),
  scopes: z.array(z.string()).optional(),
  ownerId: z.string().optional(),
});

const oauthRegister: FastifyPluginAsync = async (app) => {
  app.post(
    '/oauth/register',
    {
      schema: {
        headers: z.object({
          'x-client-registration-token': z.string(),
        }).loose(),
        body: registerSchema,
        response: {
          201: z.object({
            id:            z.string(),
            client_id:     z.string(),
            client_secret: z.string(),
            scopes:        z.array(z.string()),
            ownerId:       z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      // 1) Verify your static admin token
      const incoming = (request.headers['x-client-registration-token'] as string) || '';
      if (incoming !== process.env.CLIENT_REGISTRATION_TOKEN) {
        return reply.code(403).send({ error: 'forbidden' });
      }

      // 2) Parse + validate payload
      const { name, scopes = [], ownerId = 'system' } = registerSchema.parse(request.body);

      // 3) Generate credentials
      const clientId     = nanoid(16);
      const clientSecret = nanoid(32);
      const secretHash   = await bcrypt.hash(clientSecret, 10);

      // 4) Persist to DB
      const client = await app.prisma.oAuthClient.create({
        data: {
          name,
          clientId,
          clientSecretHash: secretHash,
          scopes: {
            connect: scopes.map(name => ({ name })),
          },
          ownerId,
        },
        include: {
          scopes: true,    // ← load the related scopes
        },
      });

      // 5) Return raw secret exactly once
      return reply.code(201).send({
        id:            client.id,
        client_id:     client.clientId,
        client_secret: clientSecret,
        scopes:        client.scopes.map(s => s.name),
        ownerId:       client.ownerId,
      });
    }
  );
};

export default oauthRegister;
