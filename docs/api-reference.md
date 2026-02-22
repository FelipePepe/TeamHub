# API Reference

Documentación de la API REST de TeamHub.

---

## Base URL

- **Desarrollo**: `http://localhost:3001/api`
- **Producción**: `https://teamhub-bxi0.onrender.com/api`

---

## Swagger

La documentación oficial de la API se mantiene en `openapi.yaml` y se visualiza con Swagger UI.

- **UI**: `http://localhost:3001/docs`
- **Spec**: `http://localhost:3001/openapi.yaml`
- **Producción**: `https://teamhub-bxi0.onrender.com/docs`

---

## Autenticación

Todas las rutas (excepto `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/mfa/verify` y `/auth/change-password`) requieren autenticación mediante Bearer Token en el header `Authorization`.

```
Authorization: Bearer <access_token>
```

---

## Endpoints

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | Iniciar sesión | No |
| POST | `/auth/refresh` | Renovar tokens | No |
| POST | `/auth/logout` | Cerrar sesión | Sí |
| GET | `/auth/me` | Obtener usuario actual | Sí |
| POST | `/auth/forgot-password` | Solicitar reset de contraseña | No |
| POST | `/auth/reset-password` | Reset de contraseña con token | No |
| POST | `/auth/change-password` | Cambiar contraseña temporal | No (mfaToken) |
| POST | `/auth/mfa/setup` | Enrolar MFA (Google Authenticator) | Sí |
| POST | `/auth/mfa/verify` | Verificar MFA | No |

### Usuarios (`/api/usuarios`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/usuarios` | Listar usuarios (filtros, paginación) | Autenticado |
| GET | `/usuarios/:id` | Obtener usuario por ID | Autenticado |
| POST | `/usuarios` | Crear usuario | ADMIN, RRHH |
| PUT | `/usuarios/:id` | Actualizar usuario | ADMIN, RRHH, self |
| PATCH | `/usuarios/:id/password` | Cambiar contraseña | self |
| PATCH | `/usuarios/:id/reset-password` | Generar contraseña temporal | ADMIN, RRHH |
| PATCH | `/usuarios/:id/unlock` | Desbloquear cuenta | ADMIN |
| DELETE | `/usuarios/:id` | Desactivar usuario (soft delete) | ADMIN, RRHH |
| PATCH | `/usuarios/:id/restore` | Reactivar usuario | ADMIN, RRHH |
| GET | `/usuarios/:id/proyectos` | Proyectos del usuario | Autenticado |
| GET | `/usuarios/:id/carga` | Carga de trabajo del usuario | Autenticado |

### Departamentos (`/api/departamentos`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/departamentos` | Listar departamentos | Autenticado |
| GET | `/departamentos/:id` | Obtener departamento | Autenticado |
| GET | `/departamentos/:id/empleados` | Empleados del departamento | Autenticado |
| GET | `/departamentos/:id/estadisticas` | Estadísticas | ADMIN, RRHH |
| POST | `/departamentos` | Crear departamento | ADMIN, RRHH |
| PUT | `/departamentos/:id` | Actualizar departamento | ADMIN, RRHH |
| DELETE | `/departamentos/:id` | Eliminar departamento | ADMIN |

### Plantillas de Onboarding (`/api/plantillas`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/plantillas` | Listar plantillas | ADMIN, RRHH |
| GET | `/plantillas/:id` | Obtener plantilla con tareas | ADMIN, RRHH |
| POST | `/plantillas` | Crear plantilla | ADMIN, RRHH |
| PUT | `/plantillas/:id` | Actualizar plantilla | ADMIN, RRHH |
| POST | `/plantillas/:id/duplicar` | Duplicar plantilla | ADMIN, RRHH |
| DELETE | `/plantillas/:id` | Eliminar plantilla | ADMIN, RRHH |
| POST | `/plantillas/:id/tareas` | Añadir tarea | ADMIN, RRHH |
| PUT | `/plantillas/:id/tareas/:tareaId` | Actualizar tarea | ADMIN, RRHH |
| DELETE | `/plantillas/:id/tareas/:tareaId` | Eliminar tarea | ADMIN, RRHH |
| PUT | `/plantillas/:id/tareas/reordenar` | Reordenar tareas | ADMIN, RRHH |

