import pkg from "pg";
import type { Handler } from "@netlify/functions";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const handler: Handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const id = event.queryStringParameters?.id;

    if (id) {
      // 🔹 Obtener una nota específica
      const result = await pool.query("SELECT * FROM notes WHERE id = $1", [id]);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0] || {}),
      };
    } else {
      // 🔹 Obtener todas las notas (normalizando categoría y ordenando)
      const result = await pool.query(`
        SELECT
          id,
          title,
          subtitle,
          content,
          LOWER(TRIM(category)) AS category,
          image1, image2, image3, image4, image5, image6, image7, image8,
          video1, video2, video3, video4, video5, video6, video7,
          created_at
        FROM notes
        ORDER BY created_at DESC
      `);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows),
      };
    }
  } catch (err) {
    console.error("❌ Error al obtener notas:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Error al obtener notas" }),
    };
  }
};
