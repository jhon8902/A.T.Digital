import { pool } from "./db.js";
import { requireNodeBasicAuth } from "./auth.js";

async function deleteNoteById(id) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM likes WHERE note_id = $1", [id]).catch(() => {});
    await client.query("DELETE FROM comentarios WHERE note_id = $1", [id]).catch(() => {});
    await client.query("DELETE FROM comments WHERE note_id = $1", [id]).catch(() => {});

    const result = await client.query(
      "DELETE FROM notes WHERE id = $1 RETURNING id, title",
      [id]
    );

    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!requireNodeBasicAuth(req, res)) return;

  if (req.method !== "DELETE" && req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    let idRaw = req.query?.id;

    if (req.method === "POST" && req.body?.id != null) {
      idRaw = String(req.body.id);
    }

    const id = Number.parseInt(String(idRaw || ""), 10);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const result = await deleteNoteById(id);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Nota no encontrada" });
    }

    return res.status(200).json({
      message: "Nota eliminada correctamente",
      id: result.rows[0]?.id,
      title: result.rows[0]?.title,
    });
  } catch (err) {
    console.error("Error eliminando nota:", err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
}
