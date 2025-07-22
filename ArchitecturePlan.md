# Muista - backend API for taskManager

___

## 1. Goal summary

Muista is a **lightweight backend service** that exposes a minimalist todo/reminder API for Zoe (an LLM agent) to interact with. Its core responsibilities are:

- **Manage simple todos**  
  - Static items with a title, description, and optional category (e.g. Personal (default), Work).  
  - No built-in timers unless a “reminder” is explicitly set.

- **Optional reminders**  
  - When a todo has a reminder, the scheduling/job system will dispatch notifications (email by default; SMS or desktop optional) and mark items as reminded.

- **Script-based tasks**  
  - Some todos may trigger custom scripts (e.g. fetch weather every 30 min and log to a file).

- **Flexible querying**  
  - Zoe can list or filter todos by status, category, project, reminder flag, date range, etc., and create or delete items on demand.

- **Standardized agent interface**  
  - Expose all functionality over a simple REST or RPC API following the Model Context Protocol (MCP) so Zoe (and future agents) can “plug in” as a game-master or modular service.

___

## 2. Architecture Plan

### Project structure

```bash
muista-backend/
├── src/
│   ├── controllers/           # Fastify route handlers (one per resource)
│   ├── routes/                # Fastify plugin registrations
│   │   └── index.ts           # import & register all route plugins
│   ├── schemas/               # Zod schemas for request/response validation
│   ├── services/              # Business logic (task management, notifications)
│   ├── jobs/                  # BullMQ job definitions & processors
│   ├── scripts/               # Ad-hoc scripts (e.g. weather polling)
│   ├── plugins/               # Fastify plugins (JWT, CORS, Helmet, Pino, rate-limit)
│   ├── utils/                 # Shared helpers (e.g. date formatting, email sender)
│   ├── protocols/             # MCP adapters (serialize/deserialize Model Context Protocol)
│   ├── docs/                  # Swagger / OpenAPI definitions
│   ├── observability/         # OpenTelemetry instrumentation & exporters
│   └── index.ts               # App bootstrap: load env, register plugins/routes, start server
│
├── prisma/                    # Prisma schema & migration history
│   ├── schema.prisma
│   └── migrations/
│
├── infra/                     # Infrastructure-as-Code
│   ├── terraform/             # Terraform configs for Postgres, Redis, etc.
│   └── helm/                  # (or Fly.io “machines”) charts for K8s or Fly
│
├── .github/                   # CI/CD workflows
│   └── workflows/
│       ├── test.yml           # run Jest, lint, type-check
│       └── deploy.yml         # build Docker image, push to Fly.io
│
├── tests/                     # Integration & unit tests
│   └── e2e/                   # supertest-based API tests
│
├── .env.example               # sample env vars
├── docker-compose.yml         # local dev: Postgres, Redis, local Fastify
├── Dockerfile
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── README.md
└── openapi.yaml               # root OpenAPI spec (used by Swagger UI)
```

### Core API Endpoints (REST)

Task CRUD

| Method | Endpoint         | Description                                                       |
| ------ | ---------------- | ----------------------------------------------------------------- |
| POST   | `/tasks`         | Create a new todo (with optional `reminder` payload)              |
| GET    | `/tasks`         | List all todos (see **Filtering & Views** below)                  |
| GET    | `/tasks/:taskId` | Retrieve a single todo by its ID                                  |
| PATCH  | `/tasks/:taskId` | Partially update a todo (e.g. toggle a reminder, change category) |
| DELETE | `/tasks/:taskId` | Delete a todo permanently                                         |

Filtering & Views

| Method | Endpoint                  | Description                                        |
| ------ | ------------------------- | -------------------------------------------------- |
| GET    | `/tasks?due=today`        | All todos due today (replaces `/tasks/today`)      |
| GET    | `/tasks?due=upcoming`     | All future todos (replaces `/tasks/upcoming`)      |
| GET    | `/tasks?category=Work`    | Filter by category (e.g. `Personal`, `Work`, etc.) |
| GET    | `/tasks?hasReminder=true` | Only todos with active reminders                   |
| GET    | `/tasks?script=true`      | Only todos that trigger a script job               |

Reminder Management

