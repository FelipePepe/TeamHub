# 📋 PLAN DE EJECUCIÓN - SonarQube Issues

**Fecha:** 2026-02-13  
**Objetivo:** Reducir de 271 a ~180 issues en 1 mes  
**Inversión:** 22 horas  
**ROI:** -34% issues, 0 CRITICAL, 0 BUGS

---

## 🎯 RESUMEN EJECUTIVO

### Situación Actual
```
Total Issues: 271
├── CRITICAL: 6 (complejidad código)
├── MAJOR: 72 (ternarios, keys, etc)
├── MINOR: 193 (props, types, etc)
└── BUGS: 5 (accesibilidad)

Security: 0 vulnerabilidades ✅
Coverage: Backend 62%, Frontend 0% ⚠️
```

### Objetivo en 1 Mes
```
Total Issues: 180 (-34%)
├── CRITICAL: 0 (-100%) ✅
├── MAJOR: 15 (-79%) ✅
├── MINOR: 165 (-14%)
└── BUGS: 0 (-100%) ✅
```

---

## 📅 CALENDARIO DE EJECUCIÓN

```
Semana 1: FASE 1 (Quick Wins) - 2h
  ├── Día 1: Bugs accesibilidad (30min)
  ├── Día 2: Optional chaining (30min)
  ├── Día 3: Empty fragments (30min)
  └── Día 4: Top-level await (30min)

Semana 2-3: FASE 2 (Critical) - 8h
  ├── Lun-Mar: Refactor tareas.service.ts (2h)
  ├── Mié-Jue: Refactor plantillas/page.tsx (2h)
  ├── Vie: Refactor onboarding/page.tsx (2h)
  └── Sáb: Flatten Gantt Chart (2h)

Semana 4: FASE 3 (Major) - 12h
  ├── Día 1-3: Ternarios anidados (6h)
  ├── Día 4: Array index keys (3h)
  ├── Día 5: Type assertions (2h)
  └── Día 6: Security hotspot (1h)
```

---

## ⚡ FASE 1: QUICK WINS (Semana 1 - 2 horas)

### Día 1: Bugs de Accesibilidad (30 minutos)

**Objetivo:** Eliminar 5 BUGS

#### Paso 1.1: Click Handlers (20 min)

**Archivos a editar:**
```
1. frontend/src/components/timetracking/timesheet-cell.tsx:62
2. frontend/src/components/onboarding/mi-onboarding-widget.tsx:163
3. frontend/src/app/(dashboard)/onboarding/page.tsx:392
4. frontend/src/components/layout/user-nav.tsx:44
```

**Acción:**
```bash
# Crear rama
git checkout develop
git pull origin develop
git checkout -b fix/sonar-accessibility

# Buscar en cada archivo líneas con onClick en <div>
# Aplicar este patrón:
```

```tsx
// PATRÓN A APLICAR:

// ANTES
<div onClick={handleClick} className="...">
  Content
</div>

// DESPUÉS - Opción A (preferida)
<button 
  onClick={handleClick} 
  className="..."
  type="button"
>
  Content
</button>

// DESPUÉS - Opción B (si <button> rompe estilos)
<div 
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  role="button"
  tabIndex={0}
  className="..."
>
  Content
</div>
```

**Verificación:**
```bash
npm test -- timesheet-cell
npm test -- mi-onboarding-widget
npm test -- onboarding/page
npm test -- user-nav
```

---

#### Paso 1.2: Tabla sin Headers (10 min)

**Archivo:** `frontend/src/components/ui/table.tsx:10`

**Acción:**
```tsx
// Añadir JSDoc documentando el uso correcto
/**
 * Table component wrapper
 * 
 * @requires Must include <thead> with header row for accessibility
 * 
 * @example Correct usage:
 * <Table>
 *   <thead>
 *     <tr>
 *       <th>Column 1</th>
 *       <th>Column 2</th>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr>
 *       <td>Data 1</td>
 *       <td>Data 2</td>
 *     </tr>
 *   </tbody>
 * </Table>
 */
```

**Verificación:**
```bash
# Buscar todos los usos de <Table>
grep -rn "<Table" frontend/src/app --include="*.tsx"
# Verificar que todos tienen <thead>
```

