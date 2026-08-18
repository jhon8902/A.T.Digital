/**
 * DEV ONLY — APIs del formulario sin límite de 3 s de lambda-local.
 *
 * Mantener registrado en astro.config.mjs → vite.plugins: [devAdminApi()]
 * Documentación: docs/desarrollo-local.md
 *
 * Si quitas este plugin, save-note / update-note volverán a fallar en local
 * con: Task timed out after 3.00 seconds
 */
const ADMIN_API_ROUTES = {
  "POST /api/save-note": { moduleId: "/src/pages/api/save-note.ts", exportName: "POST" },
  "PUT /api/update-note": { moduleId: "/src/pages/api/update-note.ts", exportName: "PUT" },
  "POST /api/update-note": { moduleId: "/src/pages/api/update-note.ts", exportName: "POST" },
  "DELETE /api/delete-note": { moduleId: "/src/pages/api/delete-note.ts", exportName: "DELETE" },
  "POST /api/delete-note": { moduleId: "/src/pages/api/delete-note.ts", exportName: "POST" },
  "POST /api/upload-cloudinary": {
    moduleId: "/src/pages/api/upload-cloudinary.ts",
    exportName: "POST",
  },
};

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function toFetchHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => headers.append(name, entry));
    } else {
      headers.set(name, value);
    }
  }
  return headers;
}

export function devAdminApi() {
  return {
    name: "dev-admin-api",
    apply: "serve",
    enforce: "pre",
    configureServer(server) {
      const handler = async (req, res, next) => {
        const rawUrl = req.url || "/";
        const pathname = rawUrl.split("?")[0];
        const routeKey = `${req.method} ${pathname}`;
        const route = ADMIN_API_ROUTES[routeKey];

        if (!route) {
          next();
          return;
        }

        try {
          const mod = await server.ssrLoadModule(route.moduleId);
          const apiHandler = mod[route.exportName];

          if (typeof apiHandler !== "function") {
            next();
            return;
          }

          const body = await readRequestBody(req);
          const request = new Request(`http://127.0.0.1${rawUrl}`, {
            method: req.method,
            headers: toFetchHeaders(req.headers),
            body: body.length > 0 ? body : undefined,
          });

          const response = await apiHandler({ request });
          res.statusCode = response.status;
          response.headers.forEach((value, name) => {
            res.setHeader(name, value);
          });
          res.end(await response.text());
        } catch (error) {
          console.error("[dev-admin-api]", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error:
                error instanceof Error
                  ? error.message
                  : "Error en API de desarrollo",
            }),
          );
        }
      };

      server.middlewares.stack.unshift({ route: "", handle: handler });
      console.log(
        "[dev-admin-api] APIs del formulario activas (sin timeout de 3 s)",
      );
    },
  };
}
