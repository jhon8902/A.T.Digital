/**
 * Inserta o actualiza fichas AutoMatch de ejemplo en la BD.
 *
 * Uso:
 *   npm run automatch:seed-ejemplo          → Mini Cooper
 *   npm run automatch:seed-chery-icar       → Chery iCAR 03T REEV
 *   node ./scripts/seed-automatch-ejemplo.cjs all
 */
require("dotenv").config();
const { Pool } = require("pg");
const { FICHAS } = require("./automatch-fichas-seed-data.cjs");

function procesarContenidoAHtml(text) {
  return String(text)
    .split(/\n\s*\n/)
    .map((bloque) => {
      const limpio = bloque.trim();
      if (!limpio) return "";

      if (/^(Titulo:|Título:)/i.test(limpio)) {
        const partes = limpio.replace(/^(Titulo:|Título:)/i, "").split("|");
        const titulo = partes[0].trim();
        const subtitulo = partes[1] ? partes[1].trim() : "";
        let html = `<h2>${titulo}</h2>`;
        if (subtitulo) html += `<p>${subtitulo}</p>`;
        return html;
      }

      return `<p>${limpio}</p>`;
    })
    .join("");
}

function buildNotePayload(ficha) {
  const encodedMeta = encodeURIComponent(
    JSON.stringify({
      texts: ficha.galleryTexts,
      catalog: ficha.catalogMeta,
    }),
  );
  const editorialHtml = procesarContenidoAHtml(ficha.plainParagraphs);

  return {
    title: ficha.title,
    subtitle: ficha.subtitle,
    editor: "Jhon Aparicio",
    source_scope: "nacional",
    category: "automatch",
    content: `${editorialHtml}<!--AUTOMATCH_META:${encodedMeta}-->`,
    ...ficha.images,
    ...ficha.specs,
  };
}

async function upsertFicha(pool, ficha) {
  const payload = buildNotePayload(ficha);
  const existing = await pool.query(
    `SELECT id FROM notes WHERE LOWER(category) = 'automatch' AND LOWER(title) = LOWER($1) ORDER BY id DESC LIMIT 1`,
    [payload.title],
  );

  const columns = Object.keys(payload);
  const values = columns.map((key) => payload[key]);

  if (existing.rows[0]?.id) {
    const id = existing.rows[0].id;
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(", ");
    await pool.query(
      `UPDATE notes SET ${setClause}, updated_at = NOW() WHERE id = $${columns.length + 1}`,
      [...values, id],
    );
    return { id, action: "updated" };
  }

  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const inserted = await pool.query(
    `INSERT INTO notes (${columns.join(", ")}) VALUES (${placeholders}) RETURNING id`,
    values,
  );
  return { id: inserted.rows[0].id, action: "created" };
}

async function main() {
  const arg = (process.argv[2] || "mini").toLowerCase();
  const keys =
    arg === "all"
      ? Object.keys(FICHAS)
      : [arg === "chery" ? "chery-icar" : arg];

  const selected = keys
    .map((key) => FICHAS[key])
    .filter(Boolean);

  if (selected.length === 0) {
    console.error(
      `❌ Ficha desconocida: "${arg}". Usa: mini | chery-icar | all`,
    );
    process.exit(1);
  }

  const connStr = process.env.DATABASE_URL;
  if (!connStr) {
    console.error("❌ DATABASE_URL no configurada en .env");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: connStr,
    ssl: connStr.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  console.log("\n📦 Seed AutoMatch — fichas editoriales\n");

  for (const ficha of selected) {
    const result = await upsertFicha(pool, ficha);
    const label = result.action === "created" ? "creada" : "actualizada";
    console.log(`✅ ${ficha.title} ${label} (id ${result.id})`);
    console.log(`   Ficha:  http://localhost:4321/notas/${result.id}`);
    console.log(`   Buscar: http://localhost:4321/automatch-find\n`);
  }

  await pool.end();
}

main().catch((error) => {
  console.error("❌ Error:", error.message || error);
  process.exit(1);
});
