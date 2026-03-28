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
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const autoId = String(payload.auto_id || "").trim();
    const nombre = String(payload.nombre || "").trim();
    const mensaje = String(payload.mensaje || "").trim();

    if (!autoId || !nombre || !mensaje) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Faltan parámetros" }),
      };
    }

    await ensureTable();

    const insert = await pool.query(
      `
      INSERT INTO automatch_comments (auto_id, nombre, mensaje)
      VALUES ($1, $2, $3)
      RETURNING id, auto_id, nombre, mensaje, created_at
      `,
      [autoId, nombre, mensaje],
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, comment: insert.rows[0] }),
    };
  } catch (error) {
    console.error("api-automatch-comment error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno del servidor" }),
    };
  }
}
