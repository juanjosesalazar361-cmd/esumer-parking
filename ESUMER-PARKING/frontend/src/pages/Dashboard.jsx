import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money, RATE } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ParkingCard from '../components/ParkingCard.jsx';

export default function Dashboard() {
  const { user } = useAuth(); const [s, setS] = useState(null);
  useEffect(() => { api.stats().then(setS); }, []);
  if (!s) return <p className="muted">Cargando…</p>;
  return (
    <>
      <div className="page-head"><h1>Hola, {user.name.split(' ')[0]}</h1><Link className="btn primary" to="/parqueadero">Ver mapa y reservar</Link></div>
      <div className="stats">
        <div className="stat"><span>Libres</span><b className="c-free">{s.free}</b></div>
        <div className="stat"><span>Reservados</span><b className="c-reserved">{s.reserved}</b></div>
        <div className="stat"><span>Ocupados</span><b className="c-occupied">{s.occupied}</b></div>
        <div className="stat"><span>Tarifa de reserva</span><b>{money(RATE)}<small>/hora</small></b></div>
      </div>
      <h2>Disponibilidad por zona</h2>
      <div className="grid-3">{s.zones.map(z => <ParkingCard key={z.zone} {...z} />)}</div>
    </>
  );
}
