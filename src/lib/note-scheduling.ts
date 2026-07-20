/**
 * Convierte timestamps sin zona (columna `timestamp without time zone`) a UTC
 * usando el reloj de pared que devolvió PostgreSQL, sin aplicar el offset local
 * del servidor (evita que 17:30 en BD se lea como 22:30 UTC en Colombia).
 */
function parseDbWallClockAsUtc(value: Date): Date | null {
  if (Number.isNaN(value.getTime())) return null;
  return new Date(
    Date.UTC(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
      value.getMilliseconds()
    )
  );
}

export function parseScheduledAt(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return parseDbWallClockAsUtc(value);
  }

  const raw = String(value).trim();
  if (!raw) return null;

  // Valor naive de PostgreSQL: "2026-06-30 17:30:00"
  const naive = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/
  );
  if (naive) {
    const [, year, month, day, hour, minute, second = "0"] = naive;
    const date = new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      )
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function serializeScheduledAt(value: unknown): string | null {
  const date = parseScheduledAt(value);
  return date ? date.toISOString() : null;
}

export function isNoteScheduledForFuture(scheduledAt: unknown): boolean {
  // Solo para UI de admin (formulario). En páginas públicas y APIs usar PUBLISHED_NOTES_SQL.
  const date = parseScheduledAt(scheduledAt);
  if (!date) return false;
  return date.getTime() > Date.now();
}

export function formatScheduledAtForInput(scheduledAt: unknown): string {
  const date = parseScheduledAt(scheduledAt);
  if (!date) return "";

  const pad = (part: number) => String(part).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + "T" + pad(date.getHours()) + ":" + pad(date.getMinutes());
}

export function normalizeScheduledAtInput(value: unknown): string | null {
  const date = parseScheduledAt(value);
  if (!date) return null;
  return date.toISOString();
}

/** Notas visibles al público (ya publicadas o sin fecha programada). */
export const PUBLISHED_NOTES_SQL = `(scheduled_at IS NULL OR scheduled_at <= NOW())`;

export const NOTES_PUBLIC_ORDER_SQL = `COALESCE(scheduled_at, created_at) DESC`;

type NoteWithDates = {
  scheduled_at?: unknown;
  created_at?: unknown;
};

/** Fecha efectiva de publicación: programada si existe, si no la de creación. */
export function getNotePublishDate(note: NoteWithDates): Date | null {
  return (
    parseScheduledAt(note.scheduled_at) ?? parseScheduledAt(note.created_at)
  );
}

export function getNotePublishTimestamp(note: NoteWithDates): number {
  const date = getNotePublishDate(note);
  return date ? date.getTime() : 0;
}

export function formatNotePublishDate(
  note: NoteWithDates,
  locale = "es-CO"
): string {
  const date = getNotePublishDate(note);
  if (!date) return "";
  return date.toLocaleDateString(locale);
}

export function formatNotePublishedLabel(
  note: NoteWithDates,
  locale = "es-CO"
): string {
  const formatted = formatNotePublishDate(note, locale);
  return formatted ? `Publicado: ${formatted}` : "";
}

export function formatNotePublishDateLong(
  note: NoteWithDates,
  locale = "es-CO"
): string {
  const date = getNotePublishDate(note);
  if (!date) return "";
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
