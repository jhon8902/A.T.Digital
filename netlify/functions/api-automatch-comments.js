import { pool } from "./db.js";

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS automatch_comments (
      id SERIAL PRIMARY KEY,
      auto_id TEXT NOT NULL,
      nombre TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const autoId = String(event.queryStringParameters?.auto_id || "").trim();
    if (!autoId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "auto_id es requerido" }),
      };
    }

    await ensureTable();

    const result = await pool.query(
      `
      SELECT id, auto_id, nombre, mensaje, created_at
      FROM automatch_comments
      WHERE auto_id = $1
      ORDER BY created_at DESC
      LIMIT 100
      `,
      [autoId],
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, comments: result.rows }),
    };
  } catch (error) {
    console.error("api-automatch-comments error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno del servidor" }),
    };
  }
}
