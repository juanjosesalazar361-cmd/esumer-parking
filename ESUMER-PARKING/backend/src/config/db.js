import pg from 'pg';
import { DATABASE_URL } from './env.js';

const ssl = /sslmode=require|neon\.tech|supabase\.co/.test(DATABASE_URL) ? { rejectUnauthorized: false } : false;
export const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl });
export const q = (text, params) => pool.query(text, params).then(r => r.rows);
