import { getDB } from "../../functions/db.js";

export async function PUT({ request }) {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "Falta el ID de la nota" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = await getDB();
    const [result] = await db.query(
      "UPDATE notas_autos SET status = 'archived' WHERE id = ?",
      [id]
    );
    await db.end();

    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({ error: "Nota no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Nota archivada correctamente" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Error al archivar la nota", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}