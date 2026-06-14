import type { APIRoute } from "astro";
import {
  getDealerSessionFromRequest,
  jsonHeaders,
  unauthorizedResponse,
} from "../../../lib/dealer-auth";
import { getDealerById } from "../../../lib/leads";

export const GET: APIRoute = async ({ request }) => {
  const session = getDealerSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const dealer = await getDealerById(session.id);
  if (!dealer || !dealer.active) return unauthorizedResponse();

  return new Response(
    JSON.stringify({
      id: dealer.id,
      name: dealer.name,
      email: dealer.email,
      city: dealer.city,
      phone: dealer.phone,
      whatsapp: dealer.whatsapp,
      commissionRate: dealer.commission_rate,
    }),
    { status: 200, headers: jsonHeaders() },
  );
};
