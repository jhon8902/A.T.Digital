import { Client } from 'pg';

export async function handler(event) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { note_id, tipo } = JSON.parse(event.body);
  const user_ip = event.headers['x-forwarded-for'] || 'anon';

  await client.query(
    'INSERT INTO likes (note_id, user_ip, tipo) VALUES ($1, $2, $3)',
    [note_id, user_ip, tipo]
  );

  await client.end();
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
}
