import 'dotenv/config';
import { serve } from '@hono/node-server';
import app from './app.js';
import { config } from './config/env.js';
import { initSentry } from './services/sentry.js';

// Initialize Sentry if DSN is provided
if (config.SENTRY_DSN) {
  const productionSampleRate = 10 / 100; // 10%
  initSentry({
    dsn: config.SENTRY_DSN,
    environment: config.SENTRY_ENVIRONMENT,
    tracesSampleRate: config.NODE_ENV === 'production' ? productionSampleRate : 1.0,
  });
}

const port = config.PORT;

serve({ fetch: app.fetch, port });

console.log(`API listening on http://localhost:${port}`);
