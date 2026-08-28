import { STORAGE_SCHEMA, STORAGE_SCHEMA_VERSION } from "./storage-schema";

type SqlBinding = ArrayBuffer | ArrayBufferView | string | number | null;
type SqlRow = Record<string, SqlStorageValue>;

function binding(value: unknown): SqlBinding {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  ) {
    return value;
  }
  if (typeof value === "boolean") return value ? 1 : 0;
  throw new Error("unsupported_sql_binding");
}

class SqlitePreparedStatement {
  private bindings: SqlBinding[] = [];

  constructor(
    private readonly sql: SqlStorage,
    private readonly query: string,
  ) {}

  bind(...values: unknown[]): SqlitePreparedStatement {
    this.bindings = values.map(binding);
    return this;
  }

  firstSync<T>(columnName?: string): T | null {
    const row = this.sql.exec<SqlRow>(this.query, ...this.bindings).toArray()[0];
    if (!row) return null;
    return (columnName ? row[columnName] : row) as T;
  }

  allSync<T>(): { results: T[]; success: true; meta: Record<string, number> } {
    const cursor = this.sql.exec<SqlRow>(this.query, ...this.bindings);
    const rows = cursor.toArray() as T[];
    return {
      results: rows,
      success: true,
      meta: {
        changes: cursor.rowsWritten,
        rows_read: cursor.rowsRead,
        rows_written: cursor.rowsWritten,
      },
    };
  }

  runSync(): { success: true; results: unknown[]; meta: Record<string, number> } {
    const cursor = this.sql.exec<SqlRow>(this.query, ...this.bindings);
    const results = cursor.toArray();
    const lastRow = this.sql.exec<{ id: number }>("SELECT last_insert_rowid() AS id").toArray()[0];
    return {
      success: true,
      results,
      meta: {
        changes: cursor.rowsWritten,
        rows_read: cursor.rowsRead,
        rows_written: cursor.rowsWritten,
        last_row_id: lastRow?.id ?? 0,
      },
    };
  }

  async first<T>(columnName?: string): Promise<T | null> {
    return this.firstSync<T>(columnName);
  }

  async all<T>(): Promise<{ results: T[]; success: true; meta: Record<string, number> }> {
    return this.allSync<T>();
  }

  async run(): Promise<{ success: true; results: unknown[]; meta: Record<string, number> }> {
    return this.runSync();
  }
}

class SqliteD1Database {
  constructor(private readonly state: DurableObjectState) {}

  prepare(query: string): SqlitePreparedStatement {
    return new SqlitePreparedStatement(this.state.storage.sql, query);
  }

  async batch(statements: SqlitePreparedStatement[]): Promise<unknown[]> {
    return this.state.storage.transactionSync(() =>
      statements.map((statement) => statement.runSync()),
    );
  }
}

export function initializeSqliteStorage(state: DurableObjectState): void {
  const sql = state.storage.sql;
  sql.exec(STORAGE_SCHEMA).toArray();
  sql
    .exec(
      `INSERT INTO settings (key, value, updated_at)
     VALUES ('storage_schema_version', ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      STORAGE_SCHEMA_VERSION,
    )
    .toArray();
}

export function createD1CompatibilityDatabase(state: DurableObjectState): D1Database {
  return new SqliteD1Database(state) as unknown as D1Database;
}
