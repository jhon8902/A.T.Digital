const PRUEBAS_SOLO_META = /<!--PRUEBAS_SOLO:1-->/i;

type PruebasSoloNoteLike = {
  content?: unknown;
  pruebas_solo_video?: unknown;
};

export function isPruebasSoloVideo(note?: PruebasSoloNoteLike | null): boolean {
  if (!note) return false;

  const flag = note.pruebas_solo_video;
  if (flag === true || flag === 1 || flag === "1" || flag === "true") {
    return true;
  }

  return PRUEBAS_SOLO_META.test(String(note.content || ""));
}

export function stripPruebasSoloMeta(content?: string | null): string {
  return String(content || "")
    .replace(PRUEBAS_SOLO_META, "")
    .trim();
}

export function appendPruebasSoloMeta(content?: string | null): string {
  const stripped = stripPruebasSoloMeta(content);
  const base =
    stripped ||
    "<p>Video de prueba publicado en AutoTech Digital.</p>";
  return `${base}<!--PRUEBAS_SOLO:1-->`;
}

export function isPublicEditorialNote(note?: PruebasSoloNoteLike | null): boolean {
  return !isPruebasSoloVideo(note);
}
