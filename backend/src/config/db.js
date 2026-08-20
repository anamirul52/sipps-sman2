const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL Configuration
let pgConfig;

if (process.env.DATABASE_URL) {
    pgConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    };
} else {
    pgConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'defaultdb',
        ssl: {
            rejectUnauthorized: false
        }
    };
}

if (!global._pgPool) {
    global._pgPool = new Pool({
        ...pgConfig,
        max: 1, // Sangat penting untuk Vercel Serverless agar tidak melebihi batas koneksi database
        idleTimeoutMillis: 1000,
        connectionTimeoutMillis: 10000,
        allowExitOnIdle: true
    });
}

const pool = global._pgPool;

// Helper function to translate MySQL SQL queries into PostgreSQL compliant SQL
function translateMySqlToPostgreSql(sql) {
    let index = 0;
    let convertedSql = sql;

    // 1. Convert `?` placeholders to `$1, $2, $3, ...`
    convertedSql = convertedSql.replace(/\?/g, () => {
        index += 1;
        return `$${index}`;
    });

    // 2. Convert common MySQL date functions
    convertedSql = convertedSql.replace(/\bCURDATE\(\)/gi, 'CURRENT_DATE');
    convertedSql = convertedSql.replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP');

    // 3. Convert GROUP_CONCAT to STRING_AGG
    // e.g. GROUP_CONCAT(c.id SEPARATOR ',') -> STRING_AGG(c.id::text, ',')
    convertedSql = convertedSql.replace(/GROUP_CONCAT\s*\(\s*(DISTINCT\s+)?c\.id\s+SEPARATOR\s+['"]([^'"]+)['"]\s*\)/gi, (match, dist, sep) => {
        return `STRING_AGG(${dist || ''}c.id::text, '${sep}')`;
    });
    // e.g. GROUP_CONCAT(c.class_name SEPARATOR ', ') -> STRING_AGG(c.class_name, ', ')
    convertedSql = convertedSql.replace(/GROUP_CONCAT\s*\(\s*(DISTINCT\s+)?([^,)]+)\s+SEPARATOR\s+['"]([^'"]+)['"]\s*\)/gi, (match, dist, col, sep) => {
        return `STRING_AGG(${dist || ''}${col.trim()}, '${sep}')`;
    });
    convertedSql = convertedSql.replace(/GROUP_CONCAT\s*\(\s*([^)]+)\s*\)/gi, (match, col) => {
        return `STRING_AGG(${col.trim()}::text, ',')`;
    });

    // 4. Convert FIELD(SUBSTRING_INDEX(class_name, '-', 1), 'X', 'XI', 'XII')
    convertedSql = convertedSql.replace(/FIELD\s*\(\s*SUBSTRING_INDEX\s*\(\s*([^,]+)\s*,\s*['"]([^'"]+)['"]\s*,\s*1\s*\)\s*,\s*['"]X['"]\s*,\s*['"]XI['"]\s*,\s*['"]XII['"]\s*\)/gi, (match, col, sep) => {
        return `CASE split_part(${col.trim()}, '${sep}', 1) WHEN 'X' THEN 1 WHEN 'XI' THEN 2 WHEN 'XII' THEN 3 ELSE 4 END`;
    });

    // 5. Convert FIELD(u.role, 'admin', 'bk', 'wali_kelas', 'piket')
    convertedSql = convertedSql.replace(/FIELD\s*\(\s*u\.role\s*,\s*['"]admin['"]\s*,\s*['"]bk['"]\s*,\s*['"]wali_kelas['"]\s*,\s*['"]piket['"]\s*\)/gi, () => {
        return `CASE u.role WHEN 'admin' THEN 1 WHEN 'bk' THEN 2 WHEN 'wali_kelas' THEN 3 WHEN 'piket' THEN 4 ELSE 5 END`;
    });

    // 6. Convert FIELD(u.role, 'admin', 'bk', 'piket', 'wali_kelas')
    convertedSql = convertedSql.replace(/FIELD\s*\(\s*u\.role\s*,\s*['"]admin['"]\s*,\s*['"]bk['"]\s*,\s*['"]piket['"]\s*,\s*['"]wali_kelas['"]\s*\)/gi, () => {
        return `CASE u.role WHEN 'admin' THEN 1 WHEN 'bk' THEN 2 WHEN 'piket' THEN 3 WHEN 'wali_kelas' THEN 4 ELSE 5 END`;
    });

    // 7. For INSERT statements without RETURNING, append RETURNING id so result.insertId is accessible
    if (/^\s*INSERT\s+INTO\s+/i.test(convertedSql) && !/\bRETURNING\b/i.test(convertedSql)) {
        convertedSql = convertedSql.trim().replace(/;+$/, '') + ' RETURNING id';
    }

    return convertedSql;
}

// Wrapper for Query execution returning [rows, result] like mysql2/promise
async function executeQuery(target, sql, params = []) {
    const formattedSql = translateMySqlToPostgreSql(sql);
    const flatParams = Array.isArray(params) ? params : [];
    
    const result = await target.query(formattedSql, flatParams);
    
    // Structure rows and metadata matching mysql2 return format
    const rows = result.rows || [];
    const meta = {
        insertId: rows[0]?.id || null,
        affectedRows: result.rowCount || 0,
        rowCount: result.rowCount || 0
    };

    return [rows, meta];
}

// Export custom pool wrapper compatible with existing controller code
const db = {
    query: async (sql, params) => {
        return executeQuery(pool, sql, params);
    },
    
    getConnection: async () => {
        const client = await pool.connect();
        
        return {
            query: async (sql, params) => {
                return executeQuery(client, sql, params);
            },
            beginTransaction: async () => {
                await client.query('BEGIN');
            },
            commit: async () => {
                await client.query('COMMIT');
            },
            rollback: async () => {
                await client.query('ROLLBACK');
            },
            release: () => {
                client.release();
            }
        };
    },
    
    rawPool: pool
};

module.exports = db;
