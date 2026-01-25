# TeamHub - Checklist de Desarrollo

## Resumen de Planificación

| Fase | Descripción | Horas Est. | Estado |
|------|-------------|------------|--------|
| 0 | Setup inicial del proyecto | 6h | ⬜ |
| 1 | Autenticación y usuarios | 10h | ⬜ |
| 2 | Departamentos y empleados | 8h | ⬜ |
| 3 | Onboarding (plantillas y procesos) | 12h | ⬜ |
| 4 | Proyectos y asignaciones | 10h | ⬜ |
| 5 | Timetracking | 8h | ⬜ |
| 6 | Dashboards y reportes | 6h | ⬜ |
| 7 | Testing y calidad | 4h | ⬜ |
| 8 | Documentación, deploy y presentación | 6h | 🟡 |
| **Total** | | **70h** | |

**Leyenda:** ⬜ Pendiente | 🟡 En progreso | ✅ Completado

---

## Checklist de Implementacion Backend (Ejecucion Actual)

### Fase 0: Preparacion y pruebas
- [x] Revisar fuentes de verdad (docs/adr, OpenAPI, reglas de negocio) y gaps.
- [x] Definir alcance y estrategia de persistencia (Drizzle vs store) y actualizar `docs/decisiones.md`.
- [x] Preparar entorno de BD de pruebas (migraciones, seed, config) o alternativa para tests.

### Fase 1: Auth y Usuarios
- [x] Migrar Auth a DB (login, MFA, refresh/reset) con validaciones y tests.
- [x] Migrar Usuarios (CRUD, password, unlock) con RBAC y tests.

### Fase 2: Dominios principales
- [x] Migrar Departamentos con tests.
- [x] Migrar Plantillas con tests.
- [x] Migrar Procesos con tests.
- [x] Migrar Proyectos/Asignaciones con tests.
- [x] Migrar Timetracking con tests.

### Fase 3: Dashboards
- [x] Implementar Dashboards con metricas reales y tests.

### Fase 4: Hardening y documentacion
- [ ] Endurecer seguridad (RBAC, rate limiting, headers, Zod) y revisar regresiones.
- [ ] Actualizar OpenAPI y docs backend segun cambios.
- [ ] Ejecutar lint/tests y resolver fallos.
- [x] Exponer Swagger UI en `/docs` y servir `openapi.yaml` en `/openapi.yaml`.

---

## Resumen por Subfases

### Fase 0: Setup Inicial del Proyecto
- 0.1 Estructura del repositorio: repo en GitHub, ramas/protecciones, monorepo, .gitignore y documentación inicial.
- 0.2 Setup backend: init Node+TS, dependencias, tsconfig, linting, estructura de carpetas, scripts y entry point Hono.
- 0.3 Setup frontend: crear Next.js, instalar dependencias, shadcn/ui, estructura, env y verificación de arranque.
- 0.4 Setup base de datos: docker-compose, Drizzle config, conexión y migración inicial.
- 0.5 Configuración de desarrollo: .env.example, husky/lint-staged opcional y documentación de setup.

### Fase 1: Autenticación y Usuarios
- 1.1 Modelo de usuarios: esquema users, enum de roles y migraciones.
- 1.2 Backend auth: servicio de tokens/hashed, schemas Zod y rutas de auth.
- 1.3 Middlewares: autenticación, autorización por roles y rate limit en login.
- 1.4 CRUD usuarios: servicios y rutas con filtros, soft delete, cambio de password y tests.
- 1.5 Frontend auth: API client con interceptores, provider, login/registro y ProtectedRoute.
- 1.6 Layout principal: layout de dashboard, sidebar/header, navegación por roles y perfil.
- 1.7 Seed de datos: usuarios base por rol y verificación de acceso.

### Fase 2: Departamentos y Empleados
- 2.1 Modelo de departamentos: esquema, relaciones con users y migraciones.
- 2.2 Backend departamentos: servicio, schemas, rutas con permisos y tests.
- 2.3 Frontend departamentos: hooks, listado, crear/editar y eliminación con reasignación.
- 2.4 Frontend empleados: hooks, listado con filtros, alta/edición y detalle.
- 2.5 Seed adicional: departamentos y empleados de ejemplo.

### Fase 3: Onboarding - Plantillas y Procesos
- 3.1 Modelo de plantillas: esquema de plantillas y tareas, enums y migraciones.
- 3.2 Modelo de procesos: esquema de procesos y tareas, enums y migraciones.
- 3.3 Backend plantillas: servicios, schemas y rutas (CRUD, tareas, reordenar, duplicar).
- 3.4 Backend procesos: servicios, schemas y rutas (crear procesos, tareas, estado, stats).
- 3.5 Frontend plantillas: hooks, listado y editor con tareas y dependencias.
- 3.6 Frontend procesos: listado, detalle, iniciar proceso y panel de tareas.
- 3.7 Frontend mis tareas: vista personal, filtros, alertas y "Mi onboarding".
- 3.8 Seed onboarding: plantillas y procesos de ejemplo.

### Fase 4: Proyectos y Asignaciones
- 4.1 Modelo de datos: esquema de proyectos y asignaciones, enums y migraciones.
- 4.2 Backend proyectos/asignaciones: servicios, schemas y rutas con validaciones.
- 4.3 Frontend proyectos: hooks, listado, detalle y formularios.
- 4.4 Frontend asignaciones: gestión de equipo, asignación y carga de trabajo.
- 4.5 Seed proyectos: proyectos y asignaciones de ejemplo.

### Fase 5: Timetracking
- 5.1 Modelo de datos: esquema de registros de tiempo, enums, constraints y migraciones.
- 5.2 Backend timetracking: servicios, schemas y rutas de registro y aprobación.
- 5.3 Frontend registro: hooks, vista semanal/mensual y formulario de horas.
- 5.4 Frontend aprobación: panel manager, acciones masivas y vistas agrupadas.
- 5.5 Frontend resumen: widgets personales y gráficos de horas.
- 5.6 Seed timetracking: registros de ejemplo en varios estados.

### Fase 6: Dashboards y Reportes
- 6.1 Backend métricas: endpoints por rol con KPIs y alertas.
- 6.2 Frontend admin: KPIs, gráficos y actividad reciente.
- 6.3 Frontend RRHH: KPIs, alertas y métricas de onboarding.
- 6.4 Frontend manager: KPIs, carga de equipo y horas pendientes.
- 6.5 Frontend empleado: KPIs personales y accesos rápidos.
- 6.6 Componentes compartidos: gráficos y tarjetas KPI reutilizables.
- 6.7 Navegación por rol: redirecciones y menú lateral dinámico.

### Fase 7: Testing y Calidad
- 7.1 Backend tests: configuración, servicios y endpoints críticos.
- 7.2 Frontend tests: configuración, mocks y componentes clave.
- 7.3 Calidad: linting, type-check y revisión de seguridad.

### Fase 8: Documentación, Deploy y Presentación
- 8.1 Documentación: README, troubleshooting, variables y arquitectura.
- 8.2 Deploy: Vercel, Railway y CI/CD opcional.
- 8.3 Testing final: flujos por rol, validaciones, permisos y responsive.
- 8.4 Presentación: slides, demo y exportación.
- 8.5 Entrega: verificación final y URLs.

---

## Fase 0: Setup Inicial del Proyecto (6h)

### 0.1 Estructura del Repositorio

#### 0.1.1 Crear Repositorio
- [ ] Crear repositorio en GitHub
- [ ] Configurar rama principal (main)
- [ ] Configurar protección de rama main
- [ ] Crear rama develop para desarrollo

#### 0.1.2 Estructura de Carpetas
- [ ] Crear estructura de carpetas (monorepo)
  ```
  teamhub/
  ├── frontend/
  ├── backend/
  ├── docs/
  └── .github/
  ```
- [ ] Configurar .gitignore global
- [ ] Configurar .gitignore para backend (node_modules, .env, dist)
- [ ] Configurar .gitignore para frontend (node_modules, .env.local, .next)

#### 0.1.3 Documentación Inicial
- [ ] Crear README.md inicial
- [ ] Crear archivo LICENSE (MIT)
- [ ] Crear CONTRIBUTING.md básico
- [ ] Crear plantilla de issues en .github/ISSUE_TEMPLATE/

### 0.2 Setup Backend

#### 0.2.1 Inicialización del Proyecto
- [x] Crear directorio backend
- [x] Inicializar proyecto Node.js con TypeScript
  ```bash
  mkdir backend && cd backend
  npm init -y
  ```
- [ ] Instalar dependencias de producción
  ```bash
  npm install hono @hono/node-server
  npm install drizzle-orm postgres
  npm install zod jsonwebtoken bcryptjs
  npm install dotenv
  ```
- [ ] Instalar dependencias de desarrollo
  ```bash
  npm install -D typescript @types/node
  npm install -D @types/jsonwebtoken @types/bcryptjs
  npm install -D drizzle-kit tsx
  npm install -D vitest @vitest/coverage-v8
  ```
  - Nota: bloqueado por `EAI_AGAIN` en `registry.npmjs.org`.

#### 0.2.2 Configuración de TypeScript
- [x] Crear tsconfig.json con configuración estricta
- [x] Configurar paths aliases (@/ para src/)
- [x] Configurar target ES2022 y moduleResolution NodeNext

#### 0.2.3 Configuración de Linting
- [ ] Instalar ESLint y plugins
  ```bash
  npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
  ```
- [x] Crear archivo .eslintrc.cjs
- [ ] Instalar y configurar Prettier
  ```bash
  npm install -D prettier eslint-config-prettier
  ```
- [ ] Crear archivo .prettierrc

#### 0.2.4 Estructura de Carpetas Backend
- [x] Crear estructura de carpetas
  ```
  src/
  ├── routes/
  ├── services/
  ├── middleware/
  ├── db/
  │   ├── schema/
  │   └── migrations/
  ├── types/
  ├── utils/
  └── index.ts
  ```

#### 0.2.5 Configuración de Scripts
- [x] Configurar script dev (tsx watch)
- [x] Configurar script build (tsc)
- [x] Configurar script start (node dist/index.js)
- [x] Configurar script lint
- [x] Configurar script test
- [x] Configurar scripts de base de datos (db:migrate, db:seed, db:studio)

