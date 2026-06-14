import { getPool } from "./db";

export type LeadSource = "nota" | "automatch";
export type LeadEstado = "pendiente" | "contactado" | "confirmado";

export interface TestDrivePayload {
  dealerId?: number;
  autoId?: string | number;
  noteId?: number;
  nombre: string;
  email: string;
  telefono: string;
  mensaje?: string;
  autoNombre?: string;
  concesionarioNombre?: string;
  ciudad?: string;
  source?: LeadSource;
  userIp?: string;
  userAgent?: string;
}

export interface DealerLead {
  id: number;
  auto_id: number | null;
  note_id: number | null;
  nombre: string;
  email: string;
  telefono: string;
  mensaje: string | null;
  concesionario_id: number | null;
  concesionario_nombre: string | null;
  auto_nombre: string | null;
  ciudad: string | null;
  estado: LeadEstado;
  source: string | null;
  created_at: string;
  updated_at: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string) {
  return EMAIL_RE.test(email);
}

export async function resolveDealerId(payload: TestDrivePayload): Promise<number | null> {
  if (payload.dealerId && Number.isInteger(payload.dealerId)) {
    return payload.dealerId;
  }

  const pool = getPool();

  if (payload.noteId) {
    const byNote = await pool.query(
      `SELECT dealer_id FROM dealer_vehicles
       WHERE note_id = $1 AND active = true
       ORDER BY id ASC LIMIT 1`,
      [payload.noteId],
    );
    if (byNote.rows[0]?.dealer_id) {
      return Number(byNote.rows[0].dealer_id);
    }
  }

  if (payload.autoId !== undefined && payload.autoId !== null && payload.autoId !== "") {
    const autoKey = String(payload.autoId);
    const byAuto = await pool.query(
      `SELECT dealer_id FROM dealer_vehicles
       WHERE auto_id = $1 AND active = true
       ORDER BY id ASC LIMIT 1`,
      [autoKey],
    );
    if (byAuto.rows[0]?.dealer_id) {
      return Number(byAuto.rows[0].dealer_id);
    }
  }

  if (payload.concesionarioNombre) {
    const byName = await pool.query(
      `SELECT id FROM dealers
       WHERE lower(name) = lower($1) AND active = true
       LIMIT 1`,
      [payload.concesionarioNombre.trim()],
    );
    if (byName.rows[0]?.id) {
      return Number(byName.rows[0].id);
    }
  }

  return null;
}

export interface NoteDealerInfo {
  dealerId: number;
  dealerNombre: string;
}

export async function getDealerForNote(
  noteId: number,
): Promise<NoteDealerInfo | null> {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT d.id, d.name
       FROM dealer_vehicles dv
       JOIN dealers d ON d.id = dv.dealer_id
       WHERE dv.note_id = $1 AND dv.active = true AND d.active = true
       ORDER BY dv.id ASC
       LIMIT 1`,
      [noteId],
    );

    if (!result.rows[0]?.id) {
      return null;
    }

    return {
      dealerId: Number(result.rows[0].id),
      dealerNombre: String(result.rows[0].name || ""),
    };
  } catch {
    return null;
  }
}

export async function createTestDriveLead(payload: TestDrivePayload) {
  const nombre = payload.nombre?.trim();
  const email = payload.email?.trim().toLowerCase();
  const telefono = payload.telefono?.trim();

  if (!nombre || !email || !telefono) {
    throw new Error("Campos requeridos faltantes");
  }

  if (!isValidEmail(email)) {
    throw new Error("Email inválido");
  }

  const dealerId = await resolveDealerId(payload);
  const autoIdNumber = Number(payload.autoId);
  const parsedAutoId = Number.isFinite(autoIdNumber) ? autoIdNumber : 0;

  const result = await getPool().query(
    `INSERT INTO test_drives (
      auto_id, note_id, nombre, email, telefono, mensaje,
      concesionario_id, concesionario_nombre, auto_nombre,
      ciudad, source, estado, user_ip, user_agent
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pendiente', $12, $13)
    RETURNING id, created_at`,
    [
      parsedAutoId,
      payload.noteId ?? null,
      nombre,
      email,
      telefono,
      payload.mensaje?.trim() || null,
      dealerId,
      payload.concesionarioNombre?.trim() || null,
      payload.autoNombre?.trim() || null,
      payload.ciudad?.trim() || null,
      payload.source || "automatch",
      payload.userIp || null,
      payload.userAgent || null,
    ],
  );

  return {
    id: result.rows[0].id as number,
    created_at: result.rows[0].created_at as string,
    dealerId,
  };
}

export async function getDealerLeads(
  dealerId: number,
  estado?: string,
): Promise<DealerLead[]> {
  const params: Array<string | number> = [dealerId];
  let where = "WHERE concesionario_id = $1";

  if (estado && estado !== "all") {
    params.push(estado);
    where += ` AND estado = $${params.length}`;
  }

  const result = await getPool().query(
    `SELECT *
     FROM test_drives
     ${where}
     ORDER BY created_at DESC`,
    params,
  );

  return result.rows as DealerLead[];
}

export async function updateDealerLeadStatus(
  dealerId: number,
  leadId: number,
  estado: LeadEstado,
) {
  const result = await getPool().query(
    `UPDATE test_drives
     SET estado = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND concesionario_id = $3
     RETURNING *`,
    [estado, leadId, dealerId],
  );

  return (result.rows[0] as DealerLead | undefined) ?? null;
}

export async function getDealerStats(dealerId: number, commissionRate: number) {
  const result = await getPool().query(
    `SELECT
       COUNT(*)::int AS total_leads,
       COUNT(*) FILTER (
         WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_TIMESTAMP)
       )::int AS month_leads,
       COUNT(*) FILTER (WHERE estado = 'confirmado')::int AS confirmed_leads
     FROM test_drives
     WHERE concesionario_id = $1`,
    [dealerId],
  );

  const row = result.rows[0];
  const confirmed = Number(row?.confirmed_leads || 0);

  return {
    totalLeads: Number(row?.total_leads || 0),
    monthLeads: Number(row?.month_leads || 0),
    confirmedLeads: confirmed,
    totalCommission: confirmed * commissionRate,
    commissionRate,
  };
}

export async function getDealerByEmail(email: string) {
  const result = await getPool().query(
    `SELECT id, name, email, password_hash, phone, whatsapp, city, commission_rate, active
     FROM dealers
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email.trim()],
  );

  return result.rows[0] as
    | {
        id: number;
        name: string;
        email: string;
        password_hash: string;
        phone: string | null;
        whatsapp: string | null;
        city: string | null;
        commission_rate: number;
        active: boolean;
      }
    | undefined;
}

export async function getDealerById(id: number) {
  const result = await getPool().query(
    `SELECT id, name, email, phone, whatsapp, city, commission_rate, active
     FROM dealers
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  return result.rows[0] as
    | {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        whatsapp: string | null;
        city: string | null;
        commission_rate: number;
        active: boolean;
      }
    | undefined;
}
