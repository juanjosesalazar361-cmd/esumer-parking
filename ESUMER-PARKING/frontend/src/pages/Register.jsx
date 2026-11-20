import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Backdrop from '../components/Backdrop.jsx';

export default function Register() {
  const { register } = useAuth(); const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', type: 'Estudiante' }); const [err, setErr] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => { e.preventDefault(); setErr(''); try { await register(f); nav('/vehiculos'); } catch (x) { setErr(x.message); } };
  return (
    <div className="auth-page">
       <Backdrop />
      <form className="auth-card" onSubmit={submit}>
        <div className="brand"><span className="brand-mark">P</span><div><strong>ESUMER</strong><small>Parking</small></div></div>
        <h1>Crea tu cuenta</h1>
        <label>Nombre completo<input required value={f.name} onChange={set('name')} /></label>
        <label>Correo<input type="email" required value={f.email} onChange={set('email')} /></label>
        <label>Rol en la universidad
          <select value={f.type} onChange={set('type')}><option>Estudiante</option><option>Profesor</option><option>Administrativo</option></select>
        </label>
        <label>Contraseña (mínimo 6 caracteres)<input type="password" required minLength={6} value={f.password} onChange={set('password')} /></label>
        {err && <div className="alert">{err}</div>}
        <button className="btn primary">Crear cuenta</button>
        <p className="muted">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </form>
    </div>
  );
}
