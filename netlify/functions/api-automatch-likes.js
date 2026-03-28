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
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    await ensureTable();

    const rawIds = event.queryStringParameters?.auto_ids || "";
    const ids = rawIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const params = [];
    let whereClause = "";

    if (ids.length > 0) {
      params.push(ids);
      whereClause = "WHERE auto_id = ANY($1)";
    }

    const result = await pool.query(
      `
      SELECT auto_id, tipo, COUNT(*)::int AS total
      FROM automatch_likes
      ${whereClause}
      GROUP BY auto_id, tipo
      `,
      params,
    );

    const counts = {};
    for (const row of result.rows) {
      if (!counts[row.auto_id]) {
        counts[row.auto_id] = { like: 0, corazon: 0 };
      }
      counts[row.auto_id][row.tipo] = row.total;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, counts }),
    };
  } catch (error) {
    console.error("api-automatch-likes error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno del servidor" }),
    };
  }
}
