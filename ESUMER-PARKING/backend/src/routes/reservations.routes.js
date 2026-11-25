import { Router } from 'express';
import { pool, q } from '../config/db.js';
import { expireReservations, log } from '../data/db.js';
import { RATE_PER_HOUR } from '../config/env.js';
import { auth } from '../middlewares/auth.js';
import { h } from '../middlewares/async.js';

const r = Router();
r.use(auth);
const COLS = `id, user_id AS "userId", vehicle_id AS "vehicleId", space_id AS "spaceId", start_at AS "start", end_at AS "end", hours, total, status, payment_ref AS "paymentRef"`;

// ¿Hay otra reserva activa que se cruce con [start, end) en este espacio? (se usa al extender)
const overlap = async (c, spaceId, start, end, ignoreId = 0) =>
  (await c.query(`SELECT 1 FROM reservations WHERE id <> $4 AND space_id = $1 AND status = 'active'
                  AND start_at < $3::timestamptz AND $2::timestamptz < end_at LIMIT 1`, [spaceId, start, end, ignoreId])).rowCount > 0;

// Transacción con bloqueo por espacio: evita que dos personas reserven a la vez el mismo espacio
async function withSpaceLock(spaceId, fn) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [spaceId]);
    const out = await fn(c);
    await c.query(out?.error ? 'ROLLBACK' : 'COMMIT');
    return out;
  } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; } finally { c.release(); }
}

r.get('/', h(async (req, res) => {
  await expireReservations();
  res.json(await q(`SELECT r.id, r.user_id AS "userId", r.vehicle_id AS "vehicleId", r.space_id AS "spaceId", r.start_at AS "start", r.end_at AS "end",
      r.hours, r.total, r.status, r.payment_ref AS "paymentRef", v.plate
    FROM reservations r LEFT JOIN vehicles v ON v.id = r.vehicle_id
    WHERE ($1 OR r.user_id = $2) ORDER BY r.start_at DESC`, [req.user.role === 'admin', req.user.id]));
}));

r.post('/', h(async (req, res) => {
  await expireReservations();
  const { spaceId, vehicleId } = req.body;
  const start = new Date(req.body.start), end = new Date(req.body.end);
  const [space] = await q('SELECT status FROM spaces WHERE id = $1', [spaceId]);
  const [vehicle] = await q('SELECT id FROM vehicles WHERE id = $1 AND user_id = $2', [Number(vehicleId) || 0, req.user.id]);
  if (!space) return res.status(404).json({ message: 'Espacio no encontrado.' });
  if (!vehicle) return res.status(400).json({ message: 'Selecciona uno de tus vehículos.' });
  if (space.status !== 'free') return res.status(409).json({ message: 'Este espacio no está disponible.' });
  if (isNaN(start) || isNaN(end) || end <= start) return res.status(400).json({ message: 'La hora de fin debe ser posterior a la de inicio.' });
  if (start < Date.now() - 5 * 60000) return res.status(400).json({ message: 'La hora de inicio ya pasó.' });
  const hours = Math.ceil((end - start) / 3600000);
  const ref = `SIM-${Date.now().toString(36).toUpperCase()}`;
  const out = await withSpaceLock(spaceId, async c => {
    // Un espacio solo puede tener una reserva activa a la vez
    const taken = await c.query(`SELECT 1 FROM reservations WHERE space_id = $1 AND status = 'active' AND end_at > now() LIMIT 1`, [spaceId]);
    if (taken.rowCount > 0) return { error: 'Este espacio ya está reservado.' };
    const { rows } = await c.query(`INSERT INTO reservations(user_id, vehicle_id, space_id, start_at, end_at, hours, total, payment_ref)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${COLS}`, [req.user.id, vehicle.id, spaceId, start, end, hours, hours * RATE_PER_HOUR, ref]);
    return { rsv: rows[0] };
  });
  if (out.error) return res.status(409).json({ message: out.error });
  await log(req.user, 'Reserva creada', `${spaceId} · ${hours} h · $${out.rsv.total}`);
  res.status(201).json(out.rsv);
}));

r.post('/:id/extend', h(async (req, res) => {
  const add = Number(req.body.hours);
  const [x] = await q(`SELECT ${COLS} FROM reservations WHERE id = $1 AND user_id = $2 AND status = 'active'`, [Number(req.params.id) || 0, req.user.id]);
  if (!x || !(add >= 1 && add <= 12)) return res.status(400).json({ message: 'No se puede extender esta reserva.' });
  const newEnd = new Date(new Date(x.end).getTime() + add * 3600000);
  const out = await withSpaceLock(x.spaceId, async c => {
    if (await overlap(c, x.spaceId, x.end, newEnd, x.id)) return { error: 'El espacio ya está reservado después de tu hora de fin.' };
    const { rows } = await c.query(`UPDATE reservations SET end_at = $1, hours = hours + $2, total = total + $3 WHERE id = $4 RETURNING ${COLS}`,
      [newEnd, add, add * RATE_PER_HOUR, x.id]);
    return { rsv: rows[0] };
  });
  if (out.error) return res.status(409).json({ message: out.error });
  await log(req.user, 'Reserva extendida', `${x.spaceId} +${add} h · $${add * RATE_PER_HOUR}`); res.json(out.rsv);
}));

r.delete('/:id', h(async (req, res) => {
  const [x] = await q(`UPDATE reservations SET status = 'cancelled' WHERE id = $1 AND ($2 OR user_id = $3) AND status = 'active' RETURNING ${COLS}`,
    [Number(req.params.id) || 0, req.user.role === 'admin', req.user.id]);
  if (!x) return res.status(404).json({ message: 'Reserva no encontrada.' });
  await log(req.user, 'Reserva cancelada', x.spaceId); res.json(x);
}));
export default r;