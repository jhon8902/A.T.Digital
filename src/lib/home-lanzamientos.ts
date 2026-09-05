import type { SiteNote } from "./api";
import {
  HOME_NEWS_ARCHIVE_SKIP,
  HOME_NEWS_CATEGORIES,
} from "./home-news-config";
import { normalizeNoteCategory } from "./notes-query";
import { getNotePublishTimestamp } from "./note-scheduling";
import { isPublicEditorialNote } from "./pruebas-solo";

/** Lanzamientos visibles en el home, debajo de Mundo automotor. */
export const HOME_LANZAMIENTOS_COUNT = 5;

/** Hrefs del mosaico + carrusel de Mundo automotor (vista Todas). */
export function openingMundoAutomotorHrefs(notes: SiteNote[]): Set<string> {
  return new Set(
    notes
      .filter(
        (note) =>
          HOME_NEWS_CATEGORIES.has(normalizeNoteCategory(note.category)) &&
          isPublicEditorialNote(note),
      )
      .sort(
        (a, b) => getNotePublishTimestamp(b) - getNotePublishTimestamp(a),
      )
      .slice(0, HOME_NEWS_ARCHIVE_SKIP)
      .map((note) => `/notas/${note.id}`),
  );
}

/** Lanzamientos del home: los que aún no salieron de primeras en Mundo automotor. */
export function pickHomeLanzamientoHrefs(
  notes: SiteNote[],
  limit = HOME_LANZAMIENTOS_COUNT,
): string[] {
  const opening = openingMundoAutomotorHrefs(notes);

  return notes
    .filter((note) => normalizeNoteCategory(note.category) === "lanzamientos")
    .sort((a, b) => getNotePublishTimestamp(b) - getNotePublishTimestamp(a))
    .map((note) => `/notas/${note.id}`)
    .filter((href) => !opening.has(href))
    .slice(0, limit);
}
