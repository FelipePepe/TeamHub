# Variables de entorno

Este documento detalla las variables de entorno requeridas por TeamHub.

## Backend (`backend/.env`)

### Obligatorias
- `NODE_ENV` (development | production | test)
- `PORT` (por defecto 3001)
- `DATABASE_URL` (conexion PostgreSQL)
- `JWT_SECRET` (minimo 256 bits, para firmar tokens con HS256)
- `CORS_ORIGINS` (lista separada por comas)
- `MFA_ENCRYPTION_KEY` (minimo 32 caracteres)

### Recomendadas
- `JWT_ACCESS_EXPIRES_IN` (por defecto: `15m` - 15 minutos)
- `JWT_REFRESH_EXPIRES_IN` (por defecto: `7d` - 7 dias)
- `JWT_MFA_EXPIRES_IN` (por defecto: `5m` - 5 minutos, token temporal MFA)
- `BCRYPT_SALT_ROUNDS` (ej: `12`)
- `MFA_ISSUER` (ej: `TeamHub`)
- `LOG_LEVEL` (debug | info | warn | error)
- `RATE_LIMIT_WINDOW_MS` (ej: `60000`)
- `RATE_LIMIT_MAX` (ej: `100`)
- `LOGIN_RATE_LIMIT_WINDOW_MS` (ej: `60000`)
- `LOGIN_RATE_LIMIT_MAX` (ej: `5`)
- `PG_SSL_CERT_PATH` (ruta al certificado CA para conexiones PostgreSQL con SSL)

## Frontend (`frontend/.env.local`)

### Obligatorias
- `NEXT_PUBLIC_API_URL` (URL del backend, ej: `http://localhost:3001/api`)

### Recomendadas
- `NEXT_PUBLIC_APP_URL` (URL publica del frontend)

## Notas
- Mantener `.env.example` actualizado con estas variables.
- No incluir secretos en el repositorio.

## Archivos en el repositorio
- `backend/.env.example`
- `frontend/.env.example`