#### 0.2.6 Entry Point
- [x] Crear archivo de entrada (src/index.ts)
- [x] Configurar servidor Hono básico
- [x] Configurar CORS
- [x] Configurar manejo de errores global
- [ ] Verificar que el servidor arranca en puerto 3001

### 0.3 Setup Frontend

#### 0.3.1 Crear Proyecto Next.js
- [x] Crear scaffold Next.js 14 con App Router (manual)
  - Nota: `npx create-next-app@latest` fallo por `EAI_AGAIN`.
  ```bash
  npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir
  ```

#### 0.3.2 Instalar Dependencias
- [ ] Instalar TanStack Query
  ```bash
  npm install @tanstack/react-query @tanstack/react-query-devtools
  ```
- [ ] Instalar Axios
  ```bash
  npm install axios
  ```
- [ ] Instalar React Hook Form y Zod
  ```bash
  npm install react-hook-form @hookform/resolvers zod
  ```
- [ ] Instalar iconos
  ```bash
  npm install lucide-react
  ```
- [ ] Instalar utilidades
  ```bash
  npm install clsx tailwind-merge date-fns
  ```
- [ ] Instalar toast notifications
  ```bash
  npm install sonner
  ```

#### 0.3.3 Configurar shadcn/ui
- [ ] Inicializar shadcn/ui
  ```bash
  npx shadcn-ui@latest init
  ```
- [ ] Instalar componentes base
  ```bash
  npx shadcn-ui@latest add button input label card
  npx shadcn-ui@latest add form select textarea
  npx shadcn-ui@latest add dialog alert-dialog dropdown-menu
  npx shadcn-ui@latest add table tabs avatar badge
  npx shadcn-ui@latest add skeleton toast
  ```

#### 0.3.4 Estructura de Carpetas Frontend
- [x] Crear estructura de carpetas
  ```
  src/
  ├── app/
  │   ├── (auth)/
  │   └── (dashboard)/
  ├── components/
  │   ├── ui/
  │   ├── forms/
  │   ├── tables/
  │   └── layout/
  ├── hooks/
  ├── lib/
  ├── types/
  └── providers/
  ```

#### 0.3.5 Configuración de Variables de Entorno
- [ ] Crear archivo .env.local
- [ ] Definir NEXT_PUBLIC_API_URL
- [x] Crear archivos .env.example por entorno (development/production/test)

#### 0.3.6 Verificación
- [ ] Verificar que el frontend arranca en puerto 3000
- [ ] Verificar que Tailwind CSS funciona
- [ ] Verificar que los componentes shadcn se renderizan

### 0.4 Setup Base de Datos

#### 0.4.1 Docker Compose
- [ ] Crear docker-compose.yml
  ```yaml
  services:
    postgres:
      image: postgres:16
      environment:
        POSTGRES_USER: teamhub
        POSTGRES_PASSWORD: teamhub_dev
        POSTGRES_DB: teamhub
      ports:
        - "5432:5432"
      volumes:
        - postgres_data:/var/lib/postgresql/data
  ```
- [ ] Crear archivo .dockerignore

#### 0.4.2 Configuración Drizzle ORM
- [ ] Crear archivo drizzle.config.ts
- [ ] Configurar conexión a PostgreSQL
- [ ] Crear archivo de conexión (db/index.ts)

#### 0.4.3 Verificación
- [ ] Levantar PostgreSQL con Docker
- [ ] Verificar conexión desde backend
- [ ] Crear migración inicial vacía
- [ ] Ejecutar migración inicial

### 0.5 Configuración de Desarrollo

#### 0.5.1 Variables de Entorno
- [x] Crear .env.example para backend (development/production/test)
  ```
  NODE_ENV=development
  PORT=3001
  DATABASE_URL=postgresql://user:password@localhost:5432/teamhub
  JWT_ACCESS_SECRET=replace_me
  JWT_REFRESH_SECRET=replace_me
  JWT_ACCESS_EXPIRES_IN=7d
  JWT_REFRESH_EXPIRES_IN=30d
  BCRYPT_SALT_ROUNDS=12
  MFA_ISSUER=TeamHub
  CORS_ORIGINS=http://localhost:3000
  SMTP_HOST=smtp.example.com
  SMTP_PORT=587
  SMTP_USER=replace_me
  SMTP_PASS=replace_me
  SMTP_FROM=TeamHub <no-reply@teamhub.com>
  APP_BASE_URL=http://localhost:3000
  LOG_LEVEL=info
  RATE_LIMIT_WINDOW_MS=60000
  RATE_LIMIT_MAX=100
  LOGIN_RATE_LIMIT_WINDOW_MS=60000
  LOGIN_RATE_LIMIT_MAX=5
  ```
- [x] Crear .env.example para frontend (development/production/test)
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3001/api
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

#### 0.5.2 Git Hooks (Opcional)
- [x] Instalar Husky
  ```bash
  npm install -D husky
  npx husky init
  ```
- [ ] Instalar lint-staged
  ```bash
  npm install -D lint-staged
  ```
- [ ] Configurar pre-commit hook para linting
- [x] Configurar pre-push hook para validaciones

#### 0.5.3 Documentación
- [ ] Documentar proceso de setup en README
- [ ] Documentar comandos disponibles
- [ ] Documentar estructura del proyecto

---

## Fase 1: Autenticación y Usuarios (10h)

### 1.1 Modelo de Datos - Usuarios

#### 1.1.1 Definir Esquema
- [ ] Crear archivo db/schema/users.ts
- [ ] Definir tabla users con campos:
  - [ ] id (uuid, primary key)
  - [ ] email (varchar, unique, not null)
  - [ ] password (varchar, not null)
  - [ ] nombre (varchar, not null)
  - [ ] apellidos (varchar)
  - [ ] rol (enum, not null, default EMPLEADO)
  - [ ] departamento_id (uuid, foreign key)
  - [ ] manager_id (uuid, self-reference)
  - [ ] avatar_url (varchar)
  - [ ] activo (boolean, default true)
  - [ ] ultimo_acceso (timestamp)
  - [ ] created_at (timestamp)
  - [ ] updated_at (timestamp)

#### 1.1.2 Definir Enums
- [ ] Crear enum userRoleEnum con valores:
  - ADMIN
  - RRHH
  - MANAGER
  - EMPLEADO

#### 1.1.3 Migraciones
- [ ] Crear migración para tabla users
- [ ] Ejecutar migración
- [ ] Verificar tabla en PostgreSQL

### 1.2 Backend - Servicio de Autenticación

#### 1.2.1 Crear Servicio (services/auth-service.ts)
- [ ] Implementar función hashPassword (bcrypt, 12 rounds)
- [ ] Implementar función comparePassword
- [ ] Implementar función generateAccessToken (JWT)
- [ ] Implementar función generateRefreshToken (JWT)
- [ ] Implementar función verifyAccessToken
- [ ] Implementar función verifyRefreshToken
- [ ] Implementar función rotateRefreshToken

#### 1.2.2 Crear Schemas de Validación (types/auth-schemas.ts)
- [ ] Schema registerSchema
  - [ ] email (email válido)
  - [ ] password (min 8, mayúscula, minúscula, número)
  - [ ] nombre (min 2, max 100)
  - [ ] apellidos (max 100, opcional)
- [ ] Schema loginSchema
  - [ ] email (email válido)
  - [ ] password (min 1)
- [ ] Schema refreshTokenSchema
- [ ] Schema forgotPasswordSchema
- [ ] Schema resetPasswordSchema

#### 1.2.3 Crear Rutas (routes/auth.ts)
- [ ] POST /api/auth/register
  - [ ] Validar datos con Zod
  - [ ] Verificar email no existe
  - [ ] Hashear password
  - [ ] Crear usuario
  - [ ] Generar tokens
  - [ ] Retornar usuario y tokens
- [ ] POST /api/auth/login
  - [ ] Validar datos con Zod
  - [ ] Buscar usuario por email
  - [ ] Verificar password
  - [ ] Verificar usuario activo
  - [ ] Actualizar ultimo_acceso
  - [ ] Generar tokens
  - [ ] Retornar usuario y tokens
- [ ] POST /api/auth/refresh
  - [ ] Validar refresh token
  - [ ] Generar nuevos tokens (rotación)
  - [ ] Retornar tokens
- [ ] POST /api/auth/logout
  - [ ] Invalidar refresh token (si se implementa blacklist)
  - [ ] Retornar confirmación
- [ ] GET /api/auth/me
  - [ ] Requerir autenticación
  - [ ] Retornar usuario actual sin password
- [ ] POST /api/auth/forgot-password (opcional MVP)
- [ ] POST /api/auth/reset-password (opcional MVP)

### 1.3 Backend - Middlewares

#### 1.3.1 Middleware de Autenticación (middleware/auth.ts)
- [ ] Extraer token del header Authorization
- [ ] Verificar formato "Bearer <token>"
- [ ] Validar token JWT
- [ ] Obtener usuario de la base de datos
- [ ] Verificar usuario activo
- [ ] Añadir usuario al contexto (c.set('user', user))

#### 1.3.2 Middleware de Autorización (middleware/roles.ts)
- [ ] Crear función requireRoles(roles: UserRole[])
- [ ] Verificar que usuario tiene uno de los roles permitidos
- [ ] Retornar 403 si no tiene permisos

#### 1.3.3 Middleware de Rate Limiting (middleware/rate-limit.ts)
- [ ] Implementar rate limiting básico para /auth/login
- [ ] Límite: 5 intentos por minuto por IP
- [ ] Retornar 429 si excede límite

### 1.4 Backend - CRUD Usuarios

#### 1.4.1 Crear Servicio (services/user-service.ts)
- [ ] getAll(filters, pagination)
- [ ] getById(id)
- [ ] getByEmail(email)
- [ ] create(data)
- [ ] update(id, data)
- [ ] softDelete(id)
- [ ] restore(id)
- [ ] changePassword(id, oldPassword, newPassword)
- [ ] updateLastAccess(id)

#### 1.4.2 Crear Rutas (routes/usuarios.ts)
- [ ] GET /api/usuarios
  - [ ] Requiere ADMIN o RRHH
  - [ ] Filtros: departamento, rol, activo, búsqueda
  - [ ] Paginación: page, limit
  - [ ] Ordenación: sortBy, sortOrder
