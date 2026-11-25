import pg from 'pg';
import { DATABASE_URL } from './env.js';

const ssl = /sslmode=require|neon\.tech|supabase\.co/.test(DATABASE_URL) ? { rejectUnauthorized: false } : false;
// En Vercel cada petición puede abrir su propio proceso, así que se limitan las conexiones
export const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl, max: process.env.VERCEL ? 2 : 10 });
export const q = (text, params) => pool.query(text, params).then(r => r.rows);