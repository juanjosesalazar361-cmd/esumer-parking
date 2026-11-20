import { Router } from 'express';
import { q } from '../config/db.js';
import { spacesView, log } from '../data/db.js';
import { auth, adminOnly } from '../middlewares/auth.js';
import { h } from '../middlewares/async.js';

const r = Router();
r.use(auth);
r.get('/spaces', h(async (req, res) => res.json(await spacesView(req.user))));
r.get('/stats', h(async (req, res) => {
  const all = await spacesView(req.user);
  const count = list => ({ total: list.length, free: list.filter(s => s.status === 'free').length, reserved: list.filter(s => s.status === 'reserved').length, occupied: list.filter(s => s.status === 'occupied').length, maintenance: list.filter(s => s.status === 'maintenance').length });
  res.json({ ...count(all), zones: ['Entrada', 'Piso 1', 'Piso 2'].map(z => ({ zone: z, ...count(all.filter(s => s.zone === z)) })) });
}));
// Admin: cambiar estado base (free | occupied | maintenance)
r.patch('/spaces/:id', adminOnly, h(async (req, res) => {
  if (!['free', 'occupied', 'maintenance'].includes(req.body.status)) return res.status(400).json({ message: 'Datos inválidos.' });
  const [s] = await q('UPDATE spaces SET status = $1 WHERE id = $2 RETURNING id, status', [req.body.status, req.params.id]);
  if (!s) return res.status(404).json({ message: 'Espacio no encontrado.' });
  await log(req.user, 'Espacio actualizado', `${s.id} → ${s.status}`); res.json(s);
}));
export default r;
