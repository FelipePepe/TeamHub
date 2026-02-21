# Quick Fixes para Issues SonarQube

## 🚀 Arreglos Rápidos (< 30 minutos)

### 1. Bugs de Accesibilidad - Click Handlers

**Problema:** Elementos no interactivos con onClick pero sin teclado.

**Archivos a arreglar:**
- `frontend/src/components/timetracking/timesheet-cell.tsx:62`
- `frontend/src/components/onboarding/mi-onboarding-widget.tsx:163`
- `frontend/src/app/(dashboard)/onboarding/page.tsx:392`
- `frontend/src/components/layout/user-nav.tsx:44`

**Solución:**

```typescript
// ❌ ANTES
<div onClick={handleClick}>
  Click me
</div>

// ✅ DESPUÉS - Opción 1: Añadir keyboard handler
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
>
  Click me
</div>

// ✅ DESPUÉS - Opción 2: Usar <button> (preferido)
<button onClick={handleClick} className="...">
  Click me
</button>
```

**Tiempo:** 5 minutos por archivo = 20 minutos total

---

### 2. Tabla sin Headers

**Archivo:** `frontend/src/components/ui/table.tsx:10`

```tsx
// ❌ ANTES
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <table>
      {children}
    </table>
  );
}

// ✅ DESPUÉS
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <table>
      {/* Si el componente es genérico, asegurar que quien lo use incluya <thead> */}
      {children}
    </table>
  );
}

// O documentar su uso correcto:
/**
 * Table component - Requires proper structure with thead/tbody
 * @example
 * <Table>
 *   <thead><tr><th>Column</th></tr></thead>
 *   <tbody><tr><td>Data</td></tr></tbody>
 * </Table>
 */
```

**Tiempo:** 10 minutos

---

## 🔧 Refactors Medianos (1-2 horas)

### 3. Optional Chaining (5 ocurrencias backend)

Buscar patrones `if (obj && obj.prop && obj.prop.nested)` y reemplazar:

```bash
# Buscar candidatos
grep -r "if.*&&.*&&" backend/src/ --include="*.ts" | grep -v test
```

```typescript
// ❌ ANTES
if (usuario && usuario.perfil && usuario.perfil.nombre) {
  console.log(usuario.perfil.nombre);
}

// ✅ DESPUÉS
if (usuario?.perfil?.nombre) {
  console.log(usuario.perfil.nombre);
}

// O mejor aún con optional chaining + nullish coalescing
const nombre = usuario?.perfil?.nombre ?? 'Sin nombre';
```

**Tiempo:** 1 hora

---

### 4. Ternarios Anidados (3 ocurrencias backend)

```typescript
// ❌ ANTES
const status = isActive 
  ? hasPermission 
    ? 'admin' 
    : 'user'
  : isGuest
    ? 'guest'
    : 'unknown';

// ✅ DESPUÉS
function getUserStatus(isActive: boolean, hasPermission: boolean, isGuest: boolean) {
  if (isActive) {
    return hasPermission ? 'admin' : 'user';
  }
  return isGuest ? 'guest' : 'unknown';
}

const status = getUserStatus(isActive, hasPermission, isGuest);

// O usar objeto lookup
const STATUS_MAP = {
  activeAdmin: 'admin',
  activeUser: 'user',
  guest: 'guest',
  unknown: 'unknown',
} as const;

const key = isActive 
  ? (hasPermission ? 'activeAdmin' : 'activeUser')
  : (isGuest ? 'guest' : 'unknown');
const status = STATUS_MAP[key];
```

**Tiempo:** 30 minutos

---

### 5. Top-level Await (3 ocurrencias)

**Archivos:**
- Migraciones DB
- Triggers setup

```typescript
// ❌ ANTES (Old style)
(async () => {
  await runMigrations();
})();

// ✅ DESPUÉS (ES2022)
await runMigrations();
```

**Requisito:** Asegurar que `package.json` tiene `"type": "module"` o archivos `.mjs`.

**Tiempo:** 15 minutos

---

## 🏗️ Refactors Grandes (4-8 horas)

### 6. Complejidad Cognitiva - tareas.service.ts:141

**Estrategia:**
1. Identificar la función compleja
2. Extraer validaciones en funciones helper
3. Usar early returns para reducir indentación
4. Extraer lógica de negocio en funciones puras

