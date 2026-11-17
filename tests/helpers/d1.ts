/**
 * Test-only D1 adapter. Every database lives in its own temporary SQLite file.
 * This verifies real local SQL/transactions, not hosted D1 or its replication.
 * Never import this module from the application.
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import type { SQLInputValue, SQLOutputValue } from 'node:sqlite';

function binding(value: unknown): SQLInputValue {
  if (value === null || typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return Uint8Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
  if (Array.isArray(value) && value.every(item => Number.isInteger(item) && item >= 0 && item <= 255)) {
    return new Uint8Array(value);
  }
  throw new TypeError('D1 test adapter: unsupported SQL binding type.');
}

function plainRow(row: Record<string, SQLOutputValue>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row));
}

class SqliteStatement implements D1PreparedStatement {
  database: SqliteD1;
  query: string;
  values: SQLInputValue[];

  constructor(database: SqliteD1, query: string, values: SQLInputValue[] = []) {
    this.database = database;
    this.query = query;
    this.values = values;
  }

  bind(...values: unknown[]): D1PreparedStatement {
    return new SqliteStatement(this.database, this.query, values.map(binding));
  }

  execute<T = Record<string, unknown>>(): D1Result<T> {
    const started = performance.now();
    const before = this.database.totalChanges();
    const statement = this.database.connection.prepare(this.query);
    const rows = statement.columns().length
      ? statement.all(...this.values).map(plainRow)
      : (statement.run(...this.values), []);
    const changes = this.database.totalChanges() - before;
    const lastId = this.database.connection.prepare('SELECT last_insert_rowid() AS id').get();
    return {
      success: true,
      results: rows as T[],
      meta: {
        duration: performance.now() - started,
        size_after: statSync(this.database.filename).size,
        rows_read: rows.length,
        rows_written: changes,
        last_row_id: Number(lastId?.id ?? 0),
        changed_db: changes > 0,
        changes,
      },
    };
  }

  async first<T = Record<string, unknown>>(): Promise<T | null>;
  async first<T = unknown>(colName: string): Promise<T | null>;
  async first<T = Record<string, unknown>>(colName?: string): Promise<T | null> {
    const statement = this.database.connection.prepare(this.query);
    const row = statement.get(...this.values);
    if (!row) return null;
    if (colName !== undefined) {
      if (!Object.hasOwn(row, colName)) throw new Error('D1_COLUMN_NOTFOUND');
      return row[colName] as T;
    }
    return plainRow(row) as T;
  }

  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    return this.execute<T>();
  }

  async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    return this.execute<T>();
  }

  async raw<T = unknown[]>(options: { columnNames: true }): Promise<[string[], ...T[]]>;
  async raw<T = unknown[]>(options?: { columnNames?: false }): Promise<T[]>;
  async raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<T[] | [string[], ...T[]]> {
    const statement = this.database.connection.prepare(this.query);
    const names = statement.columns().map(column => column.name);
    statement.setReturnArrays(true);
    const rows = statement.all(...this.values) as unknown as T[];
    return options?.columnNames ? [names, ...rows] : rows;
  }
}

class SqliteD1 implements D1Database {
  connection: DatabaseSync;
  filename: string;

  constructor(connection: DatabaseSync, filename: string) {
    this.connection = connection;
    this.filename = filename;
  }

  totalChanges(): number {
    return Number(this.connection.prepare('SELECT total_changes() AS count').get()?.count ?? 0);
  }

  prepare(query: string): D1PreparedStatement {
    return new SqliteStatement(this, query);
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    if (!statements.every(statement => statement instanceof SqliteStatement && statement.database === this)) {
      throw new TypeError('D1 test adapter: batch statements must belong to this database.');
    }
    this.connection.exec('BEGIN IMMEDIATE');
    try {
      // No await inside the transaction: another request cannot interleave its SQL.
      const results = statements.map(statement => (statement as SqliteStatement).execute<T>());
      this.connection.exec('COMMIT');
      return results;
    } catch (error) {
      this.connection.exec('ROLLBACK');
      throw error;
    }
  }

  async exec(query: string): Promise<D1ExecResult> {
    const started = performance.now();
    this.connection.exec(query);
    return { count: query.split(';').filter(part => part.trim()).length, duration: performance.now() - started };
  }

  withSession(): D1DatabaseSession {
    throw new Error('D1 test adapter does not emulate hosted database sessions.');
  }

  async dump(): Promise<ArrayBuffer> {
    const bytes = readFileSync(this.filename);
    return Uint8Array.from(bytes).buffer;
  }
}

export async function createTestDb(): Promise<{ db: D1Database; close: () => void }> {
  const folder = mkdtempSync(join(tmpdir(), 'nexo-qa-d1-'));
  const filename = join(folder, 'nexo.sqlite');
  const connection = new DatabaseSync(filename);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    try { connection.close(); } finally { rmSync(folder, { recursive: true, force: true }); }
  };
  try {
    connection.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
    const migrationsFolder = fileURLToPath(new URL('../../drizzle/', import.meta.url));
    const migrations = readdirSync(migrationsFolder).filter(name => name.endsWith('.sql')).sort();
    if (!migrations.length) throw new Error('D1 test adapter: no SQL migrations found in drizzle/.');
    connection.exec('BEGIN IMMEDIATE');
    try {
      for (const migration of migrations) connection.exec(readFileSync(join(migrationsFolder, migration), 'utf8'));
      connection.exec('COMMIT');
    } catch (error) {
      connection.exec('ROLLBACK');
      throw error;
    }
    return { db: new SqliteD1(connection, filename), close };
  } catch (error) {
    close();
    throw error;
  }
}
