/**
 * Inserta o actualiza la ficha AutoMatch de ejemplo: Mini Cooper SE Eléctrico.
 * Uso: npm run automatch:seed-ejemplo
 */
require("dotenv").config();
const { Pool } = require("pg");

const TITLE = "Mini Cooper SE Eléctrico";

const PLAIN_PARAGRAPHS = `Titulo: Diseño urbano icónico | El Mini Cooper SE mantiene la silueta reconocible de la marca con detalles eléctricos sutiles: parrilla cerrada, llantas aerodinámicas de 17 pulgadas y franjas LED que lo hacen legible en ciudad.

Titulo: Interior y conectividad | Cabina compacta pero bien resuelta con pantalla circular de 8.8 pulgadas, Apple CarPlay inalámbrico y acabados personalizables. La posición de conducción baja refuerza el carácter deportivo urbano.

Titulo: Autonomía y carga | Batería de 42 kWh con hasta 280 km WLTP en ciclo mixto. Carga AC en pared y opción de carga rápida DC para recuperar el 80% en cerca de 30 minutos según infraestructura disponible.

Titulo: Dinámica y seguridad | 181 hp y 270 Nm entregan respuesta inmediata en arranques urbanos. Incluye 6 airbags, ABS, control de tracción y asistencias básicas para uso diario en Bogotá.

Titulo: Posición en Colombia | Referencia desde $185.900.000 COP en versiones nuevas. Ideal para quien busca un eléctrico premium compacto con fuerte identidad de marca y costos de operación bajos en trayectos cortos.`;

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

function buildContent() {
  const subtitle =
    "Icónico y eléctrico. Perfecto para ciudad con tamaño compacto y autonomía de 280 km.";

  const texts = {
    img2: { line1: "Perfil compacto con presencia en avenida" },
    img3: { line1: "Detalles de diseño y acabados premium" },
    img4: { line1: "Cabina digital y confort urbano" },
    img5: { line1: "Autonomía pensada para el día a día" },
    img6: { line1: "Seguridad y asistencias para ciudad" },
  };

  const catalog = {
    tipo: "eléctrico",
    uso: "urbano",
    condicion: "nuevo",
    ciudad: "Bogotá",
    precio_cop: "185900000",
  };

  const editorialHtml = procesarContenidoAHtml(PLAIN_PARAGRAPHS);
  const encodedMeta = encodeURIComponent(JSON.stringify({ texts, catalog }));
  return {
    subtitle,
    content: `${editorialHtml}<!--AUTOMATCH_META:${encodedMeta}-->`,
  };
}

const NOTE_PAYLOAD = {
  title: TITLE,
  subtitle: buildContent().subtitle,
  editor: "Jhon Aparicio",
  source_scope: "nacional",
  category: "automatch",
  content: buildContent().content,
  image1: "/img/mini-cooper-electrico/mini-cooper-portada.webp",
  image2: "/img/mini-cooper-electrico/mini-cooper-subportada.webp",
  image3: "/img/mini-cooper-electrico/mini-cooper-diseño.webp",
  image4: "/img/mini-cooper-electrico/mini-cooper-interior.webp",
  image5: "/img/mini-cooper-electrico/mini-cooper-autonomia.webp",
  image6: "/img/mini-cooper-electrico/mini-cooper-portada.webp",
  spec_segmento: "Hatchback eléctrico urbano",
  spec_origen: "Internacional (UK/Alemania)",
  spec_precio_estimado: "Desde $185.900.000 COP",
  spec_versiones: "Cooper SE",
  spec_motorizacion: "100% eléctrico (BEV)",
  spec_potencia_hp: "181",
  spec_torque_nm: "270",
  spec_bateria_autonomia: "42 kWh | Hasta 280 km WLTP",
  spec_bateria_kwh: "42",
  spec_autonomia_km: "280",
  spec_carga: "AC doméstica y DC rápida (hasta 80% en ~30 min)",
  spec_carga_ac_kw: "11",
  spec_carga_dc_kw: "50",
  spec_aceleracion_0_100: "7.3 s",
  spec_seguridad: "6 airbags, ABS, EBD, control de tracción y estabilidad",
  spec_equipamiento:
    "Pantalla 8.8\", Apple CarPlay, cámara de reversa, crucero, aire automático, Bluetooth",
  spec_pros:
    "Diseño icónico, manejo ágil, costo de uso bajo en ciudad, marca premium accesible",
  spec_contras:
    "Autonomía limitada en viajes largos, maletero 211 L, precio premium vs compactos",
  spec_competidores: "Peugeot e-208, Mazda MX-30, Honda e, Fiat 500e, Nissan Leaf",
  spec_traccion: "Delantera",
  spec_precio_cop: "185900000",
};

async function main() {
  const connStr = process.env.DATABASE_URL;
  if (!connStr) {
    console.error("❌ DATABASE_URL no configurada en .env");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: connStr,
    ssl: connStr.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  const existing = await pool.query(
    `SELECT id FROM notes WHERE LOWER(category) = 'automatch' AND LOWER(title) = LOWER($1) ORDER BY id DESC LIMIT 1`,
    [TITLE],
  );

  const columns = Object.keys(NOTE_PAYLOAD);
  const values = columns.map((key) => NOTE_PAYLOAD[key]);

  if (existing.rows[0]?.id) {
    const id = existing.rows[0].id;
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(", ");
    await pool.query(
      `UPDATE notes SET ${setClause}, updated_at = NOW() WHERE id = $${columns.length + 1}`,
      [...values, id],
    );
    console.log(`\n✅ Ficha de ejemplo actualizada (id ${id})`);
    console.log(`   Ver en: http://localhost:4321/notas/${id}`);
    console.log(`   Carrusel AutoMatch enlazará a esta ficha si el título coincide.\n`);
  } else {
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
    const inserted = await pool.query(
      `INSERT INTO notes (${columns.join(", ")}) VALUES (${placeholders}) RETURNING id`,
      values,
    );
    const id = inserted.rows[0].id;
    console.log(`\n✅ Ficha de ejemplo creada (id ${id})`);
    console.log(`   Ver en: http://localhost:4321/notas/${id}`);
    console.log(`   Carrusel AutoMatch enlazará a esta ficha si el título coincide.\n`);
  }

  await pool.end();
}

main().catch((error) => {
  console.error("❌ Error:", error.message || error);
  process.exit(1);
});
