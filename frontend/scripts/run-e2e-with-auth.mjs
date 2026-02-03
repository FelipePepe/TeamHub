#!/usr/bin/env node
/**
 * Obtiene tokens vía login API (con MFA si aplica) y ejecuta Playwright con E2E_ACCESS_TOKEN y E2E_REFRESH_TOKEN.
 * Uso: desde frontend/ ejecutar node scripts/run-e2e-with-auth.mjs [-- playwright args...]
 * Requiere: backend en marcha, .env.e2e con E2E_USER, E2E_PASSWORD (y E2E_MFA_SECRET si MFA).
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');

const { loginViaApi } = await import(path.join(frontendRoot, 'e2e/helpers/auth-api.mjs'));
const email = process.env.E2E_USER || 'admin@example.com';
const password = process.env.E2E_PASSWORD || 'ValidPassword1!';

let tokens;
try {
  tokens = await loginViaApi(email, password);
} catch (e) {
  console.error('Login E2E falló:', e.message);
  process.exit(1);
}

const rest = process.argv.slice(2).filter((a) => a !== '--');
const args = rest.length ? rest : ['--workers=1'];
const env = {
  ...process.env,
  E2E_ACCESS_TOKEN: tokens.accessToken,
  E2E_REFRESH_TOKEN: tokens.refreshToken,
};
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(npxCommand, ['playwright', 'test', ...args], {
  cwd: frontendRoot,
  env,
  stdio: 'inherit',
});
child.on('close', (code) => process.exit(code ?? 0));
