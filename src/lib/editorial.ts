/**
 * Título corto para tarjetas de noticias: todo lo anterior al primer ":".
 * Ej: "Nissan Kait 2026: la SUV que..." → "Nissan Kait 2026"
 * Si no hay ":", devuelve el título completo.
 */
export function getNewsCardTitle(fullTitle: string): string {
  const trimmed = (fullTitle || "").trim();
  if (!trimmed) return "";

  const colonIndex = trimmed.indexOf(":");
  if (colonIndex === -1) return trimmed;

  const short = trimmed.slice(0, colonIndex).trim();
  return short.length >= 3 ? short : trimmed;
}

/** Gancho editorial: texto después del primer ":" en el título. */
export function getNewsTitleHook(fullTitle: string): string | null {
  const trimmed = (fullTitle || "").trim();
  const colonIndex = trimmed.indexOf(":");
  if (colonIndex === -1) return null;

  const hook = trimmed.slice(colonIndex + 1).trim();
  return hook.length > 0 ? hook : null;
}

export function usesCompactNewsCardTitle(category?: string): boolean {
  const normalized = (category || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return normalized === "noticias" || normalized === "lanzamientos";
}
