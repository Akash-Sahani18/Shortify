const { Pool } = require("pg");
require("dotenv").config();

let pool;

async function initPostgres() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("PostgreSQL Connected");
  } finally {
    client.release();
  }
}

function getPool() {
  if (!pool) {
    throw new Error("PostgreSQL pool is not initialized");
  }

  return pool;
}

module.exports = {
  initPostgres,
  getPool,
};
