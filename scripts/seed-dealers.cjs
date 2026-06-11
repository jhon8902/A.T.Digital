require("dotenv").config();
const { randomBytes, scryptSync } = require("node:crypto");
const { Pool } = require("pg");

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const DEALERS = [
  {
    name: "Renault Bogotá Centro",
    email: "ventas@renaultbogota.com",
    password: "demo123",
    phone: "+57 1 234 5678",
    whatsapp: "573001234567",
    city: "Bogotá",
    commission_rate: 50000,
    vehicles: [{ auto_id: "1", brand: "Renault", model: "Megane E-Tech" }],
  },
  {
    name: "BMW Medellín Premium",
    email: "ventas@bmwmedellin.com",
    password: "demo123",
    phone: "+57 4 567 8901",
    whatsapp: "573105678901",
    city: "Medellín",
    commission_rate: 50000,
    vehicles: [{ auto_id: "2", brand: "BMW", model: "330e" }],
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no está definido.");
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

  try {
    for (const dealer of DEALERS) {
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

      for (const vehicle of dealer.vehicles) {
        await pool.query(
          `INSERT INTO dealer_vehicles (dealer_id, auto_id, brand, model, active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (dealer_id, auto_id) DO UPDATE SET
             brand = EXCLUDED.brand,
             model = EXCLUDED.model,
             active = true`,
          [dealerId, vehicle.auto_id, vehicle.brand, vehicle.model],
        );
      }

      console.log(`Dealer listo: ${dealer.email} (id ${dealerId})`);
    }

    console.log("SEED_DEALERS_OK");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
