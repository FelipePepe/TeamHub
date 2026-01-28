import { readFileSync } from 'fs';
import type { ConnectionOptions } from 'tls';
import { config } from '../config/env.js';

export function normalizeConnectionString(raw: string): string {
  try {
    const url = new URL(raw);
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch {
    return raw;
  }
}

export function buildSslConfig(): ConnectionOptions | false {
  const needsSsl = Boolean(config.PG_SSL_CERT_PATH || config.PG_SSL_REJECT_UNAUTHORIZED === false);
  if (!needsSsl) {
    return false;
  }

  const ssl: ConnectionOptions = {
    rejectUnauthorized: config.PG_SSL_REJECT_UNAUTHORIZED,
  };

  if (config.PG_SSL_CERT_PATH) {
    ssl.ca = readFileSync(config.PG_SSL_CERT_PATH).toString();
  }

  return ssl;
}
