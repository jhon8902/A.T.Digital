import pkg from "pg";
import type { Handler } from "@netlify/functions";

const { Pool } = pkg;

// ✅ Conexión segura (local o producción)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

// 🔤 Función para normalizar tildes y espacios
function normalizeCategory(category: string): string {
  return category
    ?.toString()
    .trim()
    .toLowerCase()
    .normalize("NFD") // separa letras y tildes
    .replace(/[\u0300-\u036f]/g, ""); // elimina los tildes
}

export const handler: Handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const id = event.queryStringParameters?.id;
    console.log("📩 Parámetro recibido:", id);

    // 🟡 Si se pasa un ID → devolver una sola nota
    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        console.warn("⚠️ ID inválido:", id);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "ID inválido" }),
        };
      }

      const result = await pool.query("SELECT * FROM notes WHERE id = $1", [parsedId]);
      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Nota no encontrada" }),
        };
      }

      const note = result.rows[0];
      note.category = normalizeCategory(note.category);
      console.log("🧠 Nota encontrada:", note);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(note),
      };
    }

    // 🟢 Si no hay ID → devolver todas las notas
    const result = await pool.query(`
      SELECT
        id, title, subtitle, content,
        category, image1, created_at
      FROM notes
      ORDER BY created_at DESC
    `);

    // 🔤 Normalizamos todas las categorías antes de devolver
    const normalizedRows = result.rows.map((row) => ({
      ...row,
      category: normalizeCategory(row.category),
    }));

    console.log(`📚 ${normalizedRows.length} notas obtenidas`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(normalizedRows),
    };
  } catch (err) {
    console.error("❌ Error al obtener notas:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Error al obtener notas" }),
    };
  }
};
