import { Client } from 'pg';

export async function handler(event) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const note_id = event.queryStringParameters.note_id;
  const res = await client.query(
    'SELECT * FROM comentarios WHERE note_id = $1 ORDER BY created_at DESC',
    [note_id]
  );

  await client.end();
  return { statusCode: 200, body: JSON.stringify(res.rows) };
}
