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
- app/ (rutas y layouts con App Router)
  - (auth)/ login
  - (dashboard)/ rutas protegidas
    - admin/ (departamentos, empleados, plantillas)
    - proyectos/
    - timetracking/
    - onboarding/
- components/
  - ui/ (shadcn/ui base components)
  - forms/ (formularios de dominio)
  - layout/ (sidebar, header)
  - timetracking/ (grid semanal, Gantt chart)
  - onboarding/ (plantillas, procesos)
  - dashboards/ (gráficos HTML/CSS)
- hooks/ (data fetching con TanStack Query)
- lib/
  - api/ (cliente axios, interceptores)
  - auth/ (JWT, tokens)
  - utils/ (helpers, formateo)
  - gantt-utils.ts (utilidades D3.js)
- types/ (tipos TypeScript compartidos)
- __tests__/ (tests con Vitest)

## Componentes clave

### UI Components (shadcn/ui)
- Button, Input, Label, Select, Textarea
- Card, Badge, Avatar, Separator
- Dialog, Sheet, Popover, Tooltip
- Tabs, Calendar, DatePicker
- Table con sorting y paginación

### Componentes de Dominio

#### Layout
- Sidebar: navegación principal con permisos por rol
- MobileSidebar: navegación responsive en móvil (Sheet)
- Header: usuario, notificaciones, logout
- ProtectedRoute: validación de autenticación y roles

#### Forms
- LoginForm: autenticación con MFA
- EmpleadoForm: crear/editar empleados con validaciones Zod
- DepartamentoForm: gestión de departamentos
- PlantillaEditor: editor de plantillas con drag & drop
- ProyectoForm: formulario de proyectos con fechas
- TimetrackingForm: registro de horas por proyecto

#### Visualizaciones

**Dashboards (HTML/CSS)**
- BarChart: gráficos de barras verticales
- LineChart: gráficos de líneas para series temporales
- Responsive design con CSS Grid

**Timetracking (D3.js)**
- TimesheetGrid: grid editable semanal con inputs inline
- TimesheetCell: celda individual editable con debouncing
- WeekNavigation: navegación entre semanas
- CopyWeekDialog: modal para duplicar semanas
- GanttChart: visualización D3.js de timeline
- GanttTooltip: tooltips interactivos con detalles
- GanttZoomControls: controles de zoom (fit, in, out)

#### Hooks Personalizados
- useAuth: autenticación y contexto de usuario
- usePermissions: validación de permisos por rol
- useDepartamentos: TanStack Query para departamentos
- useEmpleados: TanStack Query para empleados
- usePlantillas: TanStack Query para plantillas
- useProcesos: TanStack Query para procesos de onboarding
- useProyectos: TanStack Query para proyectos y asignaciones
- useTimetracking: TanStack Query para registros de tiempo

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

## Autenticacion MFA
- Generacion de QR code con libreria `qrcode` (local, sin servicios externos).
- El QR se genera como data URL base64 para evitar errores CORB.
- Flujo: login -> cambio password (si temporal) -> setup MFA (si no configurado) -> verificar codigo TOTP.

## Providers
- `app/providers.tsx` como compositor ligero.
- Providers por modulo en `providers/` (auth, query, otros).
- Regla: si un provider supera 200 lineas, modularizar.

## Visualizaciones y Gráficos

### Dashboards (HTML/CSS - Migración a D3.js Pendiente)
**Implementación Actual:**
- `components/dashboards/bar-chart.tsx`: gráficos de barras con CSS Grid
- `components/dashboards/line-chart.tsx`: gráficos de líneas con SVG básico
- Responsive design con media queries
- Animaciones CSS básicas

**Pendiente (ADR-065):**
- Migrar a D3.js para mayor interactividad
- Añadir tooltips dinámicos
- Implementar animaciones suaves
- Añadir zoom y pan en gráficos temporales

### Timetracking - Weekly Timesheet (HTML + React)
**Implementación:**
- Grid editable con CSS Grid Layout
- Input inline en celdas con auto-save debounced (1 segundo)
- Navegación semanal con estado en URL
- Feature "Copiar Semana" con modal de confirmación
- Cálculo automático de totales (por proyecto y por día)
- Estados visuales: loading, success, error

