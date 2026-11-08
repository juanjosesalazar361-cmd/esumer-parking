const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Error inesperado. Intenta de nuevo.');
  return data;
}

export const api = {
  login: b => request('/auth/login', { method: 'POST', body: b }),
  register: b => request('/auth/register', { method: 'POST', body: b }),
  me: () => request('/auth/me'),
  spaces: () => request('/parking/spaces'),
  stats: () => request('/parking/stats'),
  setSpaceStatus: (id, status) => request(`/parking/spaces/${id}`, { method: 'PATCH', body: { status } }),
  vehicles: () => request('/vehicles'),
  addVehicle: b => request('/vehicles', { method: 'POST', body: b }),
  deleteVehicle: id => request(`/vehicles/${id}`, { method: 'DELETE' }),
  reservations: () => request('/reservations'),
  reserve: b => request('/reservations', { method: 'POST', body: b }),
  extend: (id, hours) => request(`/reservations/${id}/extend`, { method: 'POST', body: { hours } }),
  cancel: id => request(`/reservations/${id}`, { method: 'DELETE' }),
  history: () => request('/history'),
  users: () => request('/users'),
};

export const RATE = 3000;
export const money = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
export const fmt = d => new Date(d).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
