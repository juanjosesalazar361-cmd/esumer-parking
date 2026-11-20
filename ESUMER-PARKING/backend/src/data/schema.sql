CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  type TEXT NOT NULL DEFAULT 'Estudiante'
);
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  plate TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  color TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  zone TEXT NOT NULL,
  pos_row INT NOT NULL,
  pos_col INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'free'  -- free | occupied | maintenance
);
CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id INT REFERENCES vehicles(id) ON DELETE SET NULL,
  space_id TEXT NOT NULL REFERENCES spaces(id),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  hours INT NOT NULL,
  total INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',  -- active | cancelled | finished
  payment_ref TEXT
);
CREATE INDEX IF NOT EXISTS idx_res_space ON reservations(space_id, status);
CREATE TABLE IF NOT EXISTS history (
  id SERIAL PRIMARY KEY,
  user_id INT,
  user_name TEXT,
  action TEXT NOT NULL,
  detail TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
