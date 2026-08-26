const TCO_DEFAULTS = {
  precioGasolina: 14500,
  precioDiesel: 13800,
  precioKwh: 620,
  soat: 480000,
  rtm: 380000,
  seguroPct: 0.035,
  mantenimientoPct: 0.022,
  impuestoPct: 0.015,
  depreciacionPct: 0.12,
  consumoGasolina: 8.5,
  consumoDiesel: 7.2,
  consumoHibrido: 5.5,
  consumoElectrico: 17,
};

export function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function withFromParam(href, from = "automatch") {
  if (!href) return href;
  try {
    const url = new URL(href, window.location.origin);
    url.searchParams.set("from", from);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    const join = href.includes("?") ? "&" : "?";
    return `${href}${join}from=${from}`;
  }
}

export function formatCopCompact(value) {
  const amount = Number(value) || 0;
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const digits = millions >= 10 ? 0 : 1;
    return `$${millions.toLocaleString("es-CO", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    })} millones`;
  }
  return `$${Math.round(amount).toLocaleString("es-CO")}`;
}

export function annualKmFromUso(uso = "") {
  const value = String(uso).toLowerCase();
  if (value.includes("trabajo")) return 25000;
  if (value.includes("familiar")) return 18000;
  if (value.includes("deport")) return 10000;
  if (value.includes("urbano") || value.includes("ciudad")) return 12000;
  return 15000;
}

