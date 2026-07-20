export type TcoFuelType = "gasolina" | "diesel" | "electrico" | "hibrido";

export interface TcoInputs {
  precioVehiculo: number;
  tipoCombustible: TcoFuelType;
  kmAnuales: number;
  añosPropiedad: number;
  consumoLitros100km?: number;
  consumoKwh100km?: number;
  precioCombustibleLitro?: number;
  precioKwh?: number;
  soatAnual?: number;
  rtmAnual?: number;
  seguroAnual?: number;
  mantenimientoAnual?: number;
  impuestoVehicularPct?: number;
  depreciacionAnualPct?: number;
}

export interface TcoYearBreakdown {
  año: number;
  combustible: number;
  soat: number;
  rtm: number;
  seguro: number;
  mantenimiento: number;
  impuesto: number;
  depreciacion: number;
  subtotal: number;
  valorResidual: number;
}

export interface TcoResult {
  inputs: TcoInputs;
  desgloseAnual: TcoYearBreakdown[];
  totalCostoPropiedad: number;
  costoMensualPromedio: number;
  costoPorKm: number;
  valorResidualFinal: number;
  resumen: {
    combustible: number;
    obligaciones: number;
    seguro: number;
    mantenimiento: number;
    impuestos: number;
    depreciacion: number;
  };
}

/** Valores orientativos Colombia 2026 — editables en la calculadora. */
export const TCO_DEFAULTS = {
  precioGasolina: 14_500,
  precioDiesel: 13_800,
  precioKwh: 620,
  soat: 480_000,
  rtm: 380_000,
  seguroPct: 0.035,
  mantenimientoPct: 0.022,
  impuestoPct: 0.015,
  depreciacionPct: 0.12,
  consumoGasolina: 8.5,
  consumoDiesel: 7.2,
  consumoHibrido: 5.5,
  consumoElectrico: 17,
} as const;

export function inferFuelTypeFromCatalog(
  tipo: string,
): TcoFuelType {
  const normalized = tipo.toLowerCase();
  if (normalized.includes("eléctrico") || normalized.includes("electrico")) {
    return "electrico";
  }
  if (normalized.includes("híbrido") || normalized.includes("hibrido")) {
    return "hibrido";
  }
  if (normalized.includes("diesel")) {
    return "diesel";
  }
  return "gasolina";
}

function roundCop(value: number): number {
  return Math.round(value);
}

function getConsumoLitros(inputs: TcoInputs): number {
  if (inputs.consumoLitros100km && inputs.consumoLitros100km > 0) {
    return inputs.consumoLitros100km;
  }

  switch (inputs.tipoCombustible) {
    case "diesel":
      return TCO_DEFAULTS.consumoDiesel;
    case "hibrido":
      return TCO_DEFAULTS.consumoHibrido;
    default:
      return TCO_DEFAULTS.consumoGasolina;
  }
}

function getConsumoKwh(inputs: TcoInputs): number {
  return inputs.consumoKwh100km && inputs.consumoKwh100km > 0
    ? inputs.consumoKwh100km
    : TCO_DEFAULTS.consumoElectrico;
}

function getPrecioCombustible(inputs: TcoInputs): number {
  if (inputs.precioCombustibleLitro && inputs.precioCombustibleLitro > 0) {
    return inputs.precioCombustibleLitro;
  }

  return inputs.tipoCombustible === "diesel"
    ? TCO_DEFAULTS.precioDiesel
    : TCO_DEFAULTS.precioGasolina;
}

