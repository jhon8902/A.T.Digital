import type { APIRoute } from "astro";
import pkg from "pg";

const { Pool } = pkg;

let _pool: InstanceType<typeof Pool> | null = null;

const DB_CONNECTION_TIMEOUT_MS = Number(
  process.env.DB_CONNECTION_TIMEOUT_MS || "5000"
);
const DB_QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS || "8000");

function getDatabaseUrl() {
  const fromImportMeta = (import.meta as any)?.env?.DATABASE_URL;
  return fromImportMeta || process.env.DATABASE_URL;
}

function getPool() {
  if (!_pool) {
    const connStr = getDatabaseUrl();

    if (!connStr) {
      throw new Error("DATABASE_URL no esta configurada");
    }

    _pool = new Pool({
      connectionString: connStr,
      ssl: connStr.includes("localhost") ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
      query_timeout: DB_QUERY_TIMEOUT_MS,
      statement_timeout: DB_QUERY_TIMEOUT_MS,
      idleTimeoutMillis: 10000,
      max: 5,
    });
  }

  return _pool;
}

function responseHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "DELETE, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function tryDeleteDependency(
  client: any,
  sql: string,
  noteId: number
) {
  try {
    await client.query(sql, [noteId]);
  } catch (error: any) {
    const code = String(error?.code || "");
    // Ignora diferencias de esquema entre entornos (tabla/columna no existe)
    if (code === "42P01" || code === "42703") return;
    throw error;
  }
}

function quoteIdent(value: string) {
  return `"${String(value || "").replace(/"/g, '""')}"`;
}

async function deleteForeignKeyDependencies(client: any, noteId: number) {
  const refs = await client.query(`
    SELECT
      ns.nspname AS schema_name,
      cls.relname AS table_name,
      att.attname AS column_name
    FROM pg_constraint c
    JOIN pg_class cls ON cls.oid = c.conrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    JOIN pg_class pcls ON pcls.oid = c.confrelid
    JOIN pg_namespace pns ON pns.oid = pcls.relnamespace
    JOIN unnest(c.conkey) WITH ORDINALITY AS ck(attnum, ord) ON true
    JOIN unnest(c.confkey) WITH ORDINALITY AS fk(attnum, ord) ON ck.ord = fk.ord
    JOIN pg_attribute att ON att.attrelid = c.conrelid AND att.attnum = ck.attnum
    JOIN pg_attribute patt ON patt.attrelid = c.confrelid AND patt.attnum = fk.attnum
    WHERE c.contype = 'f'
      AND pns.nspname = 'public'
      AND pcls.relname = 'notes'
      AND patt.attname = 'id'
  `);

  for (const row of refs.rows) {
    const schemaName = String(row.schema_name || "public");
    const tableName = String(row.table_name || "");
    const columnName = String(row.column_name || "");

    if (!tableName || !columnName) continue;
    if (schemaName === "public" && tableName === "notes") continue;

    const sql = `DELETE FROM ${quoteIdent(schemaName)}.${quoteIdent(tableName)} WHERE ${quoteIdent(columnName)} = $1`;
    await client.query(sql, [noteId]);
  }
}

async function deleteNoteWithDependencies(noteId: number) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Compatibilidad con esquemas históricos conocidos
    await tryDeleteDependency(client, "DELETE FROM likes WHERE note_id = $1", noteId);
    await tryDeleteDependency(client, "DELETE FROM comentarios WHERE note_id = $1", noteId);
    await tryDeleteDependency(client, "DELETE FROM comments WHERE note_id = $1", noteId);

    // Limpia cualquier otra FK hacia notes.id para evitar 23503
    await deleteForeignKeyDependencies(client, noteId);

    const result = await client.query(
      "DELETE FROM notes WHERE id = $1 RETURNING id, title",
      [noteId]
    );

    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: responseHeaders(),
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const headers = responseHeaders();

  try {
    const url = new URL(request.url);
    const idRaw = url.searchParams.get("id") || "";
    const id = Number.parseInt(idRaw, 10);

    if (!Number.isInteger(id) || id <= 0) {
      return new Response(JSON.stringify({ error: "ID invalido" }), {
        status: 400,
        headers,
      });
    }

    const result = await deleteNoteWithDependencies(id);

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: "Nota no encontrada" }), {
        status: 404,
        headers,
      });
    }

    return new Response(
      JSON.stringify({
        message: "Nota eliminada correctamente",
        id: result.rows[0]?.id,
        title: result.rows[0]?.title,
      }),
      {
        status: 200,
        headers,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: "Error al eliminar la nota",
        detail: error?.message || null,
        code: error?.code || null,
        constraint: error?.constraint || null,
      }),
      {
        status: 500,
        headers,
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  const headers = responseHeaders();

  try {
    const body = await request.json().catch(() => ({}));
    const id = Number.parseInt(String(body?.id || ""), 10);

    if (!Number.isInteger(id) || id <= 0) {
      return new Response(JSON.stringify({ error: "ID invalido" }), {
        status: 400,
        headers,
      });
    }

    const result = await deleteNoteWithDependencies(id);

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: "Nota no encontrada" }), {
        status: 404,
        headers,
      });
    }

    return new Response(
      JSON.stringify({
        message: "Nota eliminada correctamente",
        id: result.rows[0]?.id,
        title: result.rows[0]?.title,
      }),
      {
        status: 200,
        headers,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: "Error al eliminar la nota",
        detail: error?.message || null,
        code: error?.code || null,
        constraint: error?.constraint || null,
      }),
      {
        status: 500,
        headers,
      }
    );
  }
};
