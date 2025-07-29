// src/routes/index.ts

import { FastifyInstance } from 'fastify';
import docsRoute from './docs.js';
import pingRoute from './ping.js';
import healthRoute from './health.js';
import readyRoute from './ready.js';
import oauthTokenRoute from './oauth-token.js';
import oauthRegisterRoute from './oauth-register.js';
import usersRoute from './users.js';

export default async function registerRoutes(app: FastifyInstance) {
  app.register(docsRoute);
  app.register(pingRoute);
  app.register(healthRoute);
  app.register(readyRoute);
  app.register(oauthTokenRoute);
  app.register(oauthRegisterRoute);
  app.register(usersRoute);
}

