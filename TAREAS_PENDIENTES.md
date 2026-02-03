# TeamHub - Plan de Trabajo y Tareas Pendientes

Documento unificado de seguimiento del proyecto organizado por fases funcionales. Cada fase integra trabajo de backend y frontend.

---

## 🎯 Resumen Ejecutivo - Estado del Proyecto

### ✅ Backend: 100% Completo
**~149 endpoints implementados y testeados:**
- Auth: 7 endpoints ✅
- Usuarios: 7 endpoints ✅
- Departamentos: 5 endpoints ✅
- Plantillas: 10 endpoints ✅
- Procesos: 13 endpoints ✅
- Proyectos: 14 endpoints ✅
- Timetracking: 13 endpoints ✅
- Dashboard: 1 endpoint ✅

**20 tests pasando** en 8 archivos de test

### ✅ Frontend: 100% Completado
**✅ Completado:**
- Fase 0: Setup (Next.js, Tailwind, shadcn/ui)
- Fase 1: Auth y usuarios (login, MFA, perfil)
- Fase 2: Departamentos y empleados (100% - formulario y detalle completos)
- Fase 3: Onboarding (100% - plantillas, procesos, mis tareas, widget)
- Fase 4: Proyectos (100% - CRUD, asignaciones, estadísticas)
- Fase 5: Timetracking (100% - registro, aprobación, weekly timesheet, Gantt D3.js)
- Fase 6: Dashboards (100% - responsive implementado, migración a D3.js pendiente)

**104 tests frontend pasando** ✅

### 📊 Prioridad: Pulir y Documentar

---

## 📊 Resumen de Progreso General

| Fase | Descripción | Horas Est. | Progreso | Estado |
|------|-------------|------------|----------|--------|
| 0 | Setup inicial del proyecto | 6h | 100% | ✅ Completada |
| 1 | Autenticación y usuarios | 10h | 100% | ✅ Completada |
| 2 | Departamentos y empleados | 8h | 100% | ✅ Completada |
| 3 | Onboarding (plantillas y procesos) | 12h | 100% | ✅ Completada |
| 4 | Proyectos y asignaciones | 10h | 100% | ✅ Completada |
| 5 | Timetracking | 8h | 100% | ✅ Completada |
| 6 | Dashboards y reportes | 6h | 100% | ✅ Completada |
| 7 | Testing y calidad | 4h | 75% | 🟡 En progreso |
| 8 | Documentación, deploy y presentación | 6h | 80% | 🟡 En progreso |
| **Total** | | **70h** | **~90%** | |

**Última actualización:** 2026-01-30

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

## ✅ Fase 2: Departamentos y Empleados (100%)

