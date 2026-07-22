function normalizeCiudad(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolvePlacaTipo(auto) {
  if (auto.placa === "par" || auto.placa === "impar") {
    return auto.placa;
  }

  if (auto.placa_ultimo_digito != null) {
    return auto.placa_ultimo_digito % 2 === 0 ? "par" : "impar";
  }

  return null;
}

function resolveKilometraje(auto) {
  if (typeof auto.kilometraje === "number" && auto.kilometraje >= 0) {
    return auto.kilometraje;
  }

  if ((auto.condicion || "nuevo") === "nuevo") {
    return 0;
  }

  return null;
}

function condicionMatches(autoCondicion, prefCondicion) {
  if (!prefCondicion || prefCondicion === "ambos") return true;
  return autoCondicion === prefCondicion;
}

function kilometrajeMatches(auto, range) {
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

function placaMatches(auto, prefPlaca) {
  if (!prefPlaca || prefPlaca === "ambos") return true;

  const placaTipo = resolvePlacaTipo(auto);
  if (!placaTipo) return true;

  return placaTipo === prefPlaca;
}

function carroceriaMatches(auto, prefCarroceria) {
  if (!prefCarroceria) return true;
  if (!auto.carroceria) return false;

  return normalizeCiudad(auto.carroceria) === normalizeCiudad(prefCarroceria);
}

export function passesHardFilters(auto, prefs) {
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
      reason: "Kilometraje fuera del rango seleccionado",
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

export function scoreVehicle(auto, prefs) {
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

  const breakdown = [];

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

export function relaxSearchFilters(prefs) {
  return {
    ...prefs,
    placa: "ambos",
    kilometraje: "cualquiera",
    carroceria: "",
    condicion:
      prefs.condicion === "nuevo" || prefs.condicion === "ambos"
        ? prefs.condicion
        : "ambos",
  };
}

export function formatVehicleMeta(auto) {
  const chips = [];

  if (auto.año) {
    chips.push(`${auto.año}`);
  }

  const km = resolveKilometraje(auto);
  if (km != null && km > 0) {
    chips.push(`${km.toLocaleString("es-CO")} km`);
  } else if ((auto.condicion || "nuevo") === "nuevo") {
    chips.push("0 km");
  }

  const placa = resolvePlacaTipo(auto);
  if (placa) {
    chips.push(`Placa ${placa}`);
  }

  if (auto.carroceria) {
    chips.push(auto.carroceria);
  }

  return chips;
}
