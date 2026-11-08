import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { users, nextId, log } from '../data/db.js';
import { auth } from '../middlewares/auth.js';

const r = Router();
const safe = ({ password, ...u }) => u;
const sign = u => jwt.sign({ id: u.id }, JWT_SECRET, { expiresIn: '8h' });

r.post('/register', (req, res) => {
  const { name, email, password, type } = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Completa todos los campos. La contraseña debe tener mínimo 6 caracteres.' });
  if (users.some(u => u.email === email.toLowerCase())) return res.status(409).json({ message: 'Ese correo ya está registrado.' });
  const user = { id: nextId(), name, email: email.toLowerCase(), password: bcrypt.hashSync(password, 8), role: 'user', type: type || 'Estudiante' };
  users.push(user); log(user, 'Registro', 'Nueva cuenta');
  res.status(201).json({ token: sign(user), user: safe(user) });
});
r.post('/login', (req, res) => {
  const user = users.find(u => u.email === (req.body.email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(req.body.password || '', user.password)) return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
  log(user, 'Inicio de sesión', '');
  res.json({ token: sign(user), user: safe(user) });
});
r.get('/me', auth, (req, res) => res.json(safe(req.user)));
export default r;
