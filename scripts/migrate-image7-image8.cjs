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
    "002-add-image7-image8.sql"
  );
  const sql = fs.readFileSync(sqlPath, "utf8");

  try {
    await pool.query(sql);
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'notes'
        AND column_name IN ('image7', 'image8')
      ORDER BY column_name
    `);
    console.log("IMAGE78_OK", result.rows.map((row) => row.column_name).join(","));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