---

#### Paso 1.3: Commit y Verificar

```bash
# Tests
npm test

# Commit
git add frontend/src/components/timetracking/timesheet-cell.tsx
git add frontend/src/components/onboarding/mi-onboarding-widget.tsx
git add frontend/src/app/(dashboard)/onboarding/page.tsx
git add frontend/src/components/layout/user-nav.tsx
git add frontend/src/components/ui/table.tsx

git commit -m "fix(a11y): add keyboard support to interactive elements

- Add onKeyDown handlers to click elements
- Add role=button and tabIndex for accessibility
- Document Table component requires thead

Closes: 5 SonarQube accessibility bugs
- S1082 (4 instances)
- S5256 (1 instance)"

# Push
git push -u origin fix/sonar-accessibility

# Crear PR
gh pr create \
  --title "fix(a11y): add keyboard support to interactive elements" \
  --body "Fixes 5 SonarQube accessibility bugs (S1082, S5256)" \
  --base develop
```

**Resultado esperado:**
```
Antes: 5 bugs
Después: 0 bugs ✅
```

---

### Día 2: Optional Chaining (30 minutos)

**Objetivo:** Simplificar 6 checks anidados

#### Paso 2.1: Encontrar Casos (5 min)

```bash
cd backend/src
grep -rn "if.*&&.*&&.*&&" . --include="*.ts" | grep -v test > /tmp/optional-chaining.txt
cat /tmp/optional-chaining.txt
```

#### Paso 2.2: Refactorizar (20 min)

**Patrón:**
```typescript
// ANTES
if (usuario && usuario.perfil && usuario.perfil.departamento) {
  return usuario.perfil.departamento.nombre;
}
return 'Sin departamento';

// DESPUÉS
return usuario?.perfil?.departamento?.nombre ?? 'Sin departamento';
```

**Archivos esperados** (buscar en estos primero):
```
backend/src/services/
backend/src/routes/
backend/src/middleware/
```

#### Paso 2.3: Commit

```bash
git checkout -b refactor/optional-chaining

git add backend/src/...
git commit -m "refactor(backend): use optional chaining for nested property access

- Replace nested && checks with ?. operator
- More concise and readable code
- Resolves 6 SonarQube S6582 issues"

git push -u origin refactor/optional-chaining
gh pr create --title "refactor: use optional chaining" --base develop
```

---

### Día 3: Empty JSX Fragments (30 minutos)

**Objetivo:** Eliminar 5 fragmentos innecesarios

#### Paso 3.1: Encontrar (5 min)

```bash
cd frontend/src
grep -rn "<>" . --include="*.tsx" -A2 | grep -B1 "condition &&" > /tmp/empty-fragments.txt
```

#### Paso 3.2: Refactorizar (20 min)

```tsx
// ANTES
return (
  <>
    {condition && <Component />}
  </>
);

// DESPUÉS
return condition ? <Component /> : null;

// O si hay múltiples elementos
return (
  <>
    <Header />
    {condition && <Component />}
    <Footer />
  </>
);
// Esto está OK, no cambiar
```

#### Paso 3.3: Commit

```bash
git checkout -b refactor/empty-fragments
# ... editar archivos ...
git commit -m "refactor(frontend): remove unnecessary JSX fragments

Resolves 5 SonarQube S6848 issues"
git push -u origin refactor/empty-fragments
gh pr create --title "refactor: remove empty JSX fragments" --base develop
```

---

### Día 4: Top-level Await (30 minutos)

**Objetivo:** Modernizar 3 async wrappers

#### Paso 4.1: Encontrar (5 min)

```bash
cd backend/src
grep -rn "(async () => {" . --include="*.ts" | grep -v test
```

**Archivos esperados:**
- Migraciones: `backend/src/db/migrate.ts`
- Setup DB: `backend/src/db/setup-triggers.ts`

#### Paso 4.2: Refactorizar (20 min)

```typescript
// ANTES
(async () => {
  await runMigrations();
  await runTriggers();
})();

// DESPUÉS
await runMigrations();
await runTriggers();
```

