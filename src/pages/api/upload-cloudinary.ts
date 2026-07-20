import type { APIRoute } from "astro";
import { isAuthorizedAdminRequest } from "../../lib/admin-auth";
import {
  dataUrlToUploadBlob,
  resolveCloudinaryConfig,
  uploadBlobToCloudinary,
} from "../../lib/cloudinary-upload";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

export const POST: APIRoute = async ({ request }) => {
  if (!isAuthorizedAdminRequest(request)) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  try {
    const body = await request.json();
    const dataUrl = typeof body?.file === "string" ? body.file : "";
    const filename =
      typeof body?.filename === "string" && body.filename.trim()
        ? body.filename.trim()
        : "nota.jpg";
    const folder =
      typeof body?.folder === "string" ? body.folder.trim() : undefined;

    if (!dataUrl) {
      return new Response(JSON.stringify({ error: "Falta el archivo de imagen" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const { blob } = dataUrlToUploadBlob(dataUrl);
    const secureUrl = await uploadBlobToCloudinary(
      blob,
      filename,
      resolveCloudinaryConfig(),
      folder,
    );

    return new Response(JSON.stringify({ secure_url: secureUrl }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al subir la imagen";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: JSON_HEADERS,
    });
  }
};
