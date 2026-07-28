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

/**
 * Entradilla para tarjetas: subtítulo del formulario o gancho del título.
 */
export function getNewsCardDeck(
  fullTitle: string,
  subtitle?: string | null,
): string {
  const fromSubtitle = (subtitle || "").trim();
  if (fromSubtitle) return fromSubtitle;
  return getNewsTitleHook(fullTitle) || "";
}

/** @deprecated Todas las tarjetas usan título corto; se mantiene por compatibilidad. */
export function usesCompactNewsCardTitle(_category?: string): boolean {
  return true;
}

/**
 * Divide un bloque editorial en varios <p> para mejorar legibilidad.
 * Respeta párrafos explícitos (doble salto) y parte textos muy largos por oración.
 */
export function splitEditorialParagraph(text: string): string[] {
  const trimmed = (text || "").trim();
  if (!trimmed) return [];

  const byBlank = trimmed
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (byBlank.length > 1) return byBlank;

  const byLine = trimmed
    .split(/\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (byLine.length > 1) return byLine;

  if (trimmed.length <= 300) return [trimmed];

  const sentences =
    trimmed.match(/[^.!?…]+[.!?…]+(?:\s+|$)|[^.!?…]+$/g) || [trimmed];
  const chunks: string[] = [];
  let buffer = "";

  for (const sentence of sentences) {
    const piece = sentence.trim();
    if (!piece) continue;

    const candidate = buffer ? `${buffer} ${piece}` : piece;
    if (buffer && candidate.length > 280) {
      chunks.push(buffer.trim());
      buffer = piece;
    } else {
      buffer = candidate;
    }
  }

  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks.length > 1 ? chunks : [trimmed];
}

/** Línea corta sin cierre de oración — útil como subtítulo dentro de bloques largos. */
export function isLikelySubheading(text: string): boolean {
  const trimmed = (text || "").trim();
  if (trimmed.length < 12 || trimmed.length > 80) return false;
  if (/[.!?…]$/.test(trimmed)) return false;
  if (/^t[ií]tulo\s*:/i.test(trimmed)) return false;
  if (/^\d+[\d.,\s]*$/.test(trimmed)) return false;
  return true;
}

function stripEditorialTags(input = "") {
  return String(input)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|article|section|h1|h2|h3|h4|h5|h6|li)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Normaliza bloques AutoMatch guardados en texto plano o en HTML legacy.
 * Devuelve bloques con formato "Titulo: encabezado | párrafo".
 */
export function splitAutomatchEditorialBlocks(content = ""): string[] {
  const withoutMeta = String(content)
    .replace(/<!--AUTOMATCH_META:[^>]*-->/gi, "")
    .trim();
  if (!withoutMeta) return [];

  if (/^t[ií]tulo\s*:/im.test(withoutMeta)) {
    return withoutMeta
      .split(/(?=^t[ií]tulo\s*:)/gim)
      .map((block) => block.trim())
      .filter(Boolean);
  }

  if (/<h2[\s>]/i.test(withoutMeta)) {
    return withoutMeta
      .split(/(?=<h2[\s>])/i)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const titleMatch = block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
        const paragraphMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
        const title = titleMatch ? stripEditorialTags(titleMatch[1]) : "";
        const paragraph = paragraphMatch
          ? stripEditorialTags(paragraphMatch[1])
          : stripEditorialTags(block.replace(/<h2[\s\S]*?<\/h2>/i, ""));

        if (title && paragraph) {
          return `Titulo: ${title} | ${paragraph}`;
        }

        const plain = stripEditorialTags(block);
        return plain;
      })
      .filter(Boolean);
  }

  return withoutMeta
    .replace(/<\/(p|div|article|section|h1|h2|h3|h4|h5|h6|li)>/gi, "\n\n")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}
