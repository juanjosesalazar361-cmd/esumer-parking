// Instala lo que falte, enciende backend + frontend y abre el navegador.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const parts = [
  { name: 'API', dir: 'backend', color: '\x1b[36m' },
  { name: 'WEB', dir: 'frontend', color: '\x1b[33m' },
];

for (const p of parts) {
  if (!existsSync(`${p.dir}/node_modules`)) {
    console.log(`Instalando dependencias de ${p.dir} (solo la primera vez)...`);
    const r = spawnSync('npm', ['install'], { cwd: p.dir, stdio: 'inherit', shell: true });
    if (r.status !== 0) { console.error(`Falló npm install en ${p.dir}`); process.exit(1); }
  }
}

const children = parts.map(p => {
  const c = spawn('npm', ['run', 'dev'], { cwd: p.dir, shell: true });
  const out = d => d.toString().split('\n').filter(Boolean).forEach(l => console.log(`${p.color}[${p.name}]\x1b[0m ${l}`));
  c.stdout.on('data', out); c.stderr.on('data', out);
  return c;
});

const url = 'http://localhost:5173';
setTimeout(() => {
  const cmd = process.platform === 'win32' ? `start ${url}` : process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
  spawn(cmd, { shell: true, stdio: 'ignore' });
  console.log(`\nESUMER PARKING listo en ${url}  (Ctrl + C para apagar todo)\n`);
}, 5000);

const stop = () => { children.forEach(c => spawn('taskkill', ['/pid', c.pid, '/T', '/F'], { shell: true, stdio: 'ignore' }) && c.kill()); process.exit(); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
