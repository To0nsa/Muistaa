import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

// ↓ import the Zod→JSON-Schema transformer
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

export default fp(async function docsRoute(app: FastifyInstance) {
  // 1) Generate spec dynamically from the schemas you attach in routes
  await app.register(fastifySwagger, {
    mode: 'dynamic',
    openapi: {
      info: {
        title: 'Muista API',
        version: '0.1.0',
        description: 'Task & Reminder API for Zoe (LLM agent)',
      },
    },
    // Tell Swagger how to pick up your Zod schemas
    transform: jsonSchemaTransform
  });

  // 2) Serve the interactive UI at /docs
  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
    staticCSP: true,
  });
});
