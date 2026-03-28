import { pool } from "./db.js";

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS automatch_likes (
      id SERIAL PRIMARY KEY,
      auto_id TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('like', 'corazon')),
      client_id TEXT NOT NULL,
      user_ip TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (auto_id, tipo, client_id)
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
    const tipo = String(payload.tipo || "").trim();
    const clientId = String(payload.client_id || "").trim();
    const userIp = event.headers["x-forwarded-for"] || "unknown";

    if (!autoId || !clientId || !["like", "corazon"].includes(tipo)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Parámetros inválidos" }),
      };
    }

    await ensureTable();

    const insertResult = await pool.query(
      `
      INSERT INTO automatch_likes (auto_id, tipo, client_id, user_ip)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (auto_id, tipo, client_id) DO NOTHING
      RETURNING id
      `,
      [autoId, tipo, clientId, userIp],
    );

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM automatch_likes WHERE auto_id = $1 AND tipo = $2`,
      [autoId, tipo],
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        total: countResult.rows[0]?.total || 0,
        alreadyLiked: insertResult.rowCount === 0,
      }),
    };
  } catch (error) {
    console.error("api-automatch-like error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno del servidor" }),
    };
  }
}
