import catalogData from "../data/automatch/autos.json";

export interface AutomatchDbNote {
  id: number | string;
  title: string;
  subtitle?: string;
  content?: string;
  created_at?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  image6?: string;
}

export interface AutomatchCarouselItem {
  id: string;
  nombre: string;
  descripcion: string;
  content?: string;
  imagenes: string[];
  catalogId?: number;
  noteId?: number;
  href: string;
  ctaLabel: string;
  source: "catalog" | "note" | "merged";
}

interface CatalogAuto {
  id: number;
  nombre: string;
  descripcion: string;
  imagen_principal: string;
  galeria: string[];
}

export function normalizeAutomatchText(input = "") {
  return String(input)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeImageUrl(url?: string | null): string | null {
  if (!url) return null;
  const cleaned = String(url).trim().replace(/^['"]+|['"]+$/g, "");
  if (!cleaned) return null;
  if (cleaned.startsWith("img/")) return `/${cleaned}`;
  return cleaned;
}

function uniqueUrls(urls: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of urls) {
    const url = normalizeImageUrl(raw);
    if (!url) continue;
    const key = url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(url);
  }

  return result;
}

function stripHtml(input = "") {
  return String(input)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectNoteGallery(
  note: AutomatchDbNote,
  options: { skipCover?: boolean } = {},
): string[] {
  const cover = normalizeImageUrl(note.image1);
  const secondary = uniqueUrls([
    note.image2,
    note.image3,
    note.image4,
    note.image5,
    note.image6,
  ]);

  if (options.skipCover) {
    return secondary;
  }

  return uniqueUrls([cover, ...secondary]);
}

function titlesMatch(a: string, b: string) {
  const left = normalizeAutomatchText(a);
  const right = normalizeAutomatchText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.includes(right) || right.includes(left);
}

function findMatchingNote(catalogNombre: string, notes: AutomatchDbNote[]) {
  return notes.find((note) => titlesMatch(catalogNombre, note.title));
}

export const CAROUSEL_IMAGE_COUNT = 4;

function padCarouselImages(
  primary: string[],
  fillers: string[] = [],
  count = CAROUSEL_IMAGE_COUNT,
): string[] {
  const result = uniqueUrls(primary);

  for (const raw of fillers) {
    if (result.length >= count) break;
    const url = normalizeImageUrl(raw);
    if (!url) continue;
    const key = url.toLowerCase();
    if (result.some((item) => item.toLowerCase() === key)) continue;
    result.push(url);
  }

  return result.slice(0, count);
}

function buildCatalogCarouselImages(
  auto: CatalogAuto,
  matchedNote?: AutomatchDbNote | null,
  skipCover?: boolean,
): string[] {
  const gallery = uniqueUrls(
    auto.galeria?.length ? auto.galeria : [auto.imagen_principal],
  );

  if (!skipCover || !matchedNote) {
    return padCarouselImages(gallery, [], CAROUSEL_IMAGE_COUNT);
  }

  const cover = normalizeImageUrl(matchedNote.image1);
  const withoutCover = cover
    ? gallery.filter((url) => url.toLowerCase() !== cover.toLowerCase())
    : [...gallery];

  const noteFillers = collectNoteGallery(matchedNote, { skipCover: true });

  return padCarouselImages(
    withoutCover,
    [...noteFillers, ...gallery],
    CAROUSEL_IMAGE_COUNT,
  );
}

function noteRecency(note: AutomatchDbNote) {
  const parsed = note.created_at ? new Date(note.created_at).getTime() : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Combina autos.json con notas BD category=automatch.
 * Por defecto omite image1 de la nota en el carrusel para no repetir la portada editorial.
 */
export function buildAutomatchCarousel(
  dbNotes: AutomatchDbNote[] = [],
  options: { skipEditorialCover?: boolean } = {},
): AutomatchCarouselItem[] {
  const skipCover = options.skipEditorialCover !== false;
  const catalog = catalogData as CatalogAuto[];
  const usedNoteIds = new Set<string>();
  const items: AutomatchCarouselItem[] = [];

  for (const auto of catalog) {
    const matchedNote = findMatchingNote(auto.nombre, dbNotes);
    if (matchedNote) {
      usedNoteIds.add(String(matchedNote.id));
    }

    const imagenes = buildCatalogCarouselImages(
      auto,
      matchedNote,
      skipCover,
    );

    items.push({
      id: matchedNote ? String(matchedNote.id) : `catalog-${auto.id}`,
      nombre: auto.nombre,
      descripcion:
        matchedNote?.subtitle?.trim() ||
        auto.descripcion ||
        "Modelo disponible para comparar en Colombia.",
      content: matchedNote?.content,
      imagenes,
      catalogId: auto.id,
      noteId: matchedNote ? Number(matchedNote.id) : undefined,
      href: matchedNote ? `/notas/${matchedNote.id}` : "/automatch-find",
      ctaLabel: matchedNote ? "Ver ficha completa" : "Ver en AutoMatch",
      source: matchedNote ? "merged" : "catalog",
    });
  }

  const unmatchedNotes = dbNotes
    .filter((note) => !usedNoteIds.has(String(note.id)))
    .sort((a, b) => noteRecency(b) - noteRecency(a));

  for (const note of unmatchedNotes) {
    const allNoteImages = collectNoteGallery(note, { skipCover: false });
    let imagenes = collectNoteGallery(note, { skipCover });
    imagenes = padCarouselImages(imagenes, allNoteImages, CAROUSEL_IMAGE_COUNT);

    if (imagenes.length === 0) {
      const fallback = normalizeImageUrl(note.image1);
      if (!fallback) continue;
      imagenes = [fallback];
    }

    const plain = stripHtml(note.content || "");
    items.push({
      id: String(note.id),
      nombre: note.title,
      descripcion:
        note.subtitle?.trim() ||
        (plain.length > 110 ? `${plain.slice(0, 107).trim()}...` : plain) ||
        "Ficha AutoMatch del modelo.",
      content: note.content,
      imagenes,
      noteId: Number(note.id),
      href: `/notas/${note.id}`,
      ctaLabel: "Ver ficha completa",
      source: "note",
    });
  }

  return items;
}
