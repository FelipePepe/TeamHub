# Despliegue y CI/CD

Guia de despliegue para TeamHub (frontend en Vercel, backend en Railway) y CI/CD opcional.

## Frontend (Vercel)
1. Crear proyecto en Vercel y conectar el repo.
2. Root Directory: `frontend`.
3. Variables de entorno:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_APP_URL`
4. Build command: `npm run build`
5. Output: `.next`
6. Deploy y validar la URL publica.

## Backend (Railway)
1. Crear proyecto en Railway y un servicio PostgreSQL.
2. Crear servicio para la API:
   - Root Directory: `backend`
   - Build command: `npm run build`
   - Start command: `npm run start`
3. Variables de entorno (ver `docs/architecture/env-vars.md`).
4. Ejecutar migraciones y seed en produccion.
5. Validar endpoints con Swagger.

## Base de datos (Railway)
- Configurar `DATABASE_URL` con el servicio PostgreSQL.
- Si Railway expone CA o se requiere SSL, cargar el certificado y definir `PG_SSL_CERT_PATH`.
- Mantener backups y rotacion segun necesidad.

## CI/CD (opcional)
Recomendado con GitHub Actions:
- Lint + type-check en PR.
- Tests (frontend/back).
- Validacion OpenAPI con `scripts/validate-openapi.sh`.
- Build de frontend y backend.

### Pipeline sugerido
- Trigger: `pull_request` y `push` a `main`.
- Node.js 20.
- Cache de `npm` por carpeta (`backend/`, `frontend/`).
- Jobs:
  1. **lint**: `npm run lint` (frontend/back).
  2. **type-check**: `npm run type-check` (frontend/back).
  3. **tests**: `npm run test` (frontend/back).
  4. **openapi**: `scripts/validate-openapi.sh`.
  5. **build**: `npm run build` (frontend/back).

### Ejemplo de workflow
```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Backend install
        working-directory: backend
        run: npm ci
      - name: Backend lint
        working-directory: backend
        run: npm run lint
      - name: Backend type-check
        working-directory: backend
        run: npm run type-check
      - name: Backend tests
        working-directory: backend
        run: npm run test
      - name: Backend build
        working-directory: backend
        run: npm run build

      - name: Frontend install
        working-directory: frontend
        run: npm ci
      - name: Frontend lint
        working-directory: frontend
        run: npm run lint
      - name: Frontend type-check
        working-directory: frontend
        run: npm run type-check
      - name: Frontend tests
        working-directory: frontend
        run: npm run test
      - name: Frontend build
        working-directory: frontend
        run: npm run build

      - name: OpenAPI validate
        run: scripts/validate-openapi.sh
```

Notas:
- Ajustar comandos segun scripts reales de cada paquete.
- Si el frontend aun no esta creado, omitir esos pasos.

## Git hooks (Husky)
- Hook pre-push: valida OpenAPI y ejecuta lint/type-check/tests si existen `backend/package.json` o `frontend/package.json`.
- Instalacion: `npm install` en la raiz para activar `husky install`.
- Hook definido en `.husky/pre-push`.

## Checklist de release
- Variables de entorno cargadas en Vercel/Railway.
- Migraciones aplicadas.
- Swagger validado.
- Smoke tests por rol.

## Incidencias registradas
- `npm install` en la raiz fallo por `EAI_AGAIN` al acceder a `registry.npmjs.org`.
- npm no pudo escribir logs en `/home/sandman/.npm/_logs`.
- Accion recomendada: revisar conectividad DNS/red y permisos del directorio de logs.
- Resolucion aplicada: `sudo npm install` ejecuto `husky install` con warning deprecado.
- `npm install` en `backend/` fallo por `EAI_AGAIN` al acceder a `registry.npmjs.org`.
- `npx create-next-app@latest` fallo por `EAI_AGAIN` al acceder a `registry.npmjs.org`.
- `npm install` en `frontend/` completo con 8 vulnerabilidades (3 moderadas, 3 altas, 2 criticas).
- Accion recomendada: ejecutar `npm audit` y revisar antes de aplicar `npm audit fix --force`.
- `npm audit fix --force` en `frontend/` dejo 0 vulnerabilidades, pero actualizo dependencias:
  - `next` -> `^14.2.35`
  - `eslint-config-next` -> `^16.1.4` (warning por peer deps con `eslint@8.57.0`)
  - `vitest` -> `^4.0.18` (major)
- Accion recomendada: alinear `eslint-config-next` con `next` y validar lint/tests/build.
- Ajuste aplicado: `eslint-config-next` alineado a `14.2.35` y `npm install` ejecutado en `frontend/`.
- Advertencias actuales: conflictos de peer deps por `@types/node` con `vitest@4` (via `vite@7`).
- `npm audit` reporta 3 vulnerabilidades high por `glob` en `eslint-config-next` 14.x (fix sugerido via `npm audit fix --force`).
- Intento de downgrade `vitest` -> `1.6.0` fallo por `EAI_AGAIN` al acceder a `registry.npmjs.org`.
- Tras instalar con red disponible en `frontend/`: warnings por `eslint-config-next@16.1.4` con `eslint@8.57.0` (peer deps).
- `npm audit` en `frontend/`: 4 vulnerabilidades (3 moderadas, 1 critica) en `esbuild/vite` con fix sugerido via `npm audit fix --force` (propone `vitest@1.0.1` fuera de rango).
