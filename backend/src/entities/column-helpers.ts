import { ColumnOptions } from 'typeorm';
import { isSqlite } from '../config/database.config';

// These helpers pick column types that work in both modes: the production
// PostgreSQL types, and the closest equivalents the dev SQLite (sql.js) database
// supports. Stored values stay identical so application logic is unaffected.

/** Native PostgreSQL `enum` in prod; TypeORM `simple-enum` (text) in dev SQLite. */
export function enumColumn(
  enumObj: object,
  options: Omit<ColumnOptions, 'type' | 'enum'> = {},
): ColumnOptions {
  return {
    type: isSqlite ? 'simple-enum' : 'enum',
    enum: enumObj,
    ...options,
  };
}

/** `timestamptz` in prod; `datetime` in dev SQLite. */
export function timestampColumn(options: Omit<ColumnOptions, 'type'> = {}): ColumnOptions {
  return { type: isSqlite ? 'datetime' : 'timestamptz', ...options };
}

/** `jsonb` in prod; `simple-json` (text) in dev SQLite. */
export function jsonColumn(options: Omit<ColumnOptions, 'type'> = {}): ColumnOptions {
  return { type: isSqlite ? 'simple-json' : 'jsonb', ...options };
}

/** Fixed-precision `numeric` in prod; `text` in dev SQLite (values are strings). */
export function numericColumn(
  precision: number,
  scale: number,
  options: Omit<ColumnOptions, 'type' | 'precision' | 'scale'> = {},
): ColumnOptions {
  return isSqlite
    ? { type: 'text', ...options }
    : { type: 'numeric', precision, scale, ...options };
}
