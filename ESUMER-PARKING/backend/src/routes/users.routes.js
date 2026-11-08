import { Router } from 'express';
import { users, vehicles } from '../data/db.js';
import { auth, adminOnly } from '../middlewares/auth.js';

const r = Router();
r.get('/', auth, adminOnly, (req, res) =>
  res.json(users.map(({ password, ...u }) => ({ ...u, vehicles: vehicles.filter(v => v.userId === u.id).length }))));
export default r;
