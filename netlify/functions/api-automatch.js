// netlify/functions/api-automatch.js
import { pool } from "./db.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { auto_id, decision } = JSON.parse(event.body);
    const user_ip = event.headers["x-forwarded-for"] || "unknown";

    if (!auto_id || !decision) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Faltan parámetros" }),
      };
    }

    await pool.query(
      "INSERT INTO automatch (user_ip, auto_id, decision) VALUES ($1, $2, $3)",
      [user_ip, auto_id, decision]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Automatch guardado ✅" }),
    };
  } catch (error) {
    console.error("DB ERROR:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
