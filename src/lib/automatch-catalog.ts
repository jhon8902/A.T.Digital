import catalogData from "../data/automatch/autos.json";
import specsData from "../data/automatch/specs.json";
import { resolveAutomatchFichaHref } from "./automatch-fichas";

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
  especificacionesId?: string;
  condicion?: string;
  href: string;
  toolHref: string;
  ctaLabel: string;
  toolCtaLabel: string;
  source: "catalog" | "note" | "merged";
}

function resolveCarouselFichaHref(
  especificacionesId: string,
  noteId?: number,
): string {
  const editorialHref = resolveAutomatchFichaHref({
    especificaciones_id: especificacionesId,
    noteId,
  });
  if (editorialHref) return editorialHref;
  if (noteId) return `/notas/${noteId}`;
  return `/automatch/ficha/${especificacionesId}`;
}

interface CatalogAuto {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  uso: string;
  precio: number;
  ciudad: string;
  condicion: string;
  año?: number;
  kilometraje?: number;
  placa?: "par" | "impar";
  placa_ultimo_digito?: number;
  carroceria?: string;
  transmision?: string;
  demo?: boolean;
  imagen_principal: string;
  galeria: string[];
  especificaciones_id: string;
  concesionario: AutomatchConcesionario;
}

export interface AutomatchConcesionario {
  id?: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  horario?: string;
  sede?: string;
  lat?: number;
  lng?: number;
}

export interface AutomatchCatalogVehicle {
  id: number | string;
  nombre: string;
  tipo: string;
  uso: string;
  precio: number;
  ciudad: string;
  condicion: string;
  año?: number;
  kilometraje?: number;
  placa?: "par" | "impar";
  placa_ultimo_digito?: number;
  carroceria?: string;
  transmision?: string;
  demo?: boolean;
  imagen_principal: string;
  galeria: string[];
  descripcion: string;
  especificaciones_id: string;
  noteId?: number;
  catalogId?: number;
  source: "catalog" | "note" | "merged";
  fichaHref?: string | null;
  concesionario: AutomatchConcesionario;
}

export interface AutomatchDbNoteFull extends AutomatchDbNote {
  spec_segmento?: string | null;
  spec_motorizacion?: string | null;
  spec_precio_cop?: string | number | null;
  spec_precio_estimado?: string | null;
  spec_potencia_hp?: string | null;
  spec_torque_nm?: string | null;
  spec_autonomia_km?: string | null;
  spec_bateria_autonomia?: string | null;
  spec_equipamiento?: string | null;
  spec_traccion?: string | null;
}

export interface DealerCatalogLink {
  auto_id: string | null;
  note_id: number | null;
  dealer_id: number;
  dealer_name: string;
  dealer_phone?: string | null;
  dealer_whatsapp?: string | null;
  dealer_email?: string | null;
  dealer_city?: string | null;
}

export type AutomatchSpecsMap = Record<
  string,
  {
    motor?: string;
    potencia?: string;
    autonomia?: string;
    autonomia_electrica?: string;
    equipamiento?: string[];
    [key: string]: unknown;
  }
>;

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