**Verificar que `package.json` tiene:**
```json
{
  "type": "module"
}
```

#### Paso 4.3: Commit

```bash
git checkout -b refactor/top-level-await
# ... editar ...
git commit -m "refactor(backend): use top-level await

- Replace IIFE async wrappers with top-level await
- Modern ES2022 syntax
- Resolves 3 SonarQube S7785 issues"
git push -u origin refactor/top-level-await
gh pr create --title "refactor: use top-level await" --base develop
```

---

### ✅ Checkpoint Semana 1

```bash
# Después de mergear todos los PRs
git checkout develop
git pull origin develop
npm run sonar:scan

# Verificar resultados
curl -u $SONAR_TOKEN: \
  "http://localhost:9000/api/issues/search?componentKeys=TeamHub-backend,TeamHub-frontend&ps=1" \
  | jq '{total: .total, bugs: .facets}'
```

**Resultado esperado:**
```
Issues: 271 → 260 (-11)
Bugs: 5 → 0 (-100%) ✅
```

---

## 🔥 FASE 2: CRITICAL ISSUES (Semana 2-3 - 8 horas)

### Día 5-6: Refactor tareas.service.ts (2 horas)

**Objetivo:** Reducir complejidad de 16 a <15

#### Paso 5.1: Analizar Función Actual (15 min)

```bash
cd backend/src/services
code tareas.service.ts:141

# Identificar la función compleja
# Analizar lógica y dependencias
```

#### Paso 5.2: Diseñar Refactor (30 min)

**Estrategia:**
1. Extraer validaciones en funciones guard
2. Extraer lógica de negocio en helpers puros
3. Usar early returns para reducir nesting
4. Aplicar Strategy pattern si hay muchos casos

**Patrón general:**
```typescript
// ANTES (Complejidad 16)
async function procesarTarea(tarea: Tarea) {
  if (condicion1) {
    if (condicion2) {
      if (condicion3) {
        // lógica compleja
        for (let x of items) {
          if (condicion4) {
            // más lógica
          }
        }
      } else {
        // otra lógica
      }
    }
  }
  return resultado;
}

// DESPUÉS (Complejidad <15)
async function procesarTarea(tarea: Tarea) {
  // Guards
  if (!validarTarea(tarea)) return null;
  if (esProcesoEspecial(tarea)) return procesarEspecial(tarea);
  
  // Lógica principal simplificada
  const itemsProcesados = await procesarItems(tarea.items);
  return construirResultado(tarea, itemsProcesados);
}

// Helpers extraídos (complejidad <5 cada uno)
function validarTarea(tarea: Tarea): boolean {
  return tarea.estado === 'activo' && tarea.usuario;
}

function esProcesoEspecial(tarea: Tarea): boolean {
  return tarea.tipo === 'urgente' && tarea.prioridad > 5;
}

async function procesarEspecial(tarea: Tarea) {
  // Lógica aislada
}

async function procesarItems(items: Item[]) {
  return items
    .filter(esValido)
    .map(transformar);
}
```

#### Paso 5.3: Implementar (1 hora)

```bash
git checkout -b refactor/reduce-complexity-tareas-service

# Editar backend/src/services/tareas.service.ts
# Extraer helpers
# Actualizar tests si es necesario
```

#### Paso 5.4: Tests y Commit (15 min)

```bash
# Tests específicos
cd backend
npm test -- tareas.service.test

# Si fallan tests, ajustar
# Si pasan, commit

git add src/services/tareas.service.ts
git add src/services/__tests__/tareas.service.test.ts

git commit -m "refactor(backend): reduce cognitive complexity in tareas.service

- Extract validation guards
- Extract business logic to pure functions
- Use early returns to reduce nesting
- Complexity: 16 → 12 (below 15 threshold)

Resolves SonarQube S3776 critical issue"

git push -u origin refactor/reduce-complexity-tareas-service
gh pr create \
  --title "refactor: reduce complexity in tareas.service" \
  --base develop
```

---

### Día 7-8: Refactor plantillas/page.tsx (2 horas)

**Objetivo:** Reducir complejidad de 17 a <15

#### Paso 6.1: Analizar (15 min)

