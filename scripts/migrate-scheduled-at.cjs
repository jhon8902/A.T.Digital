require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED;

  if (!connectionString) {
    throw new Error(
      "Define DATABASE_URL o NETLIFY_DATABASE_URL en tu archivo .env"
    );
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

  const migrationPath = path.join(
    __dirname,
    "..",
    "db",
    "migrations",
    "001-add-scheduled-at.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf8");

  try {
    await pool.query(sql);
    const check = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'notes'
        AND column_name = 'scheduled_at'
    `);
    if (check.rows.length === 0) {
      throw new Error("La columna scheduled_at no se creó correctamente.");
    }
    console.log("MIGRACION_OK: columna scheduled_at lista en notes");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
