const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const ROOT = join(__dirname, "..");
const AUTOS_PATH = join(ROOT, "src", "data", "automatch", "autos.json");
const SPECS_PATH = join(ROOT, "src", "data", "automatch", "specs.json");
const PUBLIC_AUTOS_PATH = join(ROOT, "public", "data", "automatch", "autos.json");

const REQUIRED_AUTO_FIELDS = [
  "id",
  "nombre",
  "tipo",
  "uso",
  "precio",
  "ciudad",
  "condicion",
  "imagen_principal",
  "galeria",
  "especificaciones_id",
  "concesionario",
];

const REQUIRED_DEALER_FIELDS = [
  "id",
  "nombre",
  "telefono",
  "whatsapp",
  "email",
];

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function main() {
  const errors = [];
  const warnings = [];

  const autos = loadJson(AUTOS_PATH);
  const specs = loadJson(SPECS_PATH);
  const publicAutos = loadJson(PUBLIC_AUTOS_PATH);

  if (JSON.stringify(autos) !== JSON.stringify(publicAutos)) {
    errors.push(
      "src/data/automatch/autos.json y public/data/automatch/autos.json no coinciden. Sincronízalos.",
    );
  }

  if (!Array.isArray(autos) || autos.length === 0) {
    errors.push("El catálogo no tiene vehículos.");
    report(errors, warnings);
    return;
  }

  const ids = new Set();

  for (const auto of autos) {
    const label = `Auto #${auto.id ?? "?"} (${auto.nombre || "sin nombre"})`;

    for (const field of REQUIRED_AUTO_FIELDS) {
      if (auto[field] == null || auto[field] === "") {
        errors.push(`${label}: falta campo "${field}".`);
      }
    }

    if (ids.has(auto.id)) {
      errors.push(`${label}: id duplicado ${auto.id}.`);
    }
    ids.add(auto.id);

    if (!Array.isArray(auto.galeria) || auto.galeria.length < 1) {
      errors.push(`${label}: galería vacía.`);
    }

    if (!(auto.precio > 0)) {
      errors.push(`${label}: precio inválido.`);
    }

    const dealer = auto.concesionario || {};
    for (const field of REQUIRED_DEALER_FIELDS) {
      if (!dealer[field]) {
        errors.push(`${label}: concesionario sin "${field}".`);
      }
    }

    if (dealer.id != null && Number(dealer.id) !== Number(auto.id)) {
      warnings.push(
        `${label}: concesionario.id (${dealer.id}) no coincide con auto.id (${auto.id}).`,
      );
    }

    if (!specs[auto.especificaciones_id]) {
      errors.push(
        `${label}: no existe specs["${auto.especificaciones_id}"].`,
      );
    }
  }

  report(errors, warnings, autos.length);
}

function report(errors, warnings, count = 0) {
  if (warnings.length) {
    console.warn("Advertencias:");
    warnings.forEach((item) => console.warn(`  - ${item}`));
  }

  if (errors.length) {
    console.error("Errores de catálogo AutoMatch:");
    errors.forEach((item) => console.error(`  - ${item}`));
    process.exit(1);
  }

  console.log(`CATALOGO_OK: ${count} vehículos validados.`);
}

main();
