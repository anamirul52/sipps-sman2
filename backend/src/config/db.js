const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_pelanggaran_siswa',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Aktifkan SSL jika menggunakan cloud database (seperti Aiven / TiDB / Railway)
if (process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production') {
    dbConfig.ssl = {
        rejectUnauthorized: false
    };
}

const pool = mysql.createPool(dbConfig);

module.exports = pool;
