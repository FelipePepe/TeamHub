# Guía de Desarrollo

Esta guía detalla el flujo de trabajo de desarrollo, planificación del proyecto y solución de problemas comunes.

---

## Checklist de Desarrollo

Resumen de planificación y fases principales. El detalle completo de tareas vive en [CHECKLIST.md](../CHECKLIST.md).

### Resumen de Planificación

| Fase | Descripción | Horas Est. | Estado |
|------|-------------|------------|--------|
| 0 | Setup inicial del proyecto | 6h | ✅ |
| 1 | Autenticación y usuarios | 10h | ✅ |
| 2 | Departamentos y empleados | 8h | ✅ |
| 3 | Onboarding (plantillas y procesos) | 12h | ✅ |
| 4 | Proyectos y asignaciones | 10h | ✅ |
| 5 | Timetracking | 8h | ✅ |
| 6 | Dashboards y reportes | 6h | ✅ |
| 7 | Testing y calidad | 4h | ✅ |
| 8 | Documentación, deploy y presentación | 6h | ✅ |
| **Total** | | **70h** | **100%** |

**Leyenda:** ⬜ Pendiente | 🟡 En progreso | ✅ Completado

**Progreso actual (Febrero 2026):**
- ✅ Backend completamente funcional con PostgreSQL + Drizzle ORM
- ✅ Frontend con todas las funcionalidades implementadas
- ✅ Sistema de autenticación JWT + MFA (TOTP) + HMAC API
- ✅ Testing: 1,038 tests (655 backend + 383 frontend) + E2E Playwright
- ✅ Dashboards con gráficos D3.js interactivos
- ✅ OpenAPI spec + Swagger UI
- ✅ Security hardening completo
- ✅ Documentación modularizada

---

## Resumen por Fases

### Fase 0: Setup Inicial del Proyecto ([detalle](../CHECKLIST.md#fase-0-setup-inicial-del-proyecto-6h))
- 0.1 Estructura del repositorio: repo en GitHub, ramas/protecciones, monorepo, .gitignore y documentación inicial.
- 0.2 Setup backend: init Node+TS, dependencias, tsconfig, linting, estructura de carpetas, scripts y entry point Hono.
- 0.3 Setup frontend: crear Next.js, instalar dependencias, shadcn/ui, estructura, env y verificación de arranque.
- 0.4 Setup base de datos: PostgreSQL local (Docker opcional), Drizzle config, conexión y migración inicial.
- 0.5 Configuración de desarrollo: .env.example, husky/lint-staged opcional y documentación de setup.

### Fase 1: Autenticación y Usuarios ([detalle](../CHECKLIST.md#fase-1-autenticación-y-usuarios-10h))
- 1.1 Modelo de usuarios: esquema users, enum de roles y migraciones.
- 1.2 Backend auth: servicio de tokens/hashed, schemas Zod y rutas de auth.
- 1.3 Middlewares: autenticación, autorización por roles y rate limit en login.
- 1.4 CRUD usuarios: servicios y rutas con filtros, soft delete, cambio de password y tests.
- 1.5 Frontend auth: API client con interceptores, provider, login y ProtectedRoute.
- 1.6 Layout principal: layout de dashboard, sidebar/header, navegación por roles y perfil.
- 1.7 Seed de datos: usuarios base por rol y verificación de acceso.

### Fase 2: Departamentos y Empleados ([detalle](../CHECKLIST.md#fase-2-departamentos-y-empleados-8h))
- 2.1 Modelo de departamentos: esquema, relaciones con users y migraciones.
- 2.2 Backend departamentos: servicio, schemas, rutas con permisos y tests.
- 2.3 Frontend departamentos: hooks, listado, crear/editar y eliminación con reasignación.
- 2.4 Frontend empleados: hooks, listado con filtros, alta/edición y detalle.
- 2.5 Seed adicional: departamentos y empleados de ejemplo.

### Fase 3: Onboarding - Plantillas y Procesos ([detalle](../CHECKLIST.md#fase-3-onboarding-plantillas-y-procesos-12h))
- 3.1 Modelo de plantillas: esquema de plantillas y tareas, enums y migraciones.
- 3.2 Modelo de procesos: esquema de procesos y tareas, enums y migraciones.
- 3.3 Backend plantillas: servicios, schemas y rutas (CRUD, tareas, reordenar, duplicar).
- 3.4 Backend procesos: servicios, schemas y rutas (crear procesos, tareas, estado, stats).
- 3.5 Frontend plantillas: hooks, listado y editor con tareas y dependencias.
- 3.6 Frontend procesos: listado, detalle, iniciar proceso y panel de tareas.
- 3.7 Frontend mis tareas: vista personal, filtros, alertas y "Mi onboarding".
- 3.8 Seed onboarding: plantillas y procesos de ejemplo.

### Fase 4: Proyectos y Asignaciones ([detalle](../CHECKLIST.md#fase-4-proyectos-y-asignaciones-10h))
- 4.1 Modelo de datos: esquema de proyectos y asignaciones, enums y migraciones.
- 4.2 Backend proyectos/asignaciones: servicios, schemas y rutas con validaciones.
- 4.3 Frontend proyectos: hooks, listado, detalle y formularios.
- 4.4 Frontend asignaciones: gestión de equipo, asignación y carga de trabajo.
- 4.5 Seed proyectos: proyectos y asignaciones de ejemplo.

