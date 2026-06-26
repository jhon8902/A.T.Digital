import type { APIRoute } from "astro";
import { isAuthorizedAdminRequest } from "../../lib/admin-auth";
import {
  isNoteScheduledForFuture,
  NOTES_PUBLIC_ORDER_SQL,
} from "../../lib/note-scheduling";
import {
  normalizeNoteCategory,
  normalizeNoteEditor,
  queryPublishedNotes,
} from "../../lib/notes-query";
import pkg from "pg";

const { Pool } = pkg;

let _pool: InstanceType<typeof Pool> | null = null;

const DB_CONNECTION_TIMEOUT_MS = Number(
  process.env.DB_CONNECTION_TIMEOUT_MS || "5000"
);
const DB_QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS || "8000");

function getPool() {
  if (!_pool) {
    const connStr =
      import.meta.env.DATABASE_URL ??
      process.env.DATABASE_URL ??
      process.env.NETLIFY_DATABASE_URL;

    if (!connStr) {
      throw new Error("DATABASE_URL no está configurada");
    }

    _pool = new Pool({
      connectionString: connStr,
      ssl: connStr.includes("localhost") ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
      query_timeout: DB_QUERY_TIMEOUT_MS,
      statement_timeout: DB_QUERY_TIMEOUT_MS,
      idleTimeoutMillis: 10000,
      max: 5,
    });
  }

  return _pool;
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

function isMissingScheduledAtColumnError(error: any): boolean {
  if (!error) return false;
  return (
    error.code === "42703" &&
    /scheduled_at|column\s+"?scheduled_at"?\s+does\s+not\s+exist/i.test(
      String(error.message || "")
    )
  );
}

export const GET: APIRoute = async ({ request }) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      const parsedId = Number(id);
      if (!Number.isInteger(parsedId)) {
        return new Response(JSON.stringify({ error: "ID inválido" }), {
          status: 400,
          headers,
        });
      }

      const result = await getPool().query("SELECT * FROM notes WHERE id = $1", [
        parsedId,
      ]);

      if (result.rows.length === 0) {
        return new Response(JSON.stringify({ error: "Nota no encontrada" }), {
          status: 404,
          headers,
        });
      }

      const note = result.rows[0];
      note.category = normalizeNoteCategory(note.category);
      note.editor = normalizeNoteEditor(note.editor);

      const isAdmin = isAuthorizedAdminRequest(request);
      if (isNoteScheduledForFuture(note.scheduled_at) && !isAdmin) {
        return new Response(JSON.stringify({ error: "Nota no encontrada" }), {
          status: 404,
          headers,
        });
      }

      return new Response(JSON.stringify(note), { status: 200, headers });
    }

    const isAdmin = isAuthorizedAdminRequest(request);

    if (isAdmin) {
      const visibilityFilter = "";
      let result;
      try {
        result = await getPool().query(`
          SELECT
            id, title, subtitle, editor, content, category,
            image1, image2, image3, image4, image5, image6,
            video1, video2, video3, video4, video5, video6, video7,
            spec_segmento, spec_origen, spec_precio_estimado, spec_versiones,
            spec_motorizacion, spec_potencia_hp, spec_torque_nm,
            spec_bateria_autonomia, spec_bateria_kwh, spec_autonomia_km,
            spec_carga, spec_carga_ac_kw, spec_carga_dc_kw,
            spec_aceleracion_0_100, spec_seguridad, spec_equipamiento,
            spec_pros, spec_contras, spec_competidores,
            spec_traccion, spec_precio_cop,
            created_at, scheduled_at
          FROM notes
          ${visibilityFilter}
          ORDER BY ${NOTES_PUBLIC_ORDER_SQL}
        `);
      } catch (error: any) {
        if (isMissingScheduledAtColumnError(error)) {
          result = await getPool().query(`
            SELECT
              id, title, subtitle, editor, content, category,
              image1, image2, image3, image4, image5, image6,
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
        } else if (!isMissingEditorColumnError(error)) {
          throw error;
        } else {
          result = await getPool().query(`
            SELECT
              id, title, subtitle, content, category,
              image1, image2, image3, image4, image5, image6,
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
            ${visibilityFilter}
            ORDER BY created_at DESC
          `);
        }
      }

      const normalizedRows = result.rows.map((row) => ({
        ...row,
        category: normalizeNoteCategory(row.category),
        editor: normalizeNoteEditor(row.editor),
      }));

      return new Response(JSON.stringify(normalizedRows), { status: 200, headers });
    }

    const normalizedRows = await queryPublishedNotes();
    return new Response(JSON.stringify(normalizedRows), { status: 200, headers });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: "Error al obtener notas",
        detail: error?.message || null,
      }),
      { status: 500, headers }
    );
  }
};