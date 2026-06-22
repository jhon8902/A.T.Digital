export function parseScheduledAt(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isNoteScheduledForFuture(scheduledAt: unknown): boolean {
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
