/**
 * Resolución de URL de PostgreSQL para Astro SSR y funciones Netlify.
 * Mantener el mismo orden en netlify/functions/get-notes.ts (resolveConnectionString).
 */
export function resolveDatabaseUrl(): string {
  const raw =
    process.env.NETLIFY_DATABASE_URL ??
    process.env.NETLIFY_DATABASE_URL_UNPOOLED ??
    import.meta.env.DATABASE_URL ??
    process.env.DATABASE_URL ??
    "";

  const connStr = String(raw).trim().replace(/^['"]|['"]$/g, "");
  if (!connStr) {
    throw new Error("DATABASE_URL no está configurada");
  }
  return connStr;
}
