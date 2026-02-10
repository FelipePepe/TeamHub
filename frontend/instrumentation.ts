/**
 * Next.js Instrumentation file
 * This file is automatically loaded by Next.js when the app starts
 * Use it to initialize Sentry and other monitoring tools
 */

export async function register() {
  console.log('[Instrumentation] Initializing...', {
    runtime: process.env.NEXT_RUNTIME,
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN?.substring(0, 30) + '...',
  });

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    console.log('[Instrumentation] Loading Sentry server config...');
    await import('./sentry.server.config');
    console.log('[Instrumentation] Sentry server initialized');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime instrumentation
    console.log('[Instrumentation] Loading Sentry edge config...');
    await import('./sentry.server.config');
    console.log('[Instrumentation] Sentry edge initialized');
  }
}

export async function onRequestError() {
  // This function is called when an unhandled error occurs in the server
  // You can customize error handling here if needed
}
