import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Backdrop from '../components/Backdrop.jsx';

export default function Login() {
  const { login } = useAuth(); const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' }); const [err, setErr] = useState('');
  const submit = async e => { e.preventDefault(); setErr(''); try { await login(f); nav('/'); } catch (x) { setErr(x.message); } };
  return (
    <div className="auth-page">
      <Backdrop />
      <form className="auth-card" onSubmit={submit}>
        <div className="brand"><span className="brand-mark">P</span><div><strong>ESUMER</strong><small>Parking</small></div></div>
        <h1>Inicia sesión</h1>
        <p className="muted">Consulta espacios y reserva tu parqueadero.</p>
        <label>Correo<input type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label>
        <label>Contraseña<input type="password" required value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></label>
        {err && <div className="alert">{err}</div>}
        <button className="btn primary">Entrar</button>
        <p className="muted">¿No tienes cuenta? <Link to="/registro">Crear cuenta</Link></p>
      </form>
    </div>
  );
}