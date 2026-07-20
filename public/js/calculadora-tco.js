(function () {
  const form = document.getElementById("tco-form");
  const results = document.getElementById("tco-results");
  const vehicleSelect = document.getElementById("tco-vehicle");
  const fuelSelect = document.getElementById("tco-fuel");
  const precioInput = document.getElementById("tco-precio");

  if (!form || !results || !vehicleSelect || !fuelSelect || !precioInput) return;

  const COP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

  const DEFAULTS = {
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

  function num(id) {
    const el = document.getElementById(id);
    if (!el || !(el instanceof HTMLInputElement)) return undefined;
    const value = el.value.trim();
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function numRequired(id) {
    const value = num(id);
    return value ?? 0;
  }

  function annualFuelCost(inputs) {
    const km = Math.max(0, inputs.kmAnuales);

    if (inputs.tipoCombustible === "electrico") {
      const kwhPrice = inputs.precioKwh ?? DEFAULTS.precioKwh;
      const kwhPer100 = inputs.consumoKwh100km ?? DEFAULTS.consumoElectrico;
      return (km / 100) * kwhPer100 * kwhPrice;
    }

    const litersPer100 =
      inputs.consumoLitros100km ??
      (inputs.tipoCombustible === "diesel"
        ? DEFAULTS.consumoDiesel
        : inputs.tipoCombustible === "hibrido"
          ? DEFAULTS.consumoHibrido
          : DEFAULTS.consumoGasolina);

    const fuelPrice =
      inputs.precioCombustibleLitro ??
      (inputs.tipoCombustible === "diesel"
        ? DEFAULTS.precioDiesel
        : DEFAULTS.precioGasolina);

    if (inputs.tipoCombustible === "hibrido") {
      const electricShare = 0.35;
      const kwhPrice = inputs.precioKwh ?? DEFAULTS.precioKwh;
      const kwhPer100 = (inputs.consumoKwh100km ?? DEFAULTS.consumoElectrico) * electricShare;
      const gasPer100 = litersPer100 * (1 - electricShare);
      return (km / 100) * (gasPer100 * fuelPrice + kwhPer100 * kwhPrice);
    }

    return (km / 100) * litersPer100 * fuelPrice;
  }

  function calculateTco(raw) {
    const inputs = {
      precioVehiculo: Math.max(0, raw.precioVehiculo),
      tipoCombustible: raw.tipoCombustible,
      kmAnuales: Math.max(0, raw.kmAnuales),
      añosPropiedad: Math.min(10, Math.max(1, raw.añosPropiedad)),
      consumoLitros100km: raw.consumoLitros100km,
      consumoKwh100km: raw.consumoKwh100km,
      precioCombustibleLitro: raw.precioCombustibleLitro,
      precioKwh: raw.precioKwh,
      soatAnual: raw.soatAnual,
      rtmAnual: raw.rtmAnual,
    };

    const soat = inputs.soatAnual ?? DEFAULTS.soat;
    const rtm = inputs.rtmAnual ?? DEFAULTS.rtm;
    const desgloseAnual = [];
    const resumen = {
      combustible: 0,
      obligaciones: 0,
      seguro: 0,
      mantenimiento: 0,
      impuestos: 0,
      depreciacion: 0,
    };

    let valorActual = inputs.precioVehiculo;

    for (let año = 1; año <= inputs.añosPropiedad; año += 1) {
      const combustible = Math.round(annualFuelCost(inputs));
      const seguro = Math.round(valorActual * DEFAULTS.seguroPct);
      const mantenimiento = Math.round(valorActual * DEFAULTS.mantenimientoPct);
      const impuesto = Math.round(valorActual * DEFAULTS.impuestoPct);
      const depreciacion = Math.round(valorActual * DEFAULTS.depreciacionPct);

      valorActual = Math.max(0, valorActual - depreciacion);
      const subtotal =
        combustible + soat + rtm + seguro + mantenimiento + impuesto + depreciacion;

      desgloseAnual.push({
        año,
        combustible,
        obligaciones: soat + rtm,
        seguro,
        mantenimiento,
        impuesto,
        depreciacion,
        subtotal,
        valorResidual: Math.round(valorActual),
      });

      resumen.combustible += combustible;
      resumen.obligaciones += soat + rtm;
      resumen.seguro += seguro;
      resumen.mantenimiento += mantenimiento;
      resumen.impuestos += impuesto;
      resumen.depreciacion += depreciacion;
    }

    const totalCostoPropiedad = desgloseAnual.reduce((s, r) => s + r.subtotal, 0);
    const totalKm = inputs.kmAnuales * inputs.añosPropiedad;

    return {
      desgloseAnual,
      resumen,
      totalCostoPropiedad,
      costoMensualPromedio: Math.round(totalCostoPropiedad / (inputs.añosPropiedad * 12)),
      costoPorKm: totalKm > 0 ? Math.round(totalCostoPropiedad / totalKm) : 0,
      valorResidualFinal: Math.round(valorActual),
      años: inputs.añosPropiedad,
    };
  }

  function renderResult(data) {
    document.getElementById("tco-years-label").textContent = String(data.años);
    document.getElementById("tco-total").textContent = COP.format(data.totalCostoPropiedad);
    document.getElementById("tco-monthly").textContent = COP.format(data.costoMensualPromedio);
    document.getElementById("tco-per-km").textContent = COP.format(data.costoPorKm);
    document.getElementById("tco-residual").textContent = COP.format(data.valorResidualFinal);

    const breakdownItems = [
      ["Combustible / energía", data.resumen.combustible],
      ["SOAT + revisión técnico-mecánica", data.resumen.obligaciones],
      ["Seguro todo riesgo (est.)", data.resumen.seguro],
      ["Mantenimiento", data.resumen.mantenimiento],
      ["Impuesto vehicular (est.)", data.resumen.impuestos],
      ["Depreciación", data.resumen.depreciacion],
    ];

    const list = document.getElementById("tco-breakdown-list");
    list.innerHTML = breakdownItems
      .map(
        ([label, value]) =>
          `<li><span>${label}</span><strong>${COP.format(value)}</strong></li>`,
      )
      .join("");

    const tbody = document.getElementById("tco-table-body");
    tbody.innerHTML = data.desgloseAnual
      .map(
        (row) => `<tr>
          <td>${row.año}</td>
          <td>${COP.format(row.combustible)}</td>
          <td>${COP.format(row.obligaciones)}</td>
          <td>${COP.format(row.seguro)}</td>
          <td>${COP.format(row.mantenimiento)}</td>
          <td>${COP.format(row.impuesto)}</td>
          <td>${COP.format(row.depreciacion)}</td>
          <td><strong>${COP.format(row.subtotal)}</strong></td>
        </tr>`,
      )
      .join("");

    results.hidden = false;
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  vehicleSelect.addEventListener("change", () => {
    const option = vehicleSelect.selectedOptions[0];
    if (!option || !option.value) return;

    precioInput.value = option.dataset.precio || "";
    fuelSelect.value = option.dataset.fuel || "gasolina";

    const litros = document.getElementById("tco-litros");
    const kwh = document.getElementById("tco-kwh");
    if (litros instanceof HTMLInputElement) {
      litros.value = option.dataset.litros || "";
    }
    if (kwh instanceof HTMLInputElement) {
      kwh.value = option.dataset.kwh || "";
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const precio = numRequired("tco-precio");
    if (precio <= 0) {
      precioInput.focus();
      return;
    }

    const result = calculateTco({
      precioVehiculo: precio,
      tipoCombustible: fuelSelect.value,
      kmAnuales: numRequired("tco-km"),
      añosPropiedad: numRequired("tco-years"),
      consumoLitros100km: num("tco-litros"),
      consumoKwh100km: num("tco-kwh"),
      precioCombustibleLitro: num("tco-gas-price"),
      precioKwh: num("tco-kwh-price"),
      soatAnual: num("tco-soat"),
      rtmAnual: num("tco-rtm"),
    });

    renderResult(result);
  });
})();