**Componentes:**
```typescript
// frontend/src/components/timetracking/timesheet-grid.tsx
// Grid principal con proyectos x días
<TimesheetGrid projects={projects} week={currentWeek} />

// frontend/src/components/timetracking/timesheet-cell.tsx
// Celda editable con debouncing
<TimesheetCell value={hours} onChange={handleUpdate} />

// frontend/src/components/timetracking/week-navigation.tsx
// Navegación entre semanas
<WeekNavigation currentWeek={week} onChange={setWeek} />

// frontend/src/components/timetracking/copy-week-dialog.tsx
// Modal para copiar semana
<CopyWeekDialog sourceWeek={week} onCopy={handleCopy} />
```

### Timetracking - Gantt Chart (D3.js)
**Implementación Completa con D3.js 7.x:**

**Características:**
- Visualización de timeline de registros de tiempo
- Ejes X (tiempo) e Y (proyectos) con D3 scales
- Zoom y pan interactivos con d3-zoom
- Tooltips dinámicos al hover con información detallada
- Progress bars con colores por estado (aprobado/pendiente/rechazado)
- Responsive design con detección de resize

**Arquitectura Técnica:**
```typescript
// frontend/src/components/timetracking/gantt-chart.tsx
// Componente principal con useEffect para renderizado D3
// Uso de refs para mantener instancias D3
// Cleanup automático en unmount

// frontend/src/lib/gantt-utils.ts
// Utilidades reutilizables:
- scaleTime() para eje temporal
- scaleBand() para eje de proyectos
- calculateBounds() para límites del chart
- formatTooltip() para formateo de datos
- getColorByState() para colores según estado

// frontend/src/types/timetracking.ts
// Tipos TypeScript estrictos:
interface GanttData {
  projectId: string;
  projectName: string;
  entries: TimeEntry[];
}

interface GanttDimensions {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}
```

**Flujo de Renderizado:**
1. Fetch datos con `useTimetracking` (TanStack Query)
2. Transformar datos al formato GanttData
3. Crear escalas D3 (scaleTime, scaleBand)
4. Renderizar SVG con grupos (g) para cada proyecto
5. Renderizar barras (rect) para cada entrada
6. Añadir interactividad (zoom, tooltips)
7. Cleanup en unmount

**D3.js APIs Utilizadas:**
- `d3.select()` / `d3.selectAll()`: selección DOM
- `d3.scaleTime()`: escala temporal
- `d3.scaleBand()`: escala categórica
- `d3.zoom()`: zoom y pan
- `d3.axisBottom()` / `d3.axisLeft()`: ejes
- `d3.extent()` / `d3.max()`: cálculos de límites

**Performance:**
- Memoización de cálculos costosos con `useMemo`
- Debouncing de eventos de resize
- Virtualización pendiente para grandes datasets (>1000 registros)

**Accesibilidad:**
- ARIA labels en controles de zoom
- Navegación por teclado en controles
- Tooltips con role="tooltip"
- Contraste de colores WCAG AA

## Testing
- Unit/Integration: Vitest + Testing Library.
- Ubicacion: `frontend/src/__tests__/`.
- E2E: Playwright.
- Ubicacion: `frontend/e2e/`.
- **104 tests pasando** (hooks, componentes, páginas).

## Performance y Optimizaciones

### Implementadas
- TanStack Query con cache automático (staleTime: 5 min)
- Debouncing en inputs (timesheet cells, búsquedas)
- Memoización con `useMemo` y `useCallback` en cálculos costosos
- Lazy loading de imágenes con Next.js Image
- Code splitting automático con App Router

### Pendientes
- Lazy loading de rutas secundarias
- Virtualización de listas grandes (react-window)
- Service Worker para PWA
- Optimización de bundle size (<500KB inicial)

## Pendientes Técnicos
- Migrar bar-chart y line-chart de dashboards a D3.js (ADR-065)
- Aumentar cobertura de tests E2E (actualmente sin E2E)
- Implementar tests de accesibilidad automatizados (axe-core)
- Añadir Storybook para documentación de componentes UI
