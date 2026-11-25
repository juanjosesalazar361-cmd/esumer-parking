import { useEffect, useState } from 'react';
import { api, money, fmt } from '../services/api.js';

const LABEL = { free: 'Libre', reserved: 'Ocupado (reservado)', occupied: 'Ocupado', maintenance: 'Mantenimiento' };
const COLOR = { free: '#2fbf9b', reserved: '#7c8cff', occupied: '#e5584f', maintenance: '#8b95a5' };
const ZONES = ['Todos', 'Entrada', 'Piso 1', 'Piso 2'];

export default function Admin() {
  const [users, setUsers] = useState([]); const [spaces, setSpaces] = useState([]); const [res, setRes] = useState([]);
  const [zone, setZone] = useState('Todos');

  const load = () => { api.users().then(setUsers); api.spaces().then(setSpaces); api.reservations().then(setRes); };
  // Se actualiza solo cada 10 segundos: reservas nuevas, canceladas o vencidas
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

  const set = async (id, status) => { await api.setSpaceStatus(id, status); load(); };
  const income = res.filter(r => r.status !== 'cancelled').reduce((a, r) => a + r.total, 0);
  const busy = spaces.filter(s => s.status === 'reserved' || s.status === 'occupied').length;
  const shown = spaces.filter(s => zone === 'Todos' || s.zone === zone);

  return (
    <>
      <div className="page-head"><h1>Administración</h1></div>
      <div className="stats">
        <div className="stat"><span>Usuarios</span><b>{users.length}</b></div>
        <div className="stat"><span>Reservas</span><b>{res.length}</b></div>
        <div className="stat"><span>Espacios ocupados ahora</span><b className="c-occupied">{busy}<small> / {spaces.length}</small></b></div>
        <div className="stat"><span>Ingresos simulados</span><b>{money(income)}</b></div>
      </div>

      <h2>Control de espacios</h2>
      <div className="tabs">{ZONES.map(z => <button key={z} className={`tab ${z === zone ? 'active' : ''}`} onClick={() => setZone(z)}>{z}</button>)}</div>
      <div className="admin-spaces" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
        {shown.map(s => (
          <div key={s.id} className="card mini" style={{ borderLeft: `4px solid ${COLOR[s.status]}` }}>
            <div className="row between"><strong>{s.id}</strong><span className={`badge s-${s.status}`}>{LABEL[s.status]}</span></div>
            {s.status === 'reserved' ? (
              <>
                {s.vehicle && <small><strong>{s.vehicle.plate}</strong> · {s.vehicle.brand} · {s.vehicle.color}</small>}
                {s.reservedUntil && <small>Hasta {fmt(s.reservedUntil)}</small>}
                <small className="muted">Se libera sola al terminar la reserva</small>
              </>
            ) : (
              <select value={s.status} onChange={e => set(s.id, e.target.value)}>
                <option value="free">Libre</option><option value="occupied">Ocupado</option><option value="maintenance">Mantenimiento</option>
              </select>
            )}
          </div>
        ))}
      </div>

      <h2>Reservas recientes</h2>
      <div className="table-wrap"><table><thead><tr><th>Espacio</th><th>Placa</th><th>Inicio</th><th>Fin</th><th>Total</th><th>Estado</th></tr></thead>
        <tbody>{res.slice(0, 10).map(r => <tr key={r.id}><td>{r.spaceId}</td><td>{r.plate}</td><td>{fmt(r.start)}</td><td>{fmt(r.end)}</td><td>{money(r.total)}</td><td>{r.status}</td></tr>)}</tbody></table></div>

      <h2>Usuarios</h2>
      <div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Vehículos</th></tr></thead>
        <tbody>{users.map(u => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.type}{u.role === 'admin' ? ' · Admin' : ''}</td><td>{u.vehicles}</td></tr>)}</tbody></table></div>
    </>
  );
}