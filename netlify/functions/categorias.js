import { getDB } from './db.js';

export async function handler(event, context) {
  try {
    const db = await getDB();
    const [rows] = await db.query('SELECT * FROM categorias');
    await db.end();

    return {
      statusCode: 200,
      body: JSON.stringify(rows),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
