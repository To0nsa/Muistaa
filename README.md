# Muistaa

*Lightweight Fastify + TypeScript backend for tasks & reminders*

> ⚠️ **Work in Progress** — This project is under active development. Expect breaking changes and incomplete features.

---

## Overview

Muistaa is a backend service built with [Fastify](https://fastify.dev/), [TypeScript](https://www.typescriptlang.org/), and [Prisma](https://www.prisma.io/).
It is a learning project that aims to teach me how to use new technologies properly while building a practical API for managing tasks, reminders, and notifications.

Key features planned:

* REST API with [Fastify](https://fastify.dev/) + [Zod](https://zod.dev/) type safety
* [Prisma](https://www.prisma.io/) + [PostgreSQL](https://www.postgresql.org/) for persistence
* [Redis](https://redis.io/) & [BullMQ](https://docs.bullmq.io/) for background jobs (reminders & queues)
* [JWT](https://jwt.io/) authentication & rate limiting
* Auto-generated [Swagger](https://swagger.io/tools/swagger-ui/) docs
* Notification system via [Notifire](https://github.com/notifirehq/notifire)
* [Docker](https://www.docker.com/) for reproducible dev setup

---

## Tech Stack

* **Runtime:** [Node.js](https://nodejs.org/) 24
* **Framework:** [Fastify](https://fastify.dev/) 5
* **Database:** [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/) ORM
* **Cache/Queue:** [Redis](https://redis.io/) + [BullMQ](https://docs.bullmq.io/)
* **Auth:** [JWT](https://jwt.io/)
* **Docs:** [Swagger UI](https://swagger.io/tools/swagger-ui/)

---

## Architecture Plan

See [ArchitecturePlan.md](./ArchitecturePlan.md) for the detailed architecture outline.

---

## TODO Progress Tracker

See [TODO.md](./TODO.md) for a detailed list of what has been done and what still needs to be done for the prototype.

---

## Project Structure

``` bash
muistaa/
├── src/                # Source code
│   ├── routes/         # Fastify routes
│   ├── plugins/        # Fastify plugins
│   ├── utils/          # Helpers (jwt, healthchecks, etc.)
│   └── index.ts        # Entry point
├── prisma/             # Prisma schema & migrations
├── docker-compose.yml  # Postgres + Redis services
├── Dockerfile          # App container
├── package.json        # Dependencies & scripts
├── tsconfig.json       # TypeScript config
└── .env                # Environment variables (local)
```

---

## Development Setup

### Prerequisites

* [Node.js](https://nodejs.org/) ≥ 24
* [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/muistaa.git
cd muistaa
pnpm install   # or npm install
```

### 2. Start Services

```bash
docker-compose up -d   # Starts Postgres + Redis
```

### 3. Run in Dev Mode

```bash
pnpm dev
```

### 4. Prisma Migrate

```bash
pnpm db:migrate
```

---

## Environment Variables

`.env` (example):

```ini
POSTGRES_USER=dev
POSTGRES_PASSWORD=dev
POSTGRES_DB=devdb
DATABASE_URL=postgresql://dev:dev@postgres:5432/devdb

REDIS_URL=redis://redis:6379
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=15m
PORT=3000
```
