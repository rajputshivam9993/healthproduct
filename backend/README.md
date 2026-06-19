# Doctor360 — Backend

NestJS API server for Doctor360. Provides REST endpoints and Socket.io realtime
communication, backed by PostgreSQL + PostGIS and Redis.

## Setup

### Option A — Docker-free dev mode (default in `.env`)

Runs against an in-process **sql.js** database (no Postgres/Redis/Docker needed).
The schema is auto-created and a known admin + demo doctor are seeded on startup.

```bash
npm install
npm run start:dev          # DB_TYPE=sqlite in .env
```

### Option B — PostgreSQL + PostGIS (full fidelity)

```bash
# set DB_TYPE=postgres in .env, start Postgres (docker compose up -d), then:
npm run migration:run
npm run start:dev
```

The API is served under the `/api` prefix (e.g. `http://localhost:3000/api`).

## Authentication (implemented)

| Endpoint                    | Auth   | Purpose                                            |
| --------------------------- | ------ | -------------------------------------------------- |
| `POST /api/auth/otp/request`| public | Request a 6-digit OTP for a phone (dev: returns `devOtp`) |
| `POST /api/auth/otp/verify` | public | Verify OTP → tokens; auto-creates a PATIENT if new |
| `POST /api/auth/admin/login`| public | Admin email + password → tokens                    |
| `POST /api/auth/refresh`    | public | Rotate tokens with a refresh token                 |
| `POST /api/auth/logout`     | bearer | Log out the current device                         |
| `GET  /api/auth/me`         | bearer | Current user profile                               |

**Dev credentials (seeded):**
- Admin → `admin@doctor360.in` / `admin123` (override via `SEED_ADMIN_*`)
- Demo doctor → OTP login with phone `9000000001`
- Any other 10-digit phone → OTP login creates a new patient

In dev mode the OTP is **logged to the console and returned in the response**
(`devOtp`) instead of being sent via MSG91. OTP rate-limit (3/5min), lockout
(5 fails → 15min), expiry (5min), and refresh-token rotation are all enforced.

## Environment variables

See [.env.example](.env.example). Key groups:

- **Database / Redis** — connection settings (match `docker-compose.yml`).
- **JWT** — access (15m) and refresh (7d) secrets and TTLs.
- **THROTTLE** — rate-limit window/threshold (defaults 100 / 60s).
- **MSG91 / AWS / RAZORPAY / AGORA** — third-party integration credentials.

## Scripts

| Script                     | Purpose                                        |
| -------------------------- | ---------------------------------------------- |
| `npm run start:dev`        | Run with watch mode                            |
| `npm run build`            | Compile to `dist/`                             |
| `npm run typecheck`        | Type-check without emitting                    |
| `npm run migration:run`    | Apply pending migrations                       |
| `npm run migration:revert` | Revert the last migration                      |
| `npm run migration:generate -- src/migrations/<Name>` | Generate a migration from entity diffs |

## Folder structure

```
src/
  config/        Typed @nestjs/config factories + logger options
  common/        Cross-cutting: guards, decorators, interceptors, filters, pipes
  entities/      TypeORM entities + shared enums (8 tables)
  migrations/    TypeORM migrations (schema source of truth)
  modules/       One folder per domain — each with .module / .controller / .service
                 (auth, users, doctors, appointments, prescriptions, payments,
                  reviews, notifications)
  app.module.ts  Root module: config, DB, throttling, global guards/filter/interceptor
  main.ts        Bootstrap: Helmet, ValidationPipe, CORS, Winston logger
data-source.ts   Standalone DataSource for the TypeORM CLI
```

## Conventions

- TypeScript **strict** mode; schema changes via **migrations only** (`synchronize: false`).
- Global `JwtAuthGuard` + `RolesGuard` (RBAC) protect routes; mark public routes with `@Public()`.
- Every request carries an `x-request-id` correlation header; errors return a
  standardized `{ requestId, statusCode, error, message }` body.

> Status: scaffold. Modules are registered with stubbed controllers/services;
> feature business logic is added in subsequent tasks.