export function findCatalogVehicleByTitle(title = "") {
  const catalog = catalogData as CatalogAuto[];
  return catalog.find((auto) => titlesMatch(auto.nombre, title)) || null;
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

export interface AutomatchMetaCatalog {
  tipo?: string;
  uso?: string;
  condicion?: string;
  ciudad?: string;
  precio_cop?: string | number;
}

export interface AutomatchNoteMeta {
  texts?: Record<string, { line1?: string }>;
  catalog?: AutomatchMetaCatalog;
}

export function parseAutomatchMeta(content = ""): AutomatchNoteMeta | null {
  const match = String(content).match(/AUTOMATCH_META:([^>]*)-->/i);
  if (!match?.[1]) return null;

  try {
    return JSON.parse(decodeURIComponent(match[1])) as AutomatchNoteMeta;
  } catch {
    return null;
  }
}

function resolveCatalogFromNote(note: AutomatchDbNoteFull): AutomatchMetaCatalog {
  const meta = parseAutomatchMeta(note.content || "");
  const catalog = meta?.catalog || {};

  return {
    tipo:
      catalog.tipo ||
      inferTipoFromMotorizacion(note.spec_motorizacion || "") ||
      undefined,
    uso:
      catalog.uso ||
      inferUsoFromSegmento(note.spec_segmento || "") ||
      undefined,
    condicion: catalog.condicion || "nuevo",
    ciudad: catalog.ciudad || undefined,
    precio_cop:
      catalog.precio_cop ||
      note.spec_precio_cop ||
      note.spec_precio_estimado ||
      undefined,
  };
}

function applyCatalogFields(
  vehicle: AutomatchCatalogVehicle,
  catalog: AutomatchMetaCatalog,
): AutomatchCatalogVehicle {
  const precio = parsePrecioCOP(catalog.precio_cop);

  return {
    ...vehicle,
    tipo: catalog.tipo || vehicle.tipo,
    uso: catalog.uso || vehicle.uso,
    condicion:
      vehicle.demo ||
      vehicle.condicion === "usado" ||
      vehicle.condicion === "seminuevo"
        ? vehicle.condicion
        : catalog.condicion || vehicle.condicion,
    ciudad: catalog.ciudad
      ? normalizeAutomatchText(catalog.ciudad)
      : vehicle.ciudad,
    precio: precio > 0 ? precio : vehicle.precio,
  };
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

    const noteId = matchedNote ? Number(matchedNote.id) : undefined;

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
      noteId,
      especificacionesId: auto.especificaciones_id,
      condicion: auto.condicion || "nuevo",
      href: resolveCarouselFichaHref(auto.especificaciones_id, noteId),
      toolHref: "/automatch-find",
      ctaLabel: "Ver modelo",
      toolCtaLabel: "Usar AutoMatch",
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
        "Modelo destacado en AutoMatch.",
      content: note.content,
      imagenes,
      noteId: Number(note.id),
      condicion: "nuevo",
      href: `/notas/${note.id}`,
      toolHref: "/automatch-find",
      ctaLabel: "Ver modelo",
      toolCtaLabel: "Usar AutoMatch",
      source: "note",
    });
  }

  return items;
}

function parsePrecioCOP(value?: string | number | null): number {
  if (typeof value === "number" && value > 0) return value;
  if (!value) return 0;
  const digits = String(value).replace(/[^\d]/g, "");
  return digits ? Number.parseInt(digits, 10) : 0;
}

