require("dotenv").config();
const { randomBytes, scryptSync } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { Pool } = require("pg");

const DEFAULT_PASSWORD = process.env.SEED_DEALER_PASSWORD || "demo123";
const COMMISSION_RATE = Number(process.env.SEED_DEALER_COMMISSION || "50000");

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function loadCatalogAutos() {
  const catalogPath = join(__dirname, "..", "src", "data", "automatch", "autos.json");
  const raw = readFileSync(catalogPath, "utf8");
  const autos = JSON.parse(raw);

  if (!Array.isArray(autos) || autos.length === 0) {
    throw new Error("autos.json no contiene vehículos para sembrar concesionarios.");
  }

  return autos;
}

function cityFromAuto(auto) {
  const dealerCity = auto.concesionario?.direccion || "";
  const ciudad = String(auto.ciudad || "")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  if (/bogot/i.test(dealerCity) || /bogot/i.test(ciudad)) return "Bogotá";
  if (/medell/i.test(dealerCity) || /medell/i.test(ciudad)) return "Medellín";
  if (/cali/i.test(dealerCity) || /cali/i.test(ciudad)) return "Cali";
  if (/barranquilla/i.test(dealerCity) || /barranquilla/i.test(ciudad)) {
    return "Barranquilla";
  }

  return ciudad || "Colombia";
}

function brandFromNombre(nombre = "") {
  return String(nombre).trim().split(/\s+/)[0] || "Marca";
}

function buildDealersFromCatalog(autos) {
  const dealers = [];

  for (const auto of autos) {
    const dealer = auto.concesionario;
    if (!dealer?.email) {
      throw new Error(
        `El vehículo id=${auto.id} (${auto.nombre}) no tiene email de concesionario.`,
      );
    }

    dealers.push({
      catalogAutoId: String(auto.id),
      name: dealer.nombre,
      email: dealer.email,
      password: DEFAULT_PASSWORD,
      phone: dealer.telefono || null,
      whatsapp: dealer.whatsapp || null,
      city: cityFromAuto(auto),
      commission_rate: COMMISSION_RATE,
      brand: brandFromNombre(auto.nombre),
      model: auto.nombre,
    });
  }

  return dealers;
}

async function main() {
  const connectionString =
    process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no está definido.");
  }

  const autos = loadCatalogAutos();
  const dealers = buildDealersFromCatalog(autos);

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

  try {
    for (const dealer of dealers) {
      const password_hash = hashPassword(dealer.password);
      const inserted = await pool.query(
        `INSERT INTO dealers (name, email, password_hash, phone, whatsapp, city, commission_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           password_hash = EXCLUDED.password_hash,
           phone = EXCLUDED.phone,
           whatsapp = EXCLUDED.whatsapp,
           city = EXCLUDED.city,
           commission_rate = EXCLUDED.commission_rate,
           active = true
         RETURNING id`,
        [
          dealer.name,
          dealer.email,
          password_hash,
          dealer.phone,
          dealer.whatsapp,
          dealer.city,
          dealer.commission_rate,
        ],
      );

      const dealerId = inserted.rows[0].id;

      await pool.query(
        `INSERT INTO dealer_vehicles (dealer_id, auto_id, brand, model, active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (dealer_id, auto_id) DO UPDATE SET
           brand = EXCLUDED.brand,
           model = EXCLUDED.model,
           active = true`,
        [dealerId, dealer.catalogAutoId, dealer.brand, dealer.model],
      );

      console.log(
        `Dealer listo: ${dealer.email} (id ${dealerId}) → auto_id ${dealer.catalogAutoId}`,
      );
    }

    console.log(`SEED_DEALERS_OK (${dealers.length} concesionarios)`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
