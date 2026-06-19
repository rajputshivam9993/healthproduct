// Centralized runtime configuration (Req 20.8). Read from Vite env vars with
// local-development defaults.

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
  // Default page size for data tables (Req 19.3).
  defaultPageSize: 20,
} as const;
