import { getDB } from './db.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { titulo, subtitulo, descripcion, slug, imagen, categoria_id, contenido } = JSON.parse(event.body);

  if (!titulo || !slug || !categoria_id || !contenido) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Faltan campos obligatorios" }),
    };
  }

  const contenidoJson = JSON.stringify(contenido);

  try {
    const db = await getDB();

    await db.query(
      "INSERT INTO notas_autos (titulo, descripcion, slug, imagen, categoria_id, contenido) VALUES (?, ?, ?, ?, ?, ?)",
      [titulo, subtitulo, descripcion, slug, imagen, categoria_id, contenidoJson]
    );

    await db.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Nota creada correctamente" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al guardar la nota", details: err.message }),
    };
  }
}
