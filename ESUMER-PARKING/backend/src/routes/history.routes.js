import { Router } from 'express';
import { history } from '../data/db.js';
import { auth } from '../middlewares/auth.js';

const r = Router();
r.get('/', auth, (req, res) => res.json(req.user.role === 'admin' ? history : history.filter(h => h.userId === req.user.id)));
export default r;
