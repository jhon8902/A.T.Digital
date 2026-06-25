/** Rutas públicas de fichas editoriales por `especificaciones_id` del catálogo. */
export const AUTOMATCH_FICHA_HREFS: Record<string, string> = {
  "renault-megane": "/notas-electricos/nota-renault-megane",
  "bmw-330e": "/noticias-carrusel/noticia-bmw",
  "mini-cooper-se": "/notas-electricos/nota-mini-cooper",
  "toyota-prado": "/noticias-nacionales/noticia-toyota-prado",
  "volvo-ex90": "/notas-electricos/nota-volvo-ex90",
  "nissan-xtrail": "/notas-hibridos/nota-nissan",
  "ford-bronco": "/noticias-carrusel/noticia-ford",
  "peugeot-e3008": "/notas-electricos/nota-peugeot-e3008",
  "byd-sealion7": "/notas-electricos/nota-byd-sealion7",
  "hyundai-kona-hibrida": "/notas-hibridos/nota-kona",
  "kia-ev9": "/noticias-nacionales/noticia-kia-ev9",
  "jeep-avenger": "/noticias-nacionales/noticia-jeep-avenger",
  "mazda-ez6": "/noticias-nacionales/noticia-mazda-ez6",
  "audi-q7-hibrida": "/notas-hibridos/nota-audi-q7",
  "subaru-forester-hibrida": "/notas-hibridos/nota-subaru",
  "volvo-xc90-hibrida": "/notas-hibridos/nota-volvo-cx90",
  "ford-escape-hibrida": "/notas-hibridos/nota-scape",
  "dfsk-seres-e5": "/noticias-carrusel/noticia-dfsk",
  "audi-etron": "/noticias-carrusel/noticia-audi",
  "ford-f150": "/noticias-nacionales/noticia-ford-f150",
  "smart-5-electrico": "/notas-electricos/nota-smart-5",
  "chery-e5": "/notas-electricos/nota-chery-e5",
  "deepal-s05": "/notas-electricos/nota-deepal-s05",
};

export function resolveAutomatchFichaHref(vehicle: {
  especificaciones_id?: string;
  noteId?: number;
}): string | null {
  const staticHref = vehicle.especificaciones_id
    ? AUTOMATCH_FICHA_HREFS[vehicle.especificaciones_id]
    : undefined;
  if (staticHref) return staticHref;
  if (vehicle.noteId) return `/notas/${vehicle.noteId}`;
  return null;
}
