import { NavLink } from 'react-router-dom';
import { LayoutDashboard, SquareParking, Car, CalendarClock, History, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/parqueadero', label: 'Mapa de espacios', icon: SquareParking },
  { to: '/vehiculos', label: 'Mis vehículos', icon: Car },
  { to: '/reservas', label: 'Mis reservas', icon: CalendarClock },
  { to: '/historial', label: 'Historial', icon: History },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand"><span className="brand-mark">P</span><div><strong>ESUMER</strong><small>Parking</small></div></div>
      <nav onClick={onClose}>
        {[...links, ...(user.role === 'admin' ? [{ to: '/admin', label: 'Administración', icon: ShieldCheck }] : [])].map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18} />{label}</NavLink>
        ))}
      </nav>
      <div className="user-box">
        <div className="avatar">{user.name[0]}</div>
        <div className="user-info"><strong>{user.name}</strong><small>{user.type}{user.role === 'admin' ? ' · Admin' : ''}</small></div>
        <button className="icon-btn" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión"><LogOut size={18} /></button>
      </div>
    </aside>
  );
}
