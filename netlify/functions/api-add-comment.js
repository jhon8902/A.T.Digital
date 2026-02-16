import { Client } from 'pg';

export async function handler(event) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { note_id, nombre, comentario } = JSON.parse(event.body);
  await client.query(
    'INSERT INTO comentarios (note_id, nombre, comentario) VALUES ($1, $2, $3)',
    [note_id, nombre, comentario]
  );

  await client.end();
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
}
