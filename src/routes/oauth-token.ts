import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const oauthRoute: FastifyPluginAsync = async (app) => {
  const tokenResponse = z.object({
    grant_type:    z.literal('client_credentials'),
    client_id:     z.string(),
    client_secret: z.string(),
    scope:         z.string().optional(),
  });

  app.post(
    '/oauth/token',
    {
      schema: {
        summary:     'Issue OAuth client-credentials token',
        description: 'Exchanges a client_id and client_secret for a JWT access token.',
        body:        tokenResponse,
        response:    { 200: tokenResponse },
      }
    },
    async (request, reply) => {
      const { client_id, client_secret, scope } = tokenResponse.parse(request.body);

    // 1) Fetch client + its scopes
    const client = await app.prisma.oAuthClient.findUnique({
      where: { clientId: client_id },
      include: { scopes: true },       // ← load the related OAuthScope[]
    });

    // 2) Validate existence, active flag, and secret
    if (
      !client ||
      !client.isActive ||
      !(await bcrypt.compare(client_secret, client.clientSecretHash))
    ) {
      reply.header('WWW-Authenticate', 'Bearer realm="oauth"');
      return reply.status(401).send({ error: 'invalid_client' });
    }

    // 3) Extract the allowed scopes as strings
    const allowed = client.scopes.map((s) => s.name);

    // 4) Parse & validate requested scopes
    const requested = scope ? scope.split(' ') : [];
    if (requested.some((s) => !allowed.includes(s))) {
      return reply.status(400).send({ error: 'invalid_scope' });
    }

    // 5) Issue JWT
    const token = app.jwt.sign({
      sub:       client.id,
      client_id: client.clientId,
      scope:     requested.length ? requested : allowed,
    });

    // 6) Respond
    return reply.send({
      access_token: token,
      token_type:   'Bearer',
      expires_in:   /* parse your expiry, e.g. in seconds */ 3600,
      scope:        (requested.length ? requested : allowed).join(' '),
    });
  });
};

export default oauthRoute;
