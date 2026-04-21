const ADMIN_USER = import.meta.env.FORMULARIO_ADMIN_USER ?? process.env.FORMULARIO_ADMIN_USER ?? "";
const ADMIN_PASSWORD =
  import.meta.env.FORMULARIO_ADMIN_PASSWORD ?? process.env.FORMULARIO_ADMIN_PASSWORD ?? "";

const PROTECTED_PATHS = [
  "/formulario",
  "/api/save-note",
  "/api/update-note",
  "/api/delete-note",
];

export function isProtectedAdminPath(pathname: string): boolean {
  return PROTECTED_PATHS.includes(pathname);
}

export function hasAdminAuthConfigured(): boolean {
  return Boolean(ADMIN_USER && ADMIN_PASSWORD);
}

export function isValidAdminAuthorizationHeader(value: string | null): boolean {
  if (!hasAdminAuthConfigured() || !value || !value.startsWith("Basic ")) {
    return false;
  }

  try {
    const encoded = value.slice(6).trim();
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex === -1) return false;

    const user = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);
    return user === ADMIN_USER && password === ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

export function isAuthorizedAdminRequest(request: Request): boolean {
  return isValidAdminAuthorizationHeader(request.headers.get("authorization"));
}

export function createBasicAuthChallengeResponse(): Response {
  return new Response("Acceso restringido", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="A.T. Digital Admin", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}