| Method | Endpoint                  | Description                                         |
| ------ | ------------------------- | --------------------------------------------------- |
| POST   | `/tasks/:taskId/reminder` | (Re)activate or set a reminder on an existing todo  |
| DELETE | `/tasks/:taskId/reminder` | Remove the reminder, making the todo static         |
| POST   | `/reminders/trigger`      | Manually trigger all due reminders (for debugging)  |

Job & Script-Driven Tasks

| Method | Endpoint               | Description                                                                      |
| ------ | ---------------------- | -------------------------------------------------------------------------------- |
| GET    | `/jobs`                | List all scheduled background jobs (e.g. recurring weather scripts)              |
| GET    | `/jobs/:jobId`         | Get details & status of a specific job                                           |
| POST   | `/jobs`                | Schedule a new repeatable or one-off script job (e.g. poll weather every 30 min) |
| POST   | `/jobs/:jobId/trigger` | Manually run a job immediately                                                   |

Agent Interface (Model Context Protocol)

| Method | Endpoint         | Description                                             |
| ------ | ---------------- | ------------------------------------------------------- |
| POST   | `/agent/message` | Send/receive structured messages following the MCP spec |

Infrastructure & Tooling

| Method | Endpoint   | Description                             |
| ------ | ---------- | --------------------------------------- |
| GET    | `/health`  | Simple health check (returns 200 if OK) |
| GET    | `/metrics` | Prometheus-style metrics endpoint       |
| GET    | `/docs`    | Swagger UI / OpenAPI interactive docs   |

___

## 3. Tech Stack

| Category                 | Tech/Tool                                | Purpose                                                                    |
| ------------------------ | ---------------------------------------- | -------------------------------------------------------------------------- |
| **Core**                 | Node.js                                  | JavaScript/TypeScript runtime                                              |
|                          | TypeScript                               | Static typing, IDE support                                                 |
|                          | pnpm                                     | Fast, disk-efficient package manager                                       |
|                          | dotenv                                   | Loads `.env` files into `process.env`                                      |
| **Framework**            | Fastify                                  | HTTP server, routing, middleware                                           |
| **Validation & Parsing** | Zod                                      | Schema-first validation & type inference                                   |
| **ORM & Migrations**     | Prisma                                   | Type-safe database client                                                  |
|                          | Prisma Migrate                           | Declarative schema migrations                                              |
| **Database**             | PostgreSQL                               | Relational data storage                                                    |
| **Background Jobs**      | BullMQ + Redis                           | Delayed, retryable & repeatable jobs (e.g. reminders, script triggers)     |
| **Notification**         | Notifire                                 | Unified API for email, SMS & push notifications                            |
| **Authentication**       | @fastify/jwt                             | JWT-based auth plugin for Fastify                                          |
| **Security**             | @fastify/helmet                          | Secure HTTP headers                                                        |
|                          | @fastify/cors                            | CORS support                                                               |
|                          | @fastify/rate-limit                      | IP/user-based rate limiting                                                |
| **Logging**              | Pino                                     | Ultra-fast structured logging                                              |
|                          | @fastify/pino                            | HTTP request logging via Pino plugin                                       |
| **Testing**              | Jest                                     | Unit testing framework                                                     |
|                          | Supertest                                | End-to-end HTTP endpoint tests                                             |
| **Linting & Formatting** | ESLint                                   | Linting                                                                    |
|                          | Prettier                                 | Opinionated code formatting                                                |
| **Dev Tooling**          | tsx                                      | Zero-config, fast TypeScript runner with hot-reload                        |
| **API Documentation**    | Swagger UI                               | Auto-generated interactive REST docs                                       |
| **Containerization**     | Docker                                   | Consistent build/runtime environment                                       |
| **Deployment**           | Fly.io                                   | Simple, global container hosting                                           |
| **Monitoring & Alerts**  | Sentry                                   | Error tracking & performance monitoring                                    |
| **CI / CD**              | GitHub Actions                           | Automate testing, linting, builds, and deployments                         |
|                          | Dependabot                               | Automated dependency updates & security alerts                             |
| **Infra & Secrets**      | Terraform                                | Declare and manage cloud infrastructure                                    |
|                          | Helm (or Fly.io “machines”)              | Package & manage Kubernetes (or Fly.io) deployments                        |
|                          | HashiCorp Vault (or AWS Secrets Manager) | Centralized, encrypted secrets management                                  |
| **Observability**        | OpenTelemetry / Jaeger                   | Distributed tracing of requests & background jobs                          |
|                          | Prometheus + Grafana                     | Metrics collection, dashboards, alerting                                   |
|                          | Loki (or ELK / CloudWatch Logs)          | Log aggregation & powerful querying                                        |
| **Security & Testing**   | Snyk (or OWASP Dependency-Check)         | Continuous scanning of dependencies & container images for vulnerabilities |
|                          | k6 (or Artillery)                        | Load / stress testing your API and background-job throughput               |
| **API Gateway**          | Kong (or Traefik)                        | Central routing, auth, rate-limit, and canarying across micro-services     |

