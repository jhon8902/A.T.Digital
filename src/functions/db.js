// netlify/functions/db.js es un módulo para gestionar la conexión a la base de datos MySQL.
import mysql from "mysql2/promise";

export async function getDB() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "MiSql2025!autos*#", // ← aquí tu contraseña real
    database: "notas_portal",
  });
  return connection;
}

