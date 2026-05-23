const { Pool } = require("pg");
require("dotenv").config(); // Permet de lire le fichier .env en local

let pool;

// 1. Si la variable DATABASE_URL existe (Production sur Render ou test avec Supabase)
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Obligatoire pour la sécurité de Supabase
    },
  });
} 
// 2. Sinon, on se rabat sur tes anciennes variables locales (PostgreSQL local)
else {
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
}

module.exports = pool;