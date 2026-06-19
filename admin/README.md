# Doctor360 — Admin Portal

React + Vite + TypeScript admin web app, styled with Tailwind CSS and Shadcn/UI.

## Setup

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

## Environment variables

- `VITE_API_BASE_URL` — backend API base (default `http://localhost:3000/api`).

## Folder structure (Req 20.6)

```
src/
  pages/         One component per route (login, dashboard, doctors, appointments, slots, analytics)
  components/    layout/ (sidebar, header, admin-layout), ui/ (Shadcn primitives),
                 protected-route, page-placeholder
  hooks/         Custom hooks
  services/      API layer (Axios client + token-refresh seam)
  stores/        Zustand stores (auth)
  types/         Shared TypeScript types
  constants/     Centralized config
  lib/           cn() util + React Query client
  router.tsx     Protected client-side routes (JWT + ADMIN role)
  App.tsx        Providers + router
  index.css      Tailwind + Shadcn design tokens
```

## Adding Shadcn components

`components.json` is configured for the `@/components/ui` alias. Add more
primitives with the Shadcn CLI, e.g. `npx shadcn@latest add table dialog select`.

## Scripts

| Script              | Purpose                          |
| ------------------- | -------------------------------- |
| `npm run dev`       | Start the Vite dev server        |
| `npm run build`     | Type-check + production build    |
| `npm run preview`   | Preview the production build     |
| `npm run typecheck` | Type-check without emitting      |

> Status: scaffold. Pages render placeholders inside the sidebar + header shell;
> routing and the auth guard are wired. Tables, forms, and charts are added later.
