/**
 * Sentry Server Configuration for Next.js
 * Automatically loaded by Next.js instrumentation
 */

import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 10 / 100 : 1.0,
    
    // Don't send errors in development (optional)
    enabled: process.env.NODE_ENV !== 'test',
  });
}
