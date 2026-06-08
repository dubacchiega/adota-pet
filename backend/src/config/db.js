const mysql2 = require('mysql2/promise');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql2.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      database: process.env.DB_NAME || 'adota_pet',
      user: process.env.DB_USER || 'adota_user',
      password: process.env.DB_PASSWORD || 'adota_pass',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

module.exports = { getPool };
