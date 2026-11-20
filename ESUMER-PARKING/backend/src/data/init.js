import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

// Crea las tablas y los datos iniciales (espacios y administrador) si todavía no existen.
export async function initDb() {
  await pool.query(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));

  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM spaces');
  if (!rows[0].n) {
    const zones = [['Entrada', 'E', 20], ['Piso 1', 'P1', 30], ['Piso 2', 'P2', 30]];
    let i = 0;
    for (const [zone, prefix, n] of zones) {
      for (let k = 0; k < n; k++, i++) {
        const status = i === 7 ? 'maintenance' : i % 4 === 1 ? 'occupied' : 'free';
        await pool.query('INSERT INTO spaces(id, zone, pos_row, pos_col, status) VALUES ($1,$2,$3,$4,$5)',
          [`${prefix}-${String(k + 1).padStart(2, '0')}`, zone, Math.floor(k / 10), k % 10, status]);
      }
    }
  }
  await pool.query(
    `INSERT INTO users(name, email, password, role, type) VALUES ($1,$2,$3,'admin','Administrativo') ON CONFLICT (email) DO NOTHING`,
    ['Administrador ESUMER', 'admin@esumer.edu.co', bcrypt.hashSync('admin123', 8)]);
}
