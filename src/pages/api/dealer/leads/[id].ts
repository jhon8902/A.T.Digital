import type { APIRoute } from "astro";
import {
  getDealerSessionFromRequest,
  jsonHeaders,
  unauthorizedResponse,
} from "../../../../lib/dealer-auth";
import { updateDealerLeadStatus, type LeadEstado } from "../../../../lib/leads";

const VALID_STATES = new Set<LeadEstado>([
  "pendiente",
  "contactado",
  "confirmado",
]);

export const PATCH: APIRoute = async ({ request, params }) => {
  const session = getDealerSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const leadId = Number(params.id);
  if (!Number.isInteger(leadId)) {
    return new Response(JSON.stringify({ error: "ID inválido" }), {
      status: 400,
      headers: jsonHeaders(),
    });
  }

  try {
    const body = await request.json();
    const estado = body?.estado as LeadEstado;

    if (!VALID_STATES.has(estado)) {
      return new Response(JSON.stringify({ error: "Estado inválido" }), {
        status: 400,
        headers: jsonHeaders(),
      });
    }

    const updated = await updateDealerLeadStatus(session.id, leadId, estado);
    if (!updated) {
      return new Response(JSON.stringify({ error: "Lead no encontrado" }), {
        status: 404,
        headers: jsonHeaders(),
      });
    }

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: jsonHeaders(),
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Error al actualizar lead" }),
      { status: 500, headers: jsonHeaders() },
    );
  }
};
