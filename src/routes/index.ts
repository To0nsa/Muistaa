// src/routes/index.ts

import { FastifyInstance } from 'fastify';
import docsRoute from './docs.js';
import pingRoute from './ping.js';
import healthRoute from './health.js';
import readyRoute from './ready.js';
import signupRoute from './auth/signup.js';

export default async function registerRoutes(app: FastifyInstance) {
  app.register(docsRoute);
  app.register(pingRoute);
  app.register(healthRoute);
  app.register(readyRoute);
  app.register(signupRoute);
}

