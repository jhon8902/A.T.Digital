/**
 * Utilidad para construir URLs de API
 * En desarrollo y producción: /.netlify/functions/
 * Netlify Dev maneja automáticamente el enrutamiento correcto
 */

export function getApiUrl(endpoint: string): string {
  // Usar rutas relativas - funcionan en dev y producción
  return `/.netlify/functions/${endpoint}`;
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
