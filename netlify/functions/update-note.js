// src/functions/update-note.js
import { pool } from "./db.js";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const {
      id,
      title,
      subtitle,
      content,
      category,
      image1,
      image2,
      image3,
      image4,
      image5,
      video1,
      video2,
      video3,
      video4,
      video5,
      video6,
      video7,
    } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "ID inválido o faltante" });
    }

    const query = `
      UPDATE notes SET
        title = $1,
        subtitle = $2,
        content = $3,
        category = $4,
        image1 = $5,
        image2 = $6,
        image3 = $7,
        image4 = $8,
        image5 = $9,
        video1 = $10,
        video2 = $11,
        video3 = $12,
        video4 = $13,
        video5 = $14,
        video6 = $15,
        video7 = $16
      WHERE id = $17
      RETURNING *;
    `;

    const values = [
      title,
      subtitle,
      content,
      category,
      image1,
      image2,
      image3,
      image4,
      image5,
      video1,
      video2,
      video3,
      video4,
      video5,
      video6,
      video7,
      id,
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Nota no encontrada" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error actualizando nota:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
}