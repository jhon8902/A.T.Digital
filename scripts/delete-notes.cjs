require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ✏️  Pon aquí los IDs que quieras borrar
const IDS_A_BORRAR = [82, 83, 84];

async function main() {
  if (IDS_A_BORRAR.length === 0) {
    console.log("No hay IDs para borrar.");
    await pool.end();
    return;
  }

  const placeholders = IDS_A_BORRAR.map((_, i) => `$${i + 1}`).join(", ");
  const result = await pool.query(
    `DELETE FROM notes WHERE id IN (${placeholders}) RETURNING id, title`,
    IDS_A_BORRAR
  );

  console.log(`\n🗑️  Se eliminaron ${result.rowCount} nota(s):`);
  result.rows.forEach(r => console.log(`  ✅ ID ${r.id} — ${r.title}`));
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
