import pkg from "pg";
import type { Handler } from "@netlify/functions";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

// 🔤 Función para limpiar y normalizar categorías
function normalizeCategory(category: string): string {
  if (!category) return "general";
  return category
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD") // separa letras y tildes
    .replace(/[\u0300-\u036f]/g, ""); // elimina las tildes
}

export const handler: Handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    // ✅ Preflight CORS
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

    // ✅ Solo POST permitido
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers, body: "Método no permitido" };
    }

    // ✅ Parsear body
    const body = JSON.parse(event.body || "{}");
    console.log("📩 Datos recibidos:", body);

    let { title, subtitle, content, category, image1 } = body;

    // ⚙️ Normalizamos la categoría antes de guardar
    category = normalizeCategory(category);

    // ✅ Insertar en base de datos
    const result = await pool.query(
      `INSERT INTO notes (title, subtitle, content, category, image1)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, category`,
      [title, subtitle, content, category, image1]
    );

    console.log("📝 Nota guardada correctamente:", result.rows[0]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Nota guardada con éxito ✅",
        id: result.rows[0].id,
        category: result.rows[0].category,
      }),
    };
  } catch (err) {
    console.error("❌ Error en save-note:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Error al guardar la nota" }),
    };
  }
};
