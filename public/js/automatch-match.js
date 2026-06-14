function normalizeCiudad(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function scoreVehicle(auto, prefs) {
  const breakdown = [];

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

  const prefCondicion = prefs.condicion || "ambos";
  const autoCondicion = auto.condicion || "nuevo";
  if (prefCondicion !== "ambos" && autoCondicion !== prefCondicion) {
    return {
      score: 0,
      excluded: true,
      breakdown: [
        {
          label: "Condición",
          ok: false,
          pts: 0,
          detail: `Buscas ${prefCondicion}, este es ${autoCondicion}`,
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

  const ciudadOk =
    normalizeCiudad(auto.ciudad) === normalizeCiudad(prefs.ciudad);
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

export function rankVehicles(vehicles, prefs, options = {}) {
  const gap = options.alternativaGap ?? 15;
  const scored = [];

  for (const vehicle of vehicles) {
    const match = scoreVehicle(vehicle, prefs);
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

export function buildMatchSummary(breakdown, prefs) {
  const usoItem = breakdown.find((item) => item.label === "Tipo de uso");
  if (usoItem && !usoItem.ok) {
    return `No hay ${prefs.tipo} ${prefs.uso} en catálogo. Te mostramos el ${prefs.tipo} más cercano a tu perfil.`;
  }
  return "Tu mejor coincidencia según tu perfil";
}
