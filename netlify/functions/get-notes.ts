import pkg from "pg";
import type { Handler } from "@netlify/functions";
import "dotenv/config";

const { Pool } = pkg;

let _pool: InstanceType<typeof Pool> | null = null;

const DB_CONNECTION_TIMEOUT_MS = Number(
  process.env.DB_CONNECTION_TIMEOUT_MS || "5000"
);
const DB_QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS || "8000");

function resolveConnectionString(): string {
  const raw =
    process.env.DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
    "";

  // Netlify UI values can accidentally be saved wrapped in quotes.
  const connStr = raw.trim().replace(/^['\"]|['\"]$/g, "");
  if (!connStr) {
    throw new Error("DATABASE_URL no está configurada");
  }

  return connStr;
}

function getPool() {
  if (!_pool) {
    const connStr = resolveConnectionString();

    _pool = new Pool({
      connectionString: connStr,
      ssl: connStr.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
      connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
      query_timeout: DB_QUERY_TIMEOUT_MS,
      statement_timeout: DB_QUERY_TIMEOUT_MS,
      idleTimeoutMillis: 10000,
      max: 5,
    });
  }

  return _pool;
}

// 🔤 Función para normalizar tildes y espacios
function normalizeCategory(category: string): string {
  return category
    ?.toString()
    .trim()
    .toLowerCase()
    .normalize("NFD") // separa letras y tildes
    .replace(/[\u0300-\u036f]/g, ""); // elimina los tildes
}

function normalizeSourceScope(scope: string): string {
  return normalizeCategory(scope || "nacional") === "internacional"
    ? "internacional"
    : "nacional";
}

function normalizeEditor(editor: unknown): string {
  if (typeof editor !== "string") return "Jhon Aparicio";
  const normalized = editor.trim();
  return normalized || "Jhon Aparicio";
}

function isMissingSourceScopeColumnError(error: any): boolean {
  if (!error) return false;
  return (
    error.code === "42703" &&
    /source_scope|column\s+"?source_scope"?\s+does\s+not\s+exist/i.test(
      String(error.message || "")
    )
  );
}

function isMissingEditorColumnError(error: any): boolean {
  if (!error) return false;
  return (
    error.code === "42703" &&
    /editor|column\s+"?editor"?\s+does\s+not\s+exist/i.test(
      String(error.message || "")
    )
  );
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
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ error: "ID inválido" }),
        };
      }

      const result = await getPool().query("SELECT * FROM notes WHERE id = $1", [
        parsedId,
      ]);
      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Nota no encontrada" }),
        };
      }

      const note = result.rows[0];
      note.category = normalizeCategory(note.category);
      note.source_scope = normalizeSourceScope(note.source_scope);
      note.editor = normalizeEditor(note.editor);
      console.log("🧠 Nota encontrada:", note);

      return {
        statusCode: 200,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(note),
      };
    }

    // 🟢 Si no hay ID → devolver todas las notas
    let result;
    try {
      result = await getPool().query(`
        SELECT
          id, title, subtitle, editor, content,
          category, source_scope, image1, image2, image3, image4, image5, image6,
          video1, video2, video3, video4, video5, video6, video7,
          spec_segmento, spec_origen, spec_precio_estimado, spec_versiones,
          spec_motorizacion, spec_potencia_hp, spec_torque_nm,
          spec_bateria_autonomia, spec_bateria_kwh, spec_autonomia_km,
          spec_carga, spec_carga_ac_kw, spec_carga_dc_kw,
          spec_aceleracion_0_100, spec_seguridad, spec_equipamiento,
          spec_pros, spec_contras, spec_competidores,
          spec_traccion, spec_precio_cop,
          created_at
        FROM notes
        ORDER BY created_at DESC
      `);
    } catch (error: any) {
      if (!isMissingSourceScopeColumnError(error) && !isMissingEditorColumnError(error)) throw error;
      result = await getPool().query(`
        SELECT
          id, title, subtitle, content,
          category, image1, image2, image3, image4, image5, image6,
          video1, video2, video3, video4, video5, video6, video7,
          spec_segmento, spec_origen, spec_precio_estimado, spec_versiones,
          spec_motorizacion, spec_potencia_hp, spec_torque_nm,
          spec_bateria_autonomia, spec_bateria_kwh, spec_autonomia_km,
          spec_carga, spec_carga_ac_kw, spec_carga_dc_kw,
          spec_aceleracion_0_100, spec_seguridad, spec_equipamiento,
          spec_pros, spec_contras, spec_competidores,
          spec_traccion, spec_precio_cop,
          created_at
        FROM notes
        ORDER BY created_at DESC
      `);
    }

    // 🔤 Normalizamos todas las categorías antes de devolver
    const normalizedRows = result.rows.map((row) => ({
      ...row,
      category: normalizeCategory(row.category),
      source_scope: normalizeSourceScope(row.source_scope),
      editor: normalizeEditor(row.editor),
    }));

    console.log(`📚 ${normalizedRows.length} notas obtenidas`);
    return {
      statusCode: 200,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(normalizedRows),
    };
  } catch (err) {
    console.error("❌ Error al obtener notas:", err);
    return {
      statusCode: 500,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Error al obtener notas",
        detail: (err as any)?.message || null,
      }),
    };
  }
};
