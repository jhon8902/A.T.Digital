export type CloudinaryConfig = {
  cloudName: string;
  uploadPreset: string;
  folder: string;
};

export function resolveCloudinaryConfig(): CloudinaryConfig {
  const cloudName = (
    import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME ??
    process.env.PUBLIC_CLOUDINARY_CLOUD_NAME ??
    ""
  ).trim();
  const uploadPreset = (
    import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET ??
    process.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET ??
    ""
  ).trim();
  const folder = (
    import.meta.env.PUBLIC_CLOUDINARY_FOLDER ??
    process.env.PUBLIC_CLOUDINARY_FOLDER ??
    "atdigital/notas"
  ).trim();

  return { cloudName, uploadPreset, folder };
}

export function dataUrlToUploadBlob(dataUrl: string): { blob: Blob; mime: string } {
  const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Formato de imagen inválido");
  }

  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");
  return { blob: new Blob([buffer], { type: mime }), mime };
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export async function uploadBlobToCloudinary(
  blob: Blob,
  filename: string,
  config: CloudinaryConfig,
  folderOverride?: string,
): Promise<string> {
  const { cloudName, uploadPreset, folder } = config;

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
