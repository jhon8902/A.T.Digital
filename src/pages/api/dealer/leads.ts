import type { APIRoute } from "astro";
import {
  getDealerSessionFromRequest,
  jsonHeaders,
  unauthorizedResponse,
} from "../../../lib/dealer-auth";
import { getDealerLeads } from "../../../lib/leads";

export const GET: APIRoute = async ({ request, url }) => {
  const session = getDealerSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const estado = url.searchParams.get("estado") || "all";

  try {
    const leads = await getDealerLeads(session.id, estado);
    return new Response(JSON.stringify(leads), {
      status: 200,
      headers: jsonHeaders(),
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Error al cargar leads" }),
      { status: 500, headers: jsonHeaders() },
    );
  }
};