- [ ] GET /api/usuarios/:id
  - [ ] Requiere autenticación
  - [ ] EMPLEADO solo puede ver su propio perfil
  - [ ] MANAGER puede ver su equipo
- [ ] POST /api/usuarios (crear desde panel admin)
  - [ ] Requiere ADMIN o RRHH
  - [ ] Validar datos
  - [ ] Generar password temporal o enviar invitación
- [ ] PUT /api/usuarios/:id
  - [ ] Requiere autenticación
  - [ ] EMPLEADO solo puede editar su perfil (campos limitados)
  - [ ] ADMIN/RRHH pueden editar todo
- [ ] PATCH /api/usuarios/:id/password
  - [ ] Requiere autenticación
  - [ ] Validar password actual
  - [ ] Cambiar password
- [ ] DELETE /api/usuarios/:id
  - [ ] Requiere ADMIN
  - [ ] Soft delete (marcar activo = false)
- [ ] PATCH /api/usuarios/:id/restore
  - [ ] Requiere ADMIN
  - [ ] Restaurar usuario (activo = true)

#### 1.4.3 Testing de Endpoints
- [ ] Testear registro con datos válidos
- [ ] Testear registro con email duplicado
- [ ] Testear login con credenciales válidas
- [ ] Testear login con credenciales inválidas
- [ ] Testear refresh token
- [ ] Testear acceso a rutas protegidas
- [ ] Testear autorización por roles

### 1.5 Frontend - Autenticación

#### 1.5.1 Cliente API (lib/api.ts)
- [ ] Crear instancia de Axios
- [ ] Configurar baseURL desde env
- [ ] Configurar interceptor de request para añadir token
- [ ] Configurar interceptor de response para errores
- [ ] Implementar lógica de refresh token automático
- [ ] Implementar redirección a login en 401

#### 1.5.2 Contexto de Autenticación (providers/auth-provider.tsx)
- [ ] Crear AuthContext con:
  - [ ] user: User | null
  - [ ] isAuthenticated: boolean
  - [ ] isLoading: boolean
  - [ ] login(email, password)
  - [ ] register(data)
  - [ ] logout()
  - [ ] refreshUser()
- [ ] Persistir token en localStorage
- [ ] Cargar usuario al montar

#### 1.5.3 Hook useAuth (hooks/use-auth.ts)
- [ ] Crear hook que consume AuthContext
- [ ] Validar que se usa dentro del provider

#### 1.5.4 Página de Login (/login)
- [ ] Crear página app/(auth)/login/page.tsx
- [ ] Crear componente LoginForm
  - [ ] Campo email con validación
  - [ ] Campo password con show/hide
  - [ ] Botón de submit con loading
  - [ ] Enlace a registro
  - [ ] Enlace a recuperar contraseña
- [ ] Implementar validación con Zod
- [ ] Implementar manejo de errores
- [ ] Redirigir a dashboard tras login

#### 1.5.5 Página de Registro (/register)
- [ ] Crear página app/(auth)/register/page.tsx
- [ ] Crear componente RegisterForm
  - [ ] Campo nombre
  - [ ] Campo apellidos
  - [ ] Campo email
  - [ ] Campo password con indicador de fortaleza
  - [ ] Campo confirmar password
  - [ ] Checkbox términos y condiciones
- [ ] Implementar validación
- [ ] Redirigir a login tras registro

#### 1.5.6 Componente ProtectedRoute
- [ ] Crear componente que verifica autenticación
- [ ] Redirigir a login si no autenticado
- [ ] Mostrar loading mientras verifica

### 1.6 Frontend - Layout Principal

#### 1.6.1 Layout de Dashboard (app/(dashboard)/layout.tsx)
- [ ] Crear layout con Sidebar y Header
- [ ] Envolver con ProtectedRoute
- [ ] Configurar QueryClientProvider

#### 1.6.2 Componente Sidebar (components/layout/sidebar.tsx)
- [ ] Logo y nombre de la app
- [ ] Navegación principal
  - [ ] Dashboard
  - [ ] Onboarding
  - [ ] Proyectos
  - [ ] Timetracking
  - [ ] Administración (condicional)
- [ ] Indicador de sección activa
- [ ] Versión responsive (móvil)

#### 1.6.3 Componente Header (components/layout/header.tsx)
- [ ] Breadcrumb de navegación
- [ ] Buscador global (opcional)
- [ ] Notificaciones (placeholder)
- [ ] Menú de usuario (avatar + dropdown)
  - [ ] Mi perfil
  - [ ] Configuración
  - [ ] Cerrar sesión

#### 1.6.4 Navegación por Roles
- [ ] Implementar hook usePermissions
- [ ] Ocultar/mostrar items según rol
- [ ] Redirigir a página por defecto según rol

#### 1.6.5 Página de Perfil (/perfil)
- [ ] Crear página de perfil de usuario
- [ ] Mostrar información del usuario
- [ ] Formulario de edición
- [ ] Cambio de contraseña
- [ ] Subida de avatar (opcional)

### 1.7 Seed de Datos

#### 1.7.1 Crear Script de Seed (db/seed.ts)
- [ ] Crear usuario admin
  - email: admin@teamhub.com
  - password: Admin123!
  - rol: ADMIN
- [ ] Crear usuario RRHH
  - email: rrhh@teamhub.com
  - password: Rrhh123!
  - rol: RRHH
- [ ] Crear usuario manager
  - email: manager@teamhub.com
  - password: Manager123!
  - rol: MANAGER
- [ ] Crear usuarios empleados de ejemplo (3-5)

#### 1.7.2 Ejecutar y Verificar
- [ ] Ejecutar seed
- [ ] Verificar usuarios en base de datos
- [ ] Probar login con cada rol

---

## Fase 2: Departamentos y Empleados (8h)

### 2.1 Modelo de Datos - Departamentos

#### 2.1.1 Definir Esquema
- [ ] Crear archivo db/schema/departamentos.ts
- [ ] Definir tabla departamentos con campos:
  - [ ] id (uuid, primary key)
  - [ ] nombre (varchar, unique, not null)
  - [ ] descripcion (text)
  - [ ] codigo (varchar, unique) - ej: "IT", "RRHH", "VENTAS"
  - [ ] responsable_id (uuid, foreign key a users)
  - [ ] color (varchar) - para UI
  - [ ] activo (boolean, default true)
  - [ ] created_at (timestamp)
  - [ ] updated_at (timestamp)

#### 2.1.2 Actualizar Relaciones
- [ ] Añadir relación departamento en users
- [ ] Configurar foreign key con ON DELETE SET NULL

#### 2.1.3 Migraciones
- [ ] Crear migración para tabla departamentos
- [ ] Crear migración para añadir FK en users
- [ ] Ejecutar migraciones

### 2.2 Backend - CRUD Departamentos

#### 2.2.1 Crear Servicio (services/departamento-service.ts)
- [ ] getAll(filters)
- [ ] getById(id)
- [ ] getByIdWithEmpleados(id)
- [ ] create(data)
- [ ] update(id, data)
- [ ] softDelete(id)
- [ ] countEmpleados(id)
- [ ] getEstadisticas(id)

#### 2.2.2 Crear Schemas de Validación
- [ ] createDepartamentoSchema
- [ ] updateDepartamentoSchema
- [ ] departamentoFiltersSchema

#### 2.2.3 Crear Rutas (routes/departamentos.ts)
- [ ] GET /api/departamentos
  - [ ] Requiere autenticación
  - [ ] Filtros: activo, búsqueda
  - [ ] Incluir conteo de empleados
- [ ] GET /api/departamentos/:id
  - [ ] Incluir responsable
- [ ] GET /api/departamentos/:id/empleados
  - [ ] Listar empleados del departamento
  - [ ] Paginación
- [ ] GET /api/departamentos/:id/estadisticas
  - [ ] Total empleados
  - [ ] Empleados por rol
  - [ ] Onboardings activos
- [ ] POST /api/departamentos
  - [ ] Requiere ADMIN o RRHH
  - [ ] Validar nombre único
- [ ] PUT /api/departamentos/:id
  - [ ] Requiere ADMIN o RRHH
- [ ] DELETE /api/departamentos/:id
  - [ ] Requiere ADMIN
  - [ ] Validar no tiene empleados activos (o reasignar)
  - [ ] Soft delete

#### 2.2.4 Testing de Endpoints
- [ ] Testear CRUD completo
- [ ] Testear filtros
- [ ] Testear validaciones
- [ ] Testear permisos

### 2.3 Frontend - Gestión de Departamentos

#### 2.3.1 Hook useDepartamentos (hooks/use-departamentos.ts)
- [ ] useDepartamentos() - listar
- [ ] useDepartamento(id) - obtener uno
- [ ] useCreateDepartamento() - mutation
- [ ] useUpdateDepartamento() - mutation
- [ ] useDeleteDepartamento() - mutation

#### 2.3.2 Página de Listado (/admin/departamentos)
- [ ] Crear página app/(dashboard)/admin/departamentos/page.tsx
- [ ] Tabla de departamentos
  - [ ] Columnas: nombre, código, responsable, empleados, estado
  - [ ] Ordenación por columnas
  - [ ] Búsqueda
- [ ] Botón crear departamento
- [ ] Acciones por fila: ver, editar, eliminar

#### 2.3.3 Modal/Página Crear Departamento
- [ ] Formulario con campos:
  - [ ] Nombre
  - [ ] Código
  - [ ] Descripción
  - [ ] Responsable (select de usuarios con rol MANAGER o superior)
  - [ ] Color (color picker)
- [ ] Validación
- [ ] Feedback de éxito/error

#### 2.3.4 Modal/Página Editar Departamento
- [ ] Cargar datos existentes
- [ ] Mismos campos que crear
- [ ] Mostrar estadísticas del departamento

#### 2.3.5 Diálogo de Eliminación
- [ ] Confirmación con mensaje
- [ ] Mostrar número de empleados afectados
- [ ] Opción de reasignar empleados

### 2.4 Frontend - Gestión de Empleados

