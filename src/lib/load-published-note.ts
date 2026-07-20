/**
 * Carga pública de una nota por ID.
 * BD primero (filtro SQL de publicación); si falla, HTTP a funciones Netlify/API.
 * No aplicar isNoteScheduledForFuture aquí: la visibilidad la define PUBLISHED_NOTES_SQL.
 */
import { queryNoteById, type SiteNote } from "./notes-query";

const NOTE_FETCH_TIMEOUT_MS = 15000;

function normalizeSiteOrigin(siteOrigin: string): string {
  return siteOrigin.replace(/\/$/, "");
}

export async function fetchPublishedNoteFromHttp(
  noteId: number,
  siteOrigin: string,
): Promise<SiteNote | null> {
  if (!Number.isInteger(noteId) || noteId <= 0) return null;

  const origin = normalizeSiteOrigin(siteOrigin);
  const endpoints = [
    `${origin}/.netlify/functions/get-notes?id=${noteId}`,
    `${origin}/api/get-notes?id=${noteId}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        NOTE_FETCH_TIMEOUT_MS,
      );
      const response = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === "object" && "id" in data) {
          return data as SiteNote;
        }
      }

      if (response.status === 404) {
        return null;
      }
    } catch (error) {
      console.error(`fetchPublishedNoteFromHttp falló (${endpoint}):`, error);
    }
  }

  return null;
}

export async function resolvePublishedNoteById(
  noteId: number,
  siteOrigin: string,
): Promise<SiteNote | null> {
  if (!Number.isInteger(noteId) || noteId <= 0) return null;

  const fromDb = await queryNoteById(noteId);
  if (fromDb) return fromDb;

  return fetchPublishedNoteFromHttp(noteId, siteOrigin);
}