function firstNumber(raw) {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  const match = String(raw || "")
    .replace(",", ".")
    .match(/(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function inferFuelType(tipo = "") {
  const value = String(tipo).toLowerCase();
  if (value.includes("electr")) return "electrico";
  if (value.includes("hibrid") || value.includes("híbrid")) return "hibrido";
  if (value.includes("diesel") || value.includes("diésel")) return "diesel";
  return "gasolina";
}

export function parseConsumoFromSpecs(specs = {}) {
  const haystack = [
    specs.consumo,
    specs.consumo_real,
    specs.consumo_hibrido,
    specs.consumo_electrico,
    specs.consumo_kwh,
  ]
    .filter(Boolean)
    .join(" ");
  const normalized = haystack.toLowerCase();
  const number = firstNumber(haystack);
  const looksKwh = /kwh|kw\/h/.test(normalized);

  if (looksKwh) {
    return { kwh: number, litros: firstNumber(specs.consumo_hibrido) };
  }
  return {
    litros: number,
    kwh: firstNumber(specs.consumo_electrico || specs.consumo_kwh),
  };
}

function annualFuelCost(inputs) {
  const km = Math.max(0, inputs.kmAnuales);
  if (inputs.tipo === "electrico") {
    const kwhPer100 = inputs.kwh || TCO_DEFAULTS.consumoElectrico;
    return (km / 100) * kwhPer100 * TCO_DEFAULTS.precioKwh;
  }

  const litersPer100 =
    inputs.litros ||
    (inputs.tipo === "diesel"
      ? TCO_DEFAULTS.consumoDiesel
      : inputs.tipo === "hibrido"
        ? TCO_DEFAULTS.consumoHibrido
        : TCO_DEFAULTS.consumoGasolina);
  const fuelPrice =
    inputs.tipo === "diesel"
      ? TCO_DEFAULTS.precioDiesel
      : TCO_DEFAULTS.precioGasolina;

  if (inputs.tipo === "hibrido") {
    const kwhPer100 = (inputs.kwh || TCO_DEFAULTS.consumoElectrico) * 0.35;
    const gasPer100 = litersPer100 * 0.65;
    return (
      (km / 100) *
      (gasPer100 * fuelPrice + kwhPer100 * TCO_DEFAULTS.precioKwh)
    );
  }

  return (km / 100) * litersPer100 * fuelPrice;
}

export function estimateTcoPreview(auto, specs = {}, usoOverride) {
  if (auto?.tco && auto.tco.mensual && !usoOverride) {
    return auto.tco;
  }

  const anios = 5;
  const kmAnuales = annualKmFromUso(usoOverride || auto?.uso || "");
  const tipo = inferFuelType(auto?.tipo || "");
  const consumo = parseConsumoFromSpecs(specs);
  const precio = Number(auto?.precio) || 0;

  let valor = precio;
  let total = 0;

  for (let year = 1; year <= anios; year += 1) {
    const combustible = annualFuelCost({
      tipo,
      kmAnuales,
      litros: consumo.litros,
      kwh: consumo.kwh,
    });
    const seguro = valor * TCO_DEFAULTS.seguroPct;
    const mantenimiento = valor * TCO_DEFAULTS.mantenimientoPct;
    const impuesto = valor * TCO_DEFAULTS.impuestoPct;
    const depreciacion = valor * TCO_DEFAULTS.depreciacionPct;
    total +=
      combustible +
      TCO_DEFAULTS.soat +
      TCO_DEFAULTS.rtm +
      seguro +
      mantenimiento +
      impuesto +
      depreciacion;
    valor = Math.max(0, valor - depreciacion);
  }

  return {
    mensual: Math.round(total / (anios * 12)),
    total: Math.round(total),
    anios,
    kmAnuales,
  };
}

function bodyLabel(carroceria = "") {
  const value = String(carroceria).toLowerCase();
  if (value.includes("suv")) return "SUV";
  if (value.includes("hatch")) return "hatchback";
  if (value.includes("pick")) return "pick-up";
  if (value.includes("van")) return "van";
  if (value.includes("sedan") || value.includes("sedán")) return "sedán";
  return "";
}

function generatedParaSi(auto) {
  const body = bodyLabel(auto?.carroceria);
  const bodyBit = body ? ` un ${body}` : " un auto";
  const tipo = inferFuelType(auto?.tipo);
  const tipoLabel =
    tipo === "electrico"
      ? "eléctrico"
      : tipo === "hibrido"
        ? "híbrido"
        : tipo === "diesel"
          ? "diésel"
          : "a gasolina";
  const uso = String(auto?.uso || "").toLowerCase();
  const usoLabel = uso.includes("familiar")
    ? "familia y viajes"
    : uso.includes("trabajo")
      ? "trabajo y carga"
      : uso.includes("deport")
        ? "un uso más picante, no solo el tráfico"
        : "el día a día en ciudad";
  const city = auto?.ciudad ? ` con referencia en ${auto.ciudad}` : " en Colombia";
  return `Para quien busca${bodyBit} ${tipoLabel} pensado para ${usoLabel}${city}, sin inflar el presupuesto.`;
}

function generatedParaNo(auto) {
  const tipo = inferFuelType(auto?.tipo);
  const uso = String(auto?.uso || "").toLowerCase();
  const body = String(auto?.carroceria || "").toLowerCase();
  if (tipo === "electrico") {
    return "No es para quien recorre carretera todas las semanas sin un plan claro de carga, o necesita siete puestos de verdad.";
  }
  if (uso.includes("deport") || body.includes("hatch")) {
    return "No es para quien prioriza baúl enorme, tercera fila o una camioneta alta sí o sí.";
  }
  if (uso.includes("trabajo") || body.includes("pick")) {
    return "No es para quien quiere un sedán bajo de ciudad o un eléctrico de poco kilometraje diario.";
  }
  if (uso.includes("familiar") || body.includes("suv") || body.includes("van")) {
    return "No es para quien busca un compacto barato de parqueadero estrecho, o un deportivo de fin de semana.";
  }
  return "No es para quien necesita otra carrocería, otro tipo de motor o un precio muy distinto al de esta ficha.";
}

function generatedDato(auto, specs = {}) {
  const autonomia = String(specs.autonomia || specs.autonomia_electrica || "").trim();
  if (autonomia) {
    return `Autonomía declarada: ${autonomia}. Conviene cruzarla con tu uso real, no con el folleto.`;
  }
  const motor = String(specs.motor || specs.potencia || "").trim();
  if (motor) {
    return `Dato de ficha: ${motor}. El match mira uso y presupuesto; esto es lo que la ficha comercial suele empujar al final.`;
  }
  if (auto?.precio > 0) {
    return `Precio de referencia: ${formatCopCompact(auto.precio)}. A cinco años, el costo de uso pesa más que el sticker.`;
  }
  return "Cruza este match con el costo de uso y con una nota editorial: el porcentaje solo dice qué tan cerca está de tu filtro.";
}

export function buildVeredicto(auto, specs = {}, prefs = {}) {
  const editorial = auto?.veredicto || {};
  const si = String(editorial.paraSi || editorial.si || "").trim();
  const no = String(editorial.paraNo || editorial.no || "").trim();
  const dato = String(editorial.dato || "").trim();
  const vehicle = {
    ...auto,
    uso: prefs.uso || auto?.uso,
    tipo: prefs.tipo || auto?.tipo,
  };

  return {
    paraSi: si || generatedParaSi(vehicle),
    paraNo: no || generatedParaNo(vehicle),
    dato: dato || generatedDato(vehicle, specs),
    editorial: Boolean(si || no || dato),
  };
}

export function renderVeredictoHtml(veredicto) {
  return `
    <section class="at-veredicto" aria-label="Veredicto A.T.">
      <p class="at-veredicto__kicker">Veredicto A.T.</p>
      <ul>
        <li><strong>Para quién sí.</strong> ${escapeHtml(veredicto.paraSi)}</li>
        <li><strong>Para quién no.</strong> ${escapeHtml(veredicto.paraNo)}</li>
        <li><strong>El dato que la ficha no grita.</strong> ${escapeHtml(veredicto.dato)}</li>
      </ul>
    </section>
  `;
}

export function renderTcoHtml(tco, tcoHref, auto = {}) {
  const km = Number(tco.kmAnuales || 15000).toLocaleString("es-CO");
  return `
    <section class="at-tco" aria-label="Costo de uso estimado">
      <p class="at-tco__kicker">Costo de uso estimado · ${tco.anios || 5} años</p>
      <p class="at-tco__figure">${formatCopCompact(tco.mensual)} / mes</p>
      <p class="at-tco__note">
        Energía, SOAT, seguro, mantenimiento, impuesto y depreciación.
        ${km} km/año, valores orientativos Colombia 2026.
      </p>
      <a href="${tcoHref}" class="at-tco__link" data-automatch-track="tco_click" data-auto-id="${escapeHtml(String(auto.catalogId || auto.id || ""))}">
        Ajustar en la calculadora
      </a>
    </section>
  `;
}
