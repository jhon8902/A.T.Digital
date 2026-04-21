// netlify/functions/db.js
import pkg from "pg";
const { Pool } = pkg;

function resolveConnectionString() {
  const raw =
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    "";

  return raw.trim().replace(/^['\"]|['\"]$/g, "");
}

export const pool = new Pool({
  connectionString: resolveConnectionString(),
  ssl: { rejectUnauthorized: false }
});