```bash
cd frontend/src/app/(dashboard)/admin/plantillas
code page.tsx:43
```

#### Paso 6.2: Refactorizar (1.5 horas)

**Estrategia:**
1. Extraer lógica de filtrado en custom hook
2. Extraer lógica de estado en reducer o hook
3. Separar handlers en funciones puras

```typescript
// ANTES
export default function PlantillasPage() {
  // Estado complejo
  const [filtros, setFiltros] = useState({...});
  const [ordenamiento, setOrdenamiento] = useState({...});
  
  // Función compleja (línea 43)
  const handleFiltrar = (nuevofiltro) => {
    if (nuevofiltro.tipo === 'departamento') {
      if (filtros.activos.includes(nuevofiltro.valor)) {
        // lógica anidada compleja
      } else {
        // más lógica
      }
    } else if (nuevofiltro.tipo === 'estado') {
      // más condiciones
    }
    // ... más lógica
  };
  
  return (<UI />);
}

// DESPUÉS
// 1. Custom hook para estado
function usePlantillasFilters() {
  const [filtros, setFiltros] = useState({...});
  
  const agregarFiltro = useCallback((filtro) => {
    // Lógica simple
  }, []);
  
  const removerFiltro = useCallback((filtro) => {
    // Lógica simple
  }, []);
  
  return { filtros, agregarFiltro, removerFiltro };
}

// 2. Funciones puras para lógica
function aplicarFiltros(plantillas, filtros) {
  return plantillas.filter(p => cumpleFiltros(p, filtros));
}

function cumpleFiltros(plantilla, filtros) {
  if (filtros.departamento && !matchDepartamento(plantilla, filtros)) {
    return false;
  }
  if (filtros.estado && !matchEstado(plantilla, filtros)) {
    return false;
  }
  return true;
}

// 3. Componente simplificado
export default function PlantillasPage() {
  const { filtros, agregarFiltro, removerFiltro } = usePlantillasFilters();
  const { data: plantillas } = usePlantillas();
  
  const plantillasFiltradas = useMemo(
    () => aplicarFiltros(plantillas, filtros),
    [plantillas, filtros]
  );
  
  return (<UI plantillas={plantillasFiltradas} />);
}
```

#### Paso 6.3: Commit

```bash
git checkout -b refactor/reduce-complexity-plantillas-page

git commit -m "refactor(frontend): reduce complexity in plantillas page

- Extract filters logic to custom hook
- Extract pure functions for filtering
- Use useMemo for derived state
- Complexity: 17 → 14

Resolves SonarQube S3776 critical issue"
```

---

### Día 9: Refactor onboarding/page.tsx (2 horas)

**Similar a Día 7-8**, aplicar mismo patrón.

---

### Día 10: Flatten Gantt Chart (2 horas)

**Objetivo:** Reducir nesting de 5 a 3 niveles

#### Paso 7.1: Analizar (15 min)

```bash
cd frontend/src/components/tareas
code task-gantt-chart.tsx:389
```

#### Paso 7.2: Refactorizar (1.5 horas)

```typescript
// ANTES (5 niveles - líneas 389, 391)
const renderGantt = () => {
  return projects.map(project =>            // Nivel 1
    tasks.map(task =>                       // Nivel 2
      days.map(day =>                       // Nivel 3
        hours.map(hour =>                   // Nivel 4
          cells.map(cell => (               // Nivel 5 ❌
            <Cell key={...} />
          ))
        )
      )
    )
  );
};

// DESPUÉS (3 niveles máximo)
// 1. Funciones por nivel
const renderCell = (project: Project, task: Task, day: Day, hour: Hour, cell: Cell) => (
  <Cell
    key={`${project.id}-${task.id}-${day}-${hour}-${cell.id}`}
    data={cell}
  />
);

const renderHour = (project: Project, task: Task, day: Day, hour: Hour) => {
  return cells.map(cell => renderCell(project, task, day, hour, cell));
};

const renderDay = (project: Project, task: Task, day: Day) => {
  return hours.map(hour => renderHour(project, task, day, hour));
};

const renderTask = (project: Project, task: Task) => {
  return days.map(day => renderDay(project, task, day));
};

// 2. Composición final
const renderGantt = () => {
  return projects.flatMap(project =>        // Nivel 1
    tasks.map(task =>                       // Nivel 2
      renderTask(project, task)             // Nivel 3 ✅
    )
  );
};
```