___

## 4. Data Model

This section defines the core data structures and relationships used in Muista's backend. It includes users, devices, tasks, reminders, jobs, projects, and supporting entities like tags, notifications, comments, attachments, and audit logs.

### 4.1 Relationships

- **User ↔ Task**: One-to-many — a user owns many tasks.
- **User ↔ Project**: One-to-many — a user can organize tasks into projects.
- **User ↔ Device**: One-to-many — a user can register multiple devices for push notifications.
- **Task ↔ Reminder**: One-to-many — a task may optionally have reminders schedule.
- **Task ↔ Job**: One-to-many — a task may spawn multiple jobs (e.g., script runs).
- **Project ↔ Task**: One-to-many — a project groups tasks together.
- **Task ↔ Tag**: Many-to-many via a join relation — tasks can have multiple arbitrary tags.
- **Task ↔ Task (Subtasks)**: Self-relation — tasks can have parent/child subtasks.
- **Reminder ↔ Notification**: One-to-many — a reminder may fire multiple notifications over time.
- **Job ↔ Notification**: One-to-many — a job may send one or more notifications.
- **Entities ↔ AuditLog**: One-to-many — tasks, reminders, jobs, etc., are audited.

### 4.2 Entity Overview

#### `User`

| Field                    | Type                 | Description                                   |
| ------------------------ | -------------------- | --------------------------------------------- |
| `id`                     | String               | UUID, primary key                             |
| `email`                  | String               | Unique, used for login and notifications      |
| `name?`                  | String               | Optional display name                         |
| `hashedPw`               | String               | Hashed password or external auth subject ID   |
| `phoneNumber?`           | String?              | E.164 SMS number                              |
| `devices`                | Device\[]            | Registered push-capable devices               |
| `tasks`                  | Task\[]              | Owned tasks                                   |
| `projects`               | Project\[]           | Projects this user created                    |
| `projectMemberships`**   | ProjectMember\[]     | Memberships linking this user to projects     |
| `createdAt`              | DateTime             | Account creation timestamp                    |
| `updatedAt`              | DateTime             | Last profile update timestamp                 |

#### `Device`

| Field        | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `id`         | String   | UUID, primary key                                     |
| `userId`     | String   | FK to `User`                                          |
| `deviceId`   | String   | Client-generated ID (e.g. local UUID)                 |
| `os`         | String   | Operating system (Windows, macOS, iOS, Android, etc.) |
| `platform`   | String   | `desktop`, `mobile`, `web`                            |
| `endpoint`   | String   | Push URL or FCM/APNs token                            |
| `token?`     | String?  | Optional FCM/APNs token                               |
| `userAgent?` | String?  | Browser User-Agent for diagnostics                    |
| `lastSeenAt` | DateTime | Last contact timestamp                                |
| `createdAt`  | DateTime | Registration timestamp                                |
| `updatedAt`  | DateTime | Last update timestamp                                 |

#### `Project`

| Field          | Type                 | Description                          |
| -------------- | -------------------- | ------------------------------------ |
| `id`           | String               | UUID, primary key                    |
| `name`         | String               | Project name                         |
| `description?` | String?              | Optional description                 |
| `note?`        | String?              | Additional context notes             |
| `tasks`        | Task\[]              | Tasks in this project                |
| `members`      | ProjectMember\[]     | Users and roles for this project     |
| `createdAt`    | DateTime             | Creation timestamp                   |
| `updatedAt`    | DateTime             | Last update timestamp                |

#### `ProjectMember`

