import { useEffect, useState } from 'react';
import { Trash2, Bike, Car } from 'lucide-react';
import { api, fmt } from '../services/api.js';

export default function Vehicles() {
  const [list, setList] = useState([]); const [res, setRes] = useState([]); const [err, setErr] = useState('');
  const [f, setF] = useState({ type: 'Automóvil', plate: '', brand: '', color: '' });
  const load = () => { api.vehicles().then(setList); api.reservations().then(setRes); };
  useEffect(() => { load(); }, []);
  const active = id => res.find(r => r.vehicleId === id && r.status === 'active');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const add = async e => { e.preventDefault(); setErr(''); try { await api.addVehicle(f); setF({ ...f, plate: '', brand: '', color: '' }); load(); } catch (x) { setErr(x.message); } };
  const del = async id => { try { await api.deleteVehicle(id); load(); } catch (x) { setErr(x.message); } };
  return (
    <>
      <div className="page-head"><h1>Mis vehículos</h1></div>
      <div className="two-col">
        <form className="card" onSubmit={add}>
          <h3>Registrar vehículo</h3>
          <label>Tipo<select value={f.type} onChange={set('type')}><option>Automóvil</option><option>Motocicleta</option></select></label>
          <label>Placa<input required maxLength={7} placeholder="ABC123" value={f.plate} onChange={set('plate')} /></label>
          <label>Marca<input required value={f.brand} onChange={set('brand')} /></label>
          <label>Color<input required placeholder="Rojo, azul, negro…" value={f.color} onChange={set('color')} /></label>
          {err && <div className="alert">{err}</div>}
          <button className="btn primary">Guardar vehículo</button>
        </form>
        <div className="card">
          <h3>Registrados</h3>
          {list.length === 0 && <p className="muted">Aún no tienes vehículos. Registra el primero para poder reservar.</p>}
          {list.map(v => (
            <div className="list-item" key={v.id}>
              {v.type === 'Motocicleta' ? <Bike size={20} /> : <Car size={20} />}
              <div>
                <strong className="plate">{v.plate}</strong>
                <small>{v.brand} · {v.color}</small>
                {active(v.id) && <small className="c-reserved">Reservado en {active(v.id).spaceId} hasta {fmt(active(v.id).end)}</small>}
              </div>
              <button className="icon-btn" onClick={() => del(v.id)} aria-label="Eliminar vehículo"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}