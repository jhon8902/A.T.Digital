import type { APIRoute } from "astro";
import { createTestDriveLead } from "../../lib/leads";
import { jsonHeaders } from "../../lib/dealer-auth";

export const POST: APIRoute = async ({ request }) => {
  const headers = jsonHeaders({
    "Access-Control-Allow-Origin": "*",
  });

  try {
    const body = await request.json();
    const userIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-nf-client-connection-ip") ||
      "unknown";

    const result = await createTestDriveLead({
      dealerId: body.dealerId ? Number(body.dealerId) : undefined,
      autoId: body.autoId,
      noteId: body.noteId ? Number(body.noteId) : undefined,
      nombre: body.nombre,
      email: body.email,
      telefono: body.telefono,
      mensaje: body.mensaje,
      autoNombre: body.autoNombre,
      concesionarioNombre: body.concesionarioNombre,
      ciudad: body.ciudad,
      source: body.source === "nota" ? "nota" : "automatch",
      userIp,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Solicitud guardada correctamente",
        id: result.id,
        created_at: result.created_at,
        dealerId: result.dealerId,
      }),
      { status: 200, headers },
    );
  } catch (error: any) {
    const message = error?.message || "Error procesando solicitud";
    const status = message.includes("requeridos") || message.includes("inválido") ? 400 : 500;

    return new Response(
      JSON.stringify({ success: false, message }),
      { status, headers },
    );
  }
};

export const OPTIONS: APIRoute = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
