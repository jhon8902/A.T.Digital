import pkg from "pg";
import type { Handler } from "@netlify/functions";

const { Pool } = pkg;

// 🔧 Conexión a la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 🚀 Función principal de Netlify
export const handler: Handler = async (event, context) => {
  try {
    // ✅ CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: "",
      };
    }

    // ✅ Solo permitimos POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Método no permitido" }),
      };
    }

    // ✅ Parseamos el cuerpo del request
    const body = JSON.parse(event.body || "{}");
    console.log("📩 Datos recibidos en save-note:", body);

    // ✍️ Extraemos los campos
    let {
      title,
      subtitle,
      content,
      category,
      image1,
      image2,
      image3,
      image4,
      image5,
      image6,
      image7,
      image8,
      video1,
      video2,
      video3,
      video4,
      video5,
      video6,
      video7,
    } = body;

    // 🧹 Normalizamos los datos
    title = title?.trim();
    subtitle = subtitle?.trim();
    content = content?.trim();
    category = category?.trim().toLowerCase(); // 👈 Aquí está la mejora clave

    console.log("🟢 Categoría normalizada:", category);

    // 🗃️ Guardamos en la base de datos
    const result = await pool.query(
      `INSERT INTO notes (
        title, subtitle, content, category,
        image1, image2, image3, image4, image5, image6, image7, image8,
        video1, video2, video3, video4, video5, video6, video7
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19
      )
      RETURNING id`,
      [
        title,
        subtitle,
        content,
        category,
        image1,
        image2,
        image3,
        image4,
        image5,
        image6,
        image7,
        image8,
        video1,
        video2,
        video3,
        video4,
        video5,
        video6,
        video7,
      ]
    );

    // ✅ Respuesta de éxito
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        message: "Nota guardada con éxito",
        id: result.rows[0].id,
      }),
    };
  } catch (err: unknown) {
    console.error("❌ Error en save-note:", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: "Error al guardar la nota" }),
    };
  }
};
