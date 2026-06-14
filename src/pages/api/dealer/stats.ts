import type { APIRoute } from "astro";
import {
  getDealerSessionFromRequest,
  jsonHeaders,
  unauthorizedResponse,
} from "../../../lib/dealer-auth";
import { getDealerById, getDealerStats } from "../../../lib/leads";

export const GET: APIRoute = async ({ request }) => {
  const session = getDealerSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  try {
    const dealer = await getDealerById(session.id);
    if (!dealer) return unauthorizedResponse();

    const stats = await getDealerStats(session.id, dealer.commission_rate);
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: jsonHeaders(),
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Error al cargar estadísticas" }),
      { status: 500, headers: jsonHeaders() },
    );
  }
};
