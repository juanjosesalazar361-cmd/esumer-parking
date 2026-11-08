import { Router } from 'express';
import { spaces, spacesView, log } from '../data/db.js';
import { auth, adminOnly } from '../middlewares/auth.js';

const r = Router();
r.use(auth);
r.get('/spaces', (req, res) => res.json(spacesView()));
r.get('/stats', (req, res) => {
  const all = spacesView();
  const count = list => ({ total: list.length, free: list.filter(s => s.status === 'free').length, reserved: list.filter(s => s.status === 'reserved').length, occupied: list.filter(s => s.status === 'occupied').length, maintenance: list.filter(s => s.status === 'maintenance').length });
  res.json({ ...count(all), zones: ['Entrada', 'Piso 1', 'Piso 2'].map(z => ({ zone: z, ...count(all.filter(s => s.zone === z)) })) });
});
// Admin: cambiar estado base (free | occupied | maintenance)
r.patch('/spaces/:id', adminOnly, (req, res) => {
  const s = spaces.find(x => x.id === req.params.id);
  if (!s || !['free', 'occupied', 'maintenance'].includes(req.body.status)) return res.status(400).json({ message: 'Datos inválidos.' });
  s.status = req.body.status; log(req.user, 'Espacio actualizado', `${s.id} → ${s.status}`); res.json(s);
});
export default r;
