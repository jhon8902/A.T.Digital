import pkg from "pg";
import type { Handler } from "@netlify/functions";
import "dotenv/config";
import { requireEventBasicAuth } from "./auth.js";

const { Pool } = pkg;

let _pool: InstanceType<typeof Pool> | null = null;
let _notesColumns: Set<string> | null = null;

const KNOWN_NOTES_COLUMNS = new Set([
  "id",
  "title",
  "subtitle",
  "editor",
  "source_scope",
  "content",
  "category",
  "image1",
  "image2",
  "image3",
  "image4",
  "image5",
  "image6",
  "video1",
  "video2",
  "video3",
  "video4",
  "video5",
  "video6",
  "video7",
  "spec_segmento",
  "spec_origen",
  "spec_precio_estimado",
  "spec_versiones",
  "spec_motorizacion",
  "spec_potencia_hp",
  "spec_torque_nm",
  "spec_bateria_autonomia",
  "spec_bateria_kwh",
  "spec_autonomia_km",
  "spec_carga",
  "spec_carga_ac_kw",
  "spec_carga_dc_kw",
  "spec_aceleracion_0_100",
  "spec_seguridad",
  "spec_equipamiento",
  "spec_pros",
  "spec_contras",
  "spec_competidores",
  "spec_traccion",
  "spec_precio_cop",
  "created_at",
  "updated_at",
]);

const DB_CONNECTION_TIMEOUT_MS = Number(
  process.env.DB_CONNECTION_TIMEOUT_MS || "5000"
);
const DB_QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS || "8000");

function resolveConnectionString(): string {
  const raw =
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    "";

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
      ssl: connStr?.includes("localhost") ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
      query_timeout: DB_QUERY_TIMEOUT_MS,
      statement_timeout: DB_QUERY_TIMEOUT_MS,
      idleTimeoutMillis: 10000,
      max: 5,
    });
  }
  return _pool;
}

async function getNotesColumns(): Promise<Set<string>> {
  if (_notesColumns) return _notesColumns;

  // Evitamos consultar information_schema por request para no disparar timeout en Netlify Dev.
  _notesColumns = KNOWN_NOTES_COLUMNS;

  return _notesColumns;
}

const ALLOWED_CATEGORIES = new Set([
  "noticias",
  "electricos",
  "hibridos",
  "deportes",
  "pruebas",
  "lanzamientos",
  "automatch",
  "general",
]);

const ALLOWED_SOURCE_SCOPES = new Set(["nacional", "internacional"]);

const CATEGORY_ALIASES: Record<string, string> = {
  electrico: "electricos",
  electrica: "electricos",
  electricos: "electricos",
  hibrido: "hibridos",
  hibrida: "hibridos",
  hibridos: "hibridos",
  lanzamiento: "lanzamientos",
  noticia: "noticias",
  deporte: "deportes",
};

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

function resolveCategory(category: string): string {
  const normalized = normalizeCategory(category);
  return CATEGORY_ALIASES[normalized] || normalized;
}

function normalizeSourceScope(scope: string): string {
  const normalized = normalizeCategory(scope || "nacional");
  if (normalized === "internacional") return "internacional";
  return "nacional";
}

function normalizeMediaUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim().replace(/^['\"]+|['\"]+$/g, "");
  if (!cleaned) return undefined;
  if (cleaned.startsWith("img/")) return `/${cleaned}`;
  return cleaned;
}

function mojibakeScore(text: string): number {
  const matches = text.match(/[ÃÂâ�]/g);
  return matches ? matches.length : 0;
}

function repairPotentialMojibake(text: string): string {
  const suspicious = /[ÃÂâ�]/.test(text);
  if (!suspicious) return text;

  const repaired = Buffer.from(text, "latin1").toString("utf8");
  return mojibakeScore(repaired) < mojibakeScore(text) ? repaired : text;
}

function normalizeTextField(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = repairPotentialMojibake(
    value.trim().replace(/^['\"]+|['\"]+$/g, "")
  );
  return cleaned || undefined;
}

function isCategoryConstraintError(error: any): boolean {
  if (!error) return false;

  return (
    error.code === "22P02" ||
    error.code === "23514" ||
    /category|enum|constraint/i.test(String(error.message || ""))
  );
}

function formatDbError(error: any) {
  return {
    message: error?.message || null,
    code: error?.code || null,
    detail: error?.detail || null,
    constraint: error?.constraint || null,
    table: error?.table || null,
    column: error?.column || null,
    hint: error?.hint || null,
  };
}

function isMissingImage6ColumnError(error: any): boolean {
  if (!error) return false;
  return (
    error.code === "42703" &&
    /image6|column\s+"?image6"?\s+does\s+not\s+exist/i.test(
      String(error.message || "")
    )
  );
}

function isMissingVideoColumnsError(error: any): boolean {
  if (!error) return false;
  return (
    error.code === "42703" &&
    /video[1-7]|column\s+"?video[1-7]"?\s+does\s+not\s+exist/i.test(
      String(error.message || "")
    )
  );
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

async function insertNote(
  payload: {
  title: string;
  subtitle?: string;
  editor?: string;
  source_scope?: string;
  content: string;
  category: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  image6?: string;
  video1?: string;
  video2?: string;
  video3?: string;
  video4?: string;
  video5?: string;
  video6?: string;
  video7?: string;
  spec_segmento?: string;
  spec_origen?: string;
  spec_precio_estimado?: string;
  spec_versiones?: string;
  spec_motorizacion?: string;
  spec_potencia_hp?: string;
  spec_torque_nm?: string;
  spec_bateria_autonomia?: string;
  spec_bateria_kwh?: string;
  spec_autonomia_km?: string;
  spec_carga?: string;
  spec_carga_ac_kw?: string;
  spec_carga_dc_kw?: string;
  spec_aceleracion_0_100?: string;
  spec_seguridad?: string;
  spec_equipamiento?: string;
  spec_pros?: string;
  spec_contras?: string;
  spec_competidores?: string;
  spec_traccion?: string;
  spec_precio_cop?: string;
},
  options: { includeImage6: boolean; includeVideos: boolean; includeSourceScope: boolean; includeEditor: boolean }
) {
  const columns = [
    "title",
    "subtitle",
    "editor",
    "source_scope",
    "content",
    "category",
    "image1",
    "image2",
    "image3",
    "image4",
    "image5",
  ];

  const values: Array<string | null | undefined> = [
    payload.title,
    payload.subtitle,
    payload.editor ?? "Jhon Aparicio",
    payload.source_scope ?? "nacional",
    payload.content,
    payload.category,
    payload.image1,
    payload.image2,
    payload.image3,
    payload.image4,
    payload.image5,
  ];

  if (!options.includeSourceScope) {
    const scopeIdx = columns.indexOf("source_scope");
    if (scopeIdx >= 0) {
      columns.splice(scopeIdx, 1);
      values.splice(scopeIdx, 1);
    }
  }

  if (!options.includeEditor) {
    const editorIdx = columns.indexOf("editor");
    if (editorIdx >= 0) {
      columns.splice(editorIdx, 1);
      values.splice(editorIdx, 1);
    }
  }

  if (options.includeImage6) {
    columns.push("image6");
    values.push(payload.image6 ?? null);
  }

  if (options.includeVideos) {
    columns.push(
      "video1",
      "video2",
      "video3",
      "video4",
      "video5",
      "video6",
      "video7"
    );
    values.push(
      payload.video1 ?? null,
      payload.video2 ?? null,
      payload.video3 ?? null,
      payload.video4 ?? null,
      payload.video5 ?? null,
      payload.video6 ?? null,
      payload.video7 ?? null
    );
  }

  const technicalSpecPairs = [
    ["spec_segmento", payload.spec_segmento],
    ["spec_origen", payload.spec_origen],
    ["spec_precio_estimado", payload.spec_precio_estimado],
    ["spec_versiones", payload.spec_versiones],
    ["spec_motorizacion", payload.spec_motorizacion],
    ["spec_potencia_hp", payload.spec_potencia_hp],
    ["spec_torque_nm", payload.spec_torque_nm],
    ["spec_bateria_autonomia", payload.spec_bateria_autonomia],
    ["spec_bateria_kwh", payload.spec_bateria_kwh],
    ["spec_autonomia_km", payload.spec_autonomia_km],
    ["spec_carga", payload.spec_carga],
    ["spec_carga_ac_kw", payload.spec_carga_ac_kw],
    ["spec_carga_dc_kw", payload.spec_carga_dc_kw],
    ["spec_aceleracion_0_100", payload.spec_aceleracion_0_100],
    ["spec_seguridad", payload.spec_seguridad],
    ["spec_equipamiento", payload.spec_equipamiento],
    ["spec_pros", payload.spec_pros],
    ["spec_contras", payload.spec_contras],
    ["spec_competidores", payload.spec_competidores],
    ["spec_traccion", payload.spec_traccion],
    ["spec_precio_cop", payload.spec_precio_cop],
  ] as const;

  technicalSpecPairs.forEach(([column, value]) => {
    if (value !== undefined) {
      columns.push(column);
      values.push(value);
    }
  });

  const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");

  return getPool().query(
    `INSERT INTO notes (${columns.join(", ")})
     VALUES (${placeholders})
     RETURNING id, category`,
    values
  );
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

    const unauthorizedResponse = requireEventBasicAuth(event);
    if (unauthorizedResponse) {
      return {
        ...unauthorizedResponse,
        headers: {
          ...headers,
          ...(unauthorizedResponse.headers || {}),
        },
      };
    }

    // ✅ Parsear body
    const body = JSON.parse(event.body || "{}");
    console.log("📩 Datos recibidos:", body);

    let {
      title,
      subtitle,
      editor,
      source_scope,
      content,
      category,
      image1,
      image2,
      image3,
      image4,
      image5,
      image6,
      video1,
      video2,
      video3,
      video4,
      video5,
      video6,
      video7,
      spec_segmento,
      spec_origen,
      spec_precio_estimado,
      spec_versiones,
      spec_motorizacion,
      spec_potencia_hp,
      spec_torque_nm,
      spec_bateria_autonomia,
      spec_bateria_kwh,
      spec_autonomia_km,
      spec_carga,
      spec_carga_ac_kw,
      spec_carga_dc_kw,
      spec_aceleracion_0_100,
      spec_seguridad,
      spec_equipamiento,
      spec_pros,
      spec_contras,
      spec_competidores,
      spec_traccion,
      spec_precio_cop,
      scheduled_at
    } = body;

    const normalizedTitle = normalizeTextField(title);
    const normalizedSubtitle = normalizeTextField(subtitle);
    const normalizedEditor = normalizeTextField(editor) || "Jhon Aparicio";
    const normalizedContent = normalizeTextField(content);

    if (!normalizedTitle || !normalizedContent) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Título y contenido son obligatorios" }),
      };
    }

    // ⚙️ Normalizamos la categoría antes de guardar
    category = resolveCategory(category);

    if (!ALLOWED_CATEGORIES.has(category)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Categoría no permitida: ${category}`,
          category,
        }),
      };
    }

    const normalizedSourceScope = normalizeSourceScope(source_scope);
    if (!ALLOWED_SOURCE_SCOPES.has(normalizedSourceScope)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Ámbito no permitido: ${normalizedSourceScope}`,
          source_scope: normalizedSourceScope,
        }),
      };
    }

    // ✅ Insertar en base de datos
    const payload = {
      title: normalizedTitle,
      subtitle: normalizedSubtitle,
      editor: normalizedEditor,
      source_scope: normalizedSourceScope,
      content: normalizedContent,
      category,
      image1: normalizeMediaUrl(image1),
      image2: normalizeMediaUrl(image2),
      image3: normalizeMediaUrl(image3),
      image4: normalizeMediaUrl(image4),
      image5: normalizeMediaUrl(image5),
      image6: normalizeMediaUrl(image6),
      video1: normalizeMediaUrl(video1),
      video2: normalizeMediaUrl(video2),
      video3: normalizeMediaUrl(video3),
      video4: normalizeMediaUrl(video4),
      video5: normalizeMediaUrl(video5),
      video6: normalizeMediaUrl(video6),
      video7: normalizeMediaUrl(video7),
      spec_segmento: normalizeTextField(spec_segmento),
      spec_origen: normalizeTextField(spec_origen),
      spec_precio_estimado: normalizeTextField(spec_precio_estimado),
      spec_versiones: normalizeTextField(spec_versiones),
      spec_motorizacion: normalizeTextField(spec_motorizacion),
      spec_potencia_hp: normalizeTextField(spec_potencia_hp),
      spec_torque_nm: normalizeTextField(spec_torque_nm),
      spec_bateria_autonomia: normalizeTextField(spec_bateria_autonomia),
      spec_bateria_kwh: normalizeTextField(spec_bateria_kwh),
      spec_autonomia_km: normalizeTextField(spec_autonomia_km),
      spec_carga: normalizeTextField(spec_carga),
      spec_carga_ac_kw: normalizeTextField(spec_carga_ac_kw),
      spec_carga_dc_kw: normalizeTextField(spec_carga_dc_kw),
      spec_aceleracion_0_100: normalizeTextField(spec_aceleracion_0_100),
      spec_seguridad: normalizeTextField(spec_seguridad),
      spec_equipamiento: normalizeTextField(spec_equipamiento),
      spec_pros: normalizeTextField(spec_pros),
      spec_contras: normalizeTextField(spec_contras),
      spec_competidores: normalizeTextField(spec_competidores),
      spec_traccion: normalizeTextField(spec_traccion),
      spec_precio_cop: normalizeTextField(spec_precio_cop),
      scheduled_at: scheduled_at ? new Date(scheduled_at) : null
    };

    const columns = await getNotesColumns();
    const supportsEditor = columns.has("editor");
    const supportsSourceScope = columns.has("source_scope");
    const supportsImage6 = columns.has("image6");
    const supportsVideos = [
      "video1",
      "video2",
      "video3",
      "video4",
      "video5",
      "video6",
      "video7",
    ].every((column) => columns.has(column));

    let result;
    try {
      result = await insertNote(payload, {
        includeImage6: supportsImage6,
        includeVideos: supportsVideos,
        includeSourceScope: supportsSourceScope,
        includeEditor: supportsEditor,
      });
    } catch (insertError: any) {
      if (isCategoryConstraintError(insertError)) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error:
              "Esquema de categorias desactualizado. Aplica db/schema.sql para habilitar todas las categorias.",
            detail: formatDbError(insertError),
          }),
        };
      } else if (isMissingEditorColumnError(insertError)) {
        result = await insertNote(payload, {
          includeImage6: supportsImage6,
          includeVideos: supportsVideos,
          includeSourceScope: supportsSourceScope,
          includeEditor: false,
        });
      } else if (isMissingSourceScopeColumnError(insertError)) {
        result = await insertNote(payload, {
          includeImage6: supportsImage6,
          includeVideos: supportsVideos,
          includeSourceScope: false,
          includeEditor: supportsEditor,
        });
      } else if (isMissingVideoColumnsError(insertError)) {
        result = await insertNote(payload, {
          includeImage6: supportsImage6,
          includeVideos: false,
          includeSourceScope: supportsSourceScope,
          includeEditor: supportsEditor,
        });
      } else if (isMissingImage6ColumnError(insertError)) {
        result = await insertNote(payload, {
          includeImage6: false,
          includeVideos: supportsVideos,
          includeSourceScope: supportsSourceScope,
          includeEditor: supportsEditor,
        });
      } else {
        throw insertError;
      }
    }

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
      body: JSON.stringify({
        error: "Error al guardar la nota",
        detail: formatDbError(err),
      }),
    };
  }
};