#### 2.4.1 Hook useEmpleados (hooks/use-empleados.ts)
- [ ] useEmpleados(filters) - listar con filtros
- [ ] useEmpleado(id) - obtener uno
- [ ] useCreateEmpleado() - mutation
- [ ] useUpdateEmpleado() - mutation
- [ ] useDeleteEmpleado() - mutation
- [ ] useEmpleadosByDepartamento(depId)
- [ ] useEmpleadosByManager(managerId)

#### 2.4.2 Página de Listado (/admin/empleados)
- [ ] Crear página app/(dashboard)/admin/empleados/page.tsx
- [ ] Tabla de empleados con columnas:
  - [ ] Avatar + nombre
  - [ ] Email
  - [ ] Departamento
  - [ ] Rol
  - [ ] Manager
  - [ ] Estado
  - [ ] Fecha alta
- [ ] Filtros:
  - [ ] Por departamento (select)
  - [ ] Por rol (select)
  - [ ] Por estado (activo/inactivo)
  - [ ] Búsqueda por nombre/email
- [ ] Paginación
- [ ] Exportar a CSV (opcional)

#### 2.4.3 Modal/Página Crear Empleado
- [ ] Formulario con campos:
  - [ ] Nombre
  - [ ] Apellidos
  - [ ] Email
  - [ ] Password temporal (o enviar invitación)
  - [ ] Rol (select)
  - [ ] Departamento (select)
  - [ ] Manager (select filtrado por departamento)
- [ ] Validación
- [ ] Opción de iniciar onboarding al crear

#### 2.4.4 Modal/Página Editar Empleado
- [ ] Cargar datos existentes
- [ ] Todos los campos editables (según permisos)
- [ ] Historial de cambios de departamento
- [ ] Botón para resetear contraseña
- [ ] Botón para desactivar/reactivar

#### 2.4.5 Vista de Detalle de Empleado (/admin/empleados/:id)
- [ ] Información personal
- [ ] Departamento y manager
- [ ] Proyectos asignados
- [ ] Onboarding (si tiene)
- [ ] Historial de horas
- [ ] Timeline de actividad

### 2.5 Seed Adicional

#### 2.5.1 Departamentos de Ejemplo
- [ ] Tecnología (IT)
- [ ] Recursos Humanos (RRHH)
- [ ] Ventas (SALES)
- [ ] Marketing (MKT)
- [ ] Operaciones (OPS)

#### 2.5.2 Empleados de Ejemplo
- [ ] 2-3 empleados por departamento
- [ ] Asignar managers
- [ ] Variedad de roles

---

## Fase 3: Onboarding - Plantillas y Procesos (12h)

### 3.1 Modelo de Datos - Plantillas

#### 3.1.1 Definir Esquema PlantillaOnboarding
- [ ] Crear archivo db/schema/plantillas.ts
- [ ] Campos:
  - [ ] id (uuid, primary key)
  - [ ] nombre (varchar, not null)
  - [ ] descripcion (text)
  - [ ] departamento_id (uuid, FK opcional)
  - [ ] rol_destino (enum, opcional) - para qué rol es esta plantilla
  - [ ] duracion_estimada_dias (integer)
  - [ ] activo (boolean, default true)
  - [ ] created_by (uuid, FK)
  - [ ] created_at (timestamp)
  - [ ] updated_at (timestamp)

#### 3.1.2 Definir Esquema TareaPlantilla
- [ ] Crear archivo db/schema/tareas-plantilla.ts
- [ ] Campos:
  - [ ] id (uuid, primary key)
  - [ ] plantilla_id (uuid, FK, not null)
  - [ ] titulo (varchar, not null)
  - [ ] descripcion (text)
  - [ ] categoria (enum, not null)
  - [ ] responsable_tipo (enum) - RRHH, MANAGER, IT, EMPLEADO, CUSTOM
  - [ ] responsable_id (uuid, FK opcional) - si es CUSTOM
  - [ ] dias_desde_inicio (integer) - día relativo para fecha límite
  - [ ] duracion_estimada_horas (decimal)
  - [ ] orden (integer, not null)
  - [ ] obligatoria (boolean, default true)
  - [ ] requiere_evidencia (boolean, default false)
  - [ ] instrucciones (text)
  - [ ] recursos_url (varchar[]) - links a documentos/recursos
  - [ ] dependencias (uuid[]) - IDs de tareas que deben completarse antes

#### 3.1.3 Definir Enums
- [ ] taskCategoryEnum:
  - DOCUMENTACION
  - EQUIPAMIENTO
  - ACCESOS
  - FORMACION
  - REUNIONES
  - ADMINISTRATIVO
- [ ] responsibleTypeEnum:
  - RRHH
  - MANAGER
  - IT
  - EMPLEADO
  - CUSTOM

#### 3.1.4 Migraciones
- [ ] Crear migración para plantillas
- [ ] Crear migración para tareas_plantilla
- [ ] Ejecutar migraciones

### 3.2 Modelo de Datos - Procesos

#### 3.2.1 Definir Esquema ProcesoOnboarding
- [ ] Crear archivo db/schema/procesos.ts
- [ ] Campos:
  - [ ] id (uuid, primary key)
  - [ ] empleado_id (uuid, FK, not null)
  - [ ] plantilla_id (uuid, FK, not null)
  - [ ] fecha_inicio (date, not null)
  - [ ] fecha_fin_esperada (date)
  - [ ] fecha_fin_real (date)
  - [ ] estado (enum, not null, default EN_CURSO)
  - [ ] progreso (decimal, 0-100)
  - [ ] notas (text)
  - [ ] iniciado_por (uuid, FK)
  - [ ] created_at (timestamp)
  - [ ] updated_at (timestamp)

#### 3.2.2 Definir Esquema TareaOnboarding
- [ ] Crear archivo db/schema/tareas-onboarding.ts
- [ ] Campos:
  - [ ] id (uuid, primary key)
  - [ ] proceso_id (uuid, FK, not null)
  - [ ] tarea_plantilla_id (uuid, FK)
  - [ ] titulo (varchar, not null)
  - [ ] descripcion (text)
  - [ ] categoria (enum, not null)
  - [ ] responsable_id (uuid, FK, not null)
  - [ ] fecha_limite (date)
  - [ ] estado (enum, not null, default PENDIENTE)
  - [ ] prioridad (enum, default MEDIA)
  - [ ] completada_at (timestamp)
  - [ ] completada_por (uuid, FK)
  - [ ] notas (text)
  - [ ] evidencia_url (varchar)
  - [ ] comentarios_rechazo (text)
  - [ ] orden (integer)
  - [ ] created_at (timestamp)
  - [ ] updated_at (timestamp)

#### 3.2.3 Definir Enums
- [ ] processStatusEnum:
  - EN_CURSO
  - COMPLETADO
  - CANCELADO
  - PAUSADO
- [ ] taskStatusEnum:
  - PENDIENTE
  - EN_PROGRESO
  - COMPLETADA
  - BLOQUEADA
  - CANCELADA
- [ ] priorityEnum:
  - BAJA
  - MEDIA
  - ALTA
  - URGENTE

#### 3.2.4 Migraciones
- [ ] Crear migración para procesos
- [ ] Crear migración para tareas_onboarding
- [ ] Ejecutar migraciones

### 3.3 Backend - Plantillas de Onboarding

#### 3.3.1 Crear Servicio (services/plantilla-service.ts)
- [ ] getAll(filters)
- [ ] getById(id)
- [ ] getByIdWithTareas(id)
- [ ] create(data)
- [ ] update(id, data)
- [ ] duplicate(id, newName)
- [ ] softDelete(id)
- [ ] getEstadisticas(id) - veces usada, tiempo promedio

#### 3.3.2 Crear Servicio de Tareas Plantilla (services/tarea-plantilla-service.ts)
- [ ] getByPlantillaId(plantillaId)
- [ ] create(plantillaId, data)
- [ ] update(id, data)
- [ ] delete(id)
- [ ] reorder(plantillaId, orderedIds)
- [ ] duplicate(id)

#### 3.3.3 Crear Schemas de Validación
- [ ] createPlantillaSchema
- [ ] updatePlantillaSchema
- [ ] createTareaPlantillaSchema
- [ ] updateTareaPlantillaSchema
- [ ] reorderTareasSchema

#### 3.3.4 Crear Rutas (routes/plantillas.ts)
- [ ] GET /api/plantillas
  - [ ] Filtros: departamento, activo
- [ ] GET /api/plantillas/:id
  - [ ] Incluir tareas ordenadas
- [ ] POST /api/plantillas
  - [ ] Requiere ADMIN o RRHH
- [ ] PUT /api/plantillas/:id
  - [ ] Requiere ADMIN o RRHH
- [ ] POST /api/plantillas/:id/duplicar
  - [ ] Clonar plantilla con tareas
- [ ] DELETE /api/plantillas/:id
  - [ ] Soft delete
- [ ] POST /api/plantillas/:id/tareas
  - [ ] Crear tarea en plantilla
- [ ] PUT /api/plantillas/:id/tareas/:tareaId
  - [ ] Actualizar tarea
- [ ] DELETE /api/plantillas/:id/tareas/:tareaId
  - [ ] Eliminar tarea
- [ ] PUT /api/plantillas/:id/tareas/reordenar
  - [ ] Actualizar orden de tareas

### 3.4 Backend - Procesos de Onboarding

#### 3.4.1 Crear Servicio (services/proceso-service.ts)
- [ ] getAll(filters, pagination)
- [ ] getById(id)
- [ ] getByIdWithTareas(id)
- [ ] getByEmpleadoId(empleadoId)
- [ ] create(empleadoId, plantillaId, fechaInicio, iniciadoPor)
  - [ ] Copiar tareas de plantilla
  - [ ] Calcular fechas límite
  - [ ] Asignar responsables según tipo
- [ ] update(id, data)
- [ ] cancel(id, motivo)
- [ ] pause(id)
- [ ] resume(id)
- [ ] calculateProgress(id)
- [ ] getStatsByStatus()
- [ ] getTareasVencidas()

