export interface MatchPreferences {
  tipo: string;
  uso: string;
  ciudad: string;
  presupuesto: number;
  condicion?: string;
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

function normalizeCity(ciudad = "") {
  return String(ciudad)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function condicionMatches(
  autoCondicion: string,
  prefCondicion?: string,
): boolean {
  if (!prefCondicion || prefCondicion === "ambos") return true;
  return autoCondicion === prefCondicion;
}

export function scoreVehicle(
  auto: {
    tipo: string;
    uso: string;
    ciudad: string;
    precio: number;
    condicion?: string;
  },
  prefs: MatchPreferences,
): MatchResult {
  const breakdown: MatchBreakdownItem[] = [];

  if (auto.tipo !== prefs.tipo) {
    return {
      score: 0,
      excluded: true,
      breakdown: [
        {
          label: "Tipo de motor",
          ok: false,
          pts: 0,
          detail: `Buscas ${prefs.tipo}, este es ${auto.tipo}`,
        },
      ],
    };
  }

  if (!condicionMatches(auto.condicion || "nuevo", prefs.condicion)) {
    return {
      score: 0,
      excluded: true,
      breakdown: [
        {
          label: "Condición",
          ok: false,
          pts: 0,
          detail: `Buscas ${prefs.condicion}, este es ${auto.condicion || "nuevo"}`,
        },
      ],
    };
  }

  let score = 40;
  breakdown.push({
    label: "Tipo de motor",
    ok: true,
    pts: 40,
    detail: prefs.tipo,
  });

  const diff = Math.abs(auto.precio - prefs.presupuesto);
  const maxDiff = prefs.presupuesto * 0.15;
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
