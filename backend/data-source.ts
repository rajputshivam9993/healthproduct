import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

// Standalone DataSource used by the TypeORM CLI (migration:run / generate / revert).
// The NestJS app builds its own DataSource via TypeOrmModule in app.module.ts; the
// connection settings here are kept in sync through the same environment variables.
dotenv.config();

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
  ssl: {
    rejectUnauthorized: false
  },
});
