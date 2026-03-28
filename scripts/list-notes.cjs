require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const { rows } = await pool.query(
    `SELECT id, title, category, created_at FROM notes ORDER BY id DESC LIMIT 30`
  );
  console.log("\n📋 NOTAS EN LA BASE DE DATOS (las 30 más recientes):\n");
  console.table(rows.map(r => ({
    id: r.id,
    categoria: r.category,
    titulo: r.title?.substring(0, 60),
    creada: r.created_at?.toISOString?.()?.split("T")[0] ?? r.created_at,
  })));
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
