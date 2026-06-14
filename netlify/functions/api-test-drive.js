const { Client } = require("pg");

function resolveConnectionString() {
  const raw =
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    "";

  return raw.trim().replace(/^['\"]|['\"]$/g, "");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function resolveDealerId(client, payload) {
  if (payload.dealerId && Number.isInteger(Number(payload.dealerId))) {
    return Number(payload.dealerId);
  }

  if (payload.noteId) {
    const byNote = await client.query(
      `SELECT dealer_id FROM dealer_vehicles
       WHERE note_id = $1 AND active = true
       ORDER BY id ASC LIMIT 1`,
      [Number(payload.noteId)],
    );
    if (byNote.rows[0]?.dealer_id) return Number(byNote.rows[0].dealer_id);
  }

  if (payload.autoId !== undefined && payload.autoId !== null && payload.autoId !== "") {
    const byAuto = await client.query(
      `SELECT dealer_id FROM dealer_vehicles
       WHERE auto_id = $1 AND active = true
       ORDER BY id ASC LIMIT 1`,
      [String(payload.autoId)],
    );
    if (byAuto.rows[0]?.dealer_id) return Number(byAuto.rows[0].dealer_id);
  }

  if (payload.concesionarioNombre) {
    const byName = await client.query(
      `SELECT id FROM dealers
       WHERE lower(name) = lower($1) AND active = true
       LIMIT 1`,
      [String(payload.concesionarioNombre).trim()],
    );
    if (byName.rows[0]?.id) return Number(byName.rows[0].id);
  }

  return null;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  const client = new Client({
    connectionString: resolveConnectionString(),
    ssl: { rejectUnauthorized: false },
  });

  try {
    const body = JSON.parse(event.body || "{}");
    const nombre = String(body.nombre || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const telefono = String(body.telefono || "").trim();

    if (!nombre || !email || !telefono) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Campos requeridos faltantes", success: false }),
      };
    }

    if (!EMAIL_RE.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email inválido", success: false }),
      };
    }

    await client.connect();

    const dealerId = await resolveDealerId(client, body);
    const autoIdNumber = Number(body.autoId);
    const parsedAutoId = Number.isFinite(autoIdNumber) ? autoIdNumber : 0;

    const userIp =
      event.headers["client-ip"] ||
      event.headers["x-forwarded-for"] ||
      event.headers["x-real-ip"] ||
      "unknown";

    const result = await client.query(
      `INSERT INTO test_drives (
        auto_id, note_id, nombre, email, telefono, mensaje,
        concesionario_id, concesionario_nombre, auto_nombre,
        ciudad, source, estado, user_ip, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pendiente', $12, $13)
      RETURNING id, created_at`,
      [
        parsedAutoId,
        body.noteId ? Number(body.noteId) : null,
        nombre,
        email,
        telefono,
        body.mensaje ? String(body.mensaje).trim() : null,
        dealerId,
        body.concesionarioNombre ? String(body.concesionarioNombre).trim() : null,
        body.autoNombre ? String(body.autoNombre).trim() : null,
        body.ciudad ? String(body.ciudad).trim() : null,
        body.source === "nota" ? "nota" : "automatch",
        userIp,
        event.headers["user-agent"] || null,
      ],
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Solicitud guardada correctamente",
        success: true,
        id: result.rows[0].id,
        created_at: result.rows[0].created_at,
        dealerId,
      }),
    };
  } catch (error) {
    console.error("api-test-drive error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Error procesando solicitud",
        error: error.message,
        success: false,
      }),
    };
  } finally {
    try {
      await client.end();
    } catch {
      // noop
    }
  }
};
