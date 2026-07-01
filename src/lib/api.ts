/**
 * Utilidad para construir URLs de API
 * En desarrollo y producción: /.netlify/functions/
 * Netlify Dev maneja automáticamente el enrutamiento correcto
 */

import { queryPublishedNotes, type SiteNote } from "./notes-query";

function getServerBaseUrl(): string {
  if (typeof window !== "undefined") return "";

  const fromEnv = import.meta.env.API_BASE_URL || process.env.URL;
  if (fromEnv) return fromEnv;

  const port = process.env.PORT || "4321";
  return `http://localhost:${port}`;
}

export function getApiUrl(endpoint: string): string {
  const path = `/api/${endpoint}`;

  if (typeof window !== "undefined") {
    return path;
  }

  return new URL(path, getServerBaseUrl()).toString();
}

export async function fetchWithTimeout(url: string, timeout: number = 5000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

async function loadSiteNotesFromSources(): Promise<SiteNote[]> {
  try {
    return await queryPublishedNotes();
  } catch (error) {
    console.error("Error consultando notas en DB, usando API:", error);
    const data = await fetchWithTimeout(getApiUrl("get-notes"), 15000);
    return Array.isArray(data) ? (data as SiteNote[]) : [];
  }
}

export async function resolveSiteNotes(
  prefetched?: SiteNote[] | null
): Promise<SiteNote[]> {
  if (Array.isArray(prefetched) && prefetched.length > 0) {
    return prefetched;
  }

  return loadSiteNotesFromSources();
}

export type { SiteNote };
