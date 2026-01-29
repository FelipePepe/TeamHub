import { createHmac } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { config } from '../config/env.js';

const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutos

export const hmacValidation: MiddlewareHandler = async (c, next) => {
  const signature = c.req.header('X-Request-Signature');

  if (!signature) {
    throw new HTTPException(401, { message: 'Missing request signature' });
  }

  // Parsear: t=<timestamp>,s=<signature>
  const parts = Object.fromEntries(
    signature.split(',').map((p) => p.split('='))
  );

  const timestamp = parseInt(parts.t, 10);
  const receivedSig = parts.s;

  if (!timestamp || !receivedSig) {
    throw new HTTPException(401, { message: 'Invalid signature format' });
  }

  // Validar tiempo (máximo 5 minutos de antigüedad, permitir 1 min de adelanto por desincronización)
  const age = Date.now() - timestamp;
  if (age > SIGNATURE_MAX_AGE_MS || age < -60000) {
    throw new HTTPException(401, { message: 'Request signature expired' });
  }

  // Recalcular firma
  const method = c.req.method;
  const path = new URL(c.req.url).pathname;
  const message = `${timestamp}${method}${path}`;

  const expectedSig = createHmac('sha256', config.API_HMAC_SECRET)
    .update(message)
    .digest('hex');

  if (receivedSig !== expectedSig) {
    throw new HTTPException(401, { message: 'Invalid request signature' });
  }

  await next();
};