#### 3.4.2 Crear Servicio de Tareas Onboarding (services/tarea-onboarding-service.ts)
- [ ] getByProcesoId(procesoId)
- [ ] getById(id)
- [ ] getMisTareas(userId, filters)
- [ ] update(id, data)
- [ ] complete(id, userId, evidenciaUrl, notas)
- [ ] reject(id, comentarios)
- [ ] unblock(id)
- [ ] getTareasProximasVencer(dias)

#### 3.4.3 Crear Schemas de Validación
- [ ] createProcesoSchema
- [ ] updateProcesoSchema
- [ ] updateTareaOnboardingSchema
- [ ] completeTareaSchema
- [ ] procesoFiltersSchema

#### 3.4.4 Crear Rutas (routes/procesos.ts)
- [ ] GET /api/procesos
  - [ ] Filtros: estado, empleado, departamento, fecha
  - [ ] RRHH ve todos
  - [ ] MANAGER ve su equipo
  - [ ] EMPLEADO ve el suyo
- [ ] GET /api/procesos/:id
  - [ ] Incluir tareas y progreso
- [ ] GET /api/procesos/empleado/:empleadoId
  - [ ] Procesos del empleado
- [ ] POST /api/procesos
  - [ ] Requiere ADMIN o RRHH
  - [ ] Iniciar proceso desde plantilla
- [ ] PUT /api/procesos/:id
  - [ ] Actualizar notas, fechas
- [ ] PATCH /api/procesos/:id/cancelar
  - [ ] Cancelar proceso
- [ ] PATCH /api/procesos/:id/pausar
- [ ] PATCH /api/procesos/:id/reanudar
- [ ] GET /api/procesos/:id/tareas
  - [ ] Listar tareas del proceso
- [ ] PATCH /api/procesos/:id/tareas/:tareaId
  - [ ] Actualizar estado, notas
- [ ] PATCH /api/procesos/:id/tareas/:tareaId/completar
  - [ ] Marcar como completada
- [ ] GET /api/procesos/mis-tareas
  - [ ] Tareas asignadas al usuario actual
  - [ ] Filtros: estado, proceso, fecha
- [ ] GET /api/procesos/estadisticas
  - [ ] Métricas para dashboard

### 3.5 Frontend - Gestión de Plantillas

#### 3.5.1 Hooks
- [ ] usePlantillas()
- [ ] usePlantilla(id)
- [ ] useCreatePlantilla()
- [ ] useUpdatePlantilla()
- [ ] useDuplicatePlantilla()
- [ ] useDeletePlantilla()
- [ ] useTareasPlantilla(plantillaId)
- [ ] useCreateTareaPlantilla()
- [ ] useUpdateTareaPlantilla()
- [ ] useDeleteTareaPlantilla()
- [ ] useReorderTareas()

#### 3.5.2 Página de Listado (/admin/plantillas)
- [ ] Tabla/cards de plantillas
  - [ ] Nombre, departamento, tareas, veces usada
  - [ ] Estado activo/inactivo
- [ ] Filtros por departamento
- [ ] Búsqueda
- [ ] Acciones: ver, editar, duplicar, eliminar

#### 3.5.3 Página de Crear/Editar Plantilla (/admin/plantillas/[id])
- [ ] Formulario datos generales:
  - [ ] Nombre
  - [ ] Descripción
  - [ ] Departamento (opcional)
  - [ ] Rol destino (opcional)
  - [ ] Duración estimada
- [ ] Sección de tareas:
  - [ ] Lista ordenable (drag & drop)
  - [ ] Añadir tarea
  - [ ] Editar tarea (modal o inline)
  - [ ] Eliminar tarea
  - [ ] Duplicar tarea
- [ ] Previsualización de timeline

#### 3.5.4 Modal/Form de Tarea Plantilla
- [ ] Campos:
  - [ ] Título
  - [ ] Descripción
  - [ ] Categoría (select)
  - [ ] Tipo de responsable (select)
  - [ ] Responsable específico (si CUSTOM)
  - [ ] Días desde inicio
  - [ ] Duración estimada
  - [ ] Obligatoria (checkbox)
  - [ ] Requiere evidencia (checkbox)
  - [ ] Instrucciones
  - [ ] Recursos/enlaces
  - [ ] Dependencias (multiselect de otras tareas)

### 3.6 Frontend - Procesos de Onboarding

#### 3.6.1 Hooks
- [ ] useProcesos(filters)
- [ ] useProceso(id)
- [ ] useCreateProceso()
- [ ] useUpdateProceso()
- [ ] useCancelProceso()
- [ ] useTareasOnboarding(procesoId)
- [ ] useUpdateTareaOnboarding()
- [ ] useCompleteTarea()
- [ ] useMisTareas()
- [ ] useProcesoStats()

#### 3.6.2 Página de Listado de Procesos (/onboarding)
- [ ] Tabla de procesos
  - [ ] Empleado
  - [ ] Plantilla
  - [ ] Fecha inicio
  - [ ] Progreso (barra)
  - [ ] Estado
  - [ ] Tareas pendientes/vencidas
- [ ] Filtros:
  - [ ] Estado
  - [ ] Departamento
  - [ ] Fecha inicio
  - [ ] Búsqueda por empleado
- [ ] Botón iniciar nuevo proceso
- [ ] Vista de cards alternativa

#### 3.6.3 Página de Detalle de Proceso (/onboarding/:id)
- [ ] Header con info del empleado
  - [ ] Avatar, nombre, departamento
  - [ ] Fecha inicio, fecha estimada fin
- [ ] Barra de progreso general
- [ ] Estadísticas:
  - [ ] Tareas completadas
  - [ ] Tareas pendientes
  - [ ] Tareas vencidas
  - [ ] Días restantes
- [ ] Lista de tareas agrupadas por categoría
  - [ ] Checkbox/estado
  - [ ] Título
  - [ ] Responsable
  - [ ] Fecha límite
  - [ ] Acciones
- [ ] Timeline visual (opcional)
- [ ] Notas del proceso

#### 3.6.4 Modal Iniciar Proceso
- [ ] Seleccionar empleado (autocomplete)
- [ ] Seleccionar plantilla
- [ ] Fecha de inicio
- [ ] Previsualización de tareas
- [ ] Confirmar

#### 3.6.5 Modal/Panel de Tarea
- [ ] Ver detalles de tarea
- [ ] Instrucciones
- [ ] Recursos
- [ ] Marcar como completada
  - [ ] Subir evidencia (si requerida)
  - [ ] Añadir notas
- [ ] Ver historial de cambios

### 3.7 Frontend - Mis Tareas de Onboarding

#### 3.7.1 Página Mis Tareas (/onboarding/mis-tareas)
- [ ] Lista de tareas asignadas
- [ ] Filtros: estado, proceso, categoría
- [ ] Ordenar por fecha límite
- [ ] Vista Kanban alternativa (por estado)
- [ ] Quick actions: completar, ver detalles

#### 3.7.2 Vista "Mi Onboarding" (para empleados nuevos)
- [ ] Progreso personal
- [ ] Tareas pendientes
- [ ] Próximos hitos
- [ ] Recursos útiles

#### 3.7.3 Notificaciones/Alertas
- [ ] Componente de alertas en header
- [ ] Tareas próximas a vencer (3 días)
- [ ] Tareas vencidas

### 3.8 Seed de Onboarding

#### 3.8.1 Plantillas de Ejemplo
- [ ] Plantilla "Onboarding General"
  - [ ] 15-20 tareas típicas
  - [ ] Todas las categorías
- [ ] Plantilla "Onboarding Desarrollador"
  - [ ] Específica para IT
  - [ ] Accesos a herramientas, repos, etc.
- [ ] Plantilla "Onboarding Comercial"
  - [ ] Específica para ventas

#### 3.8.2 Procesos de Ejemplo
- [ ] 2-3 procesos en diferentes estados
- [ ] Tareas en diferentes estados

---

## Fase 4: Proyectos y Asignaciones (10h)

### 4.1 Modelo de Datos

#### 4.1.1 Definir Esquema Proyecto
- [ ] Crear archivo db/schema/proyectos.ts
- [ ] Campos:
  - [ ] id (uuid, primary key)
  - [ ] nombre (varchar, not null)
  - [ ] descripcion (text)
  - [ ] codigo (varchar, unique) - ej: "PRJ-001"
  - [ ] cliente (varchar)
  - [ ] fecha_inicio (date)
  - [ ] fecha_fin_estimada (date)
  - [ ] fecha_fin_real (date)
  - [ ] estado (enum, not null, default PLANIFICACION)
  - [ ] manager_id (uuid, FK, not null)
  - [ ] presupuesto_horas (decimal)
  - [ ] horas_consumidas (decimal, computed o trigger)
  - [ ] prioridad (enum, default MEDIA)
  - [ ] color (varchar) - para UI
  - [ ] activo (boolean, default true)
  - [ ] created_at (timestamp)
  - [ ] updated_at (timestamp)

#### 4.1.2 Definir Esquema AsignacionProyecto
- [ ] Crear archivo db/schema/asignaciones.ts
- [ ] Campos:
  - [ ] id (uuid, primary key)
  - [ ] proyecto_id (uuid, FK, not null)
  - [ ] usuario_id (uuid, FK, not null)
  - [ ] rol (varchar) - rol en el proyecto
  - [ ] dedicacion_porcentaje (decimal, 0-100)
  - [ ] horas_semanales (decimal) - alternativa a porcentaje
  - [ ] fecha_inicio (date, not null)
  - [ ] fecha_fin (date)
  - [ ] tarifa_hora (decimal) - opcional para facturación
  - [ ] notas (text)
  - [ ] activo (boolean, default true)
  - [ ] created_at (timestamp)
  - [ ] updated_at (timestamp)
- [ ] Constraint UNIQUE (proyecto_id, usuario_id, fecha_inicio)

#### 4.1.3 Definir Enums
- [ ] projectStatusEnum:
  - PLANIFICACION
  - ACTIVO
  - PAUSADO
  - COMPLETADO
  - CANCELADO

#### 4.1.4 Migraciones
- [ ] Crear migración para proyectos
- [ ] Crear migración para asignaciones
- [ ] Ejecutar migraciones

### 4.2 Backend - Proyectos

