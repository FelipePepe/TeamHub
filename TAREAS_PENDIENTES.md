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
- [ ] Crear página de listado con tabla
- [ ] Añadir filtros (departamento, rol, estado, búsqueda)
- [ ] Implementar formulario crear/editar empleado
- [ ] Añadir vista de detalle de empleado
- [ ] Tests de la página

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
- [ ] Tests de seguridad

#### 2. Corregir Warnings ESLint
- [ ] Revisar warnings en backend
- [ ] Revisar warnings en frontend
- [ ] Corregir todos los warnings
- [ ] Verificar que no hay regresiones

### 🟡 Media Prioridad

#### 3. Actualizar Documentación
- [ ] Actualizar OpenAPI con todos los endpoints
- [ ] Actualizar documentación backend según cambios
- [ ] Verificar que Swagger UI muestra todo correctamente

#### 4. Tests y Calidad
- [ ] Ejecutar suite completa de tests
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
- [ ] Mejorar accesibilidad (a11y)

#### 2. Optimizaciones Backend
- [ ] Optimizar queries de base de datos
- [ ] Implementar caching donde sea apropiado
- [ ] Añadir índices faltantes en BD
- [ ] Optimizar respuestas de API

---

## Notas

- **Siempre usar sistema colaborativo multi-LLM** para generar código (ver AGENTS.md sección 2)
- **Crear rama por tarea**: `feature/nombre-tarea` o `bugfix/nombre-tarea`
- **Tests obligatorios**: No hacer commit sin tests que pasen
- **Seguir GitFlow**: Crear desde `develop`, mergear a `develop`

---

*Última actualización: 2026-01-27*
