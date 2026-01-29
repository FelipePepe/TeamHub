# TeamHub - Plan de Trabajo y Tareas Pendientes

Documento unificado de seguimiento del proyecto. Consolida planificación general, progreso de fases y tareas específicas pendientes.

**📌 Archivo consolidado:** Este documento reemplaza `CHECKLIST.md` (archivado en `docs/archived/`)

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
| 7 | Testing y calidad | 4h | 50% | 🟡 En progreso |
| 8 | Documentación, deploy y presentación | 6h | 65% | 🟡 En progreso |
| **Total** | | **70h** | **~90%** | |

**Última actualización:** 2026-01-29

---

## 🎯 Fase Actual: Hardening y Finalización

### Estado: 65% completado
**Fases 0-6:** ✅ Completadas (100%)  
**Fase 7 (Testing):** 🟡 50%  
**Fase 8 (Docs/Deploy):** 🟡 65%

---

## 📋 Tareas Pendientes por Prioridad

### 🔴 Alta Prioridad

#### Backend - Seguridad y Robustez
- [ ] Revisar y validar RBAC en todos los endpoints
- [ ] Implementar rate limiting global (actualmente solo en login)
- [ ] Añadir headers de seguridad (CSP, X-Frame-Options, HSTS)
- [ ] Validar todas las entradas con Zod (revisar endpoints faltantes)
- [x] Implementar autenticación HMAC para API ✅ (ADR-059, PR #17, 2026-01-29)
- [ ] Tests de seguridad (OWASP Top 10)

#### Frontend - Páginas Core Faltantes

**1. Página de Empleados (`/admin/empleados`)**
- [x] Crear hook `useEmpleados` con TanStack Query ✅
- [x] Tests del hook ✅ (9 tests pasando)
- [x] Crear página de listado con tabla ✅
- [x] Añadir filtros (rol, estado, búsqueda) ✅
- [x] Tests de la página ✅ (6 tests pasando)
- [ ] Implementar formulario crear/editar empleado
- [ ] Añadir vista de detalle de empleado
- [ ] Añadir filtro por departamento (requiere refactor useDepartamentos)

**2. Página de Onboarding (`/onboarding`)**
- [ ] Crear hook `useProcesos` con TanStack Query
- [ ] Crear página de listado de procesos
- [ ] Implementar vista de detalle de proceso
- [ ] Añadir modal para iniciar nuevo proceso
- [ ] Tests del hook
- [ ] Tests de la página

**3. Página de Proyectos (`/proyectos`)**
- [ ] Crear hook `useProyectos` con TanStack Query
- [ ] Crear página de listado (vista cards y tabla)
- [ ] Implementar vista de detalle de proyecto
- [ ] Añadir formulario crear/editar proyecto
- [ ] Implementar gestión de asignaciones
- [ ] Tests del hook
- [ ] Tests de la página

**4. Página de Timetracking (`/timetracking`)**
- [ ] Crear hook `useTimeEntries` con TanStack Query
- [ ] Crear vista semanal de registro de horas
- [ ] Implementar formulario de registro
- [ ] Añadir vista de aprobación (para managers)
- [ ] Tests del hook
- [ ] Tests de la página

#### Código y Calidad
- [ ] Corregir warnings ESLint en backend
- [ ] Corregir warnings ESLint en frontend
- [ ] Verificar que no hay regresiones
- [ ] Resolver fallos de tests (si aparecen)

---

### 🟡 Media Prioridad

#### Documentación
- [x] Actualizar OpenAPI con todos los endpoints ✅ (2026-01-29)
- [x] Actualizar documentación backend según cambios ✅ (2026-01-29)
- [x] Verificar que Swagger UI muestra todo correctamente ✅ (2026-01-29)
- [x] Crear guía de troubleshooting ✅ (docs/troubleshooting.md, PR #21, 2026-01-29)
- [x] Documentar configuración HMAC en troubleshooting ✅ (ADR-061, PR #21, 2026-01-29)
- [ ] Actualizar README con estado actual del proyecto
- [ ] Documentar arquitectura final (diagramas actualizados)

#### Frontend - Páginas Secundarias

**5. Página de Plantillas (`/admin/plantillas`)**
- [ ] Crear hook `usePlantillas` con TanStack Query
- [ ] Crear página de listado
- [ ] Implementar editor de plantillas con tareas
- [ ] Añadir funcionalidad de duplicar plantilla
- [ ] Tests del hook
- [ ] Tests de la página

**6. Página de Configuración (`/admin/configuracion`)**
- [ ] Crear página básica de configuración
- [ ] Implementar gestión de variables de sistema
- [ ] Tests de la página

**7. Integrar formulario de departamentos**
- [ ] Integrar `DepartamentoForm` en página de departamentos
- [ ] Conectar botones "Crear" y "Editar"
- [ ] Añadir select de responsables (usuarios MANAGER+)
- [ ] Tests de integración

#### Testing
- [x] Ejecutar suite completa de tests ✅ (frontend: 42, backend: 20 - todos pasando, 2026-01-29)
- [ ] Verificar cobertura de código (target: 80% important features)
- [ ] Añadir tests faltantes en módulos críticos
- [ ] Tests E2E básicos (login, navegación, CRUD principal)

---

### 🟢 Baja Prioridad

#### Optimizaciones Frontend
- [ ] Implementar lazy loading de rutas
- [ ] Optimizar bundle size
- [ ] Añadir error boundaries globales
- [x] Implementar diseño responsive mobile-first ✅ (ADR-060, PR #19, 2026-01-29)
- [x] Añadir navegación móvil con hamburger menu ✅ (Sheet + MobileSidebar, PR #19, 2026-01-29)
- [x] Refactorizar dashboards admin/RRHH responsive ✅ (grids mobile-first, PR #19, 2026-01-29)
- [x] Mejorar accesibilidad base (ARIA labels, navegación teclado) ✅ (ADR-060, PR #19, 2026-01-29)
- [ ] Completar responsive en dashboards manager/empleado
- [ ] Implementar A11y completo en formularios (login, etc.)
- [ ] Ejecutar Lighthouse audit (target: >90 score A11y)

#### Optimizaciones Backend
- [ ] Optimizar queries de base de datos (EXPLAIN ANALYZE)
- [ ] Implementar caching donde sea apropiado (Redis opcional)
- [ ] Añadir índices faltantes en BD
- [ ] Optimizar respuestas de API (paginación, campos selectivos)

---

## 🔒 Gobernanza y Procesos (CRÍTICO)

### Reglas Obligatorias del Proyecto

#### ✅ Completadas
- [x] Añadir regla explícita de preservación de ramas ✅ (ADR-062, PR #22, 2026-01-29)
- [x] Añadir regla obligatoria de actualizar decisiones.md ✅ (PR #24, 2026-01-29)
- [x] Sincronizar archivos de agentes (AGENTS.md, claude.md, copilot-instructions.md) ✅ (2026-01-29)

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

## 🎯 Próximos Pasos Recomendados

1. **Completar páginas core frontend** (Empleados, Onboarding, Proyectos, Timetracking)
2. **Endurecer seguridad backend** (RBAC, rate limiting, headers)
3. **Resolver warnings ESLint** (ambos proyectos)
4. **Ejecutar suite completa de tests** y resolver fallos
5. **Aumentar cobertura de tests** a 80% en features importantes
6. **Completar responsive/A11y** en dashboards manager/empleado
7. **Actualizar documentación final** (README, arquitectura, diagramas)
8. **Tests E2E básicos** (flujos principales)
9. **Lighthouse audit** y optimizaciones finales
10. **Preparar presentación TFM**

---

**Última actualización:** 2026-01-29  
**Progreso total estimado:** ~90%  
**Tiempo estimado restante:** ~7-10 horas
