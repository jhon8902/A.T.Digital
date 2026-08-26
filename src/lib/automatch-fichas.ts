import catalogData from "../data/automatch/autos.json";

/** Las fichas AutoMatch viven en notas (categoría automatch) o en /automatch/ficha/[slug]. */
export const AUTOMATCH_FICHA_HREFS: Record<string, string> = {};

export function resolveAutomatchFichaHref(vehicle: {
  especificaciones_id?: string;
  noteId?: number;
}): string | null {
  if (vehicle.noteId) return `/notas/${vehicle.noteId}`;

  const staticHref = vehicle.especificaciones_id
    ? AUTOMATCH_FICHA_HREFS[vehicle.especificaciones_id]
    : undefined;
  if (staticHref) return staticHref;
  return null;
}

export interface CatalogConcesionario {
  id?: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  horario?: string;
}

export interface CatalogVehicleRef {
  id: number;
  nombre: string;
  tipo: string;
  precio?: number;
  especificaciones_id: string;
  concesionario: CatalogConcesionario;
}

export function getCatalogVehicleBySpecId(
  specId?: string | null,
): CatalogVehicleRef | null {
  if (!specId) return null;
  const catalog = catalogData as CatalogVehicleRef[];
  return catalog.find((item) => item.especificaciones_id === specId) || null;
}

export function portalHrefForTipo(tipo = "") {
  const normalized = tipo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized.includes("hibrid")) return "/hibridos";
  if (normalized.includes("electr")) return "/electricos";
  return "/noticias";
}
