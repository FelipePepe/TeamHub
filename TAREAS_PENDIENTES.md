# TeamHub - Plan de Trabajo y Tareas Pendientes

Documento unificado de seguimiento del proyecto organizado por fases funcionales. Cada fase integra trabajo de backend y frontend.

---

## 📊 Resumen de Progreso General

| Fase | Descripción | Horas Est. | Progreso | Estado |
|------|-------------|------------|----------|--------|
| 0 | Setup inicial del proyecto | 6h | 100% | ✅ Completada |
| 1 | Autenticación y usuarios | 10h | 100% | ✅ Completada |
| 2 | Departamentos y empleados | 8h | 90% | 🟡 En progreso |
| 3 | Onboarding (plantillas y procesos) | 12h | 60% | 🟡 En progreso |
| 4 | Proyectos y asignaciones | 10h | 50% | 🟡 En progreso |
| 5 | Timetracking | 8h | 50% | 🟡 En progreso |
| 6 | Dashboards y reportes | 6h | 100% | ✅ Completada |
| 7 | Testing y calidad | 4h | 50% | 🟡 En progreso |
| 8 | Documentación, deploy y presentación | 6h | 65% | 🟡 En progreso |
| **Total** | | **70h** | **~80%** | |

**Última actualización:** 2026-01-29

---

## ✅ Fase 0: Setup Inicial del Proyecto (100%)

**Estado:** Completada

### Backend
- [x] Estructura de repositorio (monorepo, .gitignore, docs)
- [x] Setup Node + TypeScript (tsconfig, linting, scripts)
- [x] Framework Hono configurado
- [x] Configuración de base de datos (Drizzle, migraciones)
- [x] Variables de entorno y configuración por entorno

### Frontend
- [x] Setup Next.js 15 con App Router
- [x] Instalación de shadcn/ui y Tailwind CSS
- [x] Estructura de carpetas y configuración
- [x] Variables de entorno y verificación

### DevOps
- [x] Configuración de desarrollo (.env.example)
- [x] Husky + lint-staged
- [x] Documentación de setup

---

## ✅ Fase 1: Autenticación y Usuarios (100%)

**Estado:** Completada

