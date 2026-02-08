# Documento Funcional - Backend

## Objetivo
Definir el comportamiento funcional de la API de TeamHub, los recursos principales y sus reglas de negocio.

## Alcance
- API REST con Hono.
- Autenticacion JWT.
- Roles: ADMIN, RRHH, MANAGER, EMPLEADO.

## Recursos Principales
- Auth
- Perfil
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
- POST `/mfa/setup`
- POST `/mfa/verify`
- POST `/mfa/backup` (verificar con backup code en lugar de TOTP)
- POST `/change-password` (cambio forzado de password temporal, requiere mfaToken)

### Perfil (`/api/perfil`)
- GET `/` (datos del usuario autenticado)
- PUT `/` (actualizar nombre, apellidos, email)
- PATCH `/password` (cambiar contraseña, requiere password actual)
- POST `/avatar` (subir/actualizar avatar)
- DELETE `/avatar` (eliminar avatar)
- GET `/mfa` (ver estado MFA: enrolado, fecha de activacion)
- POST `/mfa/regenerate` (regenerar QR/secret, requiere password + TOTP actual)
- POST `/mfa/backup-codes` (regenerar backup codes, requiere password + TOTP actual)

#### Reglas de autenticacion
- MFA obligatorio para todos los usuarios: el login devuelve `mfaToken` y requiere completar `/mfa/setup` (si no esta enrolado) y `/mfa/verify` antes de obtener tokens.
- Password policy: minimo 12 caracteres, mayuscula, minuscula, numero y caracter especial.
- Bloqueo tras 3 intentos fallidos (30 minutos) y rate limit 5/min por IP en login.
- El ADMIN puede desbloquear manualmente la cuenta.

#### JWT - Configuracion de tokens
- **Algoritmo**: HS256 (HMAC con SHA-256, clave simetrica).
- **Secret**: variable de entorno `JWT_SECRET` (minimo 256 bits).

#### Tipos de tokens
| Token | TTL | Proposito |
|-------|-----|-----------|
| MFA token | 5 minutos | Token temporal durante flujo MFA (entre login y verificacion TOTP) |
| Access token | 15 minutos | Autenticacion de requests a la API |
| Refresh token | 7 dias | Renovar access token sin re-login |

#### Payload del Access token (minimo)
```json
{
  "sub": "userId",
  "rol": "ADMIN|RRHH|MANAGER|EMPLEADO",
  "iat": 1234567890,
  "exp": 1234568790
}
```

#### Payload del MFA token
```json
{
  "sub": "userId",
  "type": "mfa",
  "iat": 1234567890,
  "exp": 1234568090
}
```

#### Rotacion de Refresh token
- Cada vez que se usa el refresh token en `/refresh`, se invalida el token usado y se genera uno nuevo.
- El refresh token se almacena hasheado en base de datos para validacion.
- En logout se invalida el refresh token activo.

#### Flujo de tokens
1. `POST /login` con email + password validos → devuelve `mfaToken` (5 min).
2. `POST /mfa/verify` con mfaToken + codigo TOTP → devuelve `accessToken` (15 min) + `refreshToken` (7 dias).
3. Requests autenticados usan `Authorization: Bearer {accessToken}`.
4. Antes de expirar, `POST /refresh` con refreshToken → nuevo `accessToken` + nuevo `refreshToken`.
5. `POST /logout` invalida el refresh token.

### Usuarios (`/api/usuarios`)
- GET `/` — incluye `departamentoNombre` y `managerNombre` (resueltos via LEFT JOIN)
- GET `/:id` — incluye `departamentoNombre` y `managerNombre` (resueltos via LEFT JOIN con alias para self-join de managers)
- POST `/`
- PUT `/:id`
- PATCH `/:id/password` (password hasheada de forma irreversible)
- PATCH `/:id/unlock` (solo ADMIN)
- PATCH `/:id/reset-password` (solo ADMIN, genera password temporal)
- PATCH `/:id/reset-mfa` (solo ADMIN, genera nuevo QR/secret)
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
- PATCH `/:id/restore`

### Plantillas (`/api/plantillas`)
- GET `/`
- GET `/:id`
- POST `/`
- PUT `/:id`
- DELETE `/:id` (soft delete)
- PATCH `/:id/restore`
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
- PATCH `/:id/tareas/:tareaId/rechazar` (requiere comentario)
- POST `/:id/tareas/:tareaId/evidencia` (subir evidencia: archivo o enlace)
- DELETE `/:id/tareas/:tareaId/evidencia` (eliminar evidencia)
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
- PATCH `/:id/restore`
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
- GET `/mes/:fecha`
- POST `/`
- PUT `/:id`
- DELETE `/:id`
- PATCH `/:id/aprobar`
- PATCH `/:id/rechazar` (requiere comentario)
- POST `/aprobar-masivo`
- POST `/rechazar-masivo` (requiere comentario)
- GET `/pendientes-aprobacion`
- GET `/resumen`
- POST `/copiar`

### Dashboard (`/api/dashboard`)
- GET `/admin` (requiere rol ADMIN)
- GET `/rrhh` (requiere rol ADMIN o RRHH)
- GET `/manager` (requiere rol ADMIN, RRHH o MANAGER)
- GET `/empleado` (requiere autenticación)

#### Enriquecimiento de datos en dashboards
- Las etiquetas de gráficas se devuelven con labels legibles en español (ej: `Administrador` en vez de `ADMIN`, `Planificación` en vez de `PLANIFICACION`). Los mapas de labels se definen en `backend/src/routes/dashboard/constants.ts`.
- El dashboard del manager incluye `usuarioNombre` y `proyectoNombre` en la sección `pendientesAprobacion` (resueltos via LEFT JOIN con `users` y `proyectos`).

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