#### Paso 7.3: Optimizar con useMemo

```typescript
const renderedGantt = useMemo(() => {
  return renderGantt();
}, [projects, tasks, days, hours, cells]);
```

#### Paso 7.4: Tests y Commit

```bash
npm test -- task-gantt-chart

git checkout -b refactor/flatten-gantt-nesting

git commit -m "refactor(frontend): flatten nested functions in Gantt chart

- Extract cell rendering to separate functions
- Reduce nesting from 5 to 3 levels
- Add useMemo for performance
- Improve readability and maintainability

Resolves 2 SonarQube S2004 critical issues"
```

---

### ✅ Checkpoint Semana 2-3

```bash
npm run sonar:scan

# Verificar
curl -u $SONAR_TOKEN: \
  "http://localhost:9000/api/issues/search?componentKeys=TeamHub-backend,TeamHub-frontend&severities=CRITICAL&ps=1" \
  | jq .total
```

**Resultado esperado:**
```
Issues CRITICAL: 6 → 0 (-100%) ✅
Total Issues: 260 → 254 (-6)
```

---

## 🟡 FASE 3: MAJOR ISSUES (Semana 4 - 12 horas)

### Día 11-13: Ternarios Anidados (6 horas)

**Objetivo:** Refactorizar 33 casos

#### Paso 8.1: Encontrar Todos (30 min)

```bash
grep -rn "? .* ? .* :" backend/src frontend/src \
  --include="*.ts" --include="*.tsx" \
  | grep -v test \
  > /tmp/ternary-cases.txt

# Analizar y categorizar
cat /tmp/ternary-cases.txt | wc -l  # Debe ser ~33
```

#### Paso 8.2: Refactorizar en Lotes (5 horas)

**Batch 1: Backend (15 casos - 2h)**
```bash
git checkout -b refactor/ternaries-backend
```

**Patrón A: Guard Clauses**
```typescript
// ANTES
const status = isActive ? hasPermission ? 'admin' : 'user' : 'guest';

// DESPUÉS
function getUserStatus(isActive: boolean, hasPermission: boolean) {
  if (!isActive) return 'guest';
  return hasPermission ? 'admin' : 'user';
}
const status = getUserStatus(isActive, hasPermission);
```

**Patrón B: Object Lookup**
```typescript
// ANTES
const icon = status === 'success' 
  ? color === 'green' ? '✅' : '👍'
  : status === 'error' ? '❌' : '⚠️';

// DESPUÉS
const ICON_MAP = {
  'success-green': '✅',
  'success-other': '👍',
  'error': '❌',
  'warning': '⚠️',
} as const;

const key = status === 'success' 
  ? `success-${color === 'green' ? 'green' : 'other'}`
  : status === 'error' ? 'error' : 'warning';
  
const icon = ICON_MAP[key];
```

**Batch 2: Frontend (18 casos - 3h)**
```bash
git checkout -b refactor/ternaries-frontend
```

Aplicar mismos patrones.

#### Paso 8.3: Commit por Batch

```bash
git commit -m "refactor(backend): simplify nested ternary operators

- Replace nested ternaries with guard clauses
- Use object lookup for complex conditionals
- Improve code readability

Resolves 15 SonarQube S3358 issues"
```

---

### Día 14: Array Index Keys (3 horas)

**Objetivo:** Reemplazar 15 casos

#### Paso 9.1: Encontrar (15 min)

```bash
grep -rn "key={.*index" frontend/src --include="*.tsx" > /tmp/array-keys.txt
cat /tmp/array-keys.txt
```

#### Paso 9.2: Estrategia por Caso (30 min)

Analizar cada caso:
1. ¿Tiene el item un ID único? → Usar `item.id`
2. ¿Tiene nombre único? → Usar `item.name` o combinar propiedades
3. ¿Se reordena la lista? → Generar UUID estable en data loading
4. ¿Es estática la lista? → Está OK usar index (pero mejor tener ID)

