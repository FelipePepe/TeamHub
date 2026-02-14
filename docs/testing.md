# Testing

Este documento detalla la estrategia de testing de TeamHub, incluyendo tests unitarios, integración y E2E.

---

## 🧪 Estado de Tests

**Total:** 1,038/1,038 tests passing ✅

| Suite | Tests | Estado | Coverage | Comando |
|-------|-------|--------|----------|---------|
| **Backend** | 655 | ✅ | 81.01% | `cd backend && npm test` |
| **Frontend** | 383 | ✅ | 90.07% | `cd frontend && npm test` |
| **E2E (Playwright)** | 14 pasos | ✅ | - | `cd frontend && npm run demo` |

---

## Backend Tests (Vitest)

### Ejecutar Tests
```bash
cd backend

# Todos los tests
npm test

# Watch mode
npm run test:watch

# Con coverage
npm run test:coverage
```

### Cobertura por Módulo
| Módulo | Tests | Descripción |
|--------|-------|-------------|
| Auth | 16 tests | Login, MFA, refresh tokens, bootstrap, env validation |
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
| **Env Validation** | 29 tests | Variables de entorno, defaults, errors |

### Estructura
```
backend/src/
├── __tests__/
│   ├── app.test.ts            # App initialization (16 tests)
│   ├── auth.test.ts           # Autenticación y MFA
│   ├── usuarios.test.ts       # Gestión de usuarios
│   ├── departamentos.test.ts  # Departamentos
│   ├── plantillas.test.ts     # Templates onboarding
│   ├── procesos.test.ts       # Procesos onboarding
│   ├── proyectos.test.ts      # Proyectos y asignaciones
│   ├── timetracking.test.ts   # Registro de horas
│   └── dashboard.test.ts      # Métricas
├── config/__tests__/
│   └── env.test.ts            # Variables de entorno (29 tests)
├── services/__tests__/
│   ├── auth-service.test.ts   # Servicios de auth
│   ├── mfa-service.test.ts    # Servicios MFA
│   ├── tareas-repository.test.ts  # Repositorio tareas
│   └── tareas.service.test.ts # Servicio tareas
└── validators/__tests__/
    └── validators.test.ts     # Schemas y validación
```

---

## Frontend Tests (Vitest + React Testing Library)

### Ejecutar Tests
```bash
cd frontend

# Todos los tests
npm test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# Coverage
npm run test:coverage
```

### Cobertura por Tipo
| Categoría | Tests | Descripción |
|-----------|-------|-------------|
| **Hooks** | 158 tests | TanStack Query hooks (100% coverage) |
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
| **Performance** | 155 tests | Rendimiento y optimización |

### Estructura
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
│   └── performance.test.tsx        # 155 tests
└── lib/__tests__/
    ├── auth.test.ts                # 9 tests
    ├── navigation.test.ts          # 10 tests
    └── utils.test.ts               # 7 tests
```

---

## E2E Tests (Playwright)

### Ejecutar Demo
```bash
cd frontend

# Demo con navegador visible (headed)
npm run demo

# Demo en modo grabación (headless)
npm run demo:record

# Tests E2E estándar
npm run e2e
```

### Demo Automatizada (14 pasos)
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

### Estructura E2E
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

---

## Quality Gates

### Pre-commit (Husky)
```bash
# Ejecutado automáticamente en cada commit
- Lint staged files (ESLint)
- Secrets detection (gitleaks)
- Branch naming validation
```

### Pre-push (Husky)
```bash
# Ejecutado antes de push
- npm run lint (backend + frontend)
- npm test (todos los tests)
- Type check (tsc --noEmit)
- npm audit (CVEs)
- OpenAPI validation
```

### CI/CD (GitHub Actions)
```yaml
# Ejecutado en cada PR y push a main
- ESLint validation
- TypeScript type check
- All tests (backend + frontend)
- Build verification
- Coverage reports
```

---

## Coverage Strategy (ADR-055)

| Prioridad | Coverage Target | Alcance |
|-----------|----------------|---------|
| **CORE** | 100% | Lógica crítica (auth, cálculos, transacciones) |
| **IMPORTANT** | 80% | Features visibles al usuario |
| **INFRASTRUCTURE** | 0% | Tipos, constantes, configs |

### Métricas Actuales

**Backend:** 81.01% coverage
- Auth & MFA: 95%+
- Services: 85%+
- Routes: 70%+
- Validators: 100%

**Frontend:** 90.07% coverage
- Hooks: 100%
- Pages: 85%+
- Components: 90%+
- Lib: 95%+

---

## Referencias

- [Documentación de Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev/)
- [ADR-055: Coverage Strategy](decisiones/)