#### 4.2.1 Crear Servicio (services/proyecto-service.ts)
- [ ] getAll(filters, pagination)
- [ ] getById(id)
- [ ] getByIdWithAsignaciones(id)
- [ ] getByManagerId(managerId)
- [ ] getByUsuarioId(usuarioId) - proyectos donde está asignado
- [ ] create(data)
- [ ] update(id, data)
- [ ] changeStatus(id, status)
- [ ] softDelete(id)
- [ ] getEstadisticas(id)
- [ ] getHorasConsumidas(id)
- [ ] getProximosAVencer(dias)

#### 4.2.2 Crear Servicio Asignaciones (services/asignacion-service.ts)
- [ ] getByProyectoId(proyectoId)
- [ ] getByUsuarioId(usuarioId)
- [ ] getById(id)
- [ ] create(data)
  - [ ] Validar dedicación total no > 100%
- [ ] update(id, data)
- [ ] end(id, fechaFin) - finalizar asignación
- [ ] delete(id)
- [ ] getCargaUsuario(usuarioId) - suma de dedicaciones
- [ ] getHistorialUsuario(usuarioId)

#### 4.2.3 Crear Schemas de Validación
- [ ] createProyectoSchema
- [ ] updateProyectoSchema
- [ ] proyectoFiltersSchema
- [ ] createAsignacionSchema
- [ ] updateAsignacionSchema

#### 4.2.4 Crear Rutas (routes/proyectos.ts)
- [ ] GET /api/proyectos
  - [ ] Filtros: estado, manager, cliente, fecha
  - [ ] ADMIN ve todos
  - [ ] MANAGER ve los suyos
  - [ ] EMPLEADO ve donde está asignado
- [ ] GET /api/proyectos/:id
  - [ ] Incluir manager y asignaciones
- [ ] GET /api/proyectos/:id/estadisticas
  - [ ] Horas presupuesto vs consumidas
  - [ ] Asignaciones activas
  - [ ] Progreso
- [ ] POST /api/proyectos
  - [ ] Requiere ADMIN o MANAGER
  - [ ] Generar código automático
- [ ] PUT /api/proyectos/:id
  - [ ] Solo manager del proyecto o ADMIN
- [ ] PATCH /api/proyectos/:id/estado
  - [ ] Cambiar estado
- [ ] DELETE /api/proyectos/:id
  - [ ] Requiere ADMIN
  - [ ] Soft delete
- [ ] GET /api/proyectos/:id/asignaciones
  - [ ] Listar asignaciones del proyecto
- [ ] POST /api/proyectos/:id/asignaciones
  - [ ] Asignar empleado
  - [ ] Validar dedicación
- [ ] GET /api/proyectos/:id/asignaciones/:asigId
- [ ] PUT /api/proyectos/:id/asignaciones/:asigId
  - [ ] Actualizar asignación
- [ ] PATCH /api/proyectos/:id/asignaciones/:asigId/finalizar
  - [ ] Finalizar asignación
- [ ] DELETE /api/proyectos/:id/asignaciones/:asigId
  - [ ] Eliminar asignación

#### 4.2.5 Rutas Adicionales
- [ ] GET /api/usuarios/:id/proyectos
  - [ ] Proyectos donde está asignado el usuario
- [ ] GET /api/usuarios/:id/carga
  - [ ] Suma de dedicaciones del usuario
- [ ] GET /api/proyectos/mis-proyectos
  - [ ] Proyectos del usuario actual

### 4.3 Frontend - Gestión de Proyectos

#### 4.3.1 Hooks
- [ ] useProyectos(filters)
- [ ] useProyecto(id)
- [ ] useCreateProyecto()
- [ ] useUpdateProyecto()
- [ ] useDeleteProyecto()
- [ ] useMisProyectos()
- [ ] useProyectoStats(id)

#### 4.3.2 Página de Listado (/proyectos)
- [ ] Vista de cards
  - [ ] Nombre, cliente, estado
  - [ ] Manager
  - [ ] Progreso de horas
  - [ ] Miembros asignados (avatars)
- [ ] Vista de tabla alternativa
- [ ] Filtros:
  - [ ] Estado
  - [ ] Manager
  - [ ] Cliente
  - [ ] Fecha
- [ ] Búsqueda
- [ ] Botón crear proyecto

#### 4.3.3 Página de Detalle de Proyecto (/proyectos/:id)
- [ ] Header con info principal
  - [ ] Nombre, código, cliente
  - [ ] Estado (editable)
  - [ ] Manager
- [ ] Tabs o secciones:
  - [ ] Información general
  - [ ] Equipo (asignaciones)
  - [ ] Horas registradas
  - [ ] Estadísticas
- [ ] Gráfico de horas presupuesto vs consumidas
- [ ] Timeline del proyecto

#### 4.3.4 Modal/Página Crear Proyecto
- [ ] Formulario con campos:
  - [ ] Nombre
  - [ ] Descripción
  - [ ] Cliente
  - [ ] Fecha inicio
  - [ ] Fecha fin estimada
  - [ ] Presupuesto de horas
  - [ ] Prioridad
  - [ ] Color
- [ ] Validación

#### 4.3.5 Modal/Página Editar Proyecto
- [ ] Mismos campos que crear
- [ ] Cambio de estado
- [ ] No editable si está completado/cancelado

### 4.4 Frontend - Asignaciones

#### 4.4.1 Hooks
- [ ] useAsignaciones(proyectoId)
- [ ] useAsignacion(id)
- [ ] useCreateAsignacion()
- [ ] useUpdateAsignacion()
- [ ] useEndAsignacion()
- [ ] useDeleteAsignacion()
- [ ] useCargaUsuario(userId)

#### 4.4.2 Componente Gestión de Equipo
- [ ] Tabla de miembros asignados
  - [ ] Avatar, nombre
  - [ ] Rol en proyecto
  - [ ] Dedicación
  - [ ] Fecha inicio/fin
  - [ ] Acciones
- [ ] Botón añadir miembro

#### 4.4.3 Modal Asignar Empleado
- [ ] Buscar empleado (autocomplete)
- [ ] Mostrar carga actual del empleado
- [ ] Campos:
  - [ ] Rol en proyecto
  - [ ] Dedicación (% o horas)
  - [ ] Fecha inicio
  - [ ] Fecha fin (opcional)
  - [ ] Notas
- [ ] Validar no excede 100%

#### 4.4.4 Vista "Mis Proyectos" (empleado)
- [ ] Lista de proyectos asignados
- [ ] Mi rol y dedicación
- [ ] Estado de cada proyecto
- [ ] Quick link a timetracking

#### 4.4.5 Vista Carga de Trabajo
- [ ] Para manager: ver carga de su equipo
- [ ] Gráfico de barras con % ocupación
- [ ] Alertas de sobrecarga

### 4.5 Seed de Proyectos

#### 4.5.1 Proyectos de Ejemplo
- [ ] Proyecto "Migración Cloud"
  - Estado: ACTIVO
  - 500h presupuesto
- [ ] Proyecto "App Móvil v2"
  - Estado: PLANIFICACION
- [ ] Proyecto "Portal Cliente"
  - Estado: COMPLETADO

#### 4.5.2 Asignaciones de Ejemplo
- [ ] Varios empleados asignados a cada proyecto
- [ ] Diferentes dedicaciones

---

## Fase 5: Timetracking (8h)

### 5.1 Modelo de Datos

#### 5.1.1 Definir Esquema RegistroTiempo
- [ ] Crear archivo db/schema/timetracking.ts
- [ ] Campos:
  - [ ] id (uuid, primary key)
  - [ ] usuario_id (uuid, FK, not null)
  - [ ] proyecto_id (uuid, FK, not null)
  - [ ] asignacion_id (uuid, FK) - opcional, para tracking más preciso
  - [ ] fecha (date, not null)
  - [ ] horas (decimal, not null)
  - [ ] descripcion (text, not null)
  - [ ] tarea (varchar) - descripción corta de la tarea
  - [ ] estado (enum, default PENDIENTE)
  - [ ] aprobado_por (uuid, FK)
  - [ ] aprobado_at (timestamp)
  - [ ] comentario_rechazo (text)
  - [ ] facturable (boolean, default true)
  - [ ] created_at (timestamp)
  - [ ] updated_at (timestamp)
- [ ] Constraint: usuario debe estar asignado al proyecto
- [ ] Constraint: horas <= 24 por día por usuario

#### 5.1.2 Definir Enums
- [ ] timeEntryStatusEnum:
  - PENDIENTE
  - APROBADO
  - RECHAZADO

#### 5.1.3 Migraciones
- [ ] Crear migración para registros_tiempo
- [ ] Ejecutar migración

### 5.2 Backend - Timetracking

#### 5.2.1 Crear Servicio (services/timetracking-service.ts)
- [ ] getAll(filters, pagination)
- [ ] getById(id)
- [ ] getByUsuarioId(usuarioId, filters)
- [ ] getByProyectoId(proyectoId, filters)
- [ ] create(data)
  - [ ] Validar usuario asignado al proyecto
  - [ ] Validar horas del día <= 24
  - [ ] Validar fecha no futura
- [ ] update(id, data)
  - [ ] Solo si estado PENDIENTE
- [ ] delete(id)
  - [ ] Solo si estado PENDIENTE
- [ ] approve(id, aprobadorId)
- [ ] reject(id, aprobadorId, comentario)
- [ ] bulkApprove(ids, aprobadorId)
- [ ] getResumenUsuario(usuarioId, fechaInicio, fechaFin)
- [ ] getResumenProyecto(proyectoId, fechaInicio, fechaFin)
- [ ] getPendientesAprobacion(managerId)
- [ ] getHorasPorDia(usuarioId, fecha)
- [ ] copyFromDate(usuarioId, fechaOrigen, fechaDestino)

#### 5.2.2 Crear Schemas de Validación
- [ ] createTimeEntrySchema
- [ ] updateTimeEntrySchema
- [ ] timeEntryFiltersSchema
- [ ] approveRejectSchema
- [ ] copyEntriesSchema

#### 5.2.3 Crear Rutas (routes/timetracking.ts)
- [ ] GET /api/timetracking
  - [ ] Filtros: fecha, proyecto, usuario, estado
  - [ ] Rango de fechas
  - [ ] EMPLEADO ve solo los suyos
  - [ ] MANAGER ve los de su equipo
