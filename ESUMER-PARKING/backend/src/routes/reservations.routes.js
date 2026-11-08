import { Router } from 'express';
import { reservations, spaces, vehicles, expireReservations, nextId, log } from '../data/db.js';
import { RATE_PER_HOUR } from '../config/env.js';
import { auth } from '../middlewares/auth.js';

const r = Router();
r.use(auth);
const overlap = (spaceId, start, end, ignoreId) =>
  reservations.some(x => x.id !== ignoreId && x.spaceId === spaceId && x.status === 'active' && new Date(x.start) < end && start < new Date(x.end));

r.get('/', (req, res) => {
  expireReservations();
  const list = req.user.role === 'admin' ? reservations : reservations.filter(x => x.userId === req.user.id);
  res.json(list.map(x => ({ ...x, plate: vehicles.find(v => v.id === x.vehicleId)?.plate })).sort((a, b) => new Date(b.start) - new Date(a.start)));
});
r.post('/', (req, res) => {
  expireReservations();
  const { spaceId, vehicleId } = req.body;
  const start = new Date(req.body.start), end = new Date(req.body.end);
  const space = spaces.find(s => s.id === spaceId);
  const vehicle = vehicles.find(v => v.id === Number(vehicleId) && v.userId === req.user.id);
  if (!space) return res.status(404).json({ message: 'Espacio no encontrado.' });
  if (!vehicle) return res.status(400).json({ message: 'Selecciona uno de tus vehículos.' });
  if (space.status !== 'free') return res.status(409).json({ message: 'Este espacio no está disponible.' });
  if (isNaN(start) || isNaN(end) || end <= start) return res.status(400).json({ message: 'La hora de fin debe ser posterior a la de inicio.' });
  if (start < Date.now() - 5 * 60000) return res.status(400).json({ message: 'La hora de inicio ya pasó.' });
  if (overlap(spaceId, start, end)) return res.status(409).json({ message: 'Ese espacio ya está reservado en ese horario.' });
  const hours = Math.ceil((end - start) / 3600000);
  const rsv = { id: nextId(), userId: req.user.id, vehicleId: vehicle.id, spaceId, start: start.toISOString(), end: end.toISOString(), hours, total: hours * RATE_PER_HOUR, status: 'active', paymentRef: `SIM-${Date.now().toString(36).toUpperCase()}` };
  reservations.push(rsv); log(req.user, 'Reserva creada', `${spaceId} · ${hours} h · $${rsv.total}`);
  res.status(201).json(rsv);
});
r.post('/:id/extend', (req, res) => {
  const x = reservations.find(a => a.id == req.params.id && a.userId === req.user.id && a.status === 'active');
  const add = Number(req.body.hours);
  if (!x || !(add >= 1 && add <= 12)) return res.status(400).json({ message: 'No se puede extender esta reserva.' });
  const newEnd = new Date(new Date(x.end).getTime() + add * 3600000);
  if (overlap(x.spaceId, new Date(x.end), newEnd, x.id)) return res.status(409).json({ message: 'El espacio ya está reservado después de tu hora de fin.' });
  x.end = newEnd.toISOString(); x.hours += add; x.total += add * RATE_PER_HOUR;
  log(req.user, 'Reserva extendida', `${x.spaceId} +${add} h · $${add * RATE_PER_HOUR}`); res.json(x);
});
r.delete('/:id', (req, res) => {
  const x = reservations.find(a => a.id == req.params.id && (a.userId === req.user.id || req.user.role === 'admin') && a.status === 'active');
  if (!x) return res.status(404).json({ message: 'Reserva no encontrada.' });
  x.status = 'cancelled'; log(req.user, 'Reserva cancelada', x.spaceId); res.json(x);
});
export default r;
