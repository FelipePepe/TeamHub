# Documento Funcional - Backend

## Objetivo
Definir el comportamiento funcional de la API de TeamHub, los recursos principales y sus reglas de negocio.

## Alcance
- API REST con Hono.
- Autenticacion JWT.
- Roles: ADMIN, RRHH, MANAGER, EMPLEADO.

## Recursos Principales
- Auth
- Usuarios
- Departamentos
- Onboarding (plantillas, procesos, tareas)
- Proyectos y asignaciones
- Timetracking
- Dashboard

## Endpoints por recurso

### Auth (`/api/auth`)
- POST `/login`
- POST `/refresh`
- POST `/logout`
- GET `/me`
- POST `/forgot-password`
- POST `/reset-password`
- POST `/mfa/setup`
- POST `/mfa/verify`

#### Reglas de autenticacion
- MFA obligatorio para todos los usuarios: el login devuelve `mfaToken` y requiere completar `/mfa/setup` (si no esta enrolado) y `/mfa/verify` antes de obtener tokens.
- Password policy: minimo 12 caracteres, mayuscula, minuscula, numero y caracter especial.
- Bloqueo tras 3 intentos fallidos (30 minutos) y rate limit 5/min por IP en login.
- El ADMIN puede desbloquear manualmente la cuenta.

### Usuarios (`/api/usuarios`)
- GET `/`
- GET `/:id`
- POST `/`
- PUT `/:id`
- PATCH `/:id/password` (password hasheada de forma irreversible)
- PATCH `/:id/unlock` (solo ADMIN)
- DELETE `/:id` (soft delete)
- PATCH `/:id/restore`

### Departamentos (`/api/departamentos`)
- GET `/`
- GET `/:id`
- GET `/:id/empleados`
- GET `/:id/estadisticas`
- POST `/`
- PUT `/:id`
- DELETE `/:id` (soft delete)

### Plantillas (`/api/plantillas`)
- GET `/`
- GET `/:id`
- POST `/`
- PUT `/:id`
- DELETE `/:id` (soft delete)
- POST `/:id/duplicar`
- POST `/:id/tareas`
- PUT `/:id/tareas/:tareaId`
- DELETE `/:id/tareas/:tareaId`
- PUT `/:id/tareas/reordenar`

### Procesos (`/api/procesos`)
- GET `/`
- GET `/:id`
- GET `/empleado/:empleadoId`
- POST `/`
- PUT `/:id`
- PATCH `/:id/cancelar`
- PATCH `/:id/pausar`
- PATCH `/:id/reanudar`
- GET `/:id/tareas`
- PATCH `/:id/tareas/:tareaId`
- PATCH `/:id/tareas/:tareaId/completar`
- GET `/mis-tareas`
- GET `/estadisticas`

### Proyectos (`/api/proyectos`)
- GET `/`
- GET `/:id`
- GET `/:id/estadisticas`
- POST `/`
- PUT `/:id`
- PATCH `/:id/estado`
- DELETE `/:id` (soft delete)
- GET `/mis-proyectos`

### Asignaciones (`/api/proyectos/:id/asignaciones`)
- GET `/`
- POST `/`
- GET `/:asigId`
- PUT `/:asigId`
- PATCH `/:asigId/finalizar`
- DELETE `/:asigId`

### Usuarios - Proyectos/Carga
- GET `/api/usuarios/:id/proyectos`
- GET `/api/usuarios/:id/carga`

### Timetracking (`/api/timetracking`)
- GET `/`
- GET `/:id`
- GET `/mis-registros`
- GET `/semana/:fecha`
- POST `/`
- PUT `/:id`
- DELETE `/:id`
- PATCH `/:id/aprobar`
- PATCH `/:id/rechazar`
- POST `/aprobar-masivo`
- GET `/pendientes-aprobacion`
- GET `/resumen`
- POST `/copiar`

### Dashboard (`/api/dashboard`)
- GET `/admin`
- GET `/rrhh`
- GET `/manager`
- GET `/empleado`

## Flujos Clave
- Registro y login
- Gestion de usuarios y departamentos
- Inicio y seguimiento de onboarding
- Creacion y gestion de proyectos
- Registro y aprobacion de horas

## Reglas de Negocio API
- Restricciones por rol en endpoints.
- Validacion de estados y transiciones.
- Soft delete en entidades criticas.

## Codigos de error y ejemplos

### Formato estandar
```json
{
  "error": "Mensaje generico",
  "code": "CODIGO_OPCIONAL",
  "details": []
}
```

### Codigos HTTP
- 400 Bad Request (validacion, datos incorrectos)
- 401 Unauthorized (no autenticado)
- 403 Forbidden (sin permisos)
- 404 Not Found (recurso no existe)
- 409 Conflict (duplicado/conflicto de estado)
- 429 Too Many Requests (rate limit)
- 500 Internal Server Error

### Ejemplos

**Validacion**
```json
{
  "error": "Datos de entrada invalidos",
  "code": "VALIDATION_ERROR",
  "details": [
    { "path": "email", "message": "Email invalido" }
  ]
}
```

**No encontrado**
```json
{
  "error": "Recurso no encontrado",
  "code": "NOT_FOUND"
}
```

## Pendientes
- (sin pendientes)
