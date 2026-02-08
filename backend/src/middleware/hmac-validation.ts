import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { config } from '../config/env.js';

const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutos

export const hmacValidation: MiddlewareHandler = async (c, next) => {
  // Skip HMAC validation in test environment
  if (config.NODE_ENV === 'test') {
    await next();
    return;
  }

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

  // Recalcular firma incluyendo hash del body
  const method = c.req.method;
  const path = new URL(c.req.url).pathname;
  const body = await c.req.raw.clone().text();
  const bodyHash = createHash('sha256').update(body).digest('hex');
  const message = `${timestamp}${method}${path}${bodyHash}`;

  const expectedSig = createHmac('sha256', config.API_HMAC_SECRET)
    .update(message)
    .digest('hex');

  const receivedBuf = Buffer.from(receivedSig, 'hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');
  if (receivedBuf.length !== expectedBuf.length || !timingSafeEqual(receivedBuf, expectedBuf)) {
    throw new HTTPException(401, { message: 'Invalid request signature' });
  }

  await next();
};
