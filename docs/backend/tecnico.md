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

## Pendientes
- RBAC granular por endpoint (más allá de acciones puntuales como desbloqueo).

## Estado actual
- API montada bajo `/api` con validacion Zod y headers de seguridad basicos.
- Auth, Usuarios, Departamentos, Plantillas, Procesos, Proyectos y Timetracking usan PostgreSQL/Drizzle; dashboards consumen métricas reales desde la BD.
- Swagger UI expuesto en `/docs` con `openapi.yaml` en `/openapi.yaml`.