| Field       | Type        | Description                                     |
| ----------- | ----------- | ----------------------------------------------- |
| `id`        | String      | UUID, primary key                               |
| `projectId` | String      | FK to `Project`                                 |
| `userId`    | String      | FK to `User`                                    |
| `role`      | ProjectRole | Role of the member (`OWNER`, `ADMIN`, `MEMBER`) |
| `addedBy?`  | String?     | FK to `User` who added/invited this member      |
| `joinedAt`  | DateTime    | Timestamp when the user joined the project      |
| `createdAt` | DateTime    | Record creation timestamp                       |
| `updatedAt` | DateTime    | Last update timestamp                           |

#### `Task`

| Field          | Type          | Description                                  |
| -------------- | ------------- | -------------------------------------------- |
| `id`           | String        | UUID, primary key                            |
| `ownerId`      | String        | FK to `User` (task owner)                    |
| `projectId?`   | String?       | FK to `Project`                              |
| `parentId?`    | String?       | FK to parent `Task` for subtasks             |
| `title`        | String        | Short label                                  |
| `description?` | String?       | Detailed description                         |
| `note?`        | String?       | Additional user notes                        |
| `category`     | Category      | High-level bucket (`Personal`, `Work`, etc.) |
| `priority`     | Priority      | Urgency level (`LOW`, `MEDIUM`, `HIGH`)      |
| `dueDate?`     | DateTime?     | Optional deadline                            |
| `completed`    | Boolean       | Completion flag                              |
| `completedAt?` | DateTime?     | Timestamp when marked complete               |
| `tags`         | Tag\[]        | Many-to-many labels                          |
| `reminder?`    | Reminder?     | Optional scheduling details                  |
| `jobs`         | Job\[]        | Script-driven work                           |
| `comments`     | Comment\[]    | User/team comments                           |
| `attachments`  | Attachment\[] | Linked files                                 |
| `createdAt`    | DateTime      | Creation timestamp                           |
| `updatedAt`    | DateTime      | Last update timestamp                        |

#### `Tag`

| Field   | Type    | Description       |
| ------- | ------- | ----------------- |
| `id`    | String  | UUID, primary key |
| `name`  | String  | Unique label name |
| `tasks` | Task\[] | Tagged tasks      |

#### `Reminder`

| Field              | Type           | Description                             |
| ------------------ | -------------- | --------------------------------------- |
| `id`               | String         | UUID, primary key                       |
| `taskId`           | String         | FK to `Task`                            |
| `schedule`         | String         | Cron or ISO interval expression         |
| `recurrenceType`   | RecurrenceType | `CRON` or `INTERVAL` model              |
| `interval?`        | String?        | ISO-8601 duration (e.g. `P1D`, `PT30M`) |
| `startAt?`         | DateTime?      | Recurrence start                        |
| `endAt?`           | DateTime?      | Recurrence end                          |
| `timezone?`        | String?        | IANA timezone (e.g. `Europe/Helsinki`)  |
| `channel`          | Channel        | Delivery method                         |
| `lastTriggeredAt?` | DateTime?      | Last firing timestamp                   |
| `nextTriggereAt?`  | DateTime?      | Scheduled next occurency                |
| `note?`            | String?        | User annotation for this reminder       |

#### `Job`

| Field        | Type      | Description                                    |
| ------------ | --------- | ---------------------------------------------- |
| `id`         | String    | UUID, primary key                              |
| `type`       | JobType   | `reminder` or `script`                         |
| `params`     | Json      | Parameters or context for the job              |
| `status`     | JobStatus | `pending`, `running`, `failed`, or `completed` |
| `lastRunAt`  | DateTime  | Last execution                                 |
| `nextRunAt?` | DateTime? | Scheduled next execution                       |
| `taskId?`    | String?   | FK to originating `Task`                       |
| `createdAt`  | DateTime  | Creation timestamp                             |
| `updatedAt`  | DateTime  | Last update timestamp                          |

#### `Notification`

| Field           | Type               | Description                    |
| --------------- | ------------------ | ------------------------------ |
| `id`            | String             | UUID, primary key              |
| `reminderId?`   | String?            | FK to `Reminder`               |
| `jobId?`        | String?            | FK to `Job`                    |
| `recipient`     | String             | Email or phone                 |
| `channel`       | Channel            | Delivery channel               |
| `status`        | NotificationStatus | `PENDING`, `SENT`, or `FAILED` |
| `payload?`      | Json?              | Raw message payload            |
| `errorMessage?` | String?            | Error details on failure       |
| `sentAt?`       | DateTime?          | Timestamp when sent            |
| `createdAt`     | DateTime           | Log creation timestamp         |

