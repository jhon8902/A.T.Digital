require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

async function main() {
  const connectionString = (
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    ""
  )
    .trim()
    .replace(/^['"]|['"]$/g, "");

  if (!connectionString) {
    throw new Error("DATABASE_URL no está definido en el entorno.");
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

  const sqlPath = path.join(
    __dirname,
    "..",
    "db",
    "migrations",
    "003-add-image9.sql"
  );
  const sql = fs.readFileSync(sqlPath, "utf8");

  try {
    await pool.query(sql);
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'notes'
        AND column_name = 'image9'
    `);
    console.log("IMAGE9_OK", result.rows[0] ? result.rows[0].column_name : "missing");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
