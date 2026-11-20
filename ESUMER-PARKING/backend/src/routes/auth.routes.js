import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { q } from '../config/db.js';
import { log } from '../data/db.js';
import { auth } from '../middlewares/auth.js';
import { h } from '../middlewares/async.js';

const r = Router();
const safe = ({ password, ...u }) => u;
const sign = u => jwt.sign({ id: u.id }, JWT_SECRET, { expiresIn: '8h' });

r.post('/register', h(async (req, res) => {
  const { name, email, password, type } = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Completa todos los campos. La contraseña debe tener mínimo 6 caracteres.' });
  if ((await q('SELECT 1 FROM users WHERE email = $1', [email.toLowerCase()])).length) return res.status(409).json({ message: 'Ese correo ya está registrado.' });
  const [user] = await q(`INSERT INTO users(name, email, password, role, type) VALUES ($1,$2,$3,'user',$4) RETURNING *`,
    [name, email.toLowerCase(), bcrypt.hashSync(password, 8), type || 'Estudiante']);
  await log(user, 'Registro', 'Nueva cuenta');
  res.status(201).json({ token: sign(user), user: safe(user) });
}));
r.post('/login', h(async (req, res) => {
  const [user] = await q('SELECT * FROM users WHERE email = $1', [(req.body.email || '').toLowerCase()]);
  if (!user || !bcrypt.compareSync(req.body.password || '', user.password)) return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
  await log(user, 'Inicio de sesión');
  res.json({ token: sign(user), user: safe(user) });
}));
r.get('/me', auth, (req, res) => res.json(safe(req.user)));
export default r;
