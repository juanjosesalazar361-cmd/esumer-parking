import { useEffect, useState } from 'react';
import { api, money, fmt } from '../services/api.js';

export default function Admin() {
  const [users, setUsers] = useState([]); const [spaces, setSpaces] = useState([]); const [res, setRes] = useState([]);
  const load = () => { api.users().then(setUsers); api.spaces().then(setSpaces); api.reservations().then(setRes); };
  useEffect(load, []);
  const set = async (id, status) => { await api.setSpaceStatus(id, status); load(); };
  const income = res.filter(r => r.status !== 'cancelled').reduce((a, r) => a + r.total, 0);
  return (
    <>
      <div className="page-head"><h1>Administración</h1></div>
      <div className="stats">
        <div className="stat"><span>Usuarios</span><b>{users.length}</b></div>
        <div className="stat"><span>Reservas</span><b>{res.length}</b></div>
        <div className="stat"><span>Ingresos simulados</span><b>{money(income)}</b></div>
      </div>
      <h2>Usuarios</h2>
      <div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Vehículos</th></tr></thead>
        <tbody>{users.map(u => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.type}{u.role === 'admin' ? ' · Admin' : ''}</td><td>{u.vehicles}</td></tr>)}</tbody></table></div>
      <h2>Reservas recientes</h2>
      <div className="table-wrap"><table><thead><tr><th>Espacio</th><th>Placa</th><th>Inicio</th><th>Total</th><th>Estado</th></tr></thead>
        <tbody>{res.slice(0, 10).map(r => <tr key={r.id}><td>{r.spaceId}</td><td>{r.plate}</td><td>{fmt(r.start)}</td><td>{money(r.total)}</td><td>{r.status}</td></tr>)}</tbody></table></div>
      <h2>Control de espacios</h2>
      <div className="admin-spaces">{spaces.map(s => (
        <div key={s.id} className="card mini"><strong>{s.id}</strong>
          <select value={s.status === 'reserved' ? 'free' : s.status} onChange={e => set(s.id, e.target.value)}>
            <option value="free">Libre</option><option value="occupied">Ocupado</option><option value="maintenance">Mantenimiento</option></select></div>))}</div>
    </>
  );
}
