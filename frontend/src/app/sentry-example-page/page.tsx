'use client';

import { Button } from '@/components/ui/button';

/**
 * Página de ejemplo para verificar la integración de Sentry.
 * Solo para uso en desarrollo/testing.
 */
export default function SentryExamplePage() {
  const triggerError = () => {
    // Llamar a función no definida para generar error
    // @ts-expect-error - Intentionally calling undefined function for Sentry test
    globalThis.myUndefinedFunction();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Sentry Test Page</h1>
      <p className="text-muted-foreground">
        Click the button below to trigger a test error and verify Sentry integration.
      </p>
      <Button onClick={triggerError} variant="destructive">
        Trigger Test Error
      </Button>
    </div>
  );
}