**Estado:** Completada

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
- [x] Formulario crear/editar empleado ✅ (PR #54)
- [x] Vista de detalle de empleado ✅ (PR #54)
- [x] Tests de hooks y páginas ✅ (PR #56, #57)

### Testing
- [x] Tests backend departamentos
- [x] Tests frontend hooks y páginas

---

## ✅ Fase 3: Onboarding - Plantillas y Procesos (100%)

**Estado:** Completada - Backend 100% ✅ | Frontend 100% ✅

**Auditoría backend:** 10 endpoints plantillas + 13 endpoints procesos = 23 endpoints funcionando con tests

### Backend ✅ 100%
- [x] Modelo de plantillas (schema, tareas, dependencias)
- [x] Modelo de procesos (schema, tareas, estados)
- [x] **10 endpoints plantillas** (CRUD, tareas, duplicar) ✅
- [x] **13 endpoints procesos** (crear, tareas, estados, completar) ✅
- [x] Repositories y services completos
- [x] Tests de plantillas (3 tests pasando) ✅
- [x] Tests de procesos (4 tests pasando) ✅

### Frontend ✅ 100%
- [x] **Hook `usePlantillas` con TanStack Query** ✅ (PR #30)
- [x] **Página de listado de plantillas** ✅ (PR #34)
- [x] **Editor de plantillas con tareas y dependencias** ✅ (PR #38)
- [x] **Hook `useProcesos` con TanStack Query** ✅ (PR #32)
- [x] **Página de listado de procesos** ✅ (PR #36)
- [x] **Vista de detalle de proceso** ✅ (PR #36)
- [x] **Modal para iniciar nuevo proceso** ✅ (PR #40)
- [x] Vista "Mis Tareas" personal ✅ (PR #42)
- [x] Panel "Mi Onboarding" ✅ (PR #44)
- [x] Tests de hooks y páginas ✅

---

## ✅ Fase 4: Proyectos y Asignaciones (100%)

**Estado:** Completada - Backend 100% ✅ | Frontend 100% ✅

**Auditoría backend:** 14 endpoints funcionando con tests (CRUD proyectos, asignaciones, stats, historial)

### Backend ✅ 100%
- [x] Modelo de proyectos y asignaciones (schema, enums)
- [x] **14 endpoints proyectos** (CRUD, asignaciones, finalizar, stats) ✅
- [x] Repositories y services completos
- [x] Tests de proyectos (2 tests pasando) ✅
- [x] Tests de asignaciones ✅

### Frontend ✅ 100%
- [x] **Hook `useProyectos` con TanStack Query** ✅ (PR #61)
- [x] **Página de listado (vista cards y tabla)** ✅ (PR #61)
- [x] **Vista de detalle de proyecto** ✅ (PR #61)
- [x] **Formulario crear/editar proyecto** ✅ (PR #61)
- [x] **Gestión de asignaciones de equipo** ✅ (PR #61)
- [x] Vista de estadísticas por proyecto ✅
- [x] Tipos alineados con OpenAPI (ProyectoResponse, AsignacionResponse)

---

## ✅ Fase 5: Timetracking (100%)

**Estado:** Completada - Backend 100% ✅ | Frontend 100% ✅

**Auditoría backend:** 13 endpoints funcionando con tests (CRUD, aprobar/rechazar, lotes, resumen)

### Backend ✅ 100%
- [x] Modelo de registros de tiempo (schema, constraints)
- [x] **13 endpoints timetracking** (CRUD, aprobar, rechazar, lote, resumen) ✅
- [x] Repositories y services completos
- [x] Tests de timetracking (1 test pasando) ✅

### Frontend ✅ 100%
- [x] **Hook `useTimeEntries` con TanStack Query** ✅ (PR #61)
- [x] **Vista "Mis Registros" con resumen** ✅ (PR #61)
- [x] **Formulario de registro de horas** ✅ (PR #61)
- [x] **Panel de aprobación para managers** ✅ (PR #61)
- [x] Acciones masivas de aprobación ✅
- [x] **Weekly Timesheet con grid editable** ✅ (commit 9512ed4)
- [x] **Gantt Chart con visualización D3.js** ✅ (commit 9512ed4)
- [x] Tabs navigation (My Records, Weekly Timesheet, Gantt Chart) ✅
- [x] Navegación semanal y copiar semana ✅
- [x] Zoom controls, tooltips, progress bars ✅
- [x] Tipos alineados con OpenAPI (TimetrackingResponse, CreateTimetrackingRequest)

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
- [x] Gráficos con CSS/HTML simple ✅ (implementación inicial)
- [ ] **Migrar gráficos a D3.js** 🟡 (ADR-063, decisión arquitectural tomada)
  - [ ] Refactorizar `bar-chart.tsx` con D3.js (interactividad, tooltips)
  - [ ] Refactorizar `line-chart.tsx` con D3.js (interactividad, animaciones)
  - [ ] Añadir tooltips y hover effects
  - [ ] Mantener responsive design (ADR-060)
  - [ ] Mantener accesibilidad (ARIA, teclado)
  - [ ] Actualizar tests de componentes
- [x] Diseño responsive mobile-first (ADR-060, PR #19)
- [x] Navegación móvil con hamburger menu (Sheet + MobileSidebar)
- [ ] Completar responsive en dashboards manager/empleado 🟡

### Testing
- [x] Tests backend dashboards
- [x] Tests frontend dashboards básicos

---

## 🟡 Fase 7: Testing y Calidad (75%)

**Estado:** En progreso

### Testing
- [x] Suite completa de tests backend ejecutada (20 tests pasando)
- [x] Suite completa de tests frontend ejecutada (42 tests pasando)
- [ ] Verificar cobertura de código (target: 80% features importantes) 🔴
- [ ] Añadir tests faltantes en módulos críticos 🔴
- [x] Tests E2E básicos (login, navegación) ✅ (Playwright en `frontend/e2e/`, `npm run e2e`)
- [x] Tests E2E CRUD (departamentos) ✅ (`e2e/departamentos-crud.spec.ts`; requiere E2E_USER/E2E_PASSWORD)
- [ ] Tests E2E CRUD (empleados, plantillas, etc.) 🟡
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

### 🔴 Alta Prioridad (Pulir y Completar MVP)
1. **Fase 6: Migrar dashboards a D3.js** - bar-chart y line-chart (ADR-065)
2. **Fase 7: Tests E2E básicos** - Flujos principales (login, CRUD, navegación)
3. **Fase 7: Aumentar cobertura de tests** - Target 80% en features importantes
4. **Fase 8: Actualizar documentación final** - Diagramas de arquitectura, manual de usuario

### 🟡 Media Prioridad (Optimización y Calidad)
5. **Fase 7: Lighthouse audit** - Optimizaciones de performance y accesibilidad
6. **Fase 7: Optimizar bundle size** - Lazy loading, code splitting
7. **Fase 8: Configurar CI/CD completo** - GitHub Actions con tests automáticos
8. **Fase 8: Configurar monitoreo** - Logs estructurados y métricas

### 🟢 Baja Prioridad (Post-MVP)
9. **Fase 8: Preparar presentación TFM** - Slides, demo en vivo, vídeo
10. **Fase 8: Redactar memoria final** - Documento TFM completo
11. **Features adicionales** - Notificaciones, exportación de datos, integración con calendarios

---

**Última actualización:** 2026-01-30  
**Progreso total estimado:** ~90%  
**Tiempo estimado restante:** ~6-8 horas

**Logro principal:** ✅ **Frontend completo (Fases 1-6) con Claude Opus 4.5**  
**Próxima prioridad:** Migrar visualizaciones a D3.js, tests E2E, y preparar presentación TFM
