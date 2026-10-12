// Sobe o servidor (porta 3100, reinicia ao editar) e o Vite (porta 5173) juntos.
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const env = { ...process.env, PORT: process.env.PORT || '3100', PUBLIC_URL: process.env.PUBLIC_URL || 'http://localhost:5173' };
const procs = [
  spawn(process.execPath, [...(fs.existsSync('.env') ? ['--env-file=.env'] : []), '--disable-warning=ExperimentalWarning', '--watch-path=server', '--watch-path=catalog.js', 'server/index.js'], { stdio: 'inherit', env }),
  spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', '--config', 'web/vite.config.ts'], { stdio: 'inherit', env: { ...env, API_PORT: env.PORT } }),
];
const stop = () => { procs.forEach((p) => p.kill()); process.exit(); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
procs.forEach((p) => p.on('exit', (code) => { if (code) stop(); }));
