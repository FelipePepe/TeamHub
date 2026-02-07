#!/usr/bin/env node
/**
 * Comprueba que HMAC y credenciales E2E estén bien configurados antes de ejecutar E2E.
 * Uso: desde frontend/ ejecutar node scripts/check-e2e-auth.mjs
 * Requiere: backend en marcha, .env o .env.e2e con NEXT_PUBLIC_API_HMAC_SECRET, E2E_USER, E2E_PASSWORD.
 */
import { config as loadEnv } from 'dotenv';
import { createHmac } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(frontendRoot, '..');
// Cargar .env de raíz del proyecto (p. ej. tfm/.env) y luego frontend, para que E2E_USER/E2E_PASSWORD se encuentren
loadEnv({ path: path.join(projectRoot, '.env') });
loadEnv({ path: path.join(frontendRoot, '.env') });
loadEnv({ path: path.join(frontendRoot, '.env.local') });
loadEnv({ path: path.join(frontendRoot, '.env.e2e') });

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const HMAC_SECRET =
  process.env.NEXT_PUBLIC_API_HMAC_SECRET ?? process.env.API_HMAC_SECRET ?? '';
const E2E_USER = process.env.E2E_USER ?? '';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? '';

function signRequest(method, pathForSign) {
  const timestamp = Date.now();
  const message = `${timestamp}${method}${pathForSign}`;
  const signature = createHmac('sha256', HMAC_SECRET).update(message).digest('hex');
  return `t=${timestamp},s=${signature}`;
}

async function main() {
  const issues = [];

  if (!HMAC_SECRET || HMAC_SECRET.length < 32) {
    issues.push('NEXT_PUBLIC_API_HMAC_SECRET (o API_HMAC_SECRET) no está definido o es demasiado corto en frontend/.env o .env.e2e. Debe ser igual que API_HMAC_SECRET del backend.');
  }
  if (!E2E_USER || !E2E_PASSWORD) {
    issues.push('E2E_USER o E2E_PASSWORD no definidos. Ponlos en frontend/.env.e2e (o frontend/.env o en la raíz del proyecto .env). Copia frontend/.env.e2e.example a .env.e2e y rellena tus credenciales.');
  }

  if (issues.length > 0) {
    console.error('check-e2e-auth: problemas de configuración:\n');
    issues.forEach((i) => console.error('  -', i));
    process.exit(1);
  }

  const pathForSign = '/api/auth/login';
  const url = `${API_BASE.replace(/\/api\/?$/, '')}${pathForSign}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Signature': signRequest('POST', pathForSign),
    },
    body: JSON.stringify({ email: E2E_USER, password: E2E_PASSWORD }),
  }).catch((err) => {
    console.error('check-e2e-auth: no se pudo conectar al backend. ¿Está en marcha (npm run dev en backend/)?', err.message);
    process.exit(1);
  });

  if (res.status === 401) {
    const body = await res.json().catch(() => ({}));
    console.error('check-e2e-auth: login devolvió 401 (No autorizado).');
    if (body.code === 'RATE_LIMITED') {
      console.error('  Rate limit: espera un poco y vuelve a intentar.');
    } else {
      console.error('  Comprueba: (1) NEXT_PUBLIC_API_HMAC_SECRET en frontend igual que API_HMAC_SECRET en backend. (2) E2E_USER/E2E_PASSWORD correctos en .env.e2e.');
    }
    process.exit(1);
  }

  if (!res.ok) {
    console.error('check-e2e-auth: login devolvió', res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  if (data.mfaToken) {
    console.log('check-e2e-auth: OK. Login correcto; el usuario requiere MFA (tendrás que introducir el código o definir E2E_MFA_SECRET).');
  } else if (data.accessToken) {
    console.log('check-e2e-auth: OK. Login correcto sin MFA.');
  } else {
    console.log('check-e2e-auth: OK. Respuesta de login recibida.');
  }
}

main();