function parseListField(value?: string | null): string[] {
  if (!value) return [];
  return String(value)
    .split(/[\n,;|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function inferTipoFromMotorizacion(motorizacion = ""): string {
  const m = normalizeAutomatchText(motorizacion);
  if (m.includes("electr")) return "eléctrico";
  if (m.includes("hibrid") || m.includes("hybrid") || m.includes("enchuf"))
    return "híbrido";
  if (m.includes("gasolina") || m.includes("diesel") || m.includes("combust"))
    return "gasolina";
  return "";
}

export function inferUsoFromSegmento(segmento = ""): string {
  const s = normalizeAutomatchText(segmento);
  if (s.includes("deport")) return "deportivo";
  if (
    s.includes("suv") ||
    s.includes("famil") ||
    s.includes("van") ||
    s.includes("7 pas")
  )
    return "familiar";
  if (
    s.includes("pickup") ||
    s.includes("trabajo") ||
    s.includes("comercial") ||
    s.includes("4x4")
  )
    return "trabajo";
  if (s.includes("urban") || s.includes("ciudad") || s.includes("compact"))
    return "urbano";
  return "urbano";
}

function buildSpecsFromNote(note: AutomatchDbNoteFull): AutomatchSpecsMap[string] {
  const equipamiento = parseListField(note.spec_equipamiento);
  const autonomiaKm = note.spec_autonomia_km
    ? `${note.spec_autonomia_km} km`
    : note.spec_bateria_autonomia || undefined;

  return {
    motor: note.spec_motorizacion || undefined,
    potencia: note.spec_potencia_hp
      ? `${note.spec_potencia_hp} hp`
      : undefined,
    autonomia: autonomiaKm,
    traccion: note.spec_traccion || undefined,
    equipamiento: equipamiento.length ? equipamiento : undefined,
  };
}

function findDealerLink(
  links: DealerCatalogLink[],
  catalogId?: number,
  noteId?: number,
) {
  const byAuto = links.find(
    (link) =>
      link.auto_id && catalogId && String(catalogId) === String(link.auto_id),
  );
  if (byAuto) return byAuto;

  if (noteId) {
    return links.find((link) => link.note_id === noteId) || null;
  }

  return null;
}

function applyDealerLink(
  vehicle: AutomatchCatalogVehicle,
  link: DealerCatalogLink | null,
): AutomatchCatalogVehicle {
  if (!link) return vehicle;

  return {
    ...vehicle,
    ciudad: normalizeAutomatchText(link.dealer_city || vehicle.ciudad),
    concesionario: {
      id: link.dealer_id,
      nombre: link.dealer_name,
      telefono: link.dealer_phone || vehicle.concesionario.telefono,
      whatsapp: link.dealer_whatsapp || vehicle.concesionario.whatsapp,
      email: link.dealer_email || vehicle.concesionario.email,
      direccion:
        vehicle.concesionario.direccion ||
        (link.dealer_city ? `${link.dealer_city}, Colombia` : undefined),
      horario: vehicle.concesionario.horario || "Consultar con asesor",
    },
  };
}

function catalogAutoToVehicle(
  auto: CatalogAuto,
  matchedNote: AutomatchDbNoteFull | null | undefined,
  dealerLinks: DealerCatalogLink[],
): AutomatchCatalogVehicle {
  const gallery = uniqueUrls(
    [auto.imagen_principal, ...(auto.galeria?.length ? auto.galeria : [])].filter(
      Boolean,
    ) as string[],
  );

  let vehicle: AutomatchCatalogVehicle = {
    id: auto.id,
    catalogId: auto.id,
    noteId: matchedNote ? Number(matchedNote.id) : undefined,
    nombre: auto.nombre,
    tipo: auto.tipo,
    uso: auto.uso,
    precio: auto.precio,
    ciudad: normalizeAutomatchText(auto.ciudad),
    condicion: auto.condicion || "nuevo",
    año: auto.año,
    kilometraje: auto.kilometraje,
    placa: auto.placa,
    placa_ultimo_digito: auto.placa_ultimo_digito,
    carroceria: auto.carroceria,
    transmision: auto.transmision,
    demo: auto.demo,
    imagen_principal: auto.imagen_principal,
    galeria: gallery.length ? gallery : [auto.imagen_principal],
    descripcion:
      matchedNote?.subtitle?.trim() || auto.descripcion || auto.nombre,
    especificaciones_id: auto.especificaciones_id,
    source: matchedNote ? "merged" : "catalog",
    concesionario: { ...auto.concesionario },
  };

  if (matchedNote) {
    const noteImages = collectNoteGallery(matchedNote, { skipCover: false });
    vehicle.galeria = uniqueUrls([...noteImages, ...vehicle.galeria]);
    if (noteImages[0]) vehicle.imagen_principal = noteImages[0];
  }

  vehicle = applyDealerLink(
    vehicle,
    findDealerLink(dealerLinks, auto.id, vehicle.noteId),
  );

  if (matchedNote) {
    const catalog = resolveCatalogFromNote(matchedNote);
    vehicle = applyCatalogFields(vehicle, catalog);
  }

  vehicle.fichaHref = resolveAutomatchFichaHref(vehicle);

  return vehicle;
}

function noteToVehicle(
  note: AutomatchDbNoteFull,
  dealerLinks: DealerCatalogLink[],
): AutomatchCatalogVehicle | null {
  const catalog = resolveCatalogFromNote(note);
  const tipo = catalog.tipo || "gasolina";
  const uso = catalog.uso || "urbano";
  const precio = parsePrecioCOP(catalog.precio_cop);

  const imagenes = collectNoteGallery(note, { skipCover: false });
  if (imagenes.length === 0 && !note.image1) return null;

  const noteId = Number(note.id);
  const dealerLink = findDealerLink(dealerLinks, undefined, noteId);

  let vehicle: AutomatchCatalogVehicle = {
    id: `note-${noteId}`,
    noteId,
    nombre: note.title,
    tipo,
    uso,
    precio: precio || 0,
    ciudad: normalizeAutomatchText(
      catalog.ciudad || dealerLink?.dealer_city || "bogotá",
    ),
    condicion: catalog.condicion || "nuevo",
    imagen_principal: imagenes[0] || normalizeImageUrl(note.image1) || "",
    galeria: imagenes.length
      ? imagenes
      : [normalizeImageUrl(note.image1)].filter(Boolean) as string[],
    descripcion:
      note.subtitle?.trim() ||
      stripHtml(note.content || "").slice(0, 220) ||
      note.title,
    especificaciones_id: `note-${noteId}`,
    source: "note",
    concesionario: {
      nombre: dealerLink?.dealer_name || "Concesionario por confirmar",
      telefono: dealerLink?.dealer_phone || undefined,
      whatsapp: dealerLink?.dealer_whatsapp || undefined,
      email: dealerLink?.dealer_email || undefined,
      direccion: dealerLink?.dealer_city
        ? `${dealerLink.dealer_city}, Colombia`
        : undefined,
      horario: "Consultar con asesor",
    },
  };

  vehicle = applyDealerLink(vehicle, dealerLink);
  vehicle.fichaHref = resolveAutomatchFichaHref(vehicle);
  return vehicle;
}

/**
 * Catálogo unificado para home, find y leads.
 * Combina autos.json + notas AutoMatch + vínculos de concesionarios.
 */
export function buildAutomatchCatalog(
  dbNotes: AutomatchDbNoteFull[] = [],
  dealerLinks: DealerCatalogLink[] = [],
): { autos: AutomatchCatalogVehicle[]; specs: AutomatchSpecsMap } {
  const catalog = catalogData as CatalogAuto[];
  const specs: AutomatchSpecsMap = {
    ...(specsData as AutomatchSpecsMap),
  };
  const usedNoteIds = new Set<string>();
  const autos: AutomatchCatalogVehicle[] = [];

  for (const auto of catalog) {
    const matchedNote = auto.demo
      ? undefined
      : (findMatchingNote(
          auto.nombre,
          dbNotes,
        ) as AutomatchDbNoteFull | undefined);

    if (matchedNote) {
      usedNoteIds.add(String(matchedNote.id));
      const noteSpecs = buildSpecsFromNote(matchedNote);
      if (Object.keys(noteSpecs).length > 0) {
        specs[auto.especificaciones_id] = {
          ...specs[auto.especificaciones_id],
          ...noteSpecs,
        };
      }
    }

    autos.push(catalogAutoToVehicle(auto, matchedNote, dealerLinks));
  }

  const unmatchedNotes = dbNotes.filter(
    (note) => !usedNoteIds.has(String(note.id)),
  );

  for (const note of unmatchedNotes) {
    const vehicle = noteToVehicle(note, dealerLinks);
    if (!vehicle) continue;

    const noteSpecs = buildSpecsFromNote(note);
    if (Object.keys(noteSpecs).length > 0) {
      specs[vehicle.especificaciones_id] = noteSpecs;
    }

    autos.push(vehicle);
  }

  return { autos, specs };
}
