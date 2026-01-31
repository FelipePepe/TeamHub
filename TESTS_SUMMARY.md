# Tests Creados para el Sistema de Tareas

## Resumen de Coverage

✅ **Repository (100% - CORE)**: 36 tests - `backend/src/services/__tests__/tareas-repository.test.ts`
✅ **Service (80% - IMPORTANT)**: 44 tests - `backend/src/services/__tests__/tareas.service.test.ts`
✅ **Frontend Hook (80% - IMPORTANT)**: 34 tests - `frontend/src/hooks/__tests__/use-tareas.test.tsx`

**Total: 114 tests creados**

## 1. Repository Tests (36 tests - 100% Coverage)

### Operaciones CRUD
- findByProyecto: ordenamiento, soft delete, proyecto vacío
- findByUsuario: ordenamiento desc, soft delete, usuario sin tareas
- findById: obtener tarea, not found, soft delete
- create: datos válidos, campos opcionales, dependencias, null values
- update: campos múltiples, fechas, horas, establecer null, tarea inexistente
- updateEstado: todos los estados válidos, updatedAt
- reasignar: cambiar usuario, desasignar (null), updatedAt
- delete: soft delete, tarea inexistente, ya eliminada

### Edge Cases y Validaciones
- findDependientes: tareas que dependen, excluir eliminadas
- Integridad referencial: CASCADE delete (proyectos), SET NULL (usuarios)
- Manejo de números grandes como string (orden)
- Precisión decimal en horas (string con decimales)

## 2. Service Tests (44 tests - Lógica de Negocio)

### Permisos por Rol
- **ADMIN/RRHH/MANAGER**: crear, actualizar, eliminar, reasignar tareas
- **EMPLEADO**: solo ver sus tareas, cambiar estado de sus tareas asignadas
- Restricciones: empleado NO puede ver tareas de otros, crear, eliminar o reasignar

### Validaciones de Negocio
- Proyecto existe
- Usuario asignado existe
- Fechas: fechaFin >= fechaInicio
- Dependencias: tarea existe, mismo proyecto, no circulares
- Eliminar: no permitir si tiene tareas dependientes

### Transiciones de Estado (Máquina de Estados)
- TODO → IN_PROGRESS, BLOCKED ✅
- IN_PROGRESS → REVIEW, BLOCKED, TODO ✅
- REVIEW → DONE, IN_PROGRESS ✅
- DONE → IN_PROGRESS (reabrir) ✅
- BLOCKED → TODO, IN_PROGRESS ✅
- TODO → DONE ❌ (saltar estados no permitido)

## 3. Frontend Hook Tests (34 tests - React Query)

### Queries
- useTareasByProyecto: loading, success, error, enabled false, proyectoId vacío
- useTareasByUsuario: loading, success, error 403, enabled false, usuarioId vacío
- useTarea: loading, success, error 404, enabled false, id vacío

### Mutations
- useCreateTarea: success, datos completos, error 400 validación, error 403 sin permisos
- useUpdateTarea: success, múltiples campos, error 404, error 400 fechas
- useUpdateEstadoTarea: success, todos estados válidos, error 400 transición inválida
- useReasignarTarea: success, error 403 sin permisos, error 404 usuario no existe
- useDeleteTarea: success, error 404, error 403, error 400 dependientes

### Invalidación de Queries
- Crear: invalidate proyecto y usuario
- Actualizar: invalidate detalle, proyecto y usuario
- Eliminar: invalidate todas las listas

## Patrones Utilizados

### Backend
- Vitest como framework
- Database real con setup/teardown entre tests
- Mock de servicios en tests unitarios
- Foreign keys y constraints validados
- Edge cases de base de datos (CASCADE, SET NULL)

### Frontend
- React Testing Library + Vitest
- MSW mocks para API (vi.hoisted)
- QueryClient de test sin retry
- Wrapper de QueryClientProvider
- Tests de loading, success y error states

## Coverage Estratégico Logrado

✅ **100% (CORE)**: Repository - lógica crítica de base de datos
✅ **80% (IMPORTANT)**: Service - lógica de negocio y permisos
✅ **80% (IMPORTANT)**: Frontend Hook - gestión de estado y API

**Nota**: Tests de routes E2E se dejan para fase de integración posterior.
