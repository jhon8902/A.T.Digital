// netlify/functions/db.js
import mysql from 'mysql2/promise';

export const getDB = () => {
  return mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'MiSql2025!autos*#',
    database: 'notas_portal',
  });
};
