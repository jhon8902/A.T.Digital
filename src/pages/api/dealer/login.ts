import type { APIRoute } from "astro";
import {
  createDealerSessionCookie,
  jsonHeaders,
  signDealerToken,
  verifyPassword,
} from "../../../lib/dealer-auth";
import { getDealerByEmail } from "../../../lib/leads";

export const POST: APIRoute = async ({ request }) => {
  const headers = jsonHeaders();

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email y contraseña requeridos" }), {
        status: 400,
        headers,
      });
    }

    const dealer = await getDealerByEmail(String(email));

    if (!dealer || !dealer.active) {
      return new Response(JSON.stringify({ error: "Credenciales inválidas" }), {
        status: 401,
        headers,
      });
    }

    if (!verifyPassword(String(password), dealer.password_hash)) {
      return new Response(JSON.stringify({ error: "Credenciales inválidas" }), {
        status: 401,
        headers,
      });
    }

    const token = signDealerToken({
      id: dealer.id,
      email: dealer.email,
      name: dealer.name,
    });

    return new Response(
      JSON.stringify({
        id: dealer.id,
        name: dealer.name,
        email: dealer.email,
        city: dealer.city,
        commissionRate: dealer.commission_rate,
      }),
      {
        status: 200,
        headers: {
          ...headers,
          "Set-Cookie": createDealerSessionCookie(token),
        },
      },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Error en login" }),
      { status: 500, headers },
    );
  }
};
