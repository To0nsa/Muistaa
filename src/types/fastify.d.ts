// src/types/fastify.d.ts
import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import { Redis } from 'ioredis'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    redis: Redis
  }
}
