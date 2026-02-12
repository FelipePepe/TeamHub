# TeamHub

**Plataforma de Onboarding y Gestión de Asignaciones de Empleados**

[Documentación del proyecto](docs/README.md)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black.svg)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-336791.svg)](https://www.postgresql.org/)
[![Hono](https://img.shields.io/badge/Hono-4.6-orange.svg)](https://hono.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Instalación y Ejecución](#instalación-y-ejecución)
5. [Checklist de Desarrollo](#checklist-de-desarrollo)
6. [Documentación](#documentación)
7. [Estructura del Proyecto](#estructura-del-proyecto)
8. [Funcionalidades Principales](#funcionalidades-principales)
9. [Modelo de Datos](#modelo-de-datos)
10. [API Reference](#api-reference)
11. [Seguridad](#seguridad)
12. [Testing](#testing)
13. [Despliegue](#despliegue)
14. [Troubleshooting](#troubleshooting)
15. [Roadmap](#roadmap-y-mejoras-futuras)
16. [Autor](#autor)
17. [Licencia](#licencia)

---

## Descripción General

TeamHub es una solución integral para gestionar el ciclo de vida del empleado desde su incorporación hasta su operatividad completa en proyectos. La plataforma unifica los procesos de onboarding, asignación a proyectos y registro de horas de trabajo en una única herramienta.

### Problema que Resuelve

Las empresas enfrentan múltiples desafíos al incorporar nuevos empleados:

- **Procesos fragmentados**: Onboardings gestionados en hojas de cálculo dispersas
- **Falta de visibilidad**: Imposibilidad de conocer el estado real del proceso de incorporación
- **Gestión por email**: Asignaciones a proyectos comunicadas sin sistema formal
- **Sistemas desconectados**: Registro de horas en herramientas separadas
- **Métricas inexistentes**: Sin datos para medir tiempo hasta productividad

TeamHub centraliza toda esta información proporcionando visibilidad en tiempo real a RRHH, managers y empleados.

### Propuesta de Valor

| Rol | Beneficios |
|-----|------------|
| **RRHH** | Visibilidad completa del estado de onboardings, identificación de cuellos de botella, métricas de tiempo hasta productividad, alertas de tareas vencidas |
| **Managers** | Control de la carga de trabajo del equipo, gestión de asignaciones a proyectos, aprobación de horas registradas, seguimiento del onboarding de nuevos miembros |
| **Empleados** | Claridad sobre sus tareas de incorporación, visibilidad de proyectos asignados, registro sencillo de dedicación, seguimiento del estado de sus horas |

---

## 📊 Estado Actual del Proyecto

> **Última actualización:** 7 de febrero de 2026

### ✅ Progreso General: ~95%

| Componente | Estado | Progreso | Tests |
|------------|--------|----------|-------|
| **Backend** | ✅ Completo | 100% | 226/226 ✅ |
| **Frontend** | ✅ Completo | 100% | 241/241 ✅ |
| **Total Tests** | ✅ Pasando | - | **467/467** ✅ |

### 🎯 Features Implementadas

#### ✅ Completo (100%)
- **Autenticación & Seguridad**
  - Login con JWT + MFA obligatorio (TOTP)
  - Backup codes MFA y recuperación de contraseña
  - HMAC authentication para API (ADR-059)
  - Rate limiting y RBAC granular
  - Security headers y CORS configurado

- **Gestión de Usuarios y Departamentos**
  - CRUD completo usuarios (ADMIN/RRHH/MANAGER/EMPLEADO)
  - Gestión departamentos con responsables
  - Perfiles editables y cambio de contraseña
  - Soft delete y auditoría completa

- **Módulo de Onboarding** (Fase 3)
  - Plantillas reutilizables con tareas configurables
  - Editor completo (crear/editar) con drag & drop
  - Procesos de onboarding con estados y progreso
  - Mis Tareas (vista empleado/responsable)
  - Widget Mi Onboarding en dashboard empleado
  - Dependencias entre tareas y cálculo automático de fechas

- **Dashboards por Rol** (Fase 6)
  - Admin: Métricas globales del sistema
  - RRHH: Onboardings, departamentos y alertas
  - Manager: Equipo, proyectos y aprobaciones
  - Empleado: Onboarding personal y accesos rápidos
  - Gráficos interactivos con D3.js: barras animadas, líneas con gradiente, tooltips (ADR-063/065/080)
  - Diseño responsive mobile-first (ADR-060)

- **Proyectos y Asignaciones** (Fase 4) ✅
  - CRUD completo de proyectos (crear, editar, eliminar, finalizar)
  - Vista listado con cards y tabla
  - Vista detalle con estadísticas y progreso
  - Gestión de asignaciones de equipo con validación de dedicación
  - Estadísticas por proyecto (total empleados, horas registradas, completitud)
  - Hook `useProyectos` con TanStack Query
  - Tipos alineados con OpenAPI (ProyectoResponse, AsignacionResponse)

- **Timetracking** (Fase 5) ✅
  - Registro de horas por proyecto con formulario validado
  - Vista "Mis Registros" con resumen semanal/mensual
  - **Weekly Timesheet**: Grid editable con proyectos/días, navegación semanal, copiar semana
  - **Gantt Chart**: Visualización D3.js con timeline, zoom controls, tooltips interactivos, progress bars
  - Panel de aprobación para managers (aprobar/rechazar individual y masivo)
  - Filtros por estado (pendiente, aprobado, rechazado)
  - Hook `useTimetracking` con TanStack Query
  - Tabs navigation (My Records, Weekly Timesheet, Gantt Chart)
  - Visualizaciones avanzadas con D3.js (ADR-065)

- **E2E Demo Automatizada** (Playwright)
  - Demo completa de 14 pasos con grabación de video (1920x1080)
  - Login MFA visual, CRUD departamentos/empleados/proyectos
  - Onboarding, timetracking, perfil y verificación final
  - Helpers reutilizables: typing natural, mouse movement, TOTP generation
  - Explorer-bot para detección automática de errores
  - Monitorización de errores (consola, red, visual)

### 📡 API REST - 149 Endpoints

| Módulo | Endpoints | Estado |
|--------|-----------|--------|
| Auth | 7 | ✅ |
| Usuarios | 7 (+ filtro managerId) | ✅ |
| Departamentos | 5 | ✅ |
| Plantillas Onboarding | 10 | ✅ |
| Procesos Onboarding | 13 | ✅ |
| Proyectos | 14 | ✅ |
| Timetracking | 13 | ✅ |
| Dashboards | 80+ (computed) | ✅ |

**Documentación:** Swagger UI disponible en `/docs` ([ver OpenAPI](openapi.yaml))

### 🔧 Stack Tecnológico

**Frontend:**
- Next.js 15 (App Router) + React 19
- TypeScript 5.7 + TanStack Query v5
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- D3.js (gráficos interactivos - ADR-063)

**Backend:**
- Hono 4.6 (ultraligero, 3-4x más rápido que Express)
- Drizzle ORM + PostgreSQL 16
- JWT + MFA (TOTP)
- Zod validation en runtime
- Pino logging estructurado

**Infraestructura:**
- Frontend: Vercel (edge network)
- Backend: Render
- DB: Aiven PostgreSQL (managed)
- CI/CD: GitHub Actions

### 🧪 Calidad del Código

- ✅ **Zero ESLint warnings** (backend + frontend)
- ✅ **467 tests passing** (226 backend, 241 frontend)
- ✅ **E2E Playwright** — demo automatizada de 14 pasos con video
- ✅ **100% coverage** en hooks críticos
- ✅ **Type-safe** end-to-end (TypeScript + Zod)
- ✅ **Responsive design** (mobile-first, ADR-060)
- ✅ **Accesibilidad** (ARIA labels, navegación teclado, contraste 4.5:1)

### 📝 Documentación Disponible

- 📘 [Documentación Completa](docs/README.md)
- 🏗️ [Arquitectura (SAD)](docs/architecture/sad.md)
- 🎯 [Decisiones Arquitecturales (ADRs)](docs/adr/README.md) - 82 decisiones documentadas
- 🧠 [Análisis del Problema (6 Sombreros)](docs/analisis-6-sombreros.md)
- 🔧 [Troubleshooting](docs/troubleshooting.md)
- 📊 [Estado y Progreso](docs/decisiones.md)
- 🔌 [API Reference](openapi.yaml) + Swagger UI

### 🚀 Próximos Pasos

**Prioridad ALTA:**
1. ✅ ~~Lint & Tests verification~~ (Completado)
2. ✅ ~~Security hardening~~ (rate limiting, headers CSP, JWT algorithm whitelist)
3. ✅ ~~Actualizar OpenAPI con endpoints de onboarding~~

**Prioridad MEDIA (Completado):**
4. ✅ ~~Completar frontend Proyectos (hooks + páginas)~~
5. ✅ ~~Completar frontend Timetracking (vista semanal + aprobaciones)~~
6. ✅ ~~Migrar gráficos a D3.js (tooltips, interactividad)~~ (ADR-080)

**Pendiente:**
7. 📝 Documentación final y presentación TFM
8. 🚀 Deploy final a producción

---

## Arquitectura del Sistema

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE (Browser)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Vercel)                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        Next.js 15 (App Router)                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │   Pages      │  │  Components  │  │    Hooks     │  │   Lib      │ │ │
│  │  │  (App Dir)   │  │  (shadcn/ui) │  │(TanStack Q.) │  │  (API)     │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ REST API (JSON)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Railway)                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          Hono Framework                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │   Routes     │  │  Services    │  │  Middleware  │  │   Types    │ │ │
│  │  │  (REST API)  │  │  (Business)  │  │ (Auth/Valid) │  │   (Zod)    │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      │ Drizzle ORM                           │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         PostgreSQL 16                                  │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │ │
│  │  │ users   │ │ depart. │ │plantill.│ │proyectos│ │timtrack.│  ...    │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
Usuario → Frontend (Next.js) → API Client (Axios) → Backend (Hono) → Service → Drizzle → PostgreSQL
                  ↑                                                                    │
                  └──────────────────── JSON Response ─────────────────────────────────┘
```

### Capas de la Aplicación

| Capa | Responsabilidad | Tecnología |
|------|-----------------|------------|
| **Presentación** | UI, interacción usuario, estado cliente | Next.js, React, TanStack Query |
| **API** | Endpoints REST, validación, autenticación | Hono, Zod |
| **Negocio** | Lógica de dominio, reglas de negocio | Services TypeScript |
| **Datos** | Acceso a base de datos, queries | Drizzle ORM |
| **Persistencia** | Almacenamiento de datos | PostgreSQL |

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.x | Biblioteca UI declarativa |
| Next.js | 15.x | Framework React con App Router y SSR |
| TypeScript | 5.7.x | Tipado estático y mejor DX |
| Tailwind CSS | 3.4.x | Estilos utility-first |
| shadcn/ui | latest | Componentes UI accesibles y personalizables |
| TanStack Query | 5.x | Gestión de estado servidor y caché |
| React Hook Form | 7.x | Gestión de formularios performante |
| Zod | 3.24.x | Validación de esquemas en runtime |
| D3.js | 7.x | Visualizaciones de datos |
| Lucide React | latest | Iconos SVG |
| Sonner | latest | Notificaciones toast |

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 20.x | Runtime JavaScript |
| Hono | 4.6.x | Framework web ultraligero y rápido |
| TypeScript | 5.7.x | Tipado estático |
| Drizzle ORM | 0.36.x | ORM type-safe con excelente DX |
| drizzle-kit | 1.0.0-beta | CLI para migraciones |
| PostgreSQL | 16.x | Base de datos relacional robusta |
| JWT | 9.x | Autenticación stateless |
| bcryptjs | 2.x | Hashing de passwords |
| Zod | 3.24.x | Validación de entrada |
| Pino | 9.x | Logging estructurado |
| dotenv | 16.x | Variables de entorno |

### Infraestructura y Herramientas

| Tecnología | Propósito |
|------------|-----------|
| Docker (opcional) | Containerización local (ej: PostgreSQL) |
| Vercel | Despliegue frontend (edge network) |
| Railway | Despliegue backend y base de datos |
| GitHub Actions | CI/CD pipelines |
| ESLint 9 | Linting de código (flat config) |
| Vitest 3 | Testing unitario e integración |
| Playwright | Testing E2E y demo automatizada |

---

## Instalación y Ejecución

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

#### 6. Acceder a la aplicacion

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Drizzle Studio | Ejecuta `npm run db:studio` (URL en consola) |

### Usuarios de Prueba (Seed)

El seed permite crear un usuario admin inicial si la base de datos no tiene usuarios. Configura:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD` (debe cumplir la politica de password)
- `SEED_ADMIN_NOMBRE` (opcional, por defecto "Admin")
- `SEED_ADMIN_APELLIDOS` (opcional)

Si no se definen `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`, el seed se omite. Si la base de datos esta vacia, el primer login tambien puede crear un usuario **ADMIN** usando `X-Bootstrap-Token` + `BOOTSTRAP_TOKEN` (ver mas abajo).

### Scripts Disponibles

#### Backend

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

#### Sistema Colaborativo Multi-LLM

Sistema de orquestación que permite que múltiples LLMs trabajen colaborativamente para generar código de mayor calidad. Soporta CLIs externos (GitHub Copilot, Claude) y Auto (Cursor AI).

| Script | Descripción |
|--------|-------------|
| `scripts/llm-collab/orchestrator.sh <prompt> [output]` | Orquesta el proceso completo: genera, revisa e itera hasta aprobación |
| `scripts/llm-collab/generator.sh <prompt>` | Genera código usando GitHub Copilot CLI o Auto |
| `scripts/llm-collab/reviewer.sh <code_file>` | Revisa código usando Claude CLI o Auto según estándares del proyecto |

**Modos disponibles:**
- **Modo Auto**: Auto (Cursor AI) actúa como orquestador, generador o revisor
- **Modo Script**: Usa CLIs externos (GitHub Copilot, Claude) automáticamente

Ver [scripts/llm-collab/README.md](scripts/llm-collab/README.md) para más detalles.

#### Frontend

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

## Checklist de Desarrollo

Resumen de planificación y fases principales. El detalle completo de tareas vive en [CHECKLIST.md](CHECKLIST.md).

### Resumen de Planificación

| Fase | Descripción | Horas Est. | Estado |
|------|-------------|------------|--------|
| 0 | Setup inicial del proyecto | 6h | ✅ |
| 1 | Autenticación y usuarios | 10h | ✅ |
| 2 | Departamentos y empleados | 8h | ✅ |
| 3 | Onboarding (plantillas y procesos) | 12h | ✅ |
| 4 | Proyectos y asignaciones | 10h | ✅ |
| 5 | Timetracking | 8h | ✅ |
| 6 | Dashboards y reportes | 6h | ✅ |
| 7 | Testing y calidad | 4h | 🟡 |
| 8 | Documentación, deploy y presentación | 6h | 🟡 |
| **Total** | | **70h** | **86%** |

**Leyenda:** ⬜ Pendiente | 🟡 En progreso | ✅ Completado

**Progreso actual (Febrero 2026):**
- ✅ Backend completamente funcional con PostgreSQL + Drizzle ORM
- ✅ Frontend con todas las funcionalidades implementadas (Auth, Departamentos, Empleados, Onboarding, Proyectos, Timetracking, Dashboards)
- ✅ Sistema de autenticación JWT + MFA (TOTP) + HMAC API
- ✅ Testing: 226 tests backend + 241 tests frontend + E2E Playwright
- ✅ Dashboards con gráficos D3.js interactivos (barras, líneas, Gantt)
- ✅ OpenAPI spec v1.0.0 + Swagger UI en `/docs`
- ✅ Security hardening: rate limiting, JWT algorithm whitelist, CSP headers
- 🟡 Documentación final y presentación en progreso

---

### Resumen por Subfases

#### Fase 0: Setup Inicial del Proyecto ([detalle](CHECKLIST.md#fase-0-setup-inicial-del-proyecto-6h))
- 0.1 Estructura del repositorio: repo en GitHub, ramas/protecciones, monorepo, .gitignore y documentación inicial.
- 0.2 Setup backend: init Node+TS, dependencias, tsconfig, linting, estructura de carpetas, scripts y entry point Hono.
- 0.3 Setup frontend: crear Next.js, instalar dependencias, shadcn/ui, estructura, env y verificación de arranque.
- 0.4 Setup base de datos: PostgreSQL local (Docker opcional), Drizzle config, conexión y migración inicial.
- 0.5 Configuración de desarrollo: .env.example, husky/lint-staged opcional y documentación de setup.

#### Fase 1: Autenticación y Usuarios ([detalle](CHECKLIST.md#fase-1-autenticación-y-usuarios-10h))
- 1.1 Modelo de usuarios: esquema users, enum de roles y migraciones.
- 1.2 Backend auth: servicio de tokens/hashed, schemas Zod y rutas de auth.
- 1.3 Middlewares: autenticación, autorización por roles y rate limit en login.
- 1.4 CRUD usuarios: servicios y rutas con filtros, soft delete, cambio de password y tests.
- 1.5 Frontend auth: API client con interceptores, provider, login y ProtectedRoute.
- 1.6 Layout principal: layout de dashboard, sidebar/header, navegación por roles y perfil.
- 1.7 Seed de datos: usuarios base por rol y verificación de acceso.

#### Fase 2: Departamentos y Empleados ([detalle](CHECKLIST.md#fase-2-departamentos-y-empleados-8h))
- 2.1 Modelo de departamentos: esquema, relaciones con users y migraciones.
- 2.2 Backend departamentos: servicio, schemas, rutas con permisos y tests.
- 2.3 Frontend departamentos: hooks, listado, crear/editar y eliminación con reasignación.
- 2.4 Frontend empleados: hooks, listado con filtros, alta/edición y detalle.
- 2.5 Seed adicional: departamentos y empleados de ejemplo.

#### Fase 3: Onboarding - Plantillas y Procesos ([detalle](CHECKLIST.md#fase-3-onboarding-plantillas-y-procesos-12h))
- 3.1 Modelo de plantillas: esquema de plantillas y tareas, enums y migraciones.
- 3.2 Modelo de procesos: esquema de procesos y tareas, enums y migraciones.
- 3.3 Backend plantillas: servicios, schemas y rutas (CRUD, tareas, reordenar, duplicar).
- 3.4 Backend procesos: servicios, schemas y rutas (crear procesos, tareas, estado, stats).
- 3.5 Frontend plantillas: hooks, listado y editor con tareas y dependencias.
- 3.6 Frontend procesos: listado, detalle, iniciar proceso y panel de tareas.
- 3.7 Frontend mis tareas: vista personal, filtros, alertas y "Mi onboarding".
- 3.8 Seed onboarding: plantillas y procesos de ejemplo.

#### Fase 4: Proyectos y Asignaciones ([detalle](CHECKLIST.md#fase-4-proyectos-y-asignaciones-10h))
- 4.1 Modelo de datos: esquema de proyectos y asignaciones, enums y migraciones.
- 4.2 Backend proyectos/asignaciones: servicios, schemas y rutas con validaciones.
- 4.3 Frontend proyectos: hooks, listado, detalle y formularios.
- 4.4 Frontend asignaciones: gestión de equipo, asignación y carga de trabajo.
- 4.5 Seed proyectos: proyectos y asignaciones de ejemplo.

#### Fase 5: Timetracking ([detalle](CHECKLIST.md#fase-5-timetracking-8h))
- 5.1 Modelo de datos: esquema de registros de tiempo, enums, constraints y migraciones.
- 5.2 Backend timetracking: servicios, schemas y rutas de registro y aprobación.
- 5.3 Frontend registro: hooks, vista semanal/mensual y formulario de horas.
- 5.4 Frontend aprobación: panel manager, acciones masivas y vistas agrupadas.
- 5.5 Frontend resumen: widgets personales y gráficos de horas.
- 5.6 Seed timetracking: registros de ejemplo en varios estados.

#### Fase 6: Dashboards y Reportes ([detalle](CHECKLIST.md#fase-6-dashboards-y-reportes-6h))
- 6.1 Backend métricas: endpoints por rol con KPIs y alertas.
- 6.2 Frontend admin: KPIs, gráficos y actividad reciente.
- 6.3 Frontend RRHH: KPIs, alertas y métricas de onboarding.
- 6.4 Frontend manager: KPIs, carga de equipo y horas pendientes.
- 6.5 Frontend empleado: KPIs personales y accesos rápidos.
- 6.6 Componentes compartidos: gráficos y tarjetas KPI reutilizables.
- 6.7 Navegación por rol: redirecciones y menú lateral dinámico.

#### Fase 7: Testing y Calidad ([detalle](CHECKLIST.md#fase-7-testing-y-calidad-4h))
- 7.1 Backend tests: configuración, servicios y endpoints críticos.
- 7.2 Frontend tests: configuración, mocks y componentes clave.
- 7.3 Calidad: linting, type-check y revisión de seguridad.

#### Fase 8: Documentación, Deploy y Presentación ([detalle](CHECKLIST.md#fase-8-documentación-deploy-y-presentación-6h))
- 8.1 Documentación: README, troubleshooting, variables y arquitectura.
- 8.2 Deploy: Vercel, Railway y CI/CD opcional.
- 8.3 Testing final: flujos por rol, validaciones, permisos y responsive.
- 8.4 Presentación: slides, demo y exportación.
- 8.5 Entrega: verificación final y URLs.

---

## Documentación

Índice rápido de documentos clave del proyecto:

- `docs/README.md` (índice de documentación)
- `docs/decisiones.md` (ADRs consolidados)
- `docs/documentacion-checklist.md` (checklist de documentacion pendiente)
- `docs/adr/README.md` (ADRs por archivo)
- `docs/architecture/sad.md` (SAD - arquitectura)
- `docs/architecture/env-vars.md` (variables de entorno por entorno)
- `docs/architecture/database-schema.md` (estructura de base de datos)
- `docs/architecture/deploy.md` (despliegue y CI/CD)
- `.github/workflows/ci.yml` (pipeline de CI)
- `.husky/pre-push` (hook de validaciones pre-push)
- `docs/quality/testing.md` (testing y calidad)
- `docs/frontend/funcional.md` (documento funcional frontend)
- `docs/frontend/tecnico.md` (documento técnico frontend)
- `docs/backend/funcional.md` (documento funcional backend)
- `docs/backend/tecnico.md` (documento técnico backend)
- `openapi.yaml` (contrato API)
- `docs/api/README.md` (guía API)
- Swagger UI para visualizar y validar la API
- `docs/slides/` (presentación)
- `docs/slides/outline.md` (guion de slides)
- `docs/slides/notes.md` (notas de presentación)
- `docs/screenshots/` (capturas)

---

## Estructura del Proyecto

```
teamhub/
├── backend/                         # API Hono
│   ├── src/
│   │   ├── __tests__/
│   │   ├── config/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── shared/
│   │   ├── store/
│   │   ├── validators/
│   │   ├── app.ts
│   │   └── index.ts
│   ├── drizzle.config.ts
│   ├── package.json
│   └── .env.example
├── frontend/                        # Aplicación Next.js
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── providers/
│   │   └── types/
│   ├── e2e/                        # Tests E2E (Playwright)
│   │   ├── demo/                   # Demo automatizada
│   │   ├── explorer-bot/           # Bot explorador
│   │   └── helpers/                # Auth, session, retry
│   ├── package.json
│   └── .env.example
├── context/                         # SQL de referencia
├── docs/                            # Documentación
│   ├── adr/
│   ├── api/
│   ├── architecture/
│   ├── backend/
│   ├── frontend/
│   ├── slides/
│   ├── README.md
│   └── decisiones.md
├── .github/
│   ├── workflows/
│   └── copilot-instructions.md
├── .husky/
├── scripts/
├── openapi.yaml                     # Contrato API
├── package.json
├── package-lock.json
├── README.md
├── CONTRIBUTING.md
├── CHECKLIST.md
├── AGENTS.md
├── claude.md
└── LICENSE
```

---

## Funcionalidades Principales

### 1. Gestión de Usuarios y Autenticación

#### Autenticación
- Alta interna de usuarios por ADMIN/RRHH (contraseña temporal)
- Login con JWT (access token + refresh token) y MFA obligatorio (Google Authenticator)
- Refresh automático de tokens
- Logout con invalidación de sesión
- Recuperación de contraseña por email con token
- Bloqueo tras 3 intentos fallidos (30 minutos) con desbloqueo manual por ADMIN

#### Gestión de Usuarios
- CRUD completo de usuarios
- Roles: ADMIN, RRHH, MANAGER, EMPLEADO
- Soft delete (desactivación)
- Perfil editable
- Cambio de contraseña

### 2. Gestión de Departamentos

- CRUD de departamentos
- Asignación de responsable
- Código único por departamento
- Estadísticas: empleados por departamento
- Vista de empleados por departamento

### 3. Módulo de Onboarding

#### Plantillas de Onboarding
- Crear plantillas reutilizables por departamento/rol
- Definir tareas con:
  - Título y descripción
  - Categoría (documentación, equipamiento, formación, accesos, reuniones)
  - Tipo de responsable (RRHH, Manager, IT, Empleado, Custom)
  - Días desde inicio para fecha límite
  - Obligatoriedad
  - Requisito de evidencia
  - Instrucciones y recursos
  - Dependencias entre tareas
- Ordenar tareas con drag & drop
- Duplicar plantillas

#### Procesos de Onboarding
- Iniciar proceso para nuevo empleado basado en plantilla
- Cálculo automático de fechas límite
- Asignación automática de responsables
- Estados: En curso, Completado, Cancelado, Pausado
- Seguimiento de progreso en tiempo real
- Marcar tareas como completadas con evidencias
- Alertas de tareas vencidas
- Vista "Mis tareas" para responsables
- Vista "Mi onboarding" para empleados nuevos

### 4. Módulo de Proyectos y Asignaciones

#### Gestión de Proyectos
- CRUD de proyectos
- Campos: nombre, descripción, cliente, fechas, presupuesto horas
- Estados: Planificación, Activo, Pausado, Completado, Cancelado
- Código automático (PRJ-001, PRJ-002, etc.)
- Asignación de manager responsable
- Estadísticas de horas consumidas vs presupuesto

#### Asignaciones
- Asignar empleados a proyectos
- Definir rol en el proyecto
- Dedicación (% o horas semanales)
- Fechas de inicio y fin
- Validación: dedicación total no puede superar 100%
- Historial de asignaciones
- Vista de carga de trabajo del equipo

### 5. Módulo de Timetracking

#### Registro de Horas
- Imputar horas por proyecto
- Vista semanal con calendario
- Campos: proyecto, fecha, horas, descripción
- Validaciones:
  - Solo proyectos asignados
  - Máximo 24h por día
  - No fechas futuras
- Copiar registros de días anteriores
- Indicador de estado de aprobación

#### Aprobación de Horas
- Vista para managers de horas pendientes
- Aprobar/rechazar individual o masivamente
- Comentarios en rechazos
- Bloqueo de edición tras aprobación

### 6. Dashboards y Reportes

#### Dashboard ADMIN
- Total usuarios activos
- Usuarios por rol y departamento
- Proyectos por estado
- Horas totales del mes
- Actividad reciente

#### Dashboard RRHH
- Onboardings en curso y completados
- Tiempo medio de onboarding
- Tareas vencidas (alertas)
- Empleados por departamento
- Evolución de altas

#### Dashboard Manager
- Carga del equipo (% ocupación)
- Horas pendientes de aprobar
- Distribución del equipo por proyecto
- Estado de onboardings del equipo

#### Dashboard Empleado
- Mi progreso de onboarding
- Mis proyectos activos
- Mi dedicación total
- Horas del mes (por estado)
- Próximas tareas

---

## Modelo de Datos

### Diagrama Entidad-Relación

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────────┐
│     Usuario     │──────│   Departamento  │      │ PlantillaOnboarding │
├─────────────────┤ N:1  ├─────────────────┤      ├─────────────────────┤
│ id              │      │ id              │      │ id                  │
│ email           │      │ nombre          │      │ nombre              │
│ password        │      │ descripcion     │      │ descripcion         │
│ nombre          │      │ codigo          │      │ departamento_id     │◄─┐
│ apellidos       │      │ responsable_id  │──┐   │ rol_destino         │  │
│ rol             │      │ color           │  │   │ duracion_estimada   │  │
│ departamento_id │──────│ activo          │  │   │ activo              │  │
│ manager_id      │──┐   │ created_at      │  │   │ created_by          │  │
│ avatar_url      │  │   │ updated_at      │  │   │ created_at          │  │
│ activo          │  │   └─────────────────┘  │   │ updated_at          │  │
│ ultimo_acceso   │  │            ▲           │   └─────────────────────┘  │
│ created_at      │  │            │           │              │             │
│ updated_at      │  │            │           │              │ 1:N         │
└─────────────────┘  │            │           │              ▼             │
         │           │            │           │   ┌─────────────────────┐  │
         │           └────────────┼───────────┘   │   TareaPlantilla    │  │
         │ 1:N                    │               ├─────────────────────┤  │
         ▼                        │               │ id                  │  │
┌─────────────────────┐           │               │ plantilla_id        │──┘
│  ProcesoOnboarding  │           │               │ titulo              │
├─────────────────────┤           │               │ descripcion         │
│ id                  │           │               │ categoria           │
│ empleado_id         │───────────┘               │ responsable_tipo    │
│ plantilla_id        │──────────────────────────►│ responsable_id      │
│ fecha_inicio        │                           │ dias_desde_inicio   │
│ fecha_fin_esperada  │                           │ duracion_estimada   │
│ fecha_fin_real      │                           │ orden               │
│ estado              │                           │ obligatoria         │
│ progreso            │                           │ requiere_evidencia  │
│ notas               │                           │ instrucciones       │
│ iniciado_por        │                           │ recursos_url        │
│ created_at          │                           │ dependencias        │
│ updated_at          │                           └─────────────────────┘
└─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐
│   TareaOnboarding   │
├─────────────────────┤
│ id                  │
│ proceso_id          │
│ tarea_plantilla_id  │
│ titulo              │
│ descripcion         │
│ categoria           │
│ responsable_id      │──────────────────────────┐
│ fecha_limite        │                          │
│ estado              │                          │
│ prioridad           │                          │
│ completada_at       │                          │
│ completada_por      │                          │
│ notas               │                          │
│ evidencia_url       │                          │
│ comentarios_rechazo │                          │
│ orden               │                          │
│ created_at          │                          │
│ updated_at          │                          │
└─────────────────────┘                          │
                                                 │
┌─────────────────┐      ┌─────────────────────┐ │  ┌─────────────────────┐
│    Proyecto     │──────│ AsignacionProyecto  │ │  │   RegistroTiempo    │
├─────────────────┤ 1:N  ├─────────────────────┤ │  ├─────────────────────┤
│ id              │      │ id                  │ │  │ id                  │
│ nombre          │      │ proyecto_id         │◄┼──│ proyecto_id         │
│ descripcion     │      │ usuario_id          │─┼──│ usuario_id          │──┘
│ codigo          │      │ rol                 │ │  │ asignacion_id       │
│ cliente         │      │ dedicacion_%        │ │  │ fecha               │
│ fecha_inicio    │      │ horas_semanales     │ │  │ horas               │
│ fecha_fin_est   │      │ fecha_inicio        │ │  │ descripcion         │
│ fecha_fin_real  │      │ fecha_fin           │ │  │ tarea               │
│ estado          │      │ tarifa_hora         │ │  │ estado              │
│ manager_id      │──┐   │ notas               │ │  │ aprobado_por        │
│ presupuesto_h   │  │   │ activo              │ │  │ aprobado_at         │
│ horas_consumid  │  │   │ created_at          │ │  │ comentario_rechazo  │
│ prioridad       │  │   │ updated_at          │ │  │ facturable          │
│ color           │  │   └─────────────────────┘ │  │ created_at          │
│ activo          │  │                           │  │ updated_at          │
│ created_at      │  │                           │  └─────────────────────┘
│ updated_at      │  │                           │
└─────────────────┘  └───────────────────────────┘
```

### Enumeraciones

| Enum | Valores |
|------|---------|
| **UserRole** | ADMIN, RRHH, MANAGER, EMPLEADO |
| **TaskCategory** | DOCUMENTACION, EQUIPAMIENTO, ACCESOS, FORMACION, REUNIONES, ADMINISTRATIVO |
| **ResponsibleType** | RRHH, MANAGER, IT, EMPLEADO, CUSTOM |
| **ProcessStatus** | EN_CURSO, COMPLETADO, CANCELADO, PAUSADO |
| **TaskStatus** | PENDIENTE, EN_PROGRESO, COMPLETADA, BLOQUEADA, CANCELADA |
| **Priority** | BAJA, MEDIA, ALTA, URGENTE |
| **ProjectStatus** | PLANIFICACION, ACTIVO, PAUSADO, COMPLETADO, CANCELADO |
| **TimeEntryStatus** | PENDIENTE, APROBADO, RECHAZADO |

---

## API Reference

### Base URL

- **Desarrollo**: `http://localhost:3001/api`
- **Producción**: `https://teamhub-api.railway.app/api`

### Swagger

La documentacion oficial de la API se mantiene en `openapi.yaml` y se visualiza con Swagger UI.

- UI: `http://localhost:3001/docs`
- Spec: `http://localhost:3001/openapi.yaml`

### Autenticación

Todas las rutas (excepto `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/mfa/verify` y `/auth/change-password`) requieren autenticación mediante Bearer Token en el header `Authorization`.

```
Authorization: Bearer <access_token>
```

### Endpoints

#### Autenticación (`/api/auth`)

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

#### Usuarios (`/api/usuarios`)

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

#### Departamentos (`/api/departamentos`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/departamentos` | Listar departamentos | Autenticado |
| GET | `/departamentos/:id` | Obtener departamento | Autenticado |
| GET | `/departamentos/:id/empleados` | Empleados del departamento | Autenticado |
| GET | `/departamentos/:id/estadisticas` | Estadísticas | ADMIN, RRHH |
| POST | `/departamentos` | Crear departamento | ADMIN, RRHH |
| PUT | `/departamentos/:id` | Actualizar departamento | ADMIN, RRHH |
| DELETE | `/departamentos/:id` | Eliminar departamento | ADMIN |

#### Plantillas de Onboarding (`/api/plantillas`)

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

#### Procesos de Onboarding (`/api/procesos`)

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

#### Proyectos (`/api/proyectos`)

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

#### Timetracking (`/api/timetracking`)

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

#### Dashboard (`/api/dashboard`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/dashboard/admin` | Métricas de admin | ADMIN |
| GET | `/dashboard/rrhh` | Métricas de RRHH | ADMIN, RRHH |
| GET | `/dashboard/manager` | Métricas de manager | ADMIN, MANAGER |
| GET | `/dashboard/empleado` | Métricas de empleado | Autenticado |

### Respuestas de Error

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

## Seguridad

### Autenticación

#### JWT (JSON Web Tokens)
- **Access Token**: Válido por 15 minutos por defecto (configurable), usado para autenticar requests
- **Refresh Token**: Válido por 30 días, usado para obtener nuevos access tokens
- **Rotación de Refresh Tokens**: Al usar un refresh token, se genera uno nuevo
- **MFA**: Obligatorio para todos los usuarios (Google Authenticator)

#### Almacenamiento de Tokens
- **Access Token**: localStorage (frontend)
- **Refresh Token**: localStorage (frontend)

### Autorización

#### Sistema de Roles
- **ADMIN**: Acceso total a todas las funcionalidades
- **RRHH**: Gestión de empleados, departamentos y onboarding
- **MANAGER**: Gestión de su equipo y proyectos
- **EMPLEADO**: Acceso self-service limitado

#### Verificación de Permisos
- Middleware de autorización por roles en cada endpoint
- Verificación de propiedad de recursos
- Principio de mínimo privilegio

### Protección de Datos

#### Passwords
- Hash con bcrypt (12 salt rounds)
- Nunca almacenados en texto plano
- Validación de fortaleza: mínimo 12 caracteres, mayúscula, minúscula, número y carácter especial

#### Rate Limiting
- Login: 3 intentos fallidos -> bloqueo 30 minutos (ADMIN puede desbloquear) y 5/min por IP
- API general: 100 requests por minuto por usuario

### Validación

- **Backend**: Todas las entradas validadas con Zod
- **Frontend**: Validación con Zod + React Hook Form
- **Sanitización**: React escapa HTML por defecto; CSP refuerza mitigación de XSS

### Headers de Seguridad

```
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload (solo en producción)
```

### CORS

Configuración estricta mediante `CORS_ORIGINS` (lista separada por comas).

---

## Testing

### 🧪 Estado de Tests

**Total:** 467/467 tests passing ✅

| Suite | Tests | Estado | Comando |
|-------|-------|--------|---------|
| **Backend** | 226/226 | ✅ | `cd backend && npm test` |
| **Frontend** | 241/241 | ✅ | `cd frontend && npm test` |
| **E2E (Playwright)** | 14 pasos | ✅ | `cd frontend && npm run demo` |

### Backend Tests (Vitest)

#### Ejecutar Tests
```bash
cd backend

# Todos los tests
npm test

# Watch mode
npm run test:watch

# Con coverage
npm run test:coverage
```

#### Cobertura por Módulo
| Módulo | Tests | Descripción |
|--------|-------|-------------|
| Auth | 4 tests | Login, MFA, refresh tokens, bootstrap |
| Auth Service | 28 tests | Hashing, tokens, validación |
| MFA Service | 29 tests | TOTP, encrypt/decrypt, recovery codes |
| Usuarios | 3 tests | CRUD, duplicados, permisos |
| Departamentos | 4 tests | CRUD, soft delete, duplicados |
| Plantillas | 3 tests | Creación con tareas, duplicación |
| Procesos | 2 tests | Iniciar proceso, completar tareas |
| Proyectos | 2 tests | CRUD, asignaciones |
| Timetracking | 1 test | Resumen de horas |
| Dashboard | 1 test | Métricas por rol |
| Tareas Repository | 36 tests | CRUD tareas, jerarquía, dependencias |
| Tareas Service | 44 tests | Lógica de negocio de tareas |
| Validators | 69 tests | Schemas Zod, parsing, validación |

#### Estructura
```
backend/src/
├── __tests__/
│   ├── auth.test.ts           # Autenticación y MFA
│   ├── usuarios.test.ts       # Gestión de usuarios
│   ├── departamentos.test.ts  # Departamentos
│   ├── plantillas.test.ts     # Templates onboarding
│   ├── procesos.test.ts       # Procesos onboarding
│   ├── proyectos.test.ts      # Proyectos y asignaciones
│   ├── timetracking.test.ts   # Registro de horas
│   └── dashboard.test.ts      # Métricas
├── services/__tests__/
│   ├── auth-service.test.ts   # Servicios de auth
│   ├── mfa-service.test.ts    # Servicios MFA
│   ├── tareas-repository.test.ts  # Repositorio tareas
│   └── tareas.service.test.ts # Servicio tareas
└── validators/__tests__/
    └── validators.test.ts     # Schemas y validación
```

### Frontend Tests (Vitest + React Testing Library)

#### Ejecutar Tests
```bash
cd frontend

# Todos los tests
npm test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui
```

#### Cobertura por Tipo
| Categoría | Tests | Descripción |
|-----------|-------|-------------|
| **Hooks** | 143 tests | TanStack Query hooks (100% coverage) |
| - use-auth | 17 tests | Autenticación y sesión |
| - use-empleados | 9 tests | CRUD empleados + byManager/byDepartamento |
| - use-departamentos | 19 tests | CRUD departamentos |
| - use-plantillas | 15 tests | CRUD plantillas + tareas |
| - use-procesos | 20 tests | CRUD procesos + transiciones de estado |
| - use-proyectos | 21 tests | CRUD proyectos + asignaciones |
| - use-tareas | 35 tests | Gestión de tareas jerárquicas |
| - use-timetracking | 22 tests | Registros, aprobaciones, resúmenes |
| **Pages** | 26 tests | Páginas completas con interacciones |
| **Forms** | 8 tests | LoginForm MFA + EmpleadoForm |
| **Components** | 10 tests | Gráficos D3 (BarChart, LineChart) |
| **Lib** | 26 tests | Utilidades (auth, navigation, utils) |
| **Performance** | 13 tests | Rendimiento y optimización |

#### Estructura
```
frontend/src/
├── hooks/__tests__/
│   ├── use-auth.test.tsx           # 17 tests
│   ├── use-empleados.test.tsx      # 9 tests
│   ├── use-departamentos.test.tsx  # 19 tests
│   ├── use-plantillas.test.tsx     # 15 tests
│   ├── use-procesos.test.tsx       # 20 tests
│   ├── use-proyectos.test.tsx      # 21 tests
│   ├── use-tareas.test.tsx         # 35 tests
│   └── use-timetracking.test.tsx   # 22 tests
├── app/(dashboard)/admin/
│   ├── departamentos/__tests__/    # 10 tests
│   └── empleados/__tests__/        # 16 tests (page + detail)
├── components/
│   ├── dashboard/__tests__/
│   │   └── charts.test.tsx         # 10 tests (BarChart + LineChart D3)
│   └── forms/__tests__/
│       ├── login-form.test.tsx     # 1 test (MFA flow)
│       └── empleado-form.test.tsx  # 7 tests
├── __tests__/
│   └── performance.test.tsx        # 13 tests
└── lib/__tests__/
    ├── auth.test.ts                # 9 tests
    ├── navigation.test.ts          # 10 tests
    └── utils.test.ts               # 7 tests
```

### E2E Tests (Playwright)

#### Ejecutar Demo
```bash
cd frontend

# Demo con navegador visible (headed)
npm run demo

# Demo en modo grabación (headless)
npm run demo:record

# Tests E2E estándar
npm run e2e
```

#### Demo Automatizada (14 pasos)
| Paso | Descripción |
|------|-------------|
| 1 | Login MFA visual (ADMIN) |
| 2 | Dashboard Admin (KPIs, scroll) |
| 3 | Crear Departamento |
| 4 | Crear Empleado |
| 5 | Crear Plantilla Onboarding |
| 6 | Iniciar Proceso Onboarding |
| 7 | Crear Proyecto + Asignar Equipo |
| 8 | Timetracking (tabs) |
| 9 | Mis Tareas |
| 10 | Perfil de Usuario |
| 11 | Logout |
| 12 | Login como EMPLEADO (API) |
| 13 | Empleado registra horas |
| 14 | Verificación final |

#### Estructura E2E
```
frontend/e2e/
├── demo/
│   ├── complete-demo.spec.ts       # Demo principal 14 pasos
│   ├── complete-demo-validated.spec.ts  # Demo con validación de pantallas
│   ├── demo.helpers.ts             # Helpers: typing natural, mouse, pauses
│   ├── crud.helpers.ts             # Helpers: CRUD, screenshots, toasts
│   └── monitoring/
│       └── error-detection.ts      # Monitor de errores (consola, red, visual)
├── explorer-bot/                   # Bot explorador automático
├── helpers/
│   └── e2e-session.ts              # Auth API, token cache, retry rate limit
├── login.spec.ts                   # Tests de login
└── navigation.spec.ts              # Tests de navegación
```

**Configuración:** `playwright.demo.config.ts` — 1920x1080, video on, slowMo 100ms, 5min timeout.

### Quality Gates

#### Pre-commit (Husky)
```bash
# Ejecutado automáticamente en cada commit
- Lint staged files (ESLint)
- Format (Prettier si configurado)
```

#### Pre-push (Husky)
```bash
# Ejecutado antes de push
- npm run lint (backend + frontend)
- npm test (todos los tests)
- Type check (tsc --noEmit)
```

#### CI/CD (GitHub Actions)
```yaml
# Ejecutado en cada PR y push a main
- ESLint validation
- TypeScript type check
- All tests (backend + frontend)
- Build verification
```

### Coverage Strategy (ADR-055)

| Prioridad | Coverage Target | Alcance |
|-----------|----------------|---------|
| **CORE** | 100% | Lógica crítica (auth, cálculos, transacciones) |
| **IMPORTANT** | 80% | Features visibles al usuario |
| **INFRASTRUCTURE** | 0% | Tipos, constantes, configs |

---

## Despliegue

### 🌐 URLs de Producción

| Servicio | URL | Estado |
|----------|-----|--------|
| **Frontend** | https://teamhub-tfm.vercel.app | ✅ Desplegado |
| **Backend API** | https://teamhub-backend-production.up.railway.app | ✅ Desplegado |
| **Base de Datos** | Aiven PostgreSQL (managed) | ✅ Activo |
| **Swagger UI** | https://teamhub-backend-production.up.railway.app/docs | ✅ Disponible |

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
NEXT_PUBLIC_API_URL=https://teamhub-backend-production.up.railway.app/api
NEXT_PUBLIC_APP_URL=https://teamhub-tfm.vercel.app
```

#### Despliegue Manual
```bash
cd frontend
npm run build
vercel --prod
```

### Backend (Render → Railway)

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

## Troubleshooting

### Errores Comunes

#### Error: "ECONNREFUSED" al conectar a PostgreSQL

**Causa**: PostgreSQL no está disponible en la URL configurada o el servicio está caído.

**Solución**:
```bash
# Verificar conectividad/credenciales de DATABASE_URL
# Si usas Docker, revisa el contenedor y logs:
docker ps
docker logs teamhub-postgres
```

#### Error: "Invalid token" o "jwt expired"

**Causa**: Token expirado o inválido.

**Solución**:
- El frontend debería refrescar el token automáticamente
- Si persiste, hacer logout y login de nuevo
- Verificar que `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` son los mismos en desarrollo y en el token

#### Error: "CORS policy" en el navegador

**Causa**: El backend no está configurado para aceptar requests del origen del frontend.

**Solución**:
```env
# Backend .env
CORS_ORIGINS=http://localhost:3000
```

#### Error: "Module not found" al arrancar

**Causa**: Dependencias no instaladas o desactualizadas.

**Solución**:
```bash
# Limpiar e instalar de nuevo
rm -rf node_modules
npm install
```

#### Error: "Migration failed"

**Causa**: Base de datos en estado inconsistente o migración con errores.

**Solución**:
```bash
# Reaplicar migraciones en desarrollo
npm run db:migrate
npm run db:triggers
npm run db:seed
```

### Logs y Debugging

#### Backend
```bash
# Ver logs en desarrollo
npm run dev

# En Railway
railway logs
```

#### Frontend
```bash
# Verificar errores de build
npm run build

# En Vercel
# Ver logs en el dashboard de Vercel
```

#### Base de datos
```bash
# Abrir Drizzle Studio para inspeccionar datos
npm run db:studio

# Conectar directamente con psql
# (si usas Docker)
docker exec -it teamhub-postgres psql -U teamhub -d teamhub
```

---

## Roadmap y Mejoras Futuras

### Corto Plazo (v1.1)
- [ ] Notificaciones por email (tareas vencidas, asignaciones)
- [ ] Exportación de reportes a PDF/Excel
- [x] Modo oscuro (completado — ADR-093, auditoría completa de dark mode en todas las pantallas)

### Medio Plazo (v1.2)
- [ ] Integración con proveedores de identidad (Google, Microsoft)
- [ ] Integración con Slack/Teams para notificaciones
- [ ] Firma digital de documentos de onboarding
- [ ] Comentarios en tareas de onboarding

### Largo Plazo (v2.0)
- [ ] App móvil con React Native
- [ ] Integración con calendarios externos
- [ ] Workflows personalizables
- [ ] Módulo de evaluación de desempeño
- [ ] Analytics avanzado y predicciones

---

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para guías de contribución.

### Proceso
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'feat: añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Convenciones de Commits
Seguimos [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Formateo, sin cambios de código
- `refactor:` Refactorización
- `test:` Tests
- `chore:` Mantenimiento

---

## Autor

**[Tu Nombre]**

Trabajo de Fin de Máster - Máster en Desarrollo con IA
BIG School
Febrero 2025

---

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

```
MIT License

Copyright (c) 2025 [Tu Nombre]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