#### Paso 9.3: Implementar (2 horas)

```typescript
// PATRÓN 1: Usar ID existente
// ANTES
{items.map((item, index) => (
  <Item key={index} data={item} />
))}

// DESPUÉS
{items.map((item) => (
  <Item key={item.id} data={item} />
))}

// PATRÓN 2: Componer key única
{items.map((item) => (
  <Item key={`${item.tipo}-${item.nombre}`} data={item} />
))}

// PATRÓN 3: Generar ID en data loading
const itemsWithIds = useMemo(() => 
  items.map(item => ({ 
    ...item, 
    _key: `${item.type}-${item.timestamp || Date.now()}` 
  })),
  [items]
);

{itemsWithIds.map((item) => (
  <Item key={item._key} data={item} />
))}
```

#### Paso 9.4: Commit

```bash
git checkout -b refactor/array-keys

git commit -m "refactor(frontend): use stable keys instead of array indexes

- Replace index keys with item IDs
- Compose unique keys from item properties
- Generate stable keys for items without IDs
- Improves React reconciliation performance

Resolves 15 SonarQube S6479 issues"
```

---

### Día 15: Type Assertions (2 horas)

**Objetivo:** Eliminar 30 assertions redundantes

#### Paso 10.1: Encontrar (15 min)

```bash
grep -rn " as \w\+[>;]" backend/src frontend/src --include="*.ts" --include="*.tsx" \
  | grep -v test \
  > /tmp/assertions.txt

# Archivos ya identificados
# - src/components/dashboard/line-chart.tsx:118
# - src/components/forms/departamento-form.tsx:92
# - src/routes/auth/handlers.ts:263
# - src/routes/auth/handlers.ts:282
# - src/routes/plantillas/handlers.ts:50
```

#### Paso 10.2: Verificar y Eliminar (1.5 horas)

```typescript
// ANTES
const value = getData() as string;  // TypeScript ya sabe que es string

// DESPUÉS
const value = getData();

// ANTES
const count = getCount()!;  // Ya no es null según el tipo

// DESPUÉS
const count = getCount();
```

**Proceso:**
1. Abrir archivo
2. Revisar el tipo inferido (hover en VS Code)
3. Si es el mismo que el assertion → eliminar
4. Si cambia el tipo → investigar por qué (puede ser un bug)

#### Paso 10.3: Commit

```bash
git checkout -b refactor/remove-redundant-assertions

git commit -m "refactor: remove redundant type assertions

- Remove 'as' casts where type is already correct
- Remove non-null assertions where value is guaranteed
- Trust TypeScript's type inference

Resolves 30 SonarQube S4325 issues"
```

---

### Día 16: Security Hotspot (1 hora)

**Objetivo:** Fix Regex ReDoS

#### Paso 11.1: Localizar (5 min)

```bash
code backend/src/services/mfa-service.ts
# Buscar regex patterns
```

#### Paso 11.2: Fix Vulnerability (45 min)

```typescript
// ANTES (vulnerable a ReDoS)
const SECRET_PATTERN = /^([A-Z2-7]{8})+$/;

function validateSecret(secret: string): boolean {
  return SECRET_PATTERN.test(secret);
}

// DESPUÉS (safe)
const SECRET_PATTERN = /^[A-Z2-7]+$/;

function validateSecret(secret: string): boolean {
  // Validar longitud primero (protección DoS)
  if (secret.length > 200) {
    throw new Error('Secret too long');
  }
  
  // Validar que es múltiplo de 8
  if (secret.length % 8 !== 0) {
    return false;
  }
  
  // Regex simple sin backtracking
  return SECRET_PATTERN.test(secret);
}
```

#### Paso 11.3: Tests de Seguridad

```typescript
// Añadir test
describe('validateSecret', () => {
  it('should prevent ReDoS attack', () => {
    const malicious = 'A'.repeat(10000) + '!';
    const start = Date.now();
    
    expect(() => validateSecret(malicious)).toThrow();
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // < 100ms
  });
});
```

#### Paso 11.4: Commit

