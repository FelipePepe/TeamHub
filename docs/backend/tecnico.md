# Documento Tecnico - Backend

## Stack
- Node.js 20.x
- Hono 4.6.x
- TypeScript 5.7.x
- Drizzle ORM 0.36.x
- drizzle-kit 1.0.0-beta.9
- PostgreSQL 16.x
- Zod 3.24.x
- JWT (jsonwebtoken 9.x) + bcryptjs 2.x
- Pino 9.x (logging)
- ESLint 9.x (flat config)
- Vitest 3.x
- Documentacion API: OpenAPI + Swagger (Swagger UI)

## Estructura
- routes/ (endpoints)
- services/ (logica de negocio)
- middleware/ (auth, roles, rate-limit, error handling)
- db/ (schema por entidad, migrations, seed)
- types/ (DTOs y schemas)

## Convenciones
- Rutas REST y recursos en plural.
- Validacion con Zod en todos los endpoints.
- Servicios sin dependencias de Hono.

## Seguridad
- Hash bcrypt (12 rounds).
- JWT access + refresh.
- Rate limiting en login.
- MFA obligatorio con TOTP (RFC 6238).

## Autenticacion MFA (TOTP)
- Implementacion propia de TOTP compatible con Google Authenticator.
- Secret generado con 20 bytes aleatorios, codificado en Base32.
- Secret cifrado con AES-256-GCM antes de almacenar en BD.
- Parametros TOTP: SHA1, 6 digitos, periodo 30s, ventana ±1.
- Token MFA temporal con TTL de 5 minutos.
- **Requisito**: El reloj del servidor debe estar sincronizado (NTP) para que los codigos TOTP coincidan.

## Observabilidad
- Logs estructurados con pino.
- Middleware de errores registra contexto (ruta, usuario, status).

## Testing
- Unit/Integration: Vitest.
- Tests de endpoints con `app.request`.

## Swagger UI
- UI disponible en `/docs`.
- El contrato se sirve desde `/openapi.yaml`.
- Assets locales de `swagger-ui-dist` para evitar dependencias externas.

## Rate limiting
- Global: 100 requests por minuto por usuario.
- Auth login: 5 intentos por minuto por IP.

## Patrones de Drizzle ORM

### Self-JOIN con alias
Para resolver relaciones reflexivas (ej: `users.manager_id` → `users`), se usa `alias()` de `drizzle-orm/pg-core`:

```typescript
import { alias } from 'drizzle-orm/pg-core';

const managers = alias(users, 'managers');
const rows = await db
  .select({
    user: users,
    departamentoNombre: departamentos.nombre,
    managerNombre: managers.nombre,
    managerApellidos: managers.apellidos,
  })
  .from(users)
  .leftJoin(departamentos, eq(users.departamentoId, departamentos.id))
  .leftJoin(managers, eq(users.managerId, managers.id))
  .where(eq(users.id, id));
```

Este patrón se aplica en `GET /usuarios/:id` y `GET /usuarios` para devolver `managerNombre` y `departamentoNombre` resueltos.

### Constantes de labels para dashboards
Los gráficos de dashboard devuelven etiquetas legibles en vez de enums crudos. Los mapas se definen en `backend/src/routes/dashboard/constants.ts`:
- `ROL_LABELS`: ADMIN → Administrador, RRHH → Recursos Humanos, etc.
- `PROYECTO_ESTADO_LABELS`: PLANIFICACION → Planificación, ACTIVO → Activo, etc.
- `TIMETRACKING_ESTADO_LABELS`: PENDIENTE → Pendiente, APROBADO → Aprobado, etc.

## Pendientes
- RBAC granular por endpoint (más allá de acciones puntuales como desbloqueo).

## Estado actual
- API montada bajo `/api` con validacion Zod y headers de seguridad basicos.
- Auth, Usuarios, Departamentos, Plantillas, Procesos, Proyectos y Timetracking usan PostgreSQL/Drizzle; dashboards consumen métricas reales desde la BD.
- Swagger UI expuesto en `/docs` con `openapi.yaml` en `/openapi.yaml`.
