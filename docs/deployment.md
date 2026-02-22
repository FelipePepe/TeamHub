# Instalación y Despliegue

Este documento detalla cómo instalar, configurar y desplegar TeamHub en entornos locales y de producción.

---

## Instalación Local

### Prerrequisitos

- **Node.js** 20.x o superior ([descargar](https://nodejs.org/))
- **npm** 10.x o superior (incluido con Node.js)
- **PostgreSQL** 16.x (local o via Docker)
- **Git** ([descargar](https://git-scm.com/))

### Instalación Local

#### 1. Clonar el repositorio

```bash
git clone https://github.com/[usuario]/teamhub.git
cd teamhub
```

#### 2. Copiar archivos de entorno de ejemplo

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

#### 3. Ajustar variables de entorno

**Backend (.env):**
```env
# Base de datos
DATABASE_URL=postgresql://teamhub:teamhub_dev@localhost:5432/teamhub
PG_SSL_CERT_PATH=

# JWT
JWT_ACCESS_SECRET=tu-clave-secreta-muy-larga-y-segura-minimo-32-caracteres
JWT_REFRESH_SECRET=tu-clave-secreta-muy-larga-y-segura-minimo-32-caracteres
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Servidor
PORT=3001
CORS_ORIGINS=http://localhost:3000
NODE_ENV=development
APP_BASE_URL=http://localhost:3000

# MFA y hashing
MFA_ENCRYPTION_KEY=tu-clave-secreta-muy-larga-y-segura-minimo-32-caracteres
MFA_ISSUER=TeamHub
BCRYPT_SALT_ROUNDS=12

# Rate limiting y logs
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
LOGIN_RATE_LIMIT_WINDOW_MS=60000
LOGIN_RATE_LIMIT_MAX=5
LOG_LEVEL=info
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 4. Levantar la base de datos

```bash
# Opcional: PostgreSQL con Docker
docker run --name teamhub-postgres \
  -e POSTGRES_USER=teamhub \
  -e POSTGRES_PASSWORD=teamhub_dev \
  -e POSTGRES_DB=teamhub \
  -p 5432:5432 \
  -d postgres:16
```

#### 5. Instalar dependencias e inicializar

```bash
# Backend
cd backend
npm install
npm run db:migrate
npm run db:triggers
npm run db:seed
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

#### 6. Acceder a la aplicación

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Drizzle Studio | Ejecuta `npm run db:studio` (URL en consola) |

### Usuarios de Prueba (Seed)

El seed permite crear un usuario admin inicial si la base de datos no tiene usuarios. Configura:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD` (debe cumplir la política de password)
- `SEED_ADMIN_NOMBRE` (opcional, por defecto "Admin")
- `SEED_ADMIN_APELLIDOS` (opcional)

Si no se definen `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`, el seed se omite. Si la base de datos está vacía, el primer login también puede crear un usuario **ADMIN** usando `X-Bootstrap-Token` + `BOOTSTRAP_TOKEN` (ver más abajo).

---

## Scripts Disponibles

### Backend

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo con hot-reload (tsx watch) |
| `npm run build` | Compilar TypeScript a JavaScript |
| `npm run start` | Ejecutar versión compilada |
| `npm run db:generate` | Generar migración desde cambios en schema |
| `npm run db:migrate` | Ejecutar migraciones pendientes |
| `npm run db:push` | Sincronizar schema con la DB (dev) |
| `npm run db:triggers` | Ejecutar triggers de base de datos |
| `npm run db:seed` | Seed admin (usa variables de entorno) |
| `npm run db:studio` | Abrir Drizzle Studio |
| `npm run db:setup` | Migrate + triggers + seed |
| `npm run test` | Ejecutar tests |
| `npm run test:watch` | Ejecutar tests en modo watch |
| `npm run lint` | Verificar código con ESLint |
| `npm run type-check` | Verificar tipos sin compilar |

### Sistema Colaborativo Multi-LLM

Sistema de orquestación que permite que múltiples LLMs trabajen colaborativamente para generar código de mayor calidad. Soporta CLIs externos (GitHub Copilot, Claude) y Auto (Cursor AI).

| Script | Descripción |
|--------|-------------|
| `scripts/llm-collab/orchestrator.sh <prompt> [output]` | Orquesta el proceso completo: genera, revisa e itera hasta aprobación |
| `scripts/llm-collab/generator.sh <prompt>` | Genera código usando GitHub Copilot CLI o Auto |
| `scripts/llm-collab/reviewer.sh <code_file>` | Revisa código usando Claude CLI o Auto según estándares del proyecto |

**Modos disponibles:**
- **Modo Auto**: Auto (Cursor AI) actúa como orquestador, generador o revisor
- **Modo Script**: Usa CLIs externos (GitHub Copilot, Claude) automáticamente

Ver [scripts/llm-collab/README.md](../scripts/llm-collab/README.md) para más detalles.

### Frontend

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo con hot-reload |
| `npm run build` | Compilar para producción |
| `npm run start` | Ejecutar versión de producción |
| `npm run test` | Ejecutar tests unitarios |
| `npm run test:watch` | Ejecutar tests en modo watch |
| `npm run lint` | Verificar código |
| `npm run type-check` | Verificar tipos |
| `npm run e2e` | Tests E2E con Playwright |
| `npm run demo` | Demo E2E completa (headed, video) |
| `npm run demo:record` | Demo E2E sin interfaz (solo grabación) |

---

## Despliegue en Producción

### 🌐 URLs de Producción

| Servicio | URL | Estado |
|----------|-----|--------|
| **Frontend** | https://teamhub-tfm.vercel.app | ✅ Desplegado |
| **Backend API** | https://teamhub-bxi0.onrender.com | ✅ Desplegado |
| **Base de Datos** | Aiven PostgreSQL (managed) | ✅ Activo |
| **Swagger UI** | https://teamhub-bxi0.onrender.com/docs | ✅ Disponible |

### Frontend (Vercel)

**Plataforma:** Vercel Edge Network  
**Rama:** `main` (auto-deploy activado)

#### Configuración
```bash
# Build command
npm run build

# Output directory
.next

# Framework preset
Next.js
```

#### Variables de Entorno
```env
NEXT_PUBLIC_API_URL=https://teamhub-bxi0.onrender.com/api
NEXT_PUBLIC_APP_URL=https://teamhub-tfm.vercel.app
```

#### Despliegue Manual
```bash
cd frontend
npm run build
vercel --prod
```

### Backend (Railway)

**Plataforma:** Railway  
**Rama:** `main` (auto-deploy activado desde GitHub)

#### Configuración
```bash
# Start command
npm run start

# Health check
GET /api/health

# Port
3001 (auto-asignado por Railway)
```

#### Variables de Entorno (Railway)
```env
# Database (Aiven PostgreSQL)
DATABASE_URL=postgresql://avnadmin:AVNS_xxx@teamhub-xxx.aivencloud.com:12345/teamhub?sslmode=require
PG_SSL_CERT_PATH=/app/ca-certificate.crt

# JWT Secrets (generar con: openssl rand -base64 32)
JWT_ACCESS_SECRET=<secret-32-chars-minimum>
JWT_REFRESH_SECRET=<secret-32-chars-minimum>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# MFA
MFA_ENCRYPTION_KEY=<secret-32-chars-minimum>
MFA_ISSUER=TeamHub

# CORS & App
CORS_ORIGINS=https://teamhub-tfm.vercel.app
APP_BASE_URL=https://teamhub-tfm.vercel.app
NODE_ENV=production
PORT=3001

# HMAC Authentication (ADR-059)
HMAC_SECRET=<secret-32-chars-minimum>
HMAC_ENABLED=false  # Deshabilitado para frontend (solo APIs externas)

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
LOGIN_RATE_LIMIT_WINDOW_MS=60000
LOGIN_RATE_LIMIT_MAX=5

# Logging
LOG_LEVEL=info

# SMTP (opcional - para recuperación de contraseña)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASS=<app-password>
SMTP_FROM=TeamHub <no-reply@teamhub.com>

# Security
BCRYPT_SALT_ROUNDS=12
```

### Base de Datos (Aiven PostgreSQL)

**Proveedor:** Aiven (managed PostgreSQL 16)  
**SSL:** Obligatorio con certificado CA  
**Backups:** Automáticos diarios

#### Migraciones
```bash
cd backend
npm run db:push    # Push schema changes
npm run db:studio  # GUI para inspeccionar datos
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
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

      - name: OpenAPI validate
        run: scripts/validate-openapi.sh

      - name: Backend install
        if: ${{ hashFiles('backend/package.json') != '' }}
        working-directory: backend
        run: npm ci
      - name: Backend lint
        if: ${{ hashFiles('backend/package.json') != '' }}
        working-directory: backend
        run: npm run lint
      - name: Backend type-check
        if: ${{ hashFiles('backend/package.json') != '' }}
        working-directory: backend
        run: npm run type-check
      - name: Backend tests
        if: ${{ hashFiles('backend/package.json') != '' }}
        working-directory: backend
        run: npm run test
      - name: Backend build
        if: ${{ hashFiles('backend/package.json') != '' }}
        working-directory: backend
        run: npm run build

      - name: Frontend install
        if: ${{ hashFiles('frontend/package.json') != '' }}
        working-directory: frontend
        run: npm ci
      - name: Frontend lint
        if: ${{ hashFiles('frontend/package.json') != '' }}
        working-directory: frontend
        run: npm run lint
      - name: Frontend type-check
        if: ${{ hashFiles('frontend/package.json') != '' }}
        working-directory: frontend
        run: npm run type-check
      - name: Frontend tests
        if: ${{ hashFiles('frontend/package.json') != '' }}
        working-directory: frontend
        run: npm run test
      - name: Frontend build
        if: ${{ hashFiles('frontend/package.json') != '' }}
        working-directory: frontend
        run: npm run build
```

---

## Referencias

- [Seguridad](security.md) - Headers, CORS, HMAC
- [Testing](testing.md) - Tests antes de desplegar
- [Troubleshooting](development.md#troubleshooting) - Solución de problemas comunes
