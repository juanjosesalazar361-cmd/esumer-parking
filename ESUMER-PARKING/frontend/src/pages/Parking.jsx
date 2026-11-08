import { useEffect, useMemo, useState } from 'react';
import { api, money, RATE, fmt } from '../services/api.js';
import ParkingMap from '../components/ParkingMap.jsx';

const ZONES = ['Entrada', 'Piso 1', 'Piso 2'];
const LABEL = { free: 'Libre', reserved: 'Reservado', occupied: 'Ocupado', maintenance: 'En mantenimiento' };
const toLocal = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function Parking() {
  const [spaces, setSpaces] = useState([]); const [zone, setZone] = useState('Entrada'); const [sel, setSel] = useState(null);
  const [vehicles, setVehicles] = useState([]); const [msg, setMsg] = useState(null);
  const [form, setForm] = useState(() => { const s = new Date(Date.now() + 15 * 60000); s.setSeconds(0); return { vehicleId: '', start: toLocal(s), end: toLocal(new Date(s.getTime() + 3600000)) }; });

  const load = () => api.spaces().then(setSpaces);
  useEffect(() => { load(); api.vehicles().then(v => { setVehicles(v); if (v[0]) setForm(f => ({ ...f, vehicleId: v[0].id })); }); }, []);

  const inZone = useMemo(() => spaces.filter(s => s.zone === zone), [spaces, zone]);
  const current = sel && spaces.find(s => s.id === sel.id);
  const hours = Math.max(0, Math.ceil((new Date(form.end) - new Date(form.start)) / 3600000)) || 0;

  const reserve = async e => {
    e.preventDefault(); setMsg(null);
    try {
      const r = await api.reserve({ spaceId: current.id, ...form, start: new Date(form.start).toISOString(), end: new Date(form.end).toISOString() });
      setMsg({ ok: true, text: `Reserva confirmada. Pago simulado ${r.paymentRef} por ${money(r.total)}.` }); load();
    } catch (x) { setMsg({ ok: false, text: x.message }); }
  };

  return (
    <>
      <div className="page-head"><h1>Mapa de espacios</h1></div>
      <div className="tabs">{ZONES.map(z => <button key={z} className={`tab ${z === zone ? 'active' : ''}`} onClick={() => { setZone(z); setSel(null); setMsg(null); }}>{z}</button>)}</div>
      <div className="legend">{Object.entries(LABEL).map(([k, v]) => <span key={k}><i className={`dot s-${k}`} />{v}</span>)}</div>
      <div className="parking-layout">
        {inZone.length > 0 && <ParkingMap zone={zone} spaces={inZone} selected={current?.zone === zone ? current : null} onSelect={s => { setSel(s); setMsg(null); }} />}
        <aside className="card detail">
          {!current ? <p className="muted">Toca una casilla del mapa para ver sus detalles y reservarla.</p> : (
            <>
              <h2>{current.id}</h2>
              <p><span className={`badge s-${current.status}`}>{LABEL[current.status]}</span> · {current.zone}</p>
              {current.reservedUntil && <p className="muted">Reservado hasta {fmt(current.reservedUntil)}</p>}
              {current.upcoming?.length > 0 && <p className="muted">Próximas reservas: {current.upcoming.map(u => fmt(u.start)).join(', ')}</p>}
              {current.status === 'free' && (vehicles.length === 0 ? <div className="alert">Registra un vehículo en “Mis vehículos” para poder reservar.</div> : (
                <form onSubmit={reserve}>
                  <label>Vehículo<select value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })}>{vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} · {v.brand}</option>)}</select></label>
                  <label>Inicio<input type="datetime-local" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} /></label>
                  <label>Fin<input type="datetime-local" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} /></label>
                  <div className="summary"><span>{hours} h × {money(RATE)}</span><b>{money(hours * RATE)}</b></div>
                  <button className="btn primary" disabled={!hours}>Pagar y reservar (simulado)</button>
                </form>
              ))}
              {msg && <div className={msg.ok ? 'ok' : 'alert'}>{msg.text}</div>}
            </>
          )}
        </aside>
      </div>
    </>
  );
}
