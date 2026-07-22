export type PlacaFiltro = "par" | "impar" | "ambos";
export type KilometrajeFiltro =
  | "cualquiera"
  | "0-30000"
  | "30000-60000"
  | "60000-90000"
  | "90000+";

export interface MatchPreferences {
  tipo: string;
  uso: string;
  ciudad: string;
  presupuesto: number;
  condicion?: string;
  placa?: PlacaFiltro;
  kilometraje?: KilometrajeFiltro;
  carroceria?: string;
}

export interface MatchBreakdownItem {
  label: string;
  ok: boolean;
  pts: number;
  detail?: string;
}

export interface MatchResult {
  score: number;
  excluded: boolean;
  breakdown: MatchBreakdownItem[];
}

export interface ScoredVehicle<T> {
  vehicle: T;
  match: MatchResult;
}

export interface AutomatchVehicleLike {
  tipo: string;
  uso: string;
  ciudad: string;
  precio: number;
  condicion?: string;
  kilometraje?: number;
  placa?: PlacaFiltro;
  placa_ultimo_digito?: number;
  carroceria?: string;
}

function normalizeCity(ciudad = "") {
  return String(ciudad)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolvePlacaTipo(auto: AutomatchVehicleLike): PlacaFiltro | null {
  if (auto.placa === "par" || auto.placa === "impar") {
    return auto.placa;
  }

  if (auto.placa_ultimo_digito != null) {
    return auto.placa_ultimo_digito % 2 === 0 ? "par" : "impar";
  }

  return null;
}

function resolveKilometraje(auto: AutomatchVehicleLike): number | null {
  if (typeof auto.kilometraje === "number" && auto.kilometraje >= 0) {
    return auto.kilometraje;
  }

  if ((auto.condicion || "nuevo") === "nuevo") {
    return 0;
  }

  return null;
}

function condicionMatches(
  autoCondicion: string,
  prefCondicion?: string,
): boolean {
  if (!prefCondicion || prefCondicion === "ambos") return true;
  return autoCondicion === prefCondicion;
}

function kilometrajeMatches(
  auto: AutomatchVehicleLike,
  range?: KilometrajeFiltro,
): boolean {
  if (!range || range === "cualquiera") return true;

  const km = resolveKilometraje(auto);
  if (km == null) return false;

  switch (range) {
    case "0-30000":
      return km <= 30000;
    case "30000-60000":
      return km > 30000 && km <= 60000;
    case "60000-90000":
      return km > 60000 && km <= 90000;
    case "90000+":
      return km > 90000;
    default:
      return true;
  }
}

function placaMatches(
  auto: AutomatchVehicleLike,
  prefPlaca?: PlacaFiltro,
): boolean {
  if (!prefPlaca || prefPlaca === "ambos") return true;

  const placaTipo = resolvePlacaTipo(auto);
  if (!placaTipo) return true;

  return placaTipo === prefPlaca;
}

function carroceriaMatches(
  auto: AutomatchVehicleLike,
  prefCarroceria?: string,
): boolean {
  if (!prefCarroceria) return true;
  if (!auto.carroceria) return false;

  return (
    normalizeCity(auto.carroceria) === normalizeCity(prefCarroceria)
  );
}

export function passesHardFilters(
  auto: AutomatchVehicleLike,
  prefs: MatchPreferences,
): { ok: boolean; reason?: string } {
  if (auto.tipo !== prefs.tipo) {
    return {
      ok: false,
      reason: `Tipo: buscas ${prefs.tipo}, este es ${auto.tipo}`,
    };
  }

  if (!condicionMatches(auto.condicion || "nuevo", prefs.condicion)) {
    return {
      ok: false,
      reason: `Condición: buscas ${prefs.condicion}, este es ${auto.condicion || "nuevo"}`,
    };
  }

  if (!placaMatches(auto, prefs.placa)) {
    return {
      ok: false,
      reason: `Placa: buscas ${prefs.placa}, este es placa ${resolvePlacaTipo(auto) || "sin dato"}`,
    };
  }

  if (!kilometrajeMatches(auto, prefs.kilometraje)) {
    return {
      ok: false,
      reason: `Kilometraje fuera del rango seleccionado`,
    };
  }

  if (!carroceriaMatches(auto, prefs.carroceria)) {
    return {
      ok: false,
      reason: `Carrocería: buscas ${prefs.carroceria}`,
    };
  }

  return { ok: true };
}

export function scoreVehicle(
  auto: AutomatchVehicleLike,
  prefs: MatchPreferences,
): MatchResult {
  const hard = passesHardFilters(auto, prefs);
  if (!hard.ok) {
    return {
      score: 0,
      excluded: true,
      breakdown: [
        {
          label: "Filtro",
          ok: false,
          pts: 0,
          detail: hard.reason,
        },
      ],
    };
  }

  const breakdown: MatchBreakdownItem[] = [];

  let score = 40;
  breakdown.push({
    label: "Tipo de motor",
    ok: true,
    pts: 40,
    detail: prefs.tipo,
  });

  const diff = Math.abs(auto.precio - prefs.presupuesto);
  const maxDiff = prefs.presupuesto * 0.2;
  let precioPts = 0;
  if (prefs.presupuesto > 0 && diff <= maxDiff) {
    precioPts = 30 * (1 - diff / maxDiff);
    score += precioPts;
  }
  breakdown.push({
    label: "Presupuesto",
    ok: precioPts > 0,
    pts: Math.round(precioPts),
    detail:
      precioPts > 0
        ? "Dentro de tu rango"
        : "Fuera del rango de precio esperado",
  });

  const usoOk = auto.uso === prefs.uso;
  const usoPts = usoOk ? 20 : 0;
  score += usoPts;
  breakdown.push({
    label: "Tipo de uso",
    ok: usoOk,
    pts: usoPts,
    detail: usoOk
      ? prefs.uso
      : `Buscas ${prefs.uso}, este es ${auto.uso}`,
  });

  const ciudadOk = normalizeCity(auto.ciudad) === normalizeCity(prefs.ciudad);
  const ciudadPts = ciudadOk ? 10 : 0;
  score += ciudadPts;
  breakdown.push({
    label: "Ciudad",
    ok: ciudadOk,
    pts: ciudadPts,
    detail: ciudadOk ? prefs.ciudad : auto.ciudad,
  });

  const placaTipo = resolvePlacaTipo(auto);
  if (placaTipo && prefs.placa && prefs.placa !== "ambos") {
    breakdown.push({
      label: "Placa",
      ok: true,
      pts: 0,
      detail: `Placa ${placaTipo}`,
    });
  }

  const km = resolveKilometraje(auto);
  if (km != null && prefs.kilometraje && prefs.kilometraje !== "cualquiera") {
    breakdown.push({
      label: "Kilometraje",
      ok: true,
      pts: 0,
      detail: `${km.toLocaleString("es-CO")} km`,
    });
  }

  return {
    score: Math.min(Math.round(score), 100),
    excluded: false,
    breakdown,
  };
}

export function rankVehicles<T extends { id: number | string }>(
  vehicles: T[],
  prefs: MatchPreferences,
  options: {
    applyLikesBonus?: (auto: T, baseScore: number) => number;
    alternativaGap?: number;
  } = {},
): {
  best: ScoredVehicle<T> | null;
  alternativas: ScoredVehicle<T>[];
  eligibleCount: number;
} {
  const gap = options.alternativaGap ?? 15;
  const scored: ScoredVehicle<T>[] = [];

  for (const vehicle of vehicles) {
    const match = scoreVehicle(vehicle as never, prefs);
    if (match.excluded) continue;

    let score = match.score;
    if (options.applyLikesBonus) {
      score = Math.min(options.applyLikesBonus(vehicle, score), 100);
    }

    scored.push({ vehicle, match: { ...match, score } });
  }

  scored.sort((a, b) => b.match.score - a.match.score);

  if (scored.length === 0) {
    return { best: null, alternativas: [], eligibleCount: 0 };
  }

  const best = scored[0];
  const alternativas = scored
    .slice(1)
    .filter((item) => item.match.score >= best.match.score - gap)
    .slice(0, 3);

  return {
    best,
    alternativas,
    eligibleCount: scored.length,
  };
}
