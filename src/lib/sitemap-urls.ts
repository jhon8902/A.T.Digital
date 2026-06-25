import { getPool } from "./db";
import { PUBLISHED_NOTES_SQL } from "./note-scheduling";
import { SITE_URL } from "./note-seo";

export type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

/** Rutas públicas estáticas (sin panel editorial ni APIs). */
export const STATIC_SITEMAP_PATHS = [
  "/",
  "/noticias",
  "/electricos",
  "/hibridos",
  "/deportes",
  "/pruebas",
  "/lanzamientos",
  "/contacto",
  "/politica-privacidad",
  "/buscar",
  "/tendencias-del-sector",
  "/automatch",
  "/automatch-find",
  "/notas-electricos/nota-byd-sealion7",
  "/notas-electricos/nota-mini-cooper",
  "/notas-electricos/nota-peugeot-e3008",
  "/notas-electricos/nota-renault-megane",
  "/notas-electricos/nota-smart-5",
  "/notas-electricos/nota-chery-e5",
  "/notas-electricos/nota-deepal-s05",
  "/notas-electricos/nota-volvo-ex90",
  "/notas-hibridos/nota-audi-q7",
  "/notas-hibridos/nota-kona",
  "/notas-hibridos/nota-nissan",
  "/notas-hibridos/nota-scape",
  "/notas-hibridos/nota-subaru",
  "/notas-hibridos/nota-volvo-cx90",
  "/notas-deportes/nota-deportes-motos",
  "/notas-deportes/nota-deportes1",
  "/notas-deportes/nota-deportes2",
  "/noticias-carrusel/noticia-audi",
  "/noticias-carrusel/noticia-bmw",
  "/noticias-carrusel/noticia-bmw-concept",
  "/noticias-carrusel/noticia-dfsk",
  "/noticias-carrusel/noticia-ford",
  "/noticias-nacionales/noticia-ford-f150",
  "/noticias-nacionales/noticia-jeep-avenger",
  "/noticias-nacionales/noticia-kia-ev9",
  "/noticias-nacionales/noticia-mazda-ez6",
  "/noticias-nacionales/noticia-toyota-prado",
] as const;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toLastmod(value: unknown): string | undefined {
  if (!value) return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function isMissingScheduledAtError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  return (
    err.code === "42703" &&
    /scheduled_at|column\s+"?scheduled_at"?\s+does\s+not\s+exist/i.test(
      String(err.message || ""),
    )
  );
}

export async function getPublishedNoteSitemapEntries(): Promise<SitemapEntry[]> {
  try {
    const pool = getPool();
    let result;

    try {
      result = await pool.query(`
        SELECT id, created_at, scheduled_at
        FROM notes
        WHERE ${PUBLISHED_NOTES_SQL}
        ORDER BY COALESCE(scheduled_at, created_at) DESC
      `);
    } catch (error) {
      if (!isMissingScheduledAtError(error)) throw error;

      result = await pool.query(`
        SELECT id, created_at
        FROM notes
        ORDER BY created_at DESC
      `);
    }

    return result.rows.map((row) => ({
      loc: `${SITE_URL}/notas/${row.id}`,
      lastmod: toLastmod(row.scheduled_at ?? row.created_at),
    }));
  } catch {
    return [];
  }
}

export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const staticEntries: SitemapEntry[] = STATIC_SITEMAP_PATHS.map((path) => ({
    loc: `${SITE_URL}${path}`,
  }));
  const noteEntries = await getPublishedNoteSitemapEntries();
  return [...staticEntries, ...noteEntries];
}

export async function buildSitemapXml(): Promise<string> {
  const entries = await buildSitemapEntries();
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod
        ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`
        : "";
      return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmod}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
