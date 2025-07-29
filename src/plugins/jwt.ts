import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(import('@fastify/jwt'), {
    secret: process.env.JWT_SECRET!,
    sign: { expiresIn: process.env.JWT_EXPIRES_IN },
    // if using RS256:
    // secret: { private: process.env.JWT_PRIVATE_KEY, public: process.env.JWT_PUBLIC_KEY },
    // sign: { algorithm: 'RS256', expiresIn: '1h' }
  });

  // decorator for easy use in routes:
  fastify.decorate(
    'authenticate',
    async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  );
};

export default fp(jwtPlugin);