- [ ] GET /api/timetracking/:id
- [ ] POST /api/timetracking
  - [ ] Crear registro
- [ ] PUT /api/timetracking/:id
  - [ ] Solo si PENDIENTE
- [ ] DELETE /api/timetracking/:id
  - [ ] Solo si PENDIENTE
- [ ] PATCH /api/timetracking/:id/aprobar
  - [ ] Requiere MANAGER del proyecto o ADMIN
- [ ] PATCH /api/timetracking/:id/rechazar
  - [ ] Con comentario obligatorio
- [ ] POST /api/timetracking/aprobar-masivo
  - [ ] Array de IDs
- [ ] GET /api/timetracking/resumen
  - [ ] Horas por periodo agrupadas
  - [ ] Por proyecto, por día, por estado
- [ ] GET /api/timetracking/pendientes-aprobacion
  - [ ] Para managers
  - [ ] Agrupado por empleado/proyecto
- [ ] POST /api/timetracking/copiar
  - [ ] Copiar registros de una fecha a otra
- [ ] GET /api/timetracking/mis-registros
  - [ ] Registros del usuario actual
- [ ] GET /api/timetracking/semana/:fecha
  - [ ] Vista semanal para el usuario

### 5.3 Frontend - Registro de Horas

#### 5.3.1 Hooks
- [ ] useTimeEntries(filters)
- [ ] useTimeEntry(id)
- [ ] useCreateTimeEntry()
- [ ] useUpdateTimeEntry()
- [ ] useDeleteTimeEntry()
- [ ] useApproveTimeEntry()
- [ ] useRejectTimeEntry()
- [ ] useBulkApprove()
- [ ] useWeekTimeEntries(fecha)
- [ ] useResumenHoras(fechaInicio, fechaFin)
- [ ] useCopyTimeEntries()

#### 5.3.2 Página Principal de Timetracking (/timetracking)
- [ ] Vista semanal (por defecto)
  - [ ] Navegación entre semanas (< >)
  - [ ] Selector de fecha
  - [ ] Días de la semana como columnas
  - [ ] Total por día
  - [ ] Total de la semana
- [ ] Vista mensual alternativa
- [ ] Botón añadir registro

#### 5.3.3 Componente Calendario Semanal
- [ ] Grid de 7 días
- [ ] Para cada día:
  - [ ] Fecha
  - [ ] Registros del día
  - [ ] Total horas
  - [ ] Indicador de estado (pendiente/aprobado/rechazado)
- [ ] Click en día para añadir/ver registros

#### 5.3.4 Formulario de Registro de Horas
- [ ] Campos:
  - [ ] Proyecto (select de proyectos asignados)
  - [ ] Fecha
  - [ ] Horas (input numérico, step 0.5)
  - [ ] Descripción de la tarea
  - [ ] Facturable (checkbox)
- [ ] Validaciones:
  - [ ] Proyecto requerido
  - [ ] Horas entre 0.5 y 24
  - [ ] Descripción requerida
  - [ ] Total día <= 24h
  - [ ] Fecha no futura

#### 5.3.5 Lista de Registros del Día
- [ ] Tabla/lista con:
  - [ ] Proyecto
  - [ ] Horas
  - [ ] Descripción
  - [ ] Estado (badge)
  - [ ] Acciones (editar, eliminar)
- [ ] Edición inline o modal
- [ ] Eliminar con confirmación

#### 5.3.6 Funcionalidad Copiar Registros
- [ ] Botón "Copiar de otro día"
- [ ] Seleccionar fecha origen
- [ ] Ver preview de lo que se copiará
- [ ] Confirmar

### 5.4 Frontend - Aprobación de Horas (Manager)

#### 5.4.1 Página de Aprobación (/timetracking/aprobar)
- [ ] Filtros:
  - [ ] Empleado
  - [ ] Proyecto
  - [ ] Rango de fechas
  - [ ] Estado (pendiente por defecto)
- [ ] Tabla de registros:
  - [ ] Checkbox para selección múltiple
  - [ ] Empleado
  - [ ] Proyecto
  - [ ] Fecha
  - [ ] Horas
  - [ ] Descripción
  - [ ] Acciones

#### 5.4.2 Acciones de Aprobación
- [ ] Aprobar individual
- [ ] Rechazar individual (con modal para comentario)
- [ ] Aprobar seleccionados (masivo)
- [ ] Rechazar seleccionados (masivo)

#### 5.4.3 Vista Agrupada
- [ ] Agrupar por empleado
  - [ ] Total horas pendientes
  - [ ] Expandir para ver detalle
- [ ] Agrupar por proyecto
- [ ] Agrupar por semana

### 5.5 Frontend - Resumen Personal

#### 5.5.1 Componente Resumen de Horas
- [ ] Card con estadísticas del mes:
  - [ ] Total horas registradas
  - [ ] Horas aprobadas
  - [ ] Horas pendientes
  - [ ] Horas rechazadas
- [ ] Gráfico de barras por proyecto
- [ ] Gráfico de línea por día

#### 5.5.2 Vista en Dashboard
- [ ] Widget de horas del mes
- [ ] Horas de esta semana
- [ ] Estado de aprobación

### 5.6 Seed de Timetracking

#### 5.6.1 Registros de Ejemplo
- [ ] Registros para última semana
- [ ] Diferentes estados
- [ ] Varios proyectos
- [ ] Registros pendientes de aprobar

---

## Fase 6: Dashboards y Reportes (6h)

### 6.1 Backend - Endpoints de Métricas

#### 6.1.1 Dashboard Admin (routes/dashboard.ts)
- [ ] GET /api/dashboard/admin
  - [ ] Total usuarios activos
  - [ ] Usuarios por rol
  - [ ] Usuarios por departamento
  - [ ] Proyectos por estado
  - [ ] Horas totales del mes
  - [ ] Nuevos usuarios último mes

#### 6.1.2 Dashboard RRHH
- [ ] GET /api/dashboard/rrhh
  - [ ] Onboardings en curso (número y lista)
  - [ ] Onboardings completados (último mes)
  - [ ] Tiempo medio de onboarding (días)
  - [ ] Tareas de onboarding vencidas
  - [ ] Próximos onboardings a completar
  - [ ] Empleados por departamento (gráfico)
  - [ ] Distribución por roles
  - [ ] Altas del mes

#### 6.1.3 Dashboard Manager
- [ ] GET /api/dashboard/manager
  - [ ] Carga del equipo (% ocupación promedio)
  - [ ] Miembros del equipo
  - [ ] Horas pendientes de aprobar (total)
  - [ ] Distribución del equipo por proyecto
  - [ ] Proyectos activos del manager
  - [ ] Onboardings del equipo en curso
  - [ ] Alertas (sobrecarga, horas sin aprobar > 7 días)

#### 6.1.4 Dashboard Empleado
- [ ] GET /api/dashboard/empleado
  - [ ] Mi progreso de onboarding (si aplica)
  - [ ] Mis tareas pendientes de onboarding
  - [ ] Mis proyectos activos
  - [ ] Mi dedicación total
  - [ ] Horas del mes (por estado)
  - [ ] Horas de esta semana
  - [ ] Próximas tareas

### 6.2 Frontend - Dashboard Admin

#### 6.2.1 Página Dashboard Admin (/dashboard/admin)
- [ ] KPIs principales:
  - [ ] Card: Total usuarios
  - [ ] Card: Proyectos activos
  - [ ] Card: Horas este mes
  - [ ] Card: Onboardings activos
- [ ] Gráfico: Usuarios por departamento (pie/donut)
- [ ] Gráfico: Proyectos por estado (bar)
- [ ] Lista: Actividad reciente

### 6.3 Frontend - Dashboard RRHH

#### 6.3.1 Página Dashboard RRHH (/dashboard/rrhh)
- [ ] KPIs:
  - [ ] Card: Onboardings en curso
  - [ ] Card: Completados este mes
  - [ ] Card: Tiempo medio onboarding
  - [ ] Card: Tareas vencidas
- [ ] Sección: Onboardings en curso
  - [ ] Lista con progreso
  - [ ] Acceso rápido a detalle
- [ ] Sección: Alertas
  - [ ] Tareas vencidas
  - [ ] Onboardings estancados
- [ ] Gráfico: Empleados por departamento
- [ ] Gráfico: Evolución de altas

### 6.4 Frontend - Dashboard Manager

#### 6.4.1 Página Dashboard Manager (/dashboard/manager)
- [ ] KPIs:
  - [ ] Card: Miembros del equipo
  - [ ] Card: Carga promedio del equipo
  - [ ] Card: Horas pendientes aprobar
  - [ ] Card: Proyectos activos
- [ ] Sección: Mi equipo
  - [ ] Lista con ocupación
  - [ ] Indicadores de sobrecarga
- [ ] Sección: Horas por aprobar
  - [ ] Resumen con acceso a aprobación
- [ ] Gráfico: Distribución equipo por proyecto
- [ ] Gráfico: Horas del equipo esta semana

### 6.5 Frontend - Dashboard Empleado

#### 6.5.1 Página Dashboard Empleado (/dashboard)
- [ ] KPIs:
  - [ ] Card: Horas este mes
  - [ ] Card: Proyectos activos
  - [ ] Card: Mi ocupación
  - [ ] Card: Tareas pendientes
- [ ] Sección: Mi onboarding (si aplica)
  - [ ] Barra de progreso
  - [ ] Próximas tareas
- [ ] Sección: Mis proyectos
  - [ ] Cards de proyectos
  - [ ] Mi rol y dedicación
- [ ] Sección: Resumen de horas
  - [ ] Esta semana
  - [ ] Estado de aprobación
- [ ] Accesos rápidos:
  - [ ] Imputar horas
  - [ ] Ver mis tareas

### 6.6 Componentes Compartidos

#### 6.6.1 Librería de Gráficos
- [ ] Instalar recharts o chart.js
  ```bash
  npm install recharts
  ```
- [ ] Crear componentes wrapper:
  - [ ] BarChart
  - [ ] PieChart
  - [ ] LineChart
  - [ ] ProgressBar

#### 6.6.2 Componentes de Dashboard
- [ ] StatCard (KPI con icono)
- [ ] MetricTrend (con indicador up/down)
- [ ] AlertList (lista de alertas)
- [ ] ActivityFeed (actividad reciente)