### Procesos de Onboarding (`/api/procesos`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/procesos` | Listar procesos (filtros) | ADMIN, RRHH, MANAGER* |
| GET | `/procesos/:id` | Obtener proceso con tareas | Autenticado* |
| GET | `/procesos/empleado/:empleadoId` | Procesos de un empleado | ADMIN, RRHH |
| POST | `/procesos` | Iniciar proceso | ADMIN, RRHH |
| PUT | `/procesos/:id` | Actualizar proceso | ADMIN, RRHH |
| PATCH | `/procesos/:id/cancelar` | Cancelar proceso | ADMIN, RRHH |
| PATCH | `/procesos/:id/pausar` | Pausar proceso | ADMIN, RRHH |
| PATCH | `/procesos/:id/reanudar` | Reanudar proceso | ADMIN, RRHH |
| GET | `/procesos/:id/tareas` | Listar tareas del proceso | Autenticado* |
| PATCH | `/procesos/:id/tareas/:tareaId` | Actualizar tarea | Responsable |
| PATCH | `/procesos/:id/tareas/:tareaId/completar` | Completar tarea | Responsable |
| GET | `/procesos/mis-tareas` | Mis tareas asignadas | Autenticado |
| GET | `/procesos/estadisticas` | Métricas de onboarding | ADMIN, RRHH |

*MANAGER solo ve su equipo, EMPLEADO solo ve el suyo

### Proyectos (`/api/proyectos`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/proyectos` | Listar proyectos (filtros) | Autenticado* |
| GET | `/proyectos/:id` | Obtener proyecto con asignaciones | Autenticado* |
| GET | `/proyectos/:id/estadisticas` | Estadísticas del proyecto | ADMIN, MANAGER |
| GET | `/proyectos/mis-proyectos` | Proyectos del usuario | Autenticado |
| POST | `/proyectos` | Crear proyecto | ADMIN, MANAGER |
| PUT | `/proyectos/:id` | Actualizar proyecto | ADMIN, Manager del proyecto |
| PATCH | `/proyectos/:id/estado` | Cambiar estado | ADMIN, Manager del proyecto |
| DELETE | `/proyectos/:id` | Eliminar proyecto | ADMIN |
| GET | `/proyectos/:id/asignaciones` | Listar asignaciones | Autenticado* |
| POST | `/proyectos/:id/asignaciones` | Asignar empleado | ADMIN, Manager del proyecto |
| GET | `/proyectos/:id/asignaciones/:asigId` | Obtener asignación | Autenticado |
| PUT | `/proyectos/:id/asignaciones/:asigId` | Actualizar asignación | ADMIN, Manager |
| PATCH | `/proyectos/:id/asignaciones/:asigId/finalizar` | Finalizar asignación | ADMIN, Manager |
| DELETE | `/proyectos/:id/asignaciones/:asigId` | Eliminar asignación | ADMIN, Manager |

*Visibilidad según rol

### Timetracking (`/api/timetracking`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/timetracking` | Listar registros (filtros) | Autenticado* |
| GET | `/timetracking/:id` | Obtener registro | Autenticado |
| GET | `/timetracking/mis-registros` | Mis registros | Autenticado |
| GET | `/timetracking/semana/:fecha` | Registros de la semana | Autenticado |
| POST | `/timetracking` | Crear registro | Autenticado |
| PUT | `/timetracking/:id` | Actualizar registro | Propietario (si PENDIENTE) |
| DELETE | `/timetracking/:id` | Eliminar registro | Propietario (si PENDIENTE) |
| PATCH | `/timetracking/:id/aprobar` | Aprobar registro | MANAGER |
| PATCH | `/timetracking/:id/rechazar` | Rechazar registro | MANAGER |
| POST | `/timetracking/aprobar-masivo` | Aprobar múltiples | ADMIN, Manager |
| GET | `/timetracking/pendientes-aprobacion` | Pendientes del equipo | MANAGER |
| GET | `/timetracking/resumen` | Resumen de horas | Autenticado |
| POST | `/timetracking/copiar` | Copiar registros | Autenticado |

*EMPLEADO solo ve los suyos, MANAGER ve los de su equipo

### Dashboard (`/api/dashboard`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/dashboard/admin` | Métricas de admin | ADMIN |
| GET | `/dashboard/rrhh` | Métricas de RRHH | ADMIN, RRHH |
| GET | `/dashboard/manager` | Métricas de manager | ADMIN, MANAGER |
| GET | `/dashboard/empleado` | Métricas de empleado | Autenticado |

---

## Respuestas de Error

```typescript
interface ErrorResponse {
  error: string;          // Mensaje de error
  code?: string;          // Código de error (opcional)
  details?: unknown;      // Detalles adicionales (ej: errores de validación)
}
```

| Código HTTP | Descripción |
|-------------|-------------|
| 400 | Bad Request - Error de validación o datos incorrectos |
| 401 | Unauthorized - No autenticado o token inválido |
| 403 | Forbidden - Sin permisos para esta acción |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: email duplicado) |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error del servidor |

---

## Referencias

- [Contrato OpenAPI](../openapi.yaml) - Especificación completa de la API
- [Seguridad](security.md) - Autenticación, autorización, HMAC
- [Arquitectura](architecture.md) - Diseño del sistema
