import { Router } from 'express';
import { q } from '../config/db.js';
import { auth } from '../middlewares/auth.js';
import { h } from '../middlewares/async.js';

const r = Router();
r.get('/', auth, h(async (req, res) => res.json(await q(
  `SELECT id, user_id AS "userId", user_name AS "userName", action, detail, created_at AS "at"
   FROM history WHERE ($1 OR user_id = $2) ORDER BY created_at DESC, id DESC LIMIT 200`, [req.user.role === 'admin', req.user.id]))));
export default r;
