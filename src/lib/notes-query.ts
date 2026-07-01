import {
  NOTES_PUBLIC_ORDER_SQL,
  PUBLISHED_NOTES_SQL,
  serializeScheduledAt,
} from "./note-scheduling";
import { getPool } from "./db";

function isMissingEditorColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  return (
    err.code === "42703" &&
    /editor|column\s+"?editor"?\s+does\s+not\s+exist/i.test(
      String(err.message || "")
    )
  );
}

function isMissingScheduledAtColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  return (
    err.code === "42703" &&
    /scheduled_at|column\s+"?scheduled_at"?\s+does\s+not\s+exist/i.test(
      String(err.message || "")
    )
  );
}

function isMissingSourceScopeColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  return (
    err.code === "42703" &&
    /source_scope|column\s+"?source_scope"?\s+does\s+not\s+exist/i.test(
      String(err.message || "")
    )
  );
}

export function normalizeNoteCategory(category: unknown) {
  return String(category || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeNoteEditor(editor: unknown) {
  if (typeof editor !== "string") return "Jhon Aparicio";
  const normalized = editor.trim();
  return normalized || "Jhon Aparicio";
}

export function normalizeSourceScope(scope: unknown): "nacional" | "internacional" {
  const value = String(scope || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return value === "internacional" ? "internacional" : "nacional";
}

/** Usa source_scope de BD; si falta o contradice el origen, infiere por spec_origen. */
export function inferSourceScope(note: {
  source_scope?: unknown;
  spec_origen?: unknown;
}): "nacional" | "internacional" {
  const origen = String(note.spec_origen || "").toLowerCase();
  if (
    /australia|europa|europe|china|japon|alemania|germany|uk|reino unido|estados unidos|internacional|global|mundial|francia|italia|corea|india|canad[aá]/i.test(
      origen,
    )
  ) {
    return "internacional";
  }

  const explicit = String(note.source_scope || "").trim().toLowerCase();
  if (explicit === "internacional") return "internacional";
  return "nacional";
}

export type SiteNote = Record<string, unknown> & {
  id: number;
  title: string;
  subtitle?: string;
  editor?: string;
  content?: string;
  category?: string;
  source_scope?: string;
  image1?: string;
  video1?: string;
  created_at?: string;
  scheduled_at?: string | null;
};

const PUBLISHED_NOTES_SELECT = `
  SELECT
    id, title, subtitle, editor, content, category, source_scope,
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
`;

const PUBLISHED_NOTES_SELECT_WITHOUT_SCOPE = `
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
`;

function normalizeNoteRows(rows: SiteNote[]): SiteNote[] {
  return rows.map((row) => ({
    ...row,
    category: normalizeNoteCategory(row.category),
    editor: normalizeNoteEditor(row.editor),
    source_scope: inferSourceScope(row),
    scheduled_at: serializeScheduledAt(row.scheduled_at),
  }));
}

export async function queryNoteById(
  noteId: number,
  options?: { includeUnpublished?: boolean },
): Promise<SiteNote | null> {
  if (!Number.isInteger(noteId) || noteId <= 0) return null;

  const visibilitySql = options?.includeUnpublished
    ? ""
    : ` AND ${PUBLISHED_NOTES_SQL}`;

  try {
    const result = await getPool().query(
      `SELECT * FROM notes WHERE id = $1${visibilitySql}`,
      [noteId],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as SiteNote;

    return {
      ...row,
      category: normalizeNoteCategory(row.category),
      editor: normalizeNoteEditor(row.editor),
      source_scope: inferSourceScope(row),
      scheduled_at: serializeScheduledAt(row.scheduled_at),
    };
  } catch (error) {
    console.error(`queryNoteById(${noteId}) falló:`, error);
    return null;
  }
}

export async function queryPublishedNotes(): Promise<SiteNote[]> {
  const visibilityFilter = `WHERE ${PUBLISHED_NOTES_SQL}`;

  try {
    const result = await getPool().query(`
      ${PUBLISHED_NOTES_SELECT}
      ${visibilityFilter}
      ORDER BY ${NOTES_PUBLIC_ORDER_SQL}
    `);
    return normalizeNoteRows(result.rows as SiteNote[]);
  } catch (error: unknown) {
    if (isMissingSourceScopeColumnError(error)) {
      const result = await getPool().query(`
        ${PUBLISHED_NOTES_SELECT_WITHOUT_SCOPE}
        ${visibilityFilter}
        ORDER BY ${NOTES_PUBLIC_ORDER_SQL}
      `);
      return normalizeNoteRows(result.rows as SiteNote[]);
    }

    if (isMissingScheduledAtColumnError(error)) {
      const result = await getPool().query(`
        ${PUBLISHED_NOTES_SELECT_WITHOUT_SCOPE.replace(", scheduled_at", "")}
        ${visibilityFilter}
        ORDER BY created_at DESC
      `);
      return normalizeNoteRows(result.rows as SiteNote[]);
    }

    if (isMissingEditorColumnError(error)) {
      const result = await getPool().query(`
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
      return normalizeNoteRows(result.rows as SiteNote[]);
    }

    throw error;
  }
}
