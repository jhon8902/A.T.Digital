const { Client } = require("pg");

function resolveConnectionString() {
  const raw =
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    "";
  return raw.trim().replace(/^['"]|['"]$/g, "");
}

const ALLOWED_EVENTS = new Set([
  "search",
  "match_view",
  "match_empty",
  "ficha_click",
  "ficha_view",
  "tco_click",
  "whatsapp_click",
  "test_drive",
]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const ENSURE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS automatch_events (
  id SERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  auto_id TEXT,
  note_id INTEGER,
  dealer_id INTEGER,
  tipo TEXT,
  uso TEXT,
  ciudad TEXT,
  presupuesto TEXT,
  score INTEGER,
  source TEXT,
  path TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_automatch_events_event ON automatch_events(event);
CREATE INDEX IF NOT EXISTS idx_automatch_events_created_at ON automatch_events(created_at DESC);
`;

function clip(value, max = 80) {
  return String(value || "").trim().slice(0, max);
}

function optionalInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS,
      body: JSON.stringify({ ok: false }),
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    body = {};
  }

  const eventName = clip(body.event || body.evento, 40);
  if (!ALLOWED_EVENTS.has(eventName)) {
    return {
      statusCode: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "evento inválido" }),
    };
  }

  const client = new Client({
    connectionString: resolveConnectionString(),
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(ENSURE_TABLE_SQL);
    await client.query(
      `INSERT INTO automatch_events
        (event, auto_id, note_id, dealer_id, tipo, uso, ciudad, presupuesto, score, source, path)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        eventName,
        clip(body.auto_id || body.autoId, 40) || null,
        optionalInt(body.note_id || body.noteId),
        optionalInt(body.dealer_id || body.dealerId),
        clip(body.tipo, 40) || null,
        clip(body.uso, 40) || null,
        clip(body.ciudad, 40) || null,
        clip(body.presupuesto, 40) || null,
        optionalInt(body.score),
        clip(body.source, 40) || "automatch",
        clip(body.path, 180) || null,
      ],
    );
  } catch (error) {
    console.warn("automatch-event:", error);
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }

  return {
    statusCode: 204,
    headers: CORS,
    body: "",
  };
};
