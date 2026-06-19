import { registerAs } from '@nestjs/config';

/**
 * Database settings. Two modes:
 *  - `postgres` (default / production): PostgreSQL + PostGIS, schema via migrations.
 *  - `sqlite` (local dev without Docker): an in-process sql.js database persisted
 *    to a file, schema auto-synchronized. PostGIS-specific features (proximity
 *    search) are unavailable in this mode and degrade gracefully.
 * Select with DB_TYPE=sqlite|postgres.
 */
export const databaseConfig = registerAs('database', () => ({
  type: (process.env.DB_TYPE ?? 'postgres') as 'postgres' | 'sqlite',
  // Postgres settings
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'doctor360',
  password: process.env.DB_PASSWORD ?? 'doctor360',
  database: process.env.DB_NAME ?? 'doctor360',
  // SQLite (sql.js) file location for dev
  sqliteFile: process.env.SQLITE_FILE ?? 'doctor360.dev.sqlite',
}));

/** True when the backend is running against the dev SQLite database. */
export const isSqlite = (process.env.DB_TYPE ?? 'postgres') === 'sqlite';
