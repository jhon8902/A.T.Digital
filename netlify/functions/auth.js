const ADMIN_USER = process.env.FORMULARIO_ADMIN_USER || "";
const ADMIN_PASSWORD = process.env.FORMULARIO_ADMIN_PASSWORD || "";

function isConfigured() {
  return Boolean(ADMIN_USER && ADMIN_PASSWORD);
}

function isValidAuthorizationHeader(value) {
  if (!isConfigured() || !value || !String(value).startsWith("Basic ")) {
    return false;
  }

  try {
    const encoded = String(value).slice(6).trim();
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

export function isEventAuthorizedAdmin(event) {
  return isValidAuthorizationHeader(
    event?.headers?.authorization || event?.headers?.Authorization
  );
}

export function isNodeAuthorizedAdmin(req) {
  return isValidAuthorizationHeader(req?.headers?.authorization);
}

export function requireEventBasicAuth(event) {
  if (!isConfigured()) {
    return {
      statusCode: 503,
      headers: { "Cache-Control": "no-store" },
      body: JSON.stringify({
        error: "Falta configurar FORMULARIO_ADMIN_USER y FORMULARIO_ADMIN_PASSWORD",
      }),
    };
  }

  if (!isValidAuthorizationHeader(event?.headers?.authorization || event?.headers?.Authorization)) {
    return {
      statusCode: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="A.T. Digital Admin", charset="UTF-8"',
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({ error: "No autorizado" }),
    };
  }

  return null;
}

export function requireNodeBasicAuth(req, res) {
  const setWwwAuthHeader = () => {
    const headerValue = 'Basic realm="A.T. Digital Admin", charset="UTF-8"';

    if (res && typeof res.setHeader === "function") {
      res.setHeader("WWW-Authenticate", headerValue);
      return;
    }

    if (res && typeof res.header === "function") {
      res.header("WWW-Authenticate", headerValue);
      return;
    }

    if (res && res.headers && typeof res.headers === "object") {
      res.headers["WWW-Authenticate"] = headerValue;
    }
  };

  const sendJson = (statusCode, payload) => {
    if (res && typeof res.status === "function" && typeof res.json === "function") {
      res.status(statusCode).json(payload);
      return;
    }

    if (res && typeof res.status === "function" && typeof res.send === "function") {
      res.status(statusCode).send(JSON.stringify(payload));
      return;
    }

    throw new Error("Respuesta no compatible en requireNodeBasicAuth");
  };

  if (!isConfigured()) {
    sendJson(503, {
      error: "Falta configurar FORMULARIO_ADMIN_USER y FORMULARIO_ADMIN_PASSWORD",
    });
    return false;
  }

  if (!isValidAuthorizationHeader(req?.headers?.authorization)) {
    setWwwAuthHeader();
    sendJson(401, { error: "No autorizado" });
    return false;
  }

  return true;
}
