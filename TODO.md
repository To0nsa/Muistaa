# Muistaa – Prototype Progress Tracker

## What Has Been Done

### Core Setup

* **Fastify server** (`src/index.ts`) with:

  * Logging enabled
  * CORS, Helmet, Rate limiting
  * Redis plugin
  * Prisma client integration
  * Zod validation & serialization
* **Prisma**:

  * Initial schema with `User` model
  * Migrations applied (`init` and `add_nick_name_to_user`)
  * Seed file placeholder
* **Routes implemented**:

  * `/ping` → basic pong response
  * `/health` → uptime, latency, status
  * `/ready` → Postgres + Redis readiness check
  * `/docs` → Swagger UI auto-generated from Zod schemas
  * `/signup` → User registration with password hashing, policy checks, and Prisma persistence
* **Auth plugin**:

  * JWT registration via `@fastify/jwt`
  * Custom `authenticate` decorator
* **Validation utils**:

  * Strong password policy (length, complexity, zxcvbn score)
  * Phone number normalization (libphonenumber-js)
* **Docker setup**:

  * `docker-compose.yml` with Postgres + Redis
  * `Dockerfile` for app container
* **Tooling & scripts**:

  * `prisma-dev.sh` for migration deployment
  * ESLint, Prettier configured
  * Jest + Supertest setup for testing
* **Docs**:

  * README.md with tech stack, setup, and environment variables
  * ArchitecturePlan.md with future endpoints, data model, and infra plan

---

## What Still Needs To Be Done

### Minimum Prototype Requirements

* **User management**

  * Login route with JWT issuance
  * Basic profile retrieval & update endpoint
* **Task CRUD API** (see ArchitecturePlan)

  * `POST /tasks` → create task
  * `GET /tasks` → list/filter tasks
  * `GET /tasks/:id` → single task
  * `PATCH /tasks/:id` → update task
  * `DELETE /tasks/:id` → delete task
* **Reminders**

  * `/tasks/:id/reminder` → add/remove reminder
  * BullMQ job processor for reminders
* **Background jobs**

  * Job scheduler for reminders & scripts
  * Example script job (e.g., fetch weather)
* **Notification system**

  * Integrate Notifire for email delivery (basic channel first)

### Supporting Infrastructure

* **Swagger/OpenAPI coverage** for all new routes
* **Database schema expansion**:

  * Add Task, Reminder, Project, Job, Notification models
* **Authentication & Authorization**

  * JWT scopes/roles (user vs agent vs admin)
  * Refresh token support
* **Testing**

  * Unit tests for utils (password policy, phone number)
  * Integration tests for routes (signup, login, tasks)

### Optional (Nice-to-Have for Prototype)

* MCP `/agent/message` endpoint for Zoe integration
* CI/CD workflows (GitHub Actions: lint, test, build)
* Seed data for testing tasks/reminders
* Observability basics (Pino logger, OpenTelemetry stubs)

---

## Next Steps for Prototype

1. Implement **login** route and JWT issuance.
2. Expand **Prisma schema** with Task + Reminder.
3. Add **Task CRUD endpoints** with Zod schemas.
4. Integrate **BullMQ** and create a minimal reminder queue.
5. Add **Notifire** email notification for reminders.
6. Write first **end-to-end tests** (signup + task lifecycle).

---

This list should be updated continuously as the prototype evolves.