### Backend
- [x] Modelo de usuarios (schema, roles, migraciones)
- [x] Servicio de autenticación (JWT, hash passwords)
- [x] Endpoints de auth (login, register, MFA, refresh, reset)
- [x] Middlewares (autenticación, autorización RBAC, rate limit)
- [x] CRUD usuarios con permisos y tests
- [x] Autenticación HMAC para API (ADR-059, PR #17)

### Frontend
- [x] API client con interceptores axios
- [x] Auth provider y hooks (useAuth)
- [x] Páginas de login/registro con MFA
- [x] ProtectedRoute component
- [x] Layout principal (sidebar, header, navegación)
- [x] Página de perfil

### Testing
- [x] Tests backend auth (login, MFA, tokens)
- [x] Tests backend usuarios (CRUD, permisos)

---

## 🟡 Fase 2: Departamentos y Empleados (90%)

**Estado:** En progreso - Falta formulario y detalle de empleados

### Backend
- [x] Modelo de departamentos (schema, relaciones)
- [x] Servicio y endpoints de departamentos (CRUD con permisos)
- [x] Tests de departamentos

### Frontend
- [x] Hook `useDepartamentos` con TanStack Query ✅
- [x] Página de listado de departamentos ✅
- [x] Formulario modal crear/editar departamentos ✅
- [x] Hook `useEmpleados` con TanStack Query ✅
- [x] Página de listado de empleados con filtros ✅
- [x] Tests de hooks y páginas ✅
- [ ] **Formulario crear/editar empleado** 🔴
- [ ] **Vista de detalle de empleado** ��
- [ ] Filtro por departamento (requiere refactor)
- [ ] Integrar select de responsables en departamentos

### Testing
- [x] Tests backend departamentos
- [x] Tests frontend hooks y páginas

---

## 🟡 Fase 3: Onboarding - Plantillas y Procesos (60%)

**Estado:** En progreso - Backend completo, frontend pendiente

### Backend
- [x] Modelo de plantillas (schema, tareas, dependencias)
- [x] Modelo de procesos (schema, tareas, estados)
- [x] Servicios y endpoints de plantillas (CRUD, tareas, reordenar, duplicar)
- [x] Servicios y endpoints de procesos (crear, tareas, estado, stats)
- [x] Tests de plantillas y procesos

### Frontend
- [ ] **Hook `usePlantillas` con TanStack Query** 🔴
- [ ] **Página de listado de plantillas** 🔴
- [ ] **Editor de plantillas con tareas y dependencias** 🔴
- [ ] **Hook `useProcesos` con TanStack Query** 🔴
- [ ] **Página de listado de procesos** 🔴
- [ ] **Vista de detalle de proceso** 🔴
- [ ] **Modal para iniciar nuevo proceso** 🔴
- [ ] Vista "Mis Tareas" personal
- [ ] Panel "Mi Onboarding"
- [ ] Tests de hooks y páginas

### Testing
- [x] Tests backend plantillas
- [x] Tests backend procesos
- [ ] Tests frontend (pendiente implementación)

---

## 🟡 Fase 4: Proyectos y Asignaciones (50%)

**Estado:** En progreso - Backend completo, frontend pendiente

### Backend
- [x] Modelo de proyectos y asignaciones (schema, enums)
- [x] Servicios y endpoints de proyectos (CRUD con validaciones)
- [x] Servicios y endpoints de asignaciones (gestión de equipo)
- [x] Tests de proyectos y asignaciones

### Frontend
- [ ] **Hook `useProyectos` con TanStack Query** 🔴
- [ ] **Página de listado (vista cards y tabla)** 🔴
- [ ] **Vista de detalle de proyecto** 🔴
- [ ] **Formulario crear/editar proyecto** 🔴
- [ ] **Gestión de asignaciones de equipo** 🔴
- [ ] Vista de carga de trabajo
- [ ] Tests de hooks y páginas

### Testing
- [x] Tests backend proyectos
- [x] Tests backend asignaciones
- [ ] Tests frontend (pendiente implementación)

---

## 🟡 Fase 5: Timetracking (50%)

**Estado:** En progreso - Backend completo, frontend pendiente

### Backend
- [x] Modelo de registros de tiempo (schema, constraints)
- [x] Servicios y endpoints de timetracking (registro, aprobación)
- [x] Tests de timetracking

### Frontend
- [ ] **Hook `useTimeEntries` con TanStack Query** 🔴
- [ ] **Vista semanal/mensual de registro** 🔴
- [ ] **Formulario de registro de horas** 🔴
- [ ] **Panel de aprobación para managers** 🔴
- [ ] Acciones masivas de aprobación
- [ ] Widgets personales de resumen
- [ ] Gráficos de horas
- [ ] Tests de hooks y páginas

### Testing
- [x] Tests backend timetracking
- [ ] Tests frontend (pendiente implementación)

---

## ✅ Fase 6: Dashboards y Reportes (100%)

**Estado:** Completada

### Backend
- [x] Endpoints de métricas y estadísticas
- [x] Tests de dashboards

### Frontend
- [x] Dashboard de Admin (métricas generales)
- [x] Dashboard de RRHH (empleados, departamentos)
- [x] Dashboard de Manager (equipo, proyectos)
- [x] Dashboard de Empleado (personal)
- [x] Gráficos con Recharts (bar-chart, line-chart)
- [x] Diseño responsive mobile-first (ADR-060, PR #19)
- [x] Navegación móvil con hamburger menu (Sheet + MobileSidebar)
- [ ] Completar responsive en dashboards manager/empleado 🟡

### Testing
- [x] Tests backend dashboards
- [x] Tests frontend dashboards básicos

---

## 🟡 Fase 7: Testing y Calidad (50%)

**Estado:** En progreso

### Testing
- [x] Suite completa de tests backend ejecutada (20 tests pasando)
- [x] Suite completa de tests frontend ejecutada (42 tests pasando)
- [ ] Verificar cobertura de código (target: 80% features importantes) 🔴
- [ ] Añadir tests faltantes en módulos críticos 🔴
- [ ] Tests E2E básicos (login, navegación, CRUD) 🔴
- [ ] Tests de seguridad (OWASP Top 10)

### Calidad de Código
- [ ] **Corregir warnings ESLint en backend** 🔴
- [ ] **Corregir warnings ESLint en frontend** 🔴
- [ ] Verificar que no hay regresiones
- [ ] Resolver fallos de tests (si aparecen)

### Seguridad
- [ ] **Revisar y validar RBAC en todos los endpoints** 🔴
- [ ] **Implementar rate limiting global** (actualmente solo login) 🔴
- [ ] **Añadir headers de seguridad** (CSP, X-Frame-Options, HSTS) 🔴
- [ ] **Validar todas las entradas con Zod** 🔴
- [x] Autenticación HMAC implementada ✅ (ADR-059)

### Accesibilidad
- [x] Implementar diseño responsive mobile-first ✅ (ADR-060)
- [x] Accesibilidad base (ARIA labels, navegación teclado) ✅
- [ ] Implementar A11y completo en formularios (login, etc.) 🟡
- [ ] Ejecutar Lighthouse audit (target: >90 score A11y) 🟡

### Optimizaciones
- [ ] Implementar lazy loading de rutas 🟢
- [ ] Optimizar bundle size 🟢
- [ ] Añadir error boundaries globales 🟢
- [ ] Optimizar queries de base de datos 🟢

---

## 🟡 Fase 8: Documentación, Deploy y Presentación (65%)

**Estado:** En progreso

### Documentación
- [x] Documentación de arquitectura (SAD, ADRs)
- [x] OpenAPI completo y Swagger UI configurado ✅
- [x] Documentación backend actualizada ✅
- [x] Documentación frontend (funcional, técnico)
- [x] Guía de troubleshooting ✅ (PR #21)
- [x] Documentar configuración HMAC ✅ (ADR-061)
- [ ] **Actualizar README con estado actual** 🔴
- [ ] **Documentar arquitectura final con diagramas** 🔴
- [ ] Documentación de deployment
- [ ] Manual de usuario básico

### Deploy
- [x] Backend desplegado en Render ✅
- [x] Frontend desplegado en Vercel ✅
- [x] Base de datos en Aiven PostgreSQL ✅
- [ ] Configurar CI/CD completo (GitHub Actions) 🟡
- [ ] Configurar monitoreo y logs 🟡

### Presentación TFM
- [ ] **Preparar slides de presentación** 🔴
- [ ] **Preparar demo en vivo** 🔴
- [ ] **Redactar memoria final del TFM** 🔴
- [ ] Grabar vídeo demo (opcional)

---

## 🔒 Gobernanza y Procesos (CRÍTICO)

### Reglas Obligatorias del Proyecto

#### ✅ Completadas
- [x] Añadir regla explícita de preservación de ramas (ADR-062, PR #22)
- [x] Añadir regla obligatoria de actualizar decisiones.md (PR #24)
- [x] Sincronizar archivos de agentes (AGENTS.md, claude.md, copilot-instructions.md)

#### ⚠️ Pendientes
- [ ] Mantener archivos de agentes sincronizados en futuros cambios
- [ ] Revisar cumplimiento de reglas en cada PR

---

## 📝 Notas y Reglas de Trabajo

### GitFlow
- **Crear rama por tarea**: `feature/nombre-tarea`, `bugfix/nombre-tarea`, `docs/nombre-tarea`
- **Crear desde**: `develop`
- **Mergear a**: `develop` (PRs obligatorios)
- **🔴 NUNCA borrar ramas**: Usar `gh pr merge --squash` **SIN** `--delete-branch` (ADR-062)

### Calidad
- **Tests obligatorios**: No hacer commit sin tests que pasen
- **Lint obligatorio**: Resolver warnings antes de PR
- **Type-check**: Sin errores TypeScript

### Documentación
- **🔴 SIEMPRE actualizar decisiones.md**: Documentar ADRs y progreso al completar trabajo significativo
- **Conventional Commits**: `feat/fix/docs/refactor/test/chore(scope): descripción`
- **Sincronizar docs**: ADRs, OpenAPI, README, troubleshooting

### Desarrollo
- **Sistema multi-LLM**: Usar para generar código (ver AGENTS.md sección 2)
- **Fuentes de verdad**: `docs/adr/`, `openapi.yaml`, `docs/decisiones.md`
- **Clean Code**: Funciones puras, complejidad ciclomática < 5, evitar code smells

---

## 🎯 Próximos Pasos Recomendados (Prioridad)

### 🔴 Alta Prioridad (Crítico para completar MVP)
1. **Fase 2: Completar Empleados** - Formulario crear/editar y vista detalle
2. **Fase 3: Frontend Onboarding completo** - Plantillas y Procesos (hooks, páginas, tests)
3. **Fase 4: Frontend Proyectos completo** - Proyectos y Asignaciones (hooks, páginas, tests)
4. **Fase 5: Frontend Timetracking completo** - Registro y aprobación (hooks, páginas, tests)
5. **Fase 7: Endurecer seguridad** - RBAC, rate limiting, headers, validaciones

### 🟡 Media Prioridad (Pulir MVP)
6. **Fase 7: Corregir warnings ESLint** - Backend y frontend
7. **Fase 7: Aumentar cobertura de tests** - Target 80% en features importantes
8. **Fase 8: Actualizar documentación final** - README, arquitectura, diagramas
9. **Fase 6: Completar responsive** - Dashboards manager/empleado

### 🟢 Baja Prioridad (Post-MVP)
10. **Fase 7: Tests E2E básicos** - Flujos principales
11. **Fase 7: Lighthouse audit** - Optimizaciones finales
12. **Fase 8: Preparar presentación TFM** - Slides, demo, memoria

---

**Última actualización:** 2026-01-29  
**Progreso total estimado:** ~80%  
**Tiempo estimado restante:** ~14-18 horas

**Prioridad:** Completar frontend de fases 2-5 (Empleados, Onboarding, Proyectos, Timetracking)