function annualFuelCost(inputs: TcoInputs): number {
  const km = Math.max(0, inputs.kmAnuales);

  if (inputs.tipoCombustible === "electrico") {
    const kwhPrice = inputs.precioKwh ?? TCO_DEFAULTS.precioKwh;
    const kwhPer100 = getConsumoKwh(inputs);
    return (km / 100) * kwhPer100 * kwhPrice;
  }

  const litersPer100 = getConsumoLitros(inputs);
  const fuelPrice = getPrecioCombustible(inputs);

  if (inputs.tipoCombustible === "hibrido") {
    const electricShare = 0.35;
    const kwhPrice = inputs.precioKwh ?? TCO_DEFAULTS.precioKwh;
    const kwhPer100 = getConsumoKwh(inputs) * electricShare;
    const gasPer100 = litersPer100 * (1 - electricShare);
    return (km / 100) * (gasPer100 * fuelPrice + kwhPer100 * kwhPrice);
  }

  return (km / 100) * litersPer100 * fuelPrice;
}

export function calculateTco(raw: TcoInputs): TcoResult {
  const inputs: TcoInputs = {
    ...raw,
    precioVehiculo: Math.max(0, raw.precioVehiculo),
    kmAnuales: Math.max(0, raw.kmAnuales),
    añosPropiedad: Math.min(10, Math.max(1, raw.añosPropiedad)),
  };

  const soat = inputs.soatAnual ?? TCO_DEFAULTS.soat;
  const rtm = inputs.rtmAnual ?? TCO_DEFAULTS.rtm;
  const impuestoPct = inputs.impuestoVehicularPct ?? TCO_DEFAULTS.impuestoPct;
  const depreciacionPct =
    inputs.depreciacionAnualPct ?? TCO_DEFAULTS.depreciacionPct;

  const desgloseAnual: TcoYearBreakdown[] = [];
  let valorActual = inputs.precioVehiculo;

  const resumen = {
    combustible: 0,
    obligaciones: 0,
    seguro: 0,
    mantenimiento: 0,
    impuestos: 0,
    depreciacion: 0,
  };

  for (let año = 1; año <= inputs.añosPropiedad; año += 1) {
    const combustible = annualFuelCost(inputs);
    const seguro =
      inputs.seguroAnual ??
      roundCop(valorActual * TCO_DEFAULTS.seguroPct);
    const mantenimiento =
      inputs.mantenimientoAnual ??
      roundCop(valorActual * TCO_DEFAULTS.mantenimientoPct);
    const impuesto = roundCop(valorActual * impuestoPct);
    const depreciacion = roundCop(valorActual * depreciacionPct);

    valorActual = Math.max(0, valorActual - depreciacion);

    const subtotal =
      combustible + soat + rtm + seguro + mantenimiento + impuesto + depreciacion;

    desgloseAnual.push({
      año,
      combustible: roundCop(combustible),
      soat: roundCop(soat),
      rtm: roundCop(rtm),
      seguro: roundCop(seguro),
      mantenimiento: roundCop(mantenimiento),
      impuesto: roundCop(impuesto),
      depreciacion: roundCop(depreciacion),
      subtotal: roundCop(subtotal),
      valorResidual: roundCop(valorActual),
    });

    resumen.combustible += combustible;
    resumen.obligaciones += soat + rtm;
    resumen.seguro += seguro;
    resumen.mantenimiento += mantenimiento;
    resumen.impuestos += impuesto;
    resumen.depreciacion += depreciacion;
  }

  const totalKm = inputs.kmAnuales * inputs.añosPropiedad;
  const totalCostoPropiedad = desgloseAnual.reduce(
    (sum, row) => sum + row.subtotal,
    0,
  );

  return {
    inputs,
    desgloseAnual,
    totalCostoPropiedad: roundCop(totalCostoPropiedad),
    costoMensualPromedio: roundCop(
      totalCostoPropiedad / (inputs.añosPropiedad * 12),
    ),
    costoPorKm: totalKm > 0 ? roundCop(totalCostoPropiedad / totalKm) : 0,
    valorResidualFinal: roundCop(valorActual),
    resumen: {
      combustible: roundCop(resumen.combustible),
      obligaciones: roundCop(resumen.obligaciones),
      seguro: roundCop(resumen.seguro),
      mantenimiento: roundCop(resumen.mantenimiento),
      impuestos: roundCop(resumen.impuestos),
      depreciacion: roundCop(resumen.depreciacion),
    },
  };
}

export function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