```typescript
// ❌ ANTES (Complejidad 16)
async function procesarTarea(tarea: Tarea) {
  if (tarea.estado === 'pendiente') {
    if (tarea.prioridad === 'alta') {
      if (tarea.asignado) {
        // ... lógica compleja
        if (tarea.fechaVencimiento < new Date()) {
          // ... más lógica
        }
      } else {
        // ... otra lógica
      }
    } else {
      // ... más lógica
    }
  }
  return resultado;
}

// ✅ DESPUÉS (Complejidad < 15)
async function procesarTarea(tarea: Tarea) {
  // Early returns para validaciones
  if (tarea.estado !== 'pendiente') return null;
  if (!tarea.asignado) return procesarTareaSinAsignar(tarea);
  
  // Extraer lógica compleja
  const prioridadAlta = tarea.prioridad === 'alta';
  const estaVencida = tarea.fechaVencimiento < new Date();
  
  if (prioridadAlta && estaVencida) {
    return procesarTareaUrgente(tarea);
  }
  
  return procesarTareaNormal(tarea);
}

// Helpers extraídos
function procesarTareaSinAsignar(tarea: Tarea) { /* ... */ }
function procesarTareaUrgente(tarea: Tarea) { /* ... */ }
function procesarTareaNormal(tarea: Tarea) { /* ... */ }
```

**Tiempo:** 2 horas

---

### 7. Funciones Anidadas - Gantt Chart

**Archivos:**
- `frontend/src/components/tareas/task-gantt-chart.tsx:389, 391`

**Estrategia:** Flatten nested map/filter/reduce.

```typescript
// ❌ ANTES (5 niveles de nesting)
const renderGantt = () => {
  return projects.map(project => {
    return tasks.map(task => {
      return days.map(day => {
        return hours.map(hour => {
          return <Cell key={`${project}-${task}-${day}-${hour}`} />; // 5 niveles
        });
      });
    });
  });
};

// ✅ DESPUÉS (flat)
const renderCell = (project: Project, task: Task, day: Day, hour: Hour) => (
  <Cell key={`${project.id}-${task.id}-${day}-${hour}`} />
);

const renderHours = (project: Project, task: Task, day: Day) =>
  hours.map(hour => renderCell(project, task, day, hour));

const renderDays = (project: Project, task: Task) =>
  days.map(day => renderHours(project, task, day));

const renderTasks = (project: Project) =>
  tasks.map(task => renderDays(project, task));

const renderGantt = () =>
  projects.map(project => renderTasks(project));
```

**Tiempo:** 4-6 horas (testing incluido)

---

## 🔒 Security Hotspots

### 8. Regex ReDoS Vulnerability - mfa-service.ts

**Problema:** Regex con backtracking puede causar DoS.

```typescript
// ❌ VULNERABLE a ReDoS
const secretPattern = /^([A-Z2-7]{8})+$/;
// Input malicioso: "AAAAAAAA" + "!" → Backtracking exponencial

// ✅ SAFE - Opción 1: Sin backtracking
const secretPattern = /^[A-Z2-7]+$/;
if (secret.length % 8 !== 0) throw new Error('Invalid length');

// ✅ SAFE - Opción 2: Validar longitud primero
if (secret.length > 100) throw new Error('Secret too long');
const secretPattern = /^([A-Z2-7]{8})+$/;

// ✅ SAFE - Opción 3: Usar string methods
const isValidSecret = (secret: string) => {
  if (secret.length % 8 !== 0) return false;
  return /^[A-Z2-7]+$/.test(secret);
};
```

**Tiempo:** 1 hora

---

## 📝 Checklist de Implementación

### Hoy (Quick Wins - 1 hora)
- [ ] Arreglar 5 bugs de accesibilidad (click handlers)
- [ ] Añadir headers a tabla
- [ ] Aplicar optional chaining (5 casos)

### Esta Semana (2-3 días)
- [ ] Refactorizar ternarios anidados
- [ ] Top-level await en migraciones
- [ ] Refactorizar tareas.service.ts (complejidad)
- [ ] Fix regex ReDoS vulnerability

### Este Mes
- [ ] Refactorizar Gantt Chart (nesting)
- [ ] Refactorizar páginas complejas (plantillas, onboarding)
- [ ] Incrementar coverage backend a 80%
- [ ] Implementar coverage frontend (60%)

---

## 🧪 Testing de los Fixes

```bash
# Después de cada fix, ejecutar:

# Tests
npm run test

# Linting
npm run lint

# Análisis SonarQube
npm run sonar:scan

# Verificar que el issue desapareció en:
# http://localhost:9000/dashboard
```

---

## 📊 Tracking de Progreso

```bash
# Ver issues actuales
curl -u $SONAR_TOKEN: \
  "http://localhost:9000/api/issues/search?componentKeys=TeamHub-backend&types=BUG,CODE_SMELL&severities=CRITICAL&ps=50" \
  | jq '.total'

# Después de fixes, volver a analizar
npm run sonar:scan

# Comparar con reporte anterior
```

---

## 🎯 Impacto Esperado

Después de implementar todos los quick fixes:

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Bugs Frontend | 5 | 0 | -100% |
| Critical Code Smells | 6 | 3-4 | -33% |
| Security Hotspots MEDIUM | 1 | 0 | -100% |
| Deuda Técnica | ~2 días | ~1.5 días | -25% |

**ROI:** Alto - Poco esfuerzo, gran impacto en calidad y mantenibilidad.
