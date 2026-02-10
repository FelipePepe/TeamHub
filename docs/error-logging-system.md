# Sistema de Error Logging

Sistema híbrido de registro de errores con PostgreSQL + Sentry (opcional).

## Arquitectura

### PostgreSQL (Siempre activo)
- ✅ Tabla `error_logs` para auditoría y compliance
- ✅ Registra TODOS los errores (frontend + backend)
- ✅ Contexto completo: usuario, IP, user-agent, params, stack trace
- ✅ GDPR-compliant (datos en tu infraestructura)

### Sentry (Opcional)
- ✅ Source maps para stack traces legibles
- ✅ Session replay
- ✅ Alertas automáticas (Slack/Email)
- ✅ Agrupación inteligente de errores

## Backend

### Error Logger Service
```typescript
import { logError } from './services/error-logger';

await logError({
  userId: '123',
  origen: 'BACKEND',
  nivel: 'ERROR',
  mensaje: 'Error al procesar datos',
  stackTrace: error.stack,
  contexto: { endpoint: '/api/users', method: 'POST' }
});
```

### Endpoint para Frontend
```
POST /api/errors/log
{
  "origen": "FRONTEND",
  "nivel": "ERROR",
  "mensaje": "Network error",
  "stackTrace": "...",
  "contexto": { "url": "...", "component": "..." }
}
```

## Frontend

### Setup Global
```typescript
// app/layout.tsx
import { setupGlobalErrorHandling } from '@/lib/error-logger';

useEffect(() => {
  setupGlobalErrorHandling();
}, []);
```

### Manual Logging
```typescript
import { logFrontendError, getUserFriendlyMessage } from '@/lib/error-logger';

try {
  // ...
} catch (error) {
  // Log técnico (backend)
  await logFrontendError({
    mensaje: error.message,
    stackTrace: error.stack,
    contexto: { component: 'UserForm', action: 'submit' }
  });
  
  // Mensaje user-friendly (UI)
  toast.error(getUserFriendlyMessage(error));
}
```

## Sentry Integration

### 1. Instalar dependencias
```bash
npm install @sentry/node @sentry/react
```

### 2. Configurar variables de entorno
```bash
# Backend (.env)
SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
SENTRY_ENVIRONMENT=production

# Frontend (.env.local)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

### 3. Activar en backend
```typescript
// backend/src/services/sentry.ts
// Descomentar líneas marcadas con TODO

import { initSentry } from './services/sentry';

initSentry({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  tracesSampleRate: 1.0
});
```

### 4. Activar en frontend
```typescript
// frontend/sentry.client.config.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

## Consultas útiles

### Errores no resueltos por usuario
```sql
SELECT 
  u.email,
  e.nivel,
  e.mensaje,
  e.timestamp,
  e.contexto->>'endpoint' as endpoint
FROM error_logs e
LEFT JOIN users u ON e.user_id = u.id
WHERE e.resuelto = FALSE
ORDER BY e.timestamp DESC
LIMIT 50;
```

### Errores más frecuentes
```sql
SELECT 
  mensaje,
  COUNT(*) as total,
  MAX(timestamp) as ultimo_error
FROM error_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY mensaje
ORDER BY total DESC
LIMIT 10;
```

### Marcar error como resuelto
```sql
UPDATE error_logs 
SET resuelto = TRUE, notas = 'Fixed in v1.2.3'
WHERE mensaje LIKE '%duplicate key%';
```

## Principios UI/UX

❌ **NUNCA mostrar al usuario:**
- Stack traces
- Errores SQL
- Null pointer exceptions
- IDs de tablas o keys
- Mensajes técnicos del API

✅ **SIEMPRE mostrar:**
- Mensajes descriptivos en español
- Instrucciones de qué hacer
- Opción de contactar soporte
- Ejemplo: *"Error al guardar. Por favor, verifica que todos los campos estén completos."*

## Testing

```bash
# Backend
npm test

# Frontend
npm test

# E2E
npm run test:e2e
```
