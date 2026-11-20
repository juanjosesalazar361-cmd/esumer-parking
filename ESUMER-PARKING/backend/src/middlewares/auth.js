import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { q } from '../config/db.js';

export async function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    const { id } = jwt.verify(token, JWT_SECRET);
    const [user] = await q('SELECT id, name, email, password, role, type FROM users WHERE id = $1', [id]);
    if (!user) throw new Error();
    req.user = user; next();
  } catch { res.status(401).json({ message: 'Sesión inválida. Inicia sesión de nuevo.' }); }
}
export const adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Solo administradores.' });
