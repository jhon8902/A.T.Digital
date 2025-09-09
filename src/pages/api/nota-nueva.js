// src/pages/api/nota-nueva.js
export const prerender = false;
import { getDB } from "../../functions/db.js";

export async function POST({ request }) {
  try {
    // 👇 Validamos que el body venga bien
    const data = await request.json();
    console.log("Datos recibidos:", data);

    // Chequear que al menos tenga titulo y contenido
    if (!data.titulo || !data.contenido) {
      return new Response(
        JSON.stringify({ error: "Faltan campos obligatorios" }),
        { status: 400 }
      );
    }

    const db = await getDB();

    // Archivar notas activas de la misma categoría
await db.execute(
  "UPDATE notas_autos SET status = 'archived' WHERE categoria_id = ? AND status = 'active'",
  [data.categoria_id]
);

    const [result] = await db.execute(
      `INSERT INTO notas_autos 
        (titulo, subtitulo, descripcion, slug, imagen_url, categoria_id, contenido)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.titulo,
        data.subtitulo || "",
        data.descripcion || "",
        data.slug,
        data.imagen_url || "",
        data.categoria_id,
        data.contenido,
      ]
    );

    return new Response(JSON.stringify({ id: result.insertId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error en /api/nota-nueva:", err);
    return new Response(JSON.stringify({ error: "Error al guardar la nota" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
