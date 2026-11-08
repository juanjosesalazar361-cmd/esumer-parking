import { Router } from 'express';
import { vehicles, reservations, nextId, log } from '../data/db.js';
import { auth } from '../middlewares/auth.js';

const r = Router();
r.use(auth);
r.get('/', (req, res) => res.json(req.user.role === 'admin' ? vehicles : vehicles.filter(v => v.userId === req.user.id)));
r.post('/', (req, res) => {
  const { type, plate, brand, color } = req.body;
  const p = (plate || '').toUpperCase().replace(/\s|-/g, '');
  if (!['Automóvil', 'Motocicleta'].includes(type) || !/^[A-Z]{3}\d{2}[A-Z0-9]$/.test(p)) return res.status(400).json({ message: 'Placa inválida. Ejemplos: ABC123 (auto) o ABC12D (moto).' });
  if (!brand || !color) return res.status(400).json({ message: 'Indica marca y color.' });
  if (vehicles.some(v => v.plate === p)) return res.status(409).json({ message: 'Esa placa ya está registrada.' });
  const v = { id: nextId(), userId: req.user.id, type, plate: p, brand, color };
  vehicles.push(v); log(req.user, 'Vehículo registrado', p); res.status(201).json(v);
});
r.delete('/:id', (req, res) => {
  const i = vehicles.findIndex(v => v.id == req.params.id && (v.userId === req.user.id || req.user.role === 'admin'));
  if (i < 0) return res.status(404).json({ message: 'Vehículo no encontrado.' });
  if (reservations.some(x => x.vehicleId === vehicles[i].id && x.status === 'active')) return res.status(409).json({ message: 'El vehículo tiene una reserva activa.' });
  const [v] = vehicles.splice(i, 1); log(req.user, 'Vehículo eliminado', v.plate); res.json({ ok: true });
});
export default r;