```bash
git checkout -b security/fix-regex-redos

git commit -m "security(backend): fix regex ReDoS vulnerability in MFA service

- Replace backtracking regex with simple pattern
- Add length validation before regex test
- Add unit tests for ReDoS prevention
- Validate secret format in multiple steps

Resolves SonarQube MEDIUM security hotspot"
```

---

### ✅ Checkpoint Semana 4

```bash
npm run sonar:scan

curl -u $SONAR_TOKEN: \
  "http://localhost:9000/api/issues/search?componentKeys=TeamHub-backend,TeamHub-frontend&ps=1" \
  | jq '{total: .total, critical: .facets}'
```

**Resultado esperado:**
```
Total Issues: 254 → 180 (-29%)
CRITICAL: 0 ✅
MAJOR: 72 → 15 (-79%) ✅
BUGS: 0 ✅
Security Hotspots: 9 → 8 (-1)
```

---

## 📊 TRACKING Y MÉTRICAS

### Dashboard de Progreso

```bash
# Crear script de tracking
cat > scripts/sonar-progress.sh << 'EOF'
#!/bin/bash
source .env.sonar

echo "📊 SonarQube Progress Tracker"
echo "=============================="

CURRENT=$(curl -s -u "$SONAR_TOKEN": \
  "http://localhost:9000/api/issues/search?componentKeys=TeamHub-backend,TeamHub-frontend&ps=1" \
  | jq .total)

CRITICAL=$(curl -s -u "$SONAR_TOKEN": \
  "http://localhost:9000/api/issues/search?componentKeys=TeamHub-backend,TeamHub-frontend&severities=CRITICAL&ps=1" \
  | jq .total)

BUGS=$(curl -s -u "$SONAR_TOKEN": \
  "http://localhost:9000/api/issues/search?componentKeys=TeamHub-backend,TeamHub-frontend&types=BUG&ps=1" \
  | jq .total)

echo ""
echo "Total Issues: $CURRENT / 271 (Goal: 180)"
echo "CRITICAL: $CRITICAL / 6 (Goal: 0)"
echo "BUGS: $BUGS / 5 (Goal: 0)"
echo ""

PROGRESS=$(( (271 - CURRENT) * 100 / 91 ))
echo "Progress: $PROGRESS%"
EOF

chmod +x scripts/sonar-progress.sh
```

### Ejecutar Tracking

```bash
# Después de cada fase
./scripts/sonar-progress.sh
```

---

## ✅ CHECKLIST COMPLETO

### Semana 1: FASE 1
- [ ] Día 1: Bugs accesibilidad (5 archivos)
- [ ] Día 2: Optional chaining (6 casos)
- [ ] Día 3: Empty fragments (5 casos)
- [ ] Día 4: Top-level await (3 casos)
- [ ] PR reviews y merges
- [ ] Ejecutar sonar:scan
- [ ] Verificar: 0 bugs ✅

### Semana 2-3: FASE 2
- [ ] Día 5-6: Refactor tareas.service.ts
- [ ] Día 7-8: Refactor plantillas/page.tsx
- [ ] Día 9: Refactor onboarding/page.tsx
- [ ] Día 10: Flatten Gantt Chart
- [ ] PR reviews y merges
- [ ] Ejecutar sonar:scan
- [ ] Verificar: 0 CRITICAL ✅

### Semana 4: FASE 3
- [ ] Día 11-13: Ternarios anidados (33 casos)
- [ ] Día 14: Array index keys (15 casos)
- [ ] Día 15: Type assertions (30 casos)
- [ ] Día 16: Security hotspot (1 caso)
- [ ] PR reviews y merges
- [ ] Ejecutar sonar:scan final
- [ ] Verificar: <180 issues total ✅

### Post-Ejecución
- [ ] Actualizar documentación
- [ ] Presentar resultados al equipo
- [ ] Planificar FASE 4 (opcional: MINOR issues)

---

## 🎯 ÉXITO = COMPLETAR ESTE PLAN

**Meta clara:**
```
271 issues → 180 issues en 1 mes
6 CRITICAL → 0 CRITICAL
5 BUGS → 0 BUGS
22 horas de inversión
```

**¿Listo para empezar con Día 1?**
