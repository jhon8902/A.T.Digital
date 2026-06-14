import type { APIRoute } from "astro";
import { getPool } from "../../lib/db";
import {
  buildAutomatchCatalog,
  type AutomatchDbNoteFull,
  type DealerCatalogLink,
} from "../../lib/automatch-catalog";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=120",
};

function normalizeCategory(category: string) {
  return String(category || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function fetchAutomatchNotes(): Promise<AutomatchDbNoteFull[]> {
  const result = await getPool().query(`
    SELECT
      id, title, subtitle, content, category,
      image1, image2, image3, image4, image5, image6,
      spec_segmento, spec_motorizacion, spec_precio_estimado,
      spec_potencia_hp, spec_torque_nm, spec_bateria_autonomia,
      spec_autonomia_km, spec_equipamiento, spec_traccion,
      spec_precio_cop, created_at
    FROM notes
    WHERE lower(category) = 'automatch'
    ORDER BY created_at DESC
  `);

  return result.rows
    .map((row) => ({
      ...row,
      category: normalizeCategory(row.category),
    }))
    .filter((row) => row.category === "automatch");
}

async function fetchDealerLinks(): Promise<DealerCatalogLink[]> {
  const result = await getPool().query(`
    SELECT
      dv.auto_id,
      dv.note_id,
      d.id AS dealer_id,
      d.name AS dealer_name,
      d.phone AS dealer_phone,
      d.whatsapp AS dealer_whatsapp,
      d.email AS dealer_email,
      d.city AS dealer_city
    FROM dealer_vehicles dv
    JOIN dealers d ON d.id = dv.dealer_id
    WHERE dv.active = true AND d.active = true
  `);

  return result.rows.map((row) => ({
    auto_id: row.auto_id ? String(row.auto_id) : null,
    note_id: row.note_id ? Number(row.note_id) : null,
    dealer_id: Number(row.dealer_id),
    dealer_name: String(row.dealer_name || ""),
    dealer_phone: row.dealer_phone,
    dealer_whatsapp: row.dealer_whatsapp,
    dealer_email: row.dealer_email,
    dealer_city: row.dealer_city,
  }));
}

export const GET: APIRoute = async () => {
  try {
    let dbNotes: AutomatchDbNoteFull[] = [];
    let dealerLinks: DealerCatalogLink[] = [];
    let source: "unified" | "catalog-only" = "unified";

    try {
      dbNotes = await fetchAutomatchNotes();
      dealerLinks = await fetchDealerLinks();
    } catch (dbError) {
      console.warn("automatch-catalog: BD no disponible, usando JSON base.", dbError);
      source = "catalog-only";
    }

    const { autos, specs } = buildAutomatchCatalog(dbNotes, dealerLinks);

    return new Response(
      JSON.stringify({
        autos,
        specs,
        meta: {
          source,
          count: autos.length,
          notesMerged: dbNotes.length,
          generatedAt: new Date().toISOString(),
        },
      }),
      { status: 200, headers: JSON_HEADERS },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ error: "Error al construir catálogo", detail: message }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { status: 204, headers: JSON_HEADERS });
};
