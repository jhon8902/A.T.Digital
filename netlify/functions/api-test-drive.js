// Netlify Function para solicitudes de test drive
const { Client } = require('pg');

exports.handler = async (event) => {
  console.log("📨 Solicitud recibida:", event.httpMethod);

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { autoId, nombre, email, telefono, mensaje, autoNombre, concesionarioNombre } = body;

    console.log("📋 Datos recibidos:", { autoId, nombre, email, telefono });

    // Validar campos requeridos
    if (!nombre || !email || !telefono || !autoId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Campos requeridos faltantes" }),
      };
    }

    // Validar email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email inválido" }),
      };
    }

    // Conexión a Neon PostgreSQL
    const client = new Client({
      connectionString: process.env.NETLIFY_DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    console.log("🔌 Conectando a Neon...");
    await client.connect();
    console.log("✅ Conectado a Neon");

    // Insertar en la tabla test_drives
    const query = `
      INSERT INTO test_drives 
      (auto_id, nombre, email, telefono, mensaje, concesionario_nombre, auto_nombre, user_ip)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at;
    `;

    const userIp = event.headers["client-ip"] || 
                   event.headers["x-forwarded-for"] || 
                   event.headers["x-real-ip"] || 
                   "unknown";

    const result = await client.query(query, [
      autoId,
      nombre,
      email,
      telefono,
      mensaje || null,
      concesionarioNombre || null,
      autoNombre || null,
      userIp
    ]);

    console.log("✅ Test Drive guardado en Neon:", result.rows[0]);

    // Cerrar conexión
    await client.end();
    console.log("🔌 Conexión cerrada");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        message: "Solicitud guardada correctamente",
        success: true,
        id: result.rows[0].id,
        created_at: result.rows[0].created_at
      }),
    };

  } catch (error) {
    console.error("❌ Error completo:", error);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Error procesando solicitud",
        error: error.message,
        success: false
      }),
    };
  }
};

