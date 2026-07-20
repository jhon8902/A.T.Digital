import type { Handler } from "@netlify/functions";
import "dotenv/config";
import { requireEventBasicAuth } from "./auth.js";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function resolveCloudinaryConfig() {
  return {
    cloudName: (process.env.PUBLIC_CLOUDINARY_CLOUD_NAME || "").trim(),
    uploadPreset: (process.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET || "").trim(),
    folder: (process.env.PUBLIC_CLOUDINARY_FOLDER || "atdigital/notas").trim(),
  };
}

function dataUrlToUploadBlob(dataUrl: string): { blob: Blob; mime: string } {
  const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Formato de imagen inválido");
  }

  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");
  return { blob: new Blob([buffer], { type: mime }), mime };
}

async function uploadBlobToCloudinary(
  blob: Blob,
  filename: string,
  folderOverride?: string,
): Promise<string> {
  const { cloudName, uploadPreset, folder } = resolveCloudinaryConfig();

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Falta configurar PUBLIC_CLOUDINARY_CLOUD_NAME y PUBLIC_CLOUDINARY_UPLOAD_PRESET",
    );
  }

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("La imagen supera el límite de 8 MB");
  }

  if (!blob.type.startsWith("image/")) {
    throw new Error("Solo se permiten archivos de imagen");
  }

  const formData = new FormData();
  formData.append("file", blob, filename || "nota.jpg");
  formData.append("upload_preset", uploadPreset);

  const targetFolder = (folderOverride || folder || "").trim();
  if (targetFolder) {
    formData.append("folder", targetFolder);
  }

  const endpoint =
    "https://api.cloudinary.com/v1_1/" +
    encodeURIComponent(cloudName) +
    "/image/upload";

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  let payload: { secure_url?: string; error?: { message?: string } } = {};
  try {
    payload = await response.json();
  } catch {
    throw new Error("Cloudinary no devolvió una respuesta válida");
  }

  if (!response.ok || !payload.secure_url) {
    const detail =
      payload.error?.message ||
      "Cloudinary rechazó la imagen (HTTP " + String(response.status) + ")";
    throw new Error(detail);
  }

  return payload.secure_url;
}

export const handler: Handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  const authResponse = requireEventBasicAuth(event);
  if (authResponse) return authResponse;

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Método no permitido" }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const dataUrl = typeof body?.file === "string" ? body.file : "";
    const filename =
      typeof body?.filename === "string" && body.filename.trim()
        ? body.filename.trim()
        : "nota.jpg";
    const folder =
      typeof body?.folder === "string" ? body.folder.trim() : undefined;

    if (!dataUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Falta el archivo de imagen" }),
      };
    }

    const { blob } = dataUrlToUploadBlob(dataUrl);
    const secureUrl = await uploadBlobToCloudinary(blob, filename, folder);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ secure_url: secureUrl }),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al subir la imagen";
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: message }),
    };
  }
};
