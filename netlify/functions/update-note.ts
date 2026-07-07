import pkg from "pg";
import type { Handler } from "@netlify/functions";
import "dotenv/config";
import { requireEventBasicAuth } from "./auth.js";

const { Pool } = pkg;

let _pool: InstanceType<typeof Pool> | null = null;

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

const UPDATABLE_COLUMNS = [
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

function getPool() {
  if (!_pool) {
    const connStr = (
      process.env.NETLIFY_DATABASE_URL ||
      process.env.DATABASE_URL ||
      ""
    )
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (!connStr) throw new Error("DATABASE_URL no está configurada");

    _pool = new Pool({
      connectionString: connStr,
      ssl: connStr.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
    });
  }
  return _pool;
}

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
  return normalizeCategory(scope || "nacional") === "internacional"
    ? "internacional"
    : "nacional";
}

function normalizeTextField(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim().replace(/^['"]+|['"]+$/g, "");
  return cleaned || undefined;
}

function optionalText(value: unknown): string | null {
  const normalized = normalizeTextField(value);
  return normalized ?? null;
}

function optionalMedia(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let cleaned = value.trim().replace(/^['"]+|['"]+$/g, "");
  if (!cleaned) return null;
  cleaned = cleaned.replace(/\\/g, "/");
  if (cleaned.startsWith("./")) cleaned = cleaned.slice(1);
  if (cleaned.startsWith("img/")) cleaned = `/${cleaned}`;
  if (cleaned.startsWith("/")) return encodeURI(cleaned);
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  return encodeURI(cleaned);
}

function normalizeScheduledAtInput(value: unknown): string | null {
  if (value == null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function hasOwn(obj: unknown, key: string): boolean {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

function stripPruebasSoloMeta(content?: string | null): string {
  return String(content || "")
    .replace(/<!--PRUEBAS_SOLO:1-->/gi, "")
    .trim();
}

function appendPruebasSoloMeta(content?: string | null): string {
  const stripped = stripPruebasSoloMeta(content);
  const base =
    stripped ||
    "<p>Video de prueba publicado en AutoTech Digital.</p>";
  return `${base}<!--PRUEBAS_SOLO:1-->`;
}

export const handler: Handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PUT, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "PUT" && event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Método no permitido" }),
    };
  }

  const authError = requireEventBasicAuth(event);
  if (authError) return authError;

  try {
    const body = JSON.parse(event.body || "{}");
    const id = Number.parseInt(String(body?.id || ""), 10);

    if (!Number.isInteger(id) || id <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "ID inválido" }),
      };
    }

    const updates: Record<string, string | null> = {};
    const pruebasSoloVideo =
      body.pruebas_solo_video === true ||
      body.pruebas_solo_video === 1 ||
      body.pruebas_solo_video === "1" ||
      body.pruebas_solo_video === "true";

    if (hasOwn(body, "title")) {
      const title = normalizeTextField(body.title);
      if (!title) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Título inválido" }),
        };
      }
      updates.title = title;
    }

    if (hasOwn(body, "content")) {
      let content = normalizeTextField(body.content) || "";
      if (pruebasSoloVideo) {
        updates.content = appendPruebasSoloMeta(content);
        updates.category = "pruebas";
      } else {
        content = stripPruebasSoloMeta(content);
        if (!content) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Contenido inválido" }),
          };
        }
        updates.content = content;
      }
    } else if (pruebasSoloVideo) {
      updates.category = "pruebas";
    }

    if (hasOwn(body, "category") && !pruebasSoloVideo) {
      const category = resolveCategory(String(body.category || ""));
      if (!ALLOWED_CATEGORIES.has(category)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Categoría no permitida: ${category}` }),
        };
      }
      updates.category = category;
    }

    if (hasOwn(body, "source_scope")) {
      const sourceScope = normalizeSourceScope(String(body.source_scope || ""));
      if (!ALLOWED_SOURCE_SCOPES.has(sourceScope)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Ámbito no permitido: ${sourceScope}` }),
        };
      }
      updates.source_scope = sourceScope;
    }

    const textFields = [
      "subtitle",
      "editor",
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
    ] as const;

    const mediaFields = [
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
    ] as const;

    textFields.forEach((field) => {
      if (hasOwn(body, field)) {
        updates[field] =
          field === "editor"
            ? optionalText(body[field]) || "Jhon Aparicio"
            : optionalText(body[field]);
      }
    });

    mediaFields.forEach((field) => {
      if (hasOwn(body, field)) {
        updates[field] = optionalMedia(body[field]);
      }
    });

    if (hasOwn(body, "scheduled_at")) {
      if (body.scheduled_at === null || body.scheduled_at === "") {
        updates.scheduled_at = null;
      } else {
        const normalized = normalizeScheduledAtInput(body.scheduled_at);
        if (!normalized) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Fecha de publicación inválida" }),
          };
        }
        updates.scheduled_at = normalized;
      }
    }

    if (hasOwn(body, "publish_now") && body.publish_now === true) {
      updates.scheduled_at = null;
    }

    if (Object.keys(updates).length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No hay campos para actualizar" }),
      };
    }

    const setClauses: string[] = [];
    const values: Array<string | null | number> = [];

    UPDATABLE_COLUMNS.forEach((column) => {
      if (!hasOwn(updates, column)) return;
      values.push(updates[column] ?? null);
      setClauses.push(`${column} = $${values.length}`);
    });

    values.push(id);

    const result = await getPool().query(
      `UPDATE notes SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING id, category, scheduled_at`,
      values
    );

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Nota no encontrada" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Nota actualizada con éxito ✅",
        id: result.rows[0].id,
        category: result.rows[0].category,
        scheduled_at: result.rows[0].scheduled_at ?? null,
      }),
    };
  } catch (err: any) {
    console.error("Error en update-note:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Error al actualizar la nota",
        detail: err?.message || null,
      }),
    };
  }
};
