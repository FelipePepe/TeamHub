# Tareas Pendientes - TeamHub

Este documento lista las tareas pendientes priorizadas para completar la implementación del proyecto.

## Priorización

Las tareas están ordenadas por:
1. **Alta prioridad**: Funcionalidades core que bloquean otras features
2. **Media prioridad**: Features importantes para MVP
3. **Baja prioridad**: Mejoras y optimizaciones

---

## Frontend - Páginas Faltantes

### 🔴 Alta Prioridad

#### 1. Página de Empleados (`/admin/empleados`)
- [x] Crear hook `useEmpleados` con TanStack Query ✅ (commit `35cab85`)
- [x] Tests del hook ✅ (9 tests, todos pasando)
- [x] Crear página de listado con tabla ✅ (commit pendiente)
- [x] Añadir filtros (rol, estado, búsqueda) ✅ (departamento pendiente - necesita hook useDepartamentos)
- [x] Tests de la página ✅ (6 tests, todos pasando)
- [ ] Implementar formulario crear/editar empleado
- [ ] Añadir vista de detalle de empleado
- [ ] Añadir filtro por departamento (requiere useDepartamentos hook)

#### 2. Página de Onboarding (`/onboarding`)
- [ ] Crear hook `useProcesos` con TanStack Query
- [ ] Crear página de listado de procesos
- [ ] Implementar vista de detalle de proceso
- [ ] Añadir modal para iniciar nuevo proceso
- [ ] Tests del hook
- [ ] Tests de la página

#### 3. Página de Proyectos (`/proyectos`)
- [ ] Crear hook `useProyectos` con TanStack Query
- [ ] Crear página de listado (vista cards y tabla)
- [ ] Implementar vista de detalle de proyecto
- [ ] Añadir formulario crear/editar proyecto
- [ ] Implementar gestión de asignaciones
- [ ] Tests del hook
- [ ] Tests de la página

#### 4. Página de Timetracking (`/timetracking`)
- [ ] Crear hook `useTimeEntries` con TanStack Query
- [ ] Crear vista semanal de registro de horas
- [ ] Implementar formulario de registro
- [ ] Añadir vista de aprobación (para managers)
- [ ] Tests del hook
- [ ] Tests de la página

### 🟡 Media Prioridad

#### 5. Página de Plantillas (`/admin/plantillas`)
- [ ] Crear hook `usePlantillas` con TanStack Query
- [ ] Crear página de listado
- [ ] Implementar editor de plantillas con tareas
- [ ] Añadir funcionalidad de duplicar plantilla
- [ ] Tests del hook
- [ ] Tests de la página

#### 6. Página de Configuración (`/admin/configuracion`)
- [ ] Crear página básica de configuración
- [ ] Implementar gestión de variables de sistema
- [ ] Tests de la página

### 🟢 Baja Prioridad

#### 7. Integrar formulario de departamentos
- [ ] Integrar `DepartamentoForm` en página de departamentos
- [ ] Conectar botones "Crear" y "Editar"
- [ ] Añadir select de responsables (usuarios MANAGER+)
- [ ] Tests de integración

---

## Backend - Tareas Pendientes

### 🔴 Alta Prioridad

#### 1. Endurecer Seguridad
- [ ] Revisar y validar RBAC en todos los endpoints
- [ ] Implementar rate limiting global
- [ ] Añadir headers de seguridad (CSP, X-Frame-Options, etc.)
- [ ] Validar todas las entradas con Zod
- [x] Implementar autenticación HMAC para API ✅ (ADR-059, PR #17, 2026-01-29)
- [ ] Tests de seguridad

#### 2. Corregir Warnings ESLint
- [ ] Revisar warnings en backend
- [ ] Revisar warnings en frontend
- [ ] Corregir todos los warnings
- [ ] Verificar que no hay regresiones

### 🟡 Media Prioridad

#### 3. Actualizar Documentación
- [x] Actualizar OpenAPI con todos los endpoints ✅ (2026-01-29)
- [x] Actualizar documentación backend según cambios ✅ (2026-01-29)
- [x] Verificar que Swagger UI muestra todo correctamente ✅ (2026-01-29)
- [x] Crear guía de troubleshooting ✅ (docs/troubleshooting.md, PR #21, 2026-01-29)
- [x] Documentar configuración HMAC en troubleshooting ✅ (ADR-061, PR #21, 2026-01-29)

#### 4. Tests y Calidad
- [x] Ejecutar suite completa de tests ✅ (frontend: 42, backend: 20 - todos pasando)
- [ ] Resolver fallos de tests
- [ ] Verificar cobertura de código
- [ ] Añadir tests faltantes

---

## Mejoras y Optimizaciones

### 🟢 Baja Prioridad

#### 1. Optimizaciones Frontend
- [ ] Implementar lazy loading de rutas
- [ ] Optimizar bundle size
- [ ] Añadir error boundaries
- [x] Implementar diseño responsive mobile-first ✅ (ADR-060, PR #19, 2026-01-29)
- [x] Añadir navegación móvil con hamburger menu ✅ (Sheet + MobileSidebar, PR #19, 2026-01-29)
- [x] Refactorizar dashboards admin/RRHH responsive ✅ (grids mobile-first, PR #19, 2026-01-29)
- [x] Mejorar accesibilidad base (ARIA labels, navegación teclado) ✅ (ADR-060, PR #19, 2026-01-29)
- [ ] Completar responsive en dashboards manager/empleado
- [ ] Implementar A11y completo en formularios (login, etc.)
- [ ] Ejecutar Lighthouse audit (target: >90 score A11y)

#### 2. Optimizaciones Backend
- [ ] Optimizar queries de base de datos
- [ ] Implementar caching donde sea apropiado
- [ ] Añadir índices faltantes en BD
- [ ] Optimizar respuestas de API

---

## Gobernanza y Procesos

### 🔴 Crítico

#### Reglas de GitFlow y Documentación
- [x] Añadir regla explícita de preservación de ramas ✅ (ADR-062, PR #22, 2026-01-29)
- [x] Añadir regla obligatoria de actualizar decisiones.md ✅ (PR #24, 2026-01-29)
- [x] Sincronizar archivos de agentes (AGENTS.md, claude.md, copilot-instructions.md) ✅ (2026-01-29)
- [ ] Mantener archivos de agentes sincronizados en futuros cambios

---

## Notas

- **Siempre usar sistema colaborativo multi-LLM** para generar código (ver AGENTS.md sección 2)
- **Crear rama por tarea**: `feature/nombre-tarea` o `bugfix/nombre-tarea`
- **Tests obligatorios**: No hacer commit sin tests que pasen
- **Seguir GitFlow**: Crear desde `develop`, mergear a `develop`
- **NUNCA borrar ramas**: Usar `gh pr merge --squash` SIN `--delete-branch` (ADR-062)
- **SIEMPRE actualizar decisiones.md**: Documentar ADRs y progreso al completar trabajo significativo

---

*Última actualización: 2026-01-29*
