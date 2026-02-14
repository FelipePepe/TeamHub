# ADR-093: Sistema Híbrido de Error Logging (PostgreSQL + Sentry)

**Fecha:** 2026-02-10  
**Estado:** ✅ Implementado  
**Autor:** Sistema Colaborativo Multi-LLM

## Contexto

Al desarrollar la funcionalidad de plantillas de onboarding, surgió un error de validación Zod que no fue inmediatamente comprensible para el usuario. Este incidente reveló la necesidad de un sistema robusto de logging de errores que permita:

1. **Diagnóstico rápido** sin depender de que el usuario proporcione información técnica
2. **Trazabilidad completa** de errores por usuario, endpoint, y contexto
3. **Mensajes user-friendly** que nunca expongan detalles técnicos (stack traces, SQL, null pointers)
4. **Cumplimiento GDPR** manteniendo datos sensibles en infraestructura controlada
5. **Observability en producción** con alertas automáticas

## Decisión

Implementar un **sistema híbrido de error logging** con dos componentes:

### 1. PostgreSQL (Obligatorio)
Tabla `error_logs` que registra **todos** los errores con:
- Usuario, IP, user-agent
- Origen (FRONTEND/BACKEND)
- Nivel (INFO/WARN/ERROR/FATAL)
- Mensaje, stack trace, contexto completo (JSON)
- Flag `resuelto` para seguimiento
- Timestamp para análisis temporal

**Ventajas:**
- ✅ Control total de los datos (GDPR)
- ✅ Consultas SQL directas para análisis
- ✅ Sin coste adicional
- ✅ Auditoría permanente

### 2. Sentry (Opcional)
Integración con Sentry.io para:
- Source maps y stack traces legibles
- Session replay (LogRocket-style)
- Alertas automáticas (Slack/Email)
- Agrupación inteligente de errores

**Ventajas:**
- ✅ UX superior para debugging
- ✅ Alertas en tiempo real
- ✅ Análisis de impacto y frecuencia
- ⚠️ Coste mensual según volumen

## Implementación

### Backend

**Tabla PostgreSQL:**
```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  origen VARCHAR(10) NOT NULL,
  nivel VARCHAR(10) NOT NULL,
  mensaje TEXT NOT NULL,
  stack_trace TEXT,
  contexto JSONB,
  user_agent TEXT,
  ip_address INET,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resuelto BOOLEAN NOT NULL DEFAULT FALSE,
  notas TEXT,
  sentry_event_id VARCHAR(100)
);
```

**Servicio de logging:**
- `backend/src/services/error-logger.ts`: Funciones para registrar errores
- `backend/src/services/sentry.ts`: Integración con Sentry
- `backend/src/middleware/error-logger.ts`: Middleware que captura errores automáticamente

**Endpoint para frontend:**
- `POST /api/errors/log`: Recibe errores del frontend

**Variables de entorno:**
```bash
SENTRY_DSN=https://[key]@[org].ingest.us.sentry.io/[project]
SENTRY_ENVIRONMENT=development|production
```

### Frontend

**Librería de logging:**
- `frontend/src/lib/error-logger.ts`:
  - `logFrontendError()`: Envía error al backend
  - `getUserFriendlyMessage()`: Traduce errores técnicos a mensajes legibles
  - `setupGlobalErrorHandling()`: Captura errores no manejados

**Configuración Sentry:**
- `frontend/sentry.client.config.ts`: Client-side tracking
- `frontend/sentry.server.config.ts`: Server-side tracking

**Variables de entorno:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.us.sentry.io/[project]
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development|production
```

## Principios UI/UX

### ❌ NUNCA mostrar al usuario:
- Stack traces
- Errores SQL o de base de datos
- Null pointer exceptions
- IDs de tablas, UUIDs o claves foráneas
- Mensajes técnicos del API (`ZodError`, `ECONNREFUSED`, etc.)

### ✅ SIEMPRE mostrar:
- Mensajes descriptivos en español
- Instrucciones claras de qué hacer
- Opción de contactar soporte
- **Ejemplos:**
  - ❌ `ZodError: responsableTipo is required`
  - ✅ `Error al guardar. Por favor, verifica que todos los campos estén completos.`
  
  - ❌ `Error: Cannot read property 'id' of null`
  - ✅ `Ha ocurrido un error. Por favor, inténtalo de nuevo.`
  
  - ❌ `ECONNREFUSED 127.0.0.1:5432`
  - ✅ `Error de conexión. Por favor, verifica tu conexión a internet.`

## Flujo de Error Handling

1. **Error ocurre** (frontend o backend)
2. **Backend:** Middleware captura el error
   - Registra en PostgreSQL (`error_logs`)
   - Envía a Sentry (si está configurado)
   - Re-lanza el error para procesamiento existente
3. **Frontend:** Catch block captura el error
   - Envía a `/api/errors/log` (PostgreSQL + Sentry)
   - Muestra mensaje user-friendly con `toast.error(getUserFriendlyMessage(error))`
4. **Desarrollador:**
   - Recibe alerta de Sentry (si crítico)
   - Consulta PostgreSQL para historial del usuario
   - Marca como resuelto con notas

## Consultas SQL útiles

**Errores no resueltos por usuario:**
```sql
SELECT u.email, e.nivel, e.mensaje, e.timestamp, e.contexto->>'endpoint'
FROM error_logs e
LEFT JOIN users u ON e.user_id = u.id
WHERE e.resuelto = FALSE
ORDER BY e.timestamp DESC;
```

**Errores más frecuentes (últimas 24h):**
```sql
SELECT mensaje, COUNT(*) as total, MAX(timestamp) as ultimo
FROM error_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY mensaje
ORDER BY total DESC
LIMIT 10;
```

## Consecuencias

### Positivas
- ✅ Diagnóstico 10x más rápido (toda la info en un solo lugar)
- ✅ Proactividad: detectar errores antes de que el usuario reporte
- ✅ UX mejorada: mensajes comprensibles sin jerga técnica
- ✅ Compliance GDPR: datos en infraestructura controlada
- ✅ Auditoría: historial completo de errores por usuario
- ✅ Alertas: notificación inmediata de errores críticos

### Negativas
- ⚠️ Coste Sentry: ~$26/mes (plan Team) para monitoreo avanzado
- ⚠️ Almacenamiento: ~100KB por error × volumen estimado
- ⚠️ Overhead: ~5-10ms por request para logging (async, no bloqueante)

### Mitigaciones
- Sentry solo para producción (sample rate 10%)
- Limpieza automática de errores >90 días (por implementar)
- Logging async para no bloquear requests

## Alternativas Consideradas

### 1. Solo Logs en Consola
- ❌ Sin persistencia
- ❌ Sin búsqueda
- ❌ Sin alertas

### 2. Solo Sentry
- ❌ Dependencia externa total
- ❌ Datos sensibles en terceros
- ❌ Sin control de retención

### 3. Solo PostgreSQL
- ❌ Sin source maps
- ❌ Sin session replay
- ❌ Sin alertas automáticas

**Conclusión:** El híbrido PostgreSQL + Sentry ofrece lo mejor de ambos mundos.

## Referencias

- [Sentry Node.js SDK](https://docs.sentry.io/platforms/node/)
- [Sentry Next.js SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Error Logging Best Practices](https://12factor.net/logs)
- [GDPR Compliance for Logging](https://gdpr.eu/data-processing-agreement/)

## Relacionado con

- [ADR-064: Security Hardening Strategy](./064-security-hardening-strategy.md)
- [ADR-091: JWT None Algorithm Mitigation](./091-jsonwebtoken-dependency-mitigation.md)