#### `Comment` (optional)

| Field       | Type     | Description       |
| ----------- | -------- | ----------------- |
| `id`        | String   | UUID, primary key |
| `taskId`    | String   | FK to `Task`      |
| `authorId`  | String   | FK to `User`      |
| `text`      | String   | Comment body      |
| `createdAt` | DateTime | Timestamp         |

#### `Attachment` (optional)

| Field       | Type     | Description              |
| ----------- | -------- | ------------------------ |
| `id`        | String   | UUID, primary key        |
| `taskId`    | String   | FK to `Task`             |
| `url`       | String   | File storage path or URL |
| `createdAt` | DateTime | Timestamp                |

#### `AuditLog`

| Field       | Type     | Description                          |
| ----------- | -------- | ------------------------------------ |
| `id`        | String   | UUID, primary key                    |
| `entity`    | String   | Model name (e.g. `Task`, `Reminder`) |
| `recordId`  | String   | FK to record                         |
| `userId?`   | String?  | Actor who made the change            |
| `action`    | String   | `CREATE`, `UPDATE`, `DELETE`         |
| `before?`   | Json?    | State before                         |
| `after?`    | Json?    | State after                          |
| `createdAt` | DateTime | Timestamp                            |

### 4.3 Enum Definitions

```prisma
enum Category {
  Personal
  Study
  Work
  Health
  Finance
  Family
  Social
  Shopping
  Travel
  Hobby
  Fitness
  Learning
  Project
  Chores
  Admin
}

enum ProjectRole {
  OWNER
  ADMIN
  MEMBER
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum Channel {
  email
  SMS
  desktop
}

enum RecurrenceType {
  CRON
  INTERVAL
}

enum JobType {
  reminder
  script
}

enum JobStatus {
  pending
  running
  failed
  completed
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
}
```

___

## 5. Agent Interaction Model (Zoe)

This section describes how Muista integrates with LLM agents like **Zoe** via the **Model Context Protocol (MCP)**. This enables Zoe to query, create, and update reminders, tasks, or projects as if she were a user or automation layer.

### 5.1 Model Context Protocol (MCP) Overview

MCP is a lightweight JSON-based protocol designed to structure interactions between Muista and intelligent agents (like Zoe).

- Agents send a **context + intent + parameters**
- Muista responds with **status + data or error**
- All messages are POSTed to `/agent/message`

Example request:

```json
{
  "context": {
    "agent": "zoe",
    "userId": "user-abc123"
  },
  "intent": "createTask",
  "params": {
    "title": "Buy cat food",
    "dueDate": "2025-07-23T18:00:00Z",
    "category": "Personal"
  }
}
```

Example response:

```json
{
  "status": "success",
  "data": {
    "taskId": "task-xyz789"
  }
}
```

### 5.2 Supported Zoe Intents

| Intent          | Description                                      |
| --------------- | ------------------------------------------------ |
| `createTask`    | Create a new task (with optional reminder)       |
| `updateTask`    | Patch a task’s fields                            |
| `deleteTask`    | Delete a task by ID                              |
| `askUpcoming`   | List upcoming tasks (with reminders or due soon) |
| `askOverdue`    | List past-due tasks                              |
| `askByCategory` | List tasks filtered by category                  |
| `triggerScript` | Launch a background job linked to a task         |

More intents can be added as Zoe's capabilities grow.

### 5.3 Error Handling Model

If something fails, the response includes structured diagnostics:

```json
{
  "status": "error",
  "errorCode": "INVALID_PARAMS",
  "message": "Missing title for createTask",
  "details": {
    "field": "title"
  }
}
```

Agent clients must:

- Check `status`
- Log or retry based on `errorCode`
- Fall back to generic help if unable to recover

### 5.4 Zoe SDK (Optional)

To simplify integration for Zoe or future agents, Muista can expose a client SDK:

```ts
await agent.send({ intent: 'createTask', params: { title: '...'} });
```

Planned SDK features:

- Type-safe wrapper over `fetch('/agent/message')`
- Automatic retries
- Intent autocompletion via TypeScript types
- Error normalization

### 5.5 Agent Rate Limits & Auth

