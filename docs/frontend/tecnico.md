# Documento Tecnico - Frontend

## Stack
- Next.js 15.x (App Router)
- React 19.x
- TypeScript 5.7.x
- Tailwind CSS 3.4.x
- shadcn/ui
- D3.js 7.x
- TanStack Query 5.x
- React Hook Form 7.x + Zod 3.x
- ESLint 9.x (flat config)
- Vitest 3.x

## Estructura
- app/ (rutas y layouts)
- components/ (ui, forms, layout)
- hooks/ (data fetching y helpers)
- lib/ (api, utils, auth)
- types/ (tipos compartidos)

## Componentes clave
- Tabla de empleados con acciones por fila (incluye desbloquear cuenta para ADMIN).

## Rutas (App Router)
- Grupo (auth): login.
- Grupo (dashboard):
  - /dashboard (empleado)
  - /dashboard/admin
  - /dashboard/rrhh
  - /dashboard/manager
  - /admin/departamentos
  - /admin/empleados
  - /admin/plantillas
  - /onboarding (lista)
  - /onboarding/mis-tareas
  - /proyectos
  - /proyectos/[id]
  - /timetracking
  - /timetracking/aprobar
  - /perfil

## Convenciones
- Componentes: PascalCase
- Archivos: kebab-case
- Hooks: use-*

## Estado y Datos
- Estado servidor: TanStack Query.
- Estado local: useState/useReducer.
- Validacion: Zod + React Hook Form.

## Integracion API
- Axios con interceptores.
- Base URL via NEXT_PUBLIC_API_URL.
- Manejo de errores con toasts.

## Providers
- `app/providers.tsx` como compositor ligero.
- Providers por modulo en `providers/` (auth, query, otros).
- Regla: si un provider supera 200 lineas, modularizar.

## Testing
- Unit/Integration: Vitest + Testing Library.
- Ubicacion: `frontend/src/__tests__/`.
- E2E: Playwright.
- Ubicacion: `frontend/e2e/`.

## Pendientes
- (sin pendientes)