### Fase 5: Timetracking ([detalle](../CHECKLIST.md#fase-5-timetracking-8h))
- 5.1 Modelo de datos: esquema de registros de tiempo, enums, constraints y migraciones.
- 5.2 Backend timetracking: servicios, schemas y rutas de registro y aprobación.
- 5.3 Frontend registro: hooks, vista semanal/mensual y formulario de horas.
- 5.4 Frontend aprobación: panel manager, acciones masivas y vistas agrupadas.
- 5.5 Frontend resumen: widgets personales y gráficos de horas.
- 5.6 Seed timetracking: registros de ejemplo en varios estados.

### Fase 6: Dashboards y Reportes ([detalle](../CHECKLIST.md#fase-6-dashboards-y-reportes-6h))
- 6.1 Backend métricas: endpoints por rol con KPIs y alertas.
- 6.2 Frontend admin: KPIs, gráficos y actividad reciente.
- 6.3 Frontend RRHH: KPIs, alertas y métricas de onboarding.
- 6.4 Frontend manager: KPIs, carga de equipo y horas pendientes.
- 6.5 Frontend empleado: KPIs personales y accesos rápidos.
- 6.6 Componentes compartidos: gráficos y tarjetas KPI reutilizables.
- 6.7 Navegación por rol: redirecciones y menú lateral dinámico.

### Fase 7: Testing y Calidad ([detalle](../CHECKLIST.md#fase-7-testing-y-calidad-4h))
- 7.1 Backend tests: configuración, servicios y endpoints críticos.
- 7.2 Frontend tests: configuración, mocks y componentes clave.
- 7.3 Calidad: linting, type-check y revisión de seguridad.

### Fase 8: Documentación, Deploy y Presentación ([detalle](../CHECKLIST.md#fase-8-documentación-deploy-y-presentación-6h))
- 8.1 Documentación: README, troubleshooting, variables y arquitectura.
- 8.2 Deploy: Vercel, Railway y CI/CD opcional.
- 8.3 Testing final: flujos por rol, validaciones, permisos y responsive.
- 8.4 Presentación: slides, demo y exportación.
- 8.5 Entrega: verificación final y URLs.

---

## Troubleshooting

### Errores Comunes

#### Error: "ECONNREFUSED" al conectar a PostgreSQL

**Causa**: PostgreSQL no está disponible en la URL configurada o el servicio está caído.

**Solución**:
```bash
# Verificar conectividad/credenciales de DATABASE_URL
# Si usas Docker, revisa el contenedor y logs:
docker ps
docker logs teamhub-postgres
```

#### Error: "Invalid token" o "jwt expired"

**Causa**: Token expirado o inválido.

**Solución**:
- El frontend debería refrescar el token automáticamente
- Si persiste, hacer logout y login de nuevo
- Verificar que `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` son los mismos en desarrollo y en el token

#### Error: "CORS policy" en el navegador

**Causa**: El backend no está configurado para aceptar requests del origen del frontend.

**Solución**:
```env
# Backend .env
CORS_ORIGINS=http://localhost:3000
```

#### Error: "Module not found" al arrancar

**Causa**: Dependencias no instaladas o desactualizadas.

**Solución**:
```bash
# Limpiar e instalar de nuevo
rm -rf node_modules
npm install
```

#### Error: "Migration failed"

**Causa**: Base de datos en estado inconsistente o migración con errores.

**Solución**:
```bash
# Reaplicar migraciones en desarrollo
npm run db:migrate
npm run db:triggers
npm run db:seed
```

#### Error: "MFA verification failed"

**Causa**: Código TOTP inválido o desincronizado.

**Solución**:
- Verificar que el reloj del dispositivo esté sincronizado
- Regenerar QR y re-enrolar MFA
- Usar código de recuperación si está disponible

#### Error: "Rate limit exceeded"

**Causa**: Demasiadas requests en corto tiempo.

**Solución**:
- Esperar unos segundos antes de reintentar
- En desarrollo, ajustar `RATE_LIMIT_MAX` en `.env`

---

## Logs y Debugging

### Backend
```bash
# Ver logs en desarrollo
npm run dev

# Ver logs en producción (Railway)
railway logs

# Nivel de logs personalizado
LOG_LEVEL=debug npm run dev
```

### Frontend
```bash
# Verificar errores de build
npm run build

# Ver logs en producción (Vercel)
# Acceder al dashboard de Vercel → Logs

# Debug de Next.js
DEBUG=* npm run dev
```

### Base de datos
```bash
# Abrir Drizzle Studio para inspeccionar datos
npm run db:studio

# Conectar directamente con psql (Docker)
docker exec -it teamhub-postgres psql -U teamhub -d teamhub

# Ver queries ejecutadas (Drizzle)
# Añadir en db/index.ts: logger: true
```

---

## Referencias

- [Checklist Completo](../CHECKLIST.md) - Detalle de todas las tareas
- [Instalación y Despliegue](deployment.md) - Setup local y producción
- [Testing](testing.md) - Estrategia y ejecución de tests
- [Seguridad](security.md) - Headers, autenticación, validación
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Guía de contribución