Zoe must authenticate using a **JWT token** with the `agent` role and limited scopes:

- Max 5 requests/sec
- Max 100 tasks/day per user via agent

Token must be passed in `Authorization: Bearer <token>`

___

## 6. Developer Workflow

This section outlines the development setup and how we can run Muista locally with minimal manual configuration. The goal is to enable full-stack development with a single command using Docker Compose.

### 6.1 One-Command Bootstrapping

To start a local Muista environment:

```bash
docker compose up --build
```

This command will:

- Build the `muista-app` service (Fastify + TypeScript backend)
- Launch PostgreSQL and Redis services
- Run Prisma migrations automatically
- Print logs and expose the API on `http://localhost:3000`

### 6.2 Project Structure and Mounts

The local filesystem is mounted into the container for hot reloading:

```yaml
volumes:
  - ./src:/app/src
  - ./prisma:/app/prisma
```

Using `tsx`, the backend auto-restarts on file changes.

### 6.3 Environment Configuration

- Copy `.env.example` to `.env`
- Docker Compose reads env vars and injects them into the backend and database services

```bash
cp .env.example .env
```

Secrets like `DATABASE_URL` and `JWT_SECRET` are defined via `.env` but can also be overridden via Docker Compose environment entries.

### 6.4 Scripts & Utilities

Common scripts are defined in `package.json`:

```bash
pnpm dev          # local dev with hot-reload (outside docker)
pnpm lint         # run ESLint
pnpm test         # run Jest tests
pnpm format       # run Prettier
pnpm db:migrate   # run Prisma migrate dev
```

These are automatically invoked or made available in the container if needed.

This workflow ensures a reproducible environment for everyone.
___

## 7. Non-Functional Requirements

This section defines the high-level constraints and SLAs that will guide our implementation choices and operational practices.

### 7.1 Scalability

- **Expected Load**: Support at least **100 requests per second** (QPS) on the `/tasks` and `/jobs` endpoints under normal conditions, with spikes up to **500 QPS** during peak periods (e.g. batch reminder triggers).
- **Autoscaling Policy**:

  - **Fastify Instances**: Horizontal scaling based on CPU utilization (scale out when > 60% CPU on average) and queue length for BullMQ workers (scale when pending jobs > 200).
  - **Redis & PostgreSQL**: Hosted with managed replicas; scale read replicas as needed if read latency exceeds 50 ms.

### 7.2 Performance

- **Latency Targets**:

  - **P95 latency < 50 ms** for simple CRUD on `/tasks` (no reminder processing).
  - **P95 latency < 200 ms** for `/jobs` endpoints and other heavier operations.
- **Cold-start Constraints**: Docker container startup & Fastify bootstrap < 5 s.
- **Background Jobs**: Ensure that 95% of scheduled reminders and script-triggered jobs complete within **1 second** of their scheduled run time.

### 7.3 Reliability & Availability

- **Uptime SLA**: **99.9%** availability for the public API, measured monthly (no more than \~43 m of downtime per month).
- **Retry Policies**:

  - **HTTP Requests**: Clients may retry idempotent calls; service must support idempotency via unique request-ids.
  - **Job Execution**: BullMQ retry count = 3 for transient errors, with exponential backoff (initial 1 min).
- **Data Durability**: Utilize managed PostgreSQL with point-in-time recovery and daily backups; Redis persistence with RDB/AOF snapshots.

### 7.4 Security

- **Encryption**:

  - **In Transit**: TLS 1.2+ for all inbound/outbound connections (Fastify HTTPS, Redis and DB TLS).
  - **At Rest**: PostgreSQL disk encryption and Redis encrypted snapshots (where supported by the host).
- **Authentication & Authorization**:

  - **JWT** tokens signed with RS256, short TTL (15 min) and refresh tokens.
  - **Role-Based Access Control** for administrative vs. agent vs. end-user scopes.
- **OWASP Compliance**:

  - Protect against OWASP Top 10 risks (e.g. injection, XSS, CSRF) via input validation (Zod), secure headers (Helmet), and CORS policies.
  - Regular dependency scanning with Snyk/OWASP Dependency-Check and container image scanning.

> *These non-functional requirements ensure Muista remains performant, reliable, and secure as it scales. Detailed metrics and runbooks should be added as part of the production readiness checklist.*
