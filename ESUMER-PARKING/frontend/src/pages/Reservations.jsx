import { useEffect, useState } from 'react';
import { api, money, fmt } from '../services/api.js';

const ST = { active: 'Activa', finished: 'Finalizada', cancelled: 'Cancelada' };
export default function Reservations() {
  const [list, setList] = useState([]); const [err, setErr] = useState('');
  const load = () => api.reservations().then(setList); useEffect(() => { load(); }, []);
  const run = fn => async () => { setErr(''); try { await fn(); load(); } catch (x) { setErr(x.message); } };
  return (
    <>
      <div className="page-head"><h1>Mis reservas</h1></div>
      {err && <div className="alert">{err}</div>}
      {list.length === 0 && <div className="card"><p className="muted">No tienes reservas. Elige un espacio libre en el mapa.</p></div>}
      <div className="table-wrap">{list.length > 0 && (
        <table><thead><tr><th>Espacio</th><th>Placa</th><th>Inicio</th><th>Fin</th><th>Horas</th><th>Total</th><th>Estado</th><th /></tr></thead>
          <tbody>{list.map(r => (
            <tr key={r.id}><td><strong>{r.spaceId}</strong></td><td>{r.plate}</td><td>{fmt(r.start)}</td><td>{fmt(r.end)}</td><td>{r.hours}</td><td>{money(r.total)}</td>
              <td><span className={`badge st-${r.status}`}>{ST[r.status]}</span></td>
              <td className="actions">{r.status === 'active' && <>
                <button className="btn small" onClick={run(() => api.extend(r.id, 1))}>+1 h</button>
                <button className="btn small danger" onClick={run(() => api.cancel(r.id))}>Cancelar</button></>}</td></tr>))}
          </tbody></table>)}</div>
    </>
  );
}
