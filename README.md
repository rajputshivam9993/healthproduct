# Doctor360

A healthcare platform for India connecting patients with doctors for in-person and
video consultations — patient/doctor mobile app, NestJS API, and an admin portal.

## Architecture

The repository is organised as three independent sub-projects plus shared local infra:

| Path        | Stack                                             | Purpose                                  |
| ----------- | ------------------------------------------------- | ---------------------------------------- |
| `/backend`  | NestJS, TypeORM, PostgreSQL + PostGIS, Redis      | REST/Socket.io API server                |
| `/app`      | React Native (Expo SDK 54), React Query, Zustand  | Patient & doctor mobile app              |
| `/admin`    | React + Vite + TypeScript, Shadcn/UI + Tailwind   | Admin web portal                         |

Each sub-project owns its own `package.json` and `tsconfig.json` and is built and run
independently. See each sub-project's `README.md` for details.

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- (for `/app`) the **Expo Go** app (SDK 54) on your phone, or an Android/iOS emulator.

## Quick start

1. **Start infrastructure** (PostgreSQL + PostGIS on 5432, Redis on 6379):

   ```bash
   docker compose up -d
   docker compose ps        # wait until both services are "healthy"
   ```

2. **Backend**

   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run migration:run
   npm run start:dev
   ```

3. **Mobile app**

   ```bash
   cd app
   npm install
   npx expo start
   ```

4. **Admin portal**

   ```bash
   cd admin
   npm install
   npm run dev
   ```

## Project status

This is the initial scaffold (Requirement 14): runnable structure, complete database
schema/migration, and registered-but-stubbed modules/screens/pages. Feature business
logic is implemented in subsequent tasks.
