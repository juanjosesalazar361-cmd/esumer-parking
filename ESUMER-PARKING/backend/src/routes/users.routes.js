import { Router } from 'express';
import { q } from '../config/db.js';
import { auth, adminOnly } from '../middlewares/auth.js';
import { h } from '../middlewares/async.js';

const r = Router();
r.get('/', auth, adminOnly, h(async (req, res) => res.json(await q(
  `SELECT u.id, u.name, u.email, u.role, u.type, (SELECT COUNT(*)::int FROM vehicles v WHERE v.user_id = u.id) AS vehicles FROM users u ORDER BY u.id`))));
export default r;
