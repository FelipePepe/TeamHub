# Variables de entorno

Este documento detalla las variables de entorno requeridas por TeamHub.

## Backend (`backend/.env`)

### Obligatorias
- `NODE_ENV` (development | production | test)
- `PORT` (por defecto 3001)
- `DATABASE_URL` (conexion PostgreSQL)
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGINS` (lista separada por comas)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `APP_BASE_URL` (URL base para links de reset password)

### Recomendadas
- `JWT_ACCESS_EXPIRES_IN` (ej: `7d`)
- `JWT_REFRESH_EXPIRES_IN` (ej: `30d`)
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

## Archivos por entorno (examples)
- Backend: `.env.development.example`, `.env.production.example`, `.env.test.example`.
- Frontend: `.env.development.example`, `.env.production.example`, `.env.test.example`.

## Archivos en el repositorio
- `backend/.env.example`
- `backend/.env.development.example`
- `backend/.env.production.example`
- `backend/.env.test.example`
- `frontend/.env.example`
- `frontend/.env.development.example`
- `frontend/.env.production.example`
- `frontend/.env.test.example`
