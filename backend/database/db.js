import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';

// Ensure .env.local and .env are loaded in priority order
const envFiles = [
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, '../../.env')
];
for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
}

const { Pool } = pg;

// Parse int8 (BIGINT, such as COUNT(*) result) as number
pg.types.setTypeParser(20, (val) => parseInt(val, 10));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.xbzihnxwhjmidutjvfak:MgVa0cnIFW2u22X6@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Helper to convert SQLite ? placeholders to PostgreSQL $1, $2, ...
export function toPgSql(sql) {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

const db = {
  pool,

  toPgSql,

  async query(sql, params = []) {
    const pgSql = toPgSql(sql);
    return await pool.query(pgSql, params);
  },

  async one(sql, params = []) {
    const pgSql = toPgSql(sql);
    const res = await pool.query(pgSql, params);
    return res.rows[0] || undefined;
  },

  async all(sql, params = []) {
    const pgSql = toPgSql(sql);
    const res = await pool.query(pgSql, params);
    return res.rows;
  },

  async run(sql, params = []) {
    const pgSql = toPgSql(sql);
    const res = await pool.query(pgSql, params);
    return { changes: res.rowCount, rowCount: res.rowCount };
  },

  async exec(sql) {
    return await pool.query(sql);
  },

  prepare(sql) {
    return {
      async get(...params) {
        const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const pgSql = toPgSql(sql);
        const res = await pool.query(pgSql, flat);
        return res.rows[0] || undefined;
      },
      async all(...params) {
        const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const pgSql = toPgSql(sql);
        const res = await pool.query(pgSql, flat);
        return res.rows;
      },
      async run(...params) {
        const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const pgSql = toPgSql(sql);
        const res = await pool.query(pgSql, flat);
        return { changes: res.rowCount, rowCount: res.rowCount };
      }
    };
  },

  async transaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

export default db;
