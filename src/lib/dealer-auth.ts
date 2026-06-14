import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

export const DEALER_SESSION_COOKIE = "dealer_session";
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

export interface DealerSession {
  id: number;
  email: string;
  name: string;
}

function getSessionSecret(): string {
  const secret =
    import.meta.env.DEALER_SESSION_SECRET ??
    process.env.DEALER_SESSION_SECRET ??
    import.meta.env.FORMULARIO_ADMIN_PASSWORD ??
    process.env.FORMULARIO_ADMIN_PASSWORD;

  if (!secret) {
    throw new Error("DEALER_SESSION_SECRET no está configurada");
  }

  return secret;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  try {
    const expected = Buffer.from(hash, "hex");
    const actual = scryptSync(password, salt, 64);
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function signDealerToken(payload: DealerSession): string {
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Date.now() + TOKEN_TTL_MS,
    }),
  ).toString("base64url");

  const signature = createHmac("sha256", getSessionSecret())
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

export function verifyDealerToken(token: string): DealerSession | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = createHmac("sha256", getSessionSecret())
    .update(body)
    .digest("base64url");

  if (signature.length !== expected.length) return null;

  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload?.exp || Date.now() > Number(payload.exp)) return null;
    if (!payload?.id || !payload?.email || !payload?.name) return null;

    return {
      id: Number(payload.id),
      email: String(payload.email),
      name: String(payload.name),
    };
  } catch {
    return null;
  }
}

export function getDealerSessionFromRequest(
  request: Request,
): DealerSession | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${DEALER_SESSION_COOKIE}=([^;]+)`),
  );
  if (!match?.[1]) return null;

  return verifyDealerToken(decodeURIComponent(match[1]));
}

export function createDealerSessionCookie(token: string): string {
  const maxAge = Math.floor(TOKEN_TTL_MS / 1000);
  const secure =
    import.meta.env.PROD || process.env.NODE_ENV === "production"
      ? "; Secure"
      : "";

  return `${DEALER_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearDealerSessionCookie(): string {
  return `${DEALER_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function jsonHeaders(extra: Record<string, string> = {}) {
  return {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    ...extra,
  };
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "No autorizado" }), {
    status: 401,
    headers: jsonHeaders(),
  });
}
