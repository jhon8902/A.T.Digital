import { getNotePublishTimestamp } from "./note-scheduling";
import type { SiteNote } from "./notes-query";

export type PruebaVideoItem = {
  noteId: number;
  title: string;
  subtitle: string;
  editor?: string;
  video: string;
  image?: string;
  href: string;
  fecha?: string;
  source_scope?: string;
  sortDate: number;
};

export function isDirectVideoFile(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url.trim());
}

export function mapNoteToPruebaVideo(
  note: SiteNote,
  options?: {
    fecha?: string;
    source_scope?: string;
  },
): PruebaVideoItem | null {
  const video = String(note.video1 || "").trim();
  if (!video || !isDirectVideoFile(video)) return null;

  const noteId = Number(note.id);
  if (!Number.isInteger(noteId) || noteId <= 0) return null;

  return {
    noteId,
    title: String(note.title || "Sin título").trim(),
    subtitle: String(note.subtitle || "").trim(),
    editor: note.editor ? String(note.editor).trim() : undefined,
    video,
    image: note.image1 ? String(note.image1).trim() : undefined,
    href: `/notas/${noteId}`,
    fecha: options?.fecha,
    source_scope: options?.source_scope,
    sortDate: getNotePublishTimestamp(note),
  };
}

export function buildPruebaVideosFromNotes(
  notes: SiteNote[],
  options?: {
    formatFecha?: (note: SiteNote) => string;
    formatSourceScope?: (note: SiteNote) => string;
  },
): PruebaVideoItem[] {
  const byNoteId = new Map<number, PruebaVideoItem>();

  for (const note of notes) {
    const item = mapNoteToPruebaVideo(note, {
      fecha: options?.formatFecha?.(note),
      source_scope: options?.formatSourceScope?.(note),
    });
    if (item) {
      byNoteId.set(item.noteId, item);
    }
  }

  return Array.from(byNoteId.values()).sort((a, b) => b.sortDate - a.sortDate);
}

export function slugPruebaTitle(title?: string) {
  return (title || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}
