import { Router } from 'express';
import { q } from '../config/db.js';
import { log } from '../data/db.js';
import { auth } from '../middlewares/auth.js';
import { h } from '../middlewares/async.js';

const r = Router();
r.use(auth);
const COLS = 'id, user_id AS "userId", type, plate, brand, color';

r.get('/', h(async (req, res) => res.json(await q(
  `SELECT ${COLS} FROM vehicles WHERE ($1 OR user_id = $2) ORDER BY id`, [req.user.role === 'admin', req.user.id]))));
r.post('/', h(async (req, res) => {
  const { type, plate, brand, color } = req.body;
  const p = (plate || '').toUpperCase().replace(/\s|-/g, '');
  if (!['Automóvil', 'Motocicleta'].includes(type) || !/^[A-Z]{3}\d{2}[A-Z0-9]$/.test(p)) return res.status(400).json({ message: 'Placa inválida. Ejemplos: ABC123 (auto) o ABC12D (moto).' });
  if (!brand || !color) return res.status(400).json({ message: 'Indica marca y color.' });
  if ((await q('SELECT 1 FROM vehicles WHERE plate = $1', [p])).length) return res.status(409).json({ message: 'Esa placa ya está registrada.' });
  const [v] = await q(`INSERT INTO vehicles(user_id, type, plate, brand, color) VALUES ($1,$2,$3,$4,$5) RETURNING ${COLS}`, [req.user.id, type, p, brand, color]);
  await log(req.user, 'Vehículo registrado', p); res.status(201).json(v);
}));
r.delete('/:id', h(async (req, res) => {
  const [v] = await q('SELECT id, plate FROM vehicles WHERE id = $1 AND ($2 OR user_id = $3)', [Number(req.params.id) || 0, req.user.role === 'admin', req.user.id]);
  if (!v) return res.status(404).json({ message: 'Vehículo no encontrado.' });
  if ((await q(`SELECT 1 FROM reservations WHERE vehicle_id = $1 AND status = 'active'`, [v.id])).length) return res.status(409).json({ message: 'El vehículo tiene una reserva activa.' });
  await q('DELETE FROM vehicles WHERE id = $1', [v.id]); await log(req.user, 'Vehículo eliminado', v.plate); res.json({ ok: true });
}));
export default r;
