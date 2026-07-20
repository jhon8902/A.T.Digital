import type { APIRoute } from "astro";
import pkg from "pg";
import {
  normalizeScheduledAtInput,
} from "../../lib/note-scheduling";
import {
  appendPruebasSoloMeta,
  stripPruebasSoloMeta,
} from "../../lib/pruebas-solo";

const { Pool } = pkg;

let _pool: InstanceType<typeof Pool> | null = null;
let _notesColumns: Set<string> | null = null;

const DB_CONNECTION_TIMEOUT_MS = Number(
  process.env.DB_CONNECTION_TIMEOUT_MS || "5000"
);
const DB_QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS || "8000");

function getPool() {
  if (!_pool) {
    const connStr = process.env.DATABASE_URL;
    if (!connStr) {
      throw new Error("DATABASE_URL no esta configurada");
    }

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

async function getNotesColumns(): Promise<Set<string>> {
  if (_notesColumns) return _notesColumns;

  const result = await getPool().query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notes'
  `);

  _notesColumns = new Set(
    result.rows
      .map((row: any) => String(row.column_name || "").toLowerCase())
      .filter(Boolean)
  );

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

function normalizeCategory(category: string): string {
  if (!category) return "general";
  return category
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveCategory(category: string): string {
  const normalized = normalizeCategory(category);
  return CATEGORY_ALIASES[normalized] || normalized;
}

function normalizeSourceScope(scope: string): string {
  const normalized = normalizeCategory(scope || "nacional");
  return normalized === "internacional" ? "internacional" : "nacional";
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

function optionalText(value: unknown): string | null {
  const normalized = normalizeTextField(value);
  return normalized ?? null;
}

function optionalMedia(value: unknown): string | null {
  if (typeof value !== "string") return null;

  let cleaned = value.trim().replace(/^['\"]+|['\"]+$/g, "");
  if (!cleaned) return null;

  cleaned = cleaned.replace(/\\/g, "/");
  if (cleaned.startsWith("./")) cleaned = cleaned.slice(1);
  if (cleaned.startsWith("img/")) cleaned = `/${cleaned}`;

  if (cleaned.startsWith("/")) return encodeURI(cleaned);
  if (/^https?:\/\//i.test(cleaned)) return cleaned;

  return encodeURI(cleaned);
}

function hasOwn(obj: unknown, key: string): boolean {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
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

const updatableColumns = [
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
  "scheduled_at",
] as const;

async function handleUpdate(request: Request) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PUT, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const body = await request.json();

    const id = Number.parseInt(String(body?.id || ""), 10);
    if (!Number.isInteger(id) || id <= 0) {
      return new Response(JSON.stringify({ error: "ID invalido" }), {
        status: 400,
        headers,
      });
    }

    const updates: Record<string, string | null> = {};
    const pruebasSoloVideo =
      body.pruebas_solo_video === true ||
      body.pruebas_solo_video === 1 ||
      body.pruebas_solo_video === "1" ||
      body.pruebas_solo_video === "true";

    if (hasOwn(body, "title")) {
      const title = normalizeTextField(body?.title);
      if (!title) {
        return new Response(JSON.stringify({ error: "Titulo invalido" }), { status: 400, headers });
      }
      updates.title = title;
    }

    if (hasOwn(body, "content")) {
      let content = normalizeTextField(body?.content);
      if (pruebasSoloVideo) {
        updates.content = appendPruebasSoloMeta(content);
        updates.category = "pruebas";
      } else {
        content = stripPruebasSoloMeta(content);
        if (!content) {
          return new Response(JSON.stringify({ error: "Contenido invalido" }), { status: 400, headers });
        }
        updates.content = content;
      }
    } else if (pruebasSoloVideo) {
      updates.category = "pruebas";
    }

    if (hasOwn(body, "category") && !pruebasSoloVideo) {
      const category = resolveCategory(String(body?.category || ""));
      if (!ALLOWED_CATEGORIES.has(category)) {
        return new Response(
          JSON.stringify({ error: `Categoria no permitida: ${category}` }),
          { status: 400, headers }
        );
      }
      updates.category = category;
    }

    if (hasOwn(body, "source_scope")) {
      const sourceScope = normalizeSourceScope(String(body?.source_scope || ""));
      if (!ALLOWED_SOURCE_SCOPES.has(sourceScope)) {
        return new Response(
          JSON.stringify({ error: `Ambito no permitido: ${sourceScope}` }),
          { status: 400, headers }
        );
      }
      updates.source_scope = sourceScope;
    }

    const textFields = [
      "subtitle","editor","spec_segmento","spec_origen","spec_precio_estimado",
      "spec_versiones","spec_motorizacion","spec_potencia_hp","spec_torque_nm",
      "spec_bateria_autonomia","spec_bateria_kwh","spec_autonomia_km","spec_carga",
      "spec_carga_ac_kw","spec_carga_dc_kw","spec_aceleracion_0_100","spec_seguridad",
      "spec_equipamiento","spec_pros","spec_contras","spec_competidores","spec_traccion",
      "spec_precio_cop"
    ] as const;

    const mediaFields = [
      "image1","image2","image3","image4","image5","image6",
      "video1","video2","video3","video4","video5","video6","video7"
    ] as const;

    textFields.forEach((field) => {
      if (hasOwn(body, field)) {
        updates[field] = field === "editor"
          ? (optionalText((body as any)[field]) || "Jhon Aparicio")
          : optionalText((body as any)[field]);
      }
    });

    mediaFields.forEach((field) => {
      if (hasOwn(body, field)) {
        updates[field] = optionalMedia((body as any)[field]);
      }
    });

    if (hasOwn(body, "scheduled_at")) {
      const rawScheduled = (body as any).scheduled_at;
      if (rawScheduled === null || rawScheduled === "") {
        updates.scheduled_at = null;
      } else {
        const normalized = normalizeScheduledAtInput(rawScheduled);
        if (!normalized) {
          return new Response(
            JSON.stringify({ error: "Fecha de publicacion invalida" }),
            { status: 400, headers }
          );
        }
        updates.scheduled_at = normalized;
      }
    }

    if (hasOwn(body, "publish_now") && body.publish_now === true) {
      updates.scheduled_at = null;
    }

    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ error: "No hay campos para actualizar" }),
        { status: 400, headers }
      );
    }

    const columns = await getNotesColumns();
    const setClauses: string[] = [];
    const values: Array<string | null | number> = [];

    updatableColumns.forEach((column) => {
      if (!columns.has(column)) return;
      if (!hasOwn(updates, column)) return;
      values.push(updates[column] ?? null);
      setClauses.push(`${column} = $${values.length}`);
    });

    if (setClauses.length === 0) {
      return new Response(
        JSON.stringify({ error: "Ningun campo enviado coincide con columnas editables de notes" }),
        { status: 400, headers }
      );
    }

    values.push(id);

    const result = await getPool().query(
      `
        UPDATE notes
        SET ${setClauses.join(", ")}
        WHERE id = $${values.length}
        RETURNING id, category, image5
      `,
      values
    );

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: "Nota no encontrada" }), {
        status: 404,
        headers,
      });
    }

    return new Response(
      JSON.stringify({
        message: "Nota actualizada con exito ✅",
        id: result.rows[0].id,
        category: result.rows[0].category,
        image5: result.rows[0].image5,
      }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error("❌ Error en API update-note:", err);
    return new Response(
      JSON.stringify({
        error: "Error al actualizar la nota",
        detail: formatDbError(err),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export const PUT: APIRoute = async ({ request }) => handleUpdate(request);
export const POST: APIRoute = async ({ request }) => handleUpdate(request);
export const OPTIONS: APIRoute = async () =>
  new Response("", {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PUT, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
