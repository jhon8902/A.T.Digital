import type { APIRoute } from "astro";
import { clearDealerSessionCookie, jsonHeaders } from "../../../lib/dealer-auth";

export const POST: APIRoute = async () =>
  new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      ...jsonHeaders(),
      "Set-Cookie": clearDealerSessionCookie(),
    },
  });
