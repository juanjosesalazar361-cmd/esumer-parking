import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { users } from '../data/db.js';

export function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    const { id } = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === id);
    if (!user) throw new Error();
    req.user = user; next();
  } catch { res.status(401).json({ message: 'Sesión inválida. Inicia sesión de nuevo.' }); }
}
export const adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Solo administradores.' });
