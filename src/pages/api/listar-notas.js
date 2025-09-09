import { getDB } from "../../functions/db.js";

export async function GET() {
  try {
    const db = await getDB();
    const [rows] = await db.query(`
      SELECT n.id, n.titulo, n.subtitulo, n.descripcion, n.slug, n.imagen_url, 
             n.contenido, n.fecha_publicacion, c.nombre AS categoria
      FROM notas_autos n
      JOIN categorias c ON n.categoria_id = c.id
      WHERE n.status = 'active'
      ORDER BY n.fecha_publicacion DESC
    `);
    await db.end();

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Error al obtener notas", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}