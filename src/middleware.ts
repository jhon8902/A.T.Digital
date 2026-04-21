import { defineMiddleware } from "astro:middleware";
import {
  createBasicAuthChallengeResponse,
  hasAdminAuthConfigured,
  isAuthorizedAdminRequest,
  isProtectedAdminPath,
} from "./lib/admin-auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  if (!isProtectedAdminPath(pathname)) {
    return next();
  }

  if (!hasAdminAuthConfigured()) {
    return new Response("Falta configurar FORMULARIO_ADMIN_USER y FORMULARIO_ADMIN_PASSWORD", {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  if (!isAuthorizedAdminRequest(context.request)) {
    return createBasicAuthChallengeResponse();
  }

  return next();
});