### 6.7 Navegación por Rol

#### 6.7.1 Redirección Post-Login
- [ ] ADMIN → /dashboard/admin
- [ ] RRHH → /dashboard/rrhh
- [ ] MANAGER → /dashboard/manager
- [ ] EMPLEADO → /dashboard

#### 6.7.2 Menú Lateral Dinámico
- [ ] Mostrar/ocultar según rol
- [ ] Destacar sección actual
- [ ] Badges con contadores (tareas, aprobaciones)

---

## Fase 7: Testing y Calidad (4h)

### 7.1 Backend - Tests

#### 7.1.1 Configuración
- [ ] Configurar Vitest
- [ ] Configurar base de datos de test
- [ ] Crear helpers de testing
- [ ] Configurar coverage

#### 7.1.2 Tests de Servicios
- [ ] Tests auth-service
- [ ] Tests user-service
- [ ] Tests proyecto-service
- [ ] Tests timetracking-service

#### 7.1.3 Tests de Endpoints
- [ ] Tests de autenticación
- [ ] Tests de autorización
- [ ] Tests de validación

### 7.2 Frontend - Tests

#### 7.2.1 Configuración
- [ ] Verificar Jest/Vitest configurado
- [ ] Configurar Testing Library
- [ ] Crear mocks de API

#### 7.2.2 Tests de Componentes
- [ ] Tests de formularios
- [ ] Tests de tablas
- [ ] Tests de autenticación

#### 7.2.3 Tests E2E por rol (Playwright)
- [ ] ADMIN: login con MFA, crear usuario, desbloquear cuenta, crear departamento
- [ ] RRHH: iniciar onboarding, gestionar plantillas, ver KPIs
- [ ] MANAGER: aprobar horas, gestionar asignaciones, ver equipo
- [ ] EMPLEADO: registrar horas, completar tareas, ver mis proyectos

#### 7.2.4 Casos negativos
- [ ] Auth: credenciales invalidas, MFA invalido, reset token invalido
- [ ] Usuarios: email duplicado, password invalido, acceso sin rol
- [ ] Proyectos/Asignaciones: dedicacion > 100%, cambios en estado final
- [ ] Timetracking: fecha futura, >14h dia, editar no pendiente

### 7.3 Calidad de Código

#### 7.3.1 Linting Final
- [ ] Ejecutar ESLint en backend
- [ ] Ejecutar ESLint en frontend
- [ ] Corregir warnings

#### 7.3.2 Type Checking
- [ ] Ejecutar tsc --noEmit en backend
- [ ] Ejecutar tsc --noEmit en frontend
- [ ] Corregir errores de tipos

#### 7.3.3 Revisión de Seguridad
- [ ] Revisar no hay secrets en código
- [ ] Revisar validaciones de inputs
- [ ] Revisar autorización en endpoints
- [x] Documentar estrategia de testing y calidad (`docs/quality/testing.md`)

---

## Fase 8: Documentación, Deploy y Presentación (6h)

### 8.1 Completar Documentación

#### 8.1.1 README.md
- [ ] Revisar descripción del proyecto
- [ ] Actualizar instrucciones de instalación
- [ ] Verificar comandos actuales
- [ ] Añadir sección de troubleshooting

#### 8.1.2 Capturas de Pantalla
- [ ] Captura de login
- [ ] Captura de dashboard
- [ ] Captura de onboarding
- [ ] Captura de proyectos
- [ ] Captura de timetracking
- [ ] Guardar en /docs/screenshots/

#### 8.1.3 Documentación Técnica
- [x] Documentar variables de entorno completas
- [x] Documentar estructura de base de datos
- [x] Documentar arquitectura
- [x] Crear diagrama de arquitectura
- [x] Modularizar contrato OpenAPI en `docs/api/openapi/`
- [x] Crear script de validación OpenAPI (`scripts/validate-openapi.sh`)
- [x] Crear SAD en `docs/architecture/sad.md`
- [x] Crear plantilla ADR en `docs/adr/adr-template.md`
- [x] Documentar despliegue y CI/CD en `docs/architecture/deploy.md`

### 8.2 Preparar Despliegue

#### 8.2.1 Frontend en Vercel
- [ ] Crear cuenta/proyecto en Vercel
- [ ] Conectar repositorio GitHub
- [ ] Configurar variables de entorno
- [ ] Configurar dominio (opcional)
- [ ] Verificar build exitoso
- [ ] Probar aplicación desplegada

#### 8.2.2 Backend en Railway
- [ ] Crear cuenta/proyecto en Railway
- [ ] Crear servicio PostgreSQL
  - [ ] Obtener DATABASE_URL
- [ ] Crear servicio para API
  - [ ] Conectar repositorio
  - [ ] Configurar root directory: backend
  - [ ] Configurar build command
  - [ ] Configurar start command
- [ ] Configurar variables de entorno
- [ ] Ejecutar migraciones en producción
- [ ] Ejecutar seed en producción
- [ ] Verificar API funciona

#### 8.2.3 CI/CD (Opcional)
- [ ] Crear workflow de GitHub Actions
- [ ] Build y test en PR
- [ ] Deploy automático en merge a main

### 8.3 Testing Final en Producción

#### 8.3.1 Flujos de Usuario
- [ ] Registro de nuevo usuario
- [ ] Login con cada rol
- [ ] Navegación completa
- [ ] Crear departamento
- [ ] Crear empleado
- [ ] Crear plantilla onboarding
- [ ] Iniciar proceso onboarding
- [ ] Completar tareas onboarding
- [ ] Crear proyecto
- [ ] Asignar empleados a proyecto
- [ ] Registrar horas
- [ ] Aprobar horas

#### 8.3.2 Verificaciones
- [ ] Permisos por rol funcionan
- [ ] Validaciones funcionan
- [ ] Errores se muestran correctamente
- [ ] Datos se persisten
- [ ] Sesión se mantiene

#### 8.3.3 Responsive
- [ ] Probar en móvil
- [ ] Probar en tablet
- [ ] Verificar usabilidad

### 8.4 Crear Presentación

#### 8.4.1 Estructura de Slides
- [x] Slide 1: Portada
  - Nombre del proyecto
  - Autor
  - Máster y escuela
  - Fecha
- [x] Slide 2: Agenda
- [x] Slide 3-4: Problema y contexto
  - Desafíos actuales
  - Pain points
- [x] Slide 5: Solución propuesta
  - TeamHub como respuesta
  - Propuesta de valor
- [x] Slide 6: Stack tecnológico
  - Logos y versiones
- [x] Slide 7: Arquitectura
  - Diagrama del sistema
- [x] Slide 8-11: Demo / Funcionalidades
  - Capturas principales
  - Flujos clave
- [x] Slide 12: Modelo de datos
  - Diagrama ER simplificado
- [x] Slide 13: Retos y aprendizajes
- [x] Slide 14: Roadmap / Próximos pasos
- [x] Slide 15: Conclusiones
- [x] Slide 16: Q&A

#### 8.4.2 Preparar Demo
- [ ] Datos de ejemplo completos
- [ ] Flujo de demo preparado
- [ ] Video backup por si falla

#### 8.4.2b Notas de Presentacion
- [x] Crear notas en `docs/slides/notes.md`

#### 8.4.3 Entregar Presentación
- [ ] Exportar a PDF
- [ ] Subir a /docs/slides/
- [ ] Verificar accesibilidad

### 8.5 Entrega Final

#### 8.5.1 Verificaciones Finales
- [ ] Todo el código está en el repositorio
- [ ] No hay secrets expuestos
- [ ] README actualizado
- [ ] URLs de producción funcionan
- [ ] Slides accesibles

#### 8.5.2 Entrega
- [ ] Obtener URL del repositorio
- [ ] Obtener URL de la aplicación
- [ ] Obtener URL de las slides
- [ ] Rellenar formulario de entrega
- [ ] Verificar recepción

---

## Notas y Decisiones Técnicas

### Convenciones de Código

#### Nomenclatura
- Nombres de archivos: kebab-case (user-service.ts)
- Componentes React: PascalCase (UserCard.tsx)
- Variables y funciones: camelCase (getUserById)
- Constantes: SCREAMING_SNAKE_CASE (MAX_RETRIES)
- Tipos/Interfaces: PascalCase (UserRole, CreateUserDto)

#### Commits
- Seguir Conventional Commits
- Formato: `type(scope): description`
- Tipos: feat, fix, docs, style, refactor, test, chore

### Estructura de Endpoints

#### Convenciones REST
- Plural para recursos: /api/usuarios, /api/proyectos
- Anidación para relaciones: /api/proyectos/:id/asignaciones
- Verbos HTTP correctos:
  - GET: obtener recursos
  - POST: crear recursos
  - PUT: actualizar recurso completo
  - PATCH: actualizar parcialmente
  - DELETE: eliminar recursos

#### Respuestas
- 200 OK: éxito general
- 201 Created: recurso creado
- 204 No Content: éxito sin contenido
- 400 Bad Request: error de validación
- 401 Unauthorized: no autenticado
- 403 Forbidden: sin permisos
- 404 Not Found: recurso no existe
- 409 Conflict: conflicto (duplicado)
- 500 Internal Server Error: error del servidor

### Manejo de Errores

#### Backend
```typescript
interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}
```

#### Frontend
- Toast para errores de usuario
- Console para errores de desarrollo
- Boundary para errores críticos

### Seguridad

#### Autenticación
- Passwords hasheados con bcrypt (12 rounds)
- JWT con expiración (7 días access, 30 días refresh)
- Refresh token rotation

#### Autorización
- Verificar rol en cada endpoint protegido
- Verificar propiedad de recursos
- Principio de mínimo privilegio

#### Validación
- Zod en todas las entradas
- Sanitización de outputs
- Rate limiting en auth

---

## Registro de Progreso

| Fecha | Fase | Horas | Notas |
|-------|------|-------|-------|
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |

---

## Recursos Útiles

### Documentación
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Hono Docs](https://hono.dev/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zod Docs](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Herramientas
- [Railway](https://railway.app/)
- [Vercel](https://vercel.com/)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)

---

*Última actualización: [Fecha]*
