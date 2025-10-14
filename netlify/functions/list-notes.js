const { Client } = require("pg");

exports.handler = async function (event) {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query("SELECT * FROM notes ORDER BY id DESC");
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
    };
  } catch (error) {
    console.error("Error al obtener notas:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al obtener notas" }),
    };
  }
};