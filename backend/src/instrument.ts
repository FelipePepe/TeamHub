// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
import * as Sentry from '@sentry/node';
import { config } from './config/env.js';

if (config.SENTRY_DSN) {
  const productionSampleRate = 10 / 100; // 10%
  
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.SENTRY_ENVIRONMENT || 'development',
    tracesSampleRate:
      config.NODE_ENV === 'production' ? productionSampleRate : 1.0,
    integrations: [Sentry.httpIntegration()],
  });

  console.log(
    `[Sentry] Initialized for ${config.SENTRY_ENVIRONMENT || 'development'}`
  );
}
