// src/functions/delete-note.js
import { pool } from "./db.js";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const id = parseInt(req.query.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const result = await pool.query("DELETE FROM notes WHERE id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Nota no encontrada" });
    }

    res.status(200).json({ message: "Nota eliminada correctamente" });
  } catch (err) {
    console.error("Error eliminando nota:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
}