import { q } from '../config/db.js';

export const log = (user, action, detail = '') =>
  q('INSERT INTO history(user_id, user_name, action, detail) VALUES ($1,$2,$3,$4)', [user.id, user.name, action, detail]);

// Marca como finalizadas las reservas vencidas y deja constancia en el historial
export const expireReservations = () => q(`
  WITH u AS (UPDATE reservations SET status='finished' WHERE status='active' AND end_at <= now() RETURNING user_id, space_id)
  INSERT INTO history(user_id, user_name, action, detail)
  SELECT u.user_id, users.name, 'Reserva finalizada', u.space_id FROM u JOIN users ON users.id = u.user_id`);

// Un espacio con una reserva activa (que no ha terminado) se muestra como reservado desde que se hace la reserva.
// Si se cancela o vence, vuelve a libre solo.
// vehicle = vehículo de la reserva (solo lo ve su dueño o el admin); mine = reserva propia.
const car = (r, v) => `json_build_object('id', ${r}.id, 'start', ${r}.start_at, 'end', ${r}.end_at, 'plate', ${v}.plate, 'brand', ${v}.brand, 'color', ${v}.color, 'type', ${v}.type)`;

export async function spacesView(viewer) {
  await expireReservations();
  return q(`
    SELECT s.id, s.zone, s.pos_row AS "row", s.pos_col AS "col",
      CASE WHEN s.status = 'free' AND cur.id IS NOT NULL THEN 'reserved' ELSE s.status END AS status,
      cur.start_at AS "reservedFrom",
      cur.end_at AS "reservedUntil",
      '[]'::json AS upcoming,
      CASE WHEN cur.id IS NOT NULL AND ($2 OR cur.user_id = $1) THEN ${car('cur', 'cv')} END AS vehicle,
      CASE WHEN mine.id IS NOT NULL THEN ${car('mine', 'mv')} END AS mine
    FROM spaces s
    LEFT JOIN LATERAL (SELECT r.* FROM reservations r WHERE r.space_id = s.id AND r.status = 'active'
                       AND r.end_at > now() ORDER BY r.start_at LIMIT 1) cur ON true
    LEFT JOIN vehicles cv ON cv.id = cur.vehicle_id
    LEFT JOIN LATERAL (SELECT r.* FROM reservations r WHERE r.space_id = s.id AND r.status = 'active'
                       AND r.end_at > now() AND r.user_id = $1 ORDER BY r.start_at LIMIT 1) mine ON true
    LEFT JOIN vehicles mv ON mv.id = mine.vehicle_id
    ORDER BY s.pos_row, s.pos_col`, [viewer?.id ?? 0, viewer?.role === 'admin']);
}