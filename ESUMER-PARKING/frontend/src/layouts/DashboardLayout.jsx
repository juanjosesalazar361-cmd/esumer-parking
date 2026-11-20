import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import Backdrop from '../components/Backdrop.jsx';

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="shell">
      <Backdrop />
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setOpen(o => !o)} aria-label="Abrir menú"><Menu size={20} /></button>
          <strong>ESUMER Parking</strong>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}