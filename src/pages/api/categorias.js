// src/pages/api/categorias.js es un módulo para obtener las categorías desde la base de datos.
export const prerender = false;

import { getDB } from "../../functions/db.js";

export async function GET() {
  try {
    const db = await getDB();
    const [rows] = await db.query("SELECT id, nombre FROM categorias ORDER BY nombre ASC");
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error en /api/categorias:", err);
    return new Response(JSON.stringify({ error: "Error al obtener categorías" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}