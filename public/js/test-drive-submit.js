/**
 * Envío unificado de solicitudes de test drive.
 * Intenta Astro SSR primero y hace fallback a Netlify Function legacy.
 */
export async function submitTestDrive(payload) {
  const endpoints = ["/api/test-drive", "/.netlify/functions/api-test-drive"];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        return { ok: true, data };
      }

      lastError = data?.message || data?.error || `Error ${response.status}`;
      if (response.status === 404) continue;
      return { ok: false, error: lastError };
    } catch (error) {
      lastError = error?.message || "Error de red";
    }
  }

  return { ok: false, error: lastError || "No se pudo enviar la solicitud" };
}

if (typeof window !== "undefined") {
  window.submitTestDrive = submitTestDrive;
}
