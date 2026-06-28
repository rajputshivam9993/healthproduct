import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

// Standalone DataSource used by the TypeORM CLI (migration:run / generate / revert).
// The NestJS app builds its own DataSource via TypeOrmModule in app.module.ts; the
// connection settings here are kept in sync through the same environment variables.
dotenv.config();

// This DataSource is the Postgres-only migration CLI path. Entity column types are
// chosen at module-load from process.env.DB_TYPE (see entities/column-helpers.ts), so
// force Postgres here BEFORE TypeORM lazy-loads the entity globs — otherwise a dev
// DB_TYPE=sqlite in .env makes entities emit SQLite types (datetime, simple-enum, …)
// that Postgres rejects.
process.env.DB_TYPE = 'postgres';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'doctor360',
  password: process.env.DB_PASSWORD ?? 'doctor360',
  database: process.env.DB_NAME ?? 'doctor360',
  // Glob the compiled-or-source entities/migrations so the CLI works under ts-node.
  entities: ['src/entities/*.entity.{ts,js}'],
  migrations: ['src/migrations/*.{ts,js}'],
  synchronize: false,
  logging: ['error', 'migration'],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
