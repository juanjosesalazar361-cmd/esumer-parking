// Datos en memoria. En la etapa 2 se reemplaza por PostgreSQL manteniendo los mismos nombres de entidades.
import bcrypt from 'bcryptjs';

const make = (zone, prefix, n, cols = 10) =>
  Array.from({ length: n }, (_, i) => ({
    id: `${prefix}-${String(i + 1).padStart(2, '0')}`,
    zone, row: Math.floor(i / cols), col: i % cols, status: 'free', // free | occupied | maintenance
  }));

export const spaces = [...make('Entrada', 'E', 20), ...make('Piso 1', 'P1', 30), ...make('Piso 2', 'P2', 30)];
spaces.forEach((s, i) => { if (i % 4 === 1) s.status = 'occupied'; });
spaces[7].status = 'maintenance';

export const users = [
  { id: 1, name: 'Administrador ESUMER', email: 'admin@esumer.edu.co', password: bcrypt.hashSync('admin123', 8), role: 'admin', type: 'Administrativo' },
];
export const vehicles = [];
export const reservations = []; // {id,userId,vehicleId,spaceId,start,end,hours,total,status:active|cancelled|finished,paymentRef}
export const history = [];

let seq = 100;
export const nextId = () => ++seq;
export const log = (user, action, detail) =>
  history.unshift({ id: nextId(), userId: user.id, userName: user.name, action, detail, at: new Date().toISOString() });

// Marca como finalizadas las reservas vencidas
export function expireReservations() {
  const now = Date.now();
  reservations.filter(r => r.status === 'active' && new Date(r.end) <= now).forEach(r => {
    r.status = 'finished';
    log({ id: r.userId, name: users.find(u => u.id === r.userId)?.name || '-' }, 'Reserva finalizada', r.spaceId);
  });
}

// Estado de cada espacio, calculado desde las reservas: si se cancelan o vencen, el espacio se libera solo.
export function spacesView(viewer) {
  expireReservations();
  const now = Date.now();
  const info = r => {
    const v = vehicles.find(x => x.id === r.vehicleId);
    return { id: r.id, start: r.start, end: r.end, plate: v?.plate, brand: v?.brand, color: v?.color, type: v?.type };
  };
  return spaces.map(s => {
    const act = reservations.filter(r => r.spaceId === s.id && r.status === 'active' && new Date(r.end) > now);
    const cur = act.find(r => new Date(r.start) <= now);
    const upcoming = act.filter(r => new Date(r.start) > now).map(r => ({ start: r.start, end: r.end }));
    const mine = act.find(r => r.userId === viewer?.id);
    const canSee = cur && (viewer?.role === 'admin' || cur.userId === viewer?.id);
    return {
      ...s,
      status: cur && s.status === 'free' ? 'reserved' : s.status,
      reservedUntil: cur?.end || null,
      upcoming,
      vehicle: canSee ? info(cur) : null, // la placa solo la ve el dueño o el admin
      mine: mine ? info(mine) : null,
    };
  });
}