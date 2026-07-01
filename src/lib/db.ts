import pkg from "pg";
import { resolveDatabaseUrl } from "./database-url";

const { Pool } = pkg;

let _pool: InstanceType<typeof Pool> | null = null;

const DB_CONNECTION_TIMEOUT_MS = Number(
  process.env.DB_CONNECTION_TIMEOUT_MS || "5000",
);
const DB_QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS || "8000");

export function getPool() {
  if (!_pool) {
    const connStr = resolveDatabaseUrl();

    _pool = new Pool({
      connectionString: connStr,
      ssl: connStr.includes("localhost") ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
      query_timeout: DB_QUERY_TIMEOUT_MS,
      statement_timeout: DB_QUERY_TIMEOUT_MS,
      idleTimeoutMillis: 10000,
      max: 5,
    });
  }

  return _pool;
}
