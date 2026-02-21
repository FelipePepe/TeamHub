# Análisis de Reglas SonarQube Fallando

**Fecha:** 2026-02-13  
**Total de Issues:** 271 (Backend: 69, Frontend: 202)

---

## 📊 Top 20 Reglas Fallando

| # | Regla | Issues | Severidad | Tipo | Nombre |
|---|-------|--------|-----------|------|--------|
| 1 | **S6759** | 42 | MINOR | Code Smell | React props should be read-only |
| 2 | **S3358** | 33 | MAJOR | Code Smell | Ternary operators should not be nested |
| 3 | **S4325** | 30 | MINOR | Code Smell | Redundant casts and non-null assertions |
| 4 | **S1874** | 29 | MINOR | Code Smell | Deprecated APIs should not be used |
| 5 | **S7735** | 21 | MINOR | Code Smell | Negated conditions should be avoided |
| 6 | **S6479** | 15 | MAJOR | Code Smell | Array indexes should not be used as keys |
| 7 | **S7723** | 11 | MINOR | Code Smell | Prefer nullish coalescing |
| 8 | **S7772** | 9 | MINOR | Code Smell | Type predicates should be preferred |
| 9 | **S7763** | 9 | MINOR | Code Smell | Unrelated types should not be compared |
| 10 | **S3863** | 8 | MINOR | Code Smell | Empty collections should not be accessed |
| 11 | **S7764** | 7 | MINOR | Code Smell | Prefer using primitive types |
| 12 | **S6853** | 6 | MINOR | Code Smell | Collection method with predictable results |
| 13 | **S6582** | 6 | MAJOR | Code Smell | Optional chaining should be preferred |
| 14 | **S7773** | 5 | MINOR | Code Smell | Prefer readonly arrays |
| 15 | **S6848** | 5 | MAJOR | Code Smell | JSX fragments should not be empty |
| 16 | **S1082** | 4 | MINOR | Bug | Click handlers need keyboard listeners |
| 17 | **S2004** | 3 | CRITICAL | Code Smell | Functions nested too deeply |
| 18 | **S7776** | 3 | MINOR | Code Smell | Prefer template literals |
| 19 | **S3776** | 3 | CRITICAL | Code Smell | Cognitive Complexity too high |
| 20 | **S7785** | 3 | MAJOR | Code Smell | Prefer top-level await |

---

## 🔴 Reglas CRÍTICAS (6 issues)

### 1. typescript:S3776 - Cognitive Complexity (3 issues)

**Severidad:** CRITICAL  
**Tipo:** Code Smell

**Descripción:** Las funciones tienen demasiada complejidad cognitiva (>15).

**Archivos afectados:**
```
1. src/app/(dashboard)/admin/plantillas/page.tsx:43 
   Complejidad: 17 (límite: 15)

2. src/services/tareas.service.ts:141
   Complejidad: 16 (límite: 15)

3. src/app/(dashboard)/onboarding/page.tsx:49
   Complejidad: 16 (límite: 15)
```

**Solución:**
```typescript
// ❌ ANTES (Complejidad alta)
function complexFunction(data) {
  if (condition1) {
    if (condition2) {
      for (let i of items) {
        if (condition3) {
          // nested logic
        }
      }
    }
  }
}

// ✅ DESPUÉS (Complejidad baja)
function complexFunction(data) {
  if (!condition1) return;
  if (!condition2) return;
  
  processItems(items);
}

function processItems(items) {
  return items
    .filter(item => condition3(item))
    .map(item => handleItem(item));
}
```

**Impacto:** Alto - Dificulta mantenimiento y aumenta bugs.

---

### 2. typescript:S2004 - Functions Nested Too Deeply (3 issues)

**Severidad:** CRITICAL  
**Tipo:** Code Smell

**Descripción:** Funciones anidadas más de 4 niveles.

**Archivos afectados:**
```
1. src/components/tareas/task-gantt-chart.tsx:389
2. src/components/tareas/task-gantt-chart.tsx:391
3. src/app/(dashboard)/admin/plantillas/crear/page.tsx:162
```

**Problema:**
```typescript
// ❌ 5+ niveles de nesting
function render() {
  return items.map(item => 
    days.map(day => 
      hours.map(hour => 
        minutes.map(minute => 
          cells.map(cell => <Cell />)  // NIVEL 5
        )
      )
    )
  );
}
```

**Solución:**
```typescript
// ✅ Flat (2-3 niveles máximo)
const renderCell = (item, day, hour, minute, cell) => <Cell />;
const renderMinutes = (item, day, hour) => 
  minutes.map(minute => cells.map(cell => renderCell(item, day, hour, minute, cell)));
const renderHours = (item, day) => 
  hours.map(hour => renderMinutes(item, day, hour));
const renderDays = (item) => 
  days.map(day => renderHours(item, day));
const render = () => 
  items.map(item => renderDays(item));
```

**Impacto:** Alto - Código ilegible y difícil de debuggear.

---

## 🟡 Reglas MAJOR (72 issues)

### 3. typescript:S3358 - Nested Ternary Operators (33 issues)

**Severidad:** MAJOR  
**Descripción:** Operadores ternarios anidados dificultan lectura.

**Ejemplo:**
```typescript
// ❌ ANTES
const result = a ? b ? c : d : e ? f : g;

// ✅ DESPUÉS - Opción 1: If-else
let result;
if (a) {
  result = b ? c : d;
} else {
  result = e ? f : g;
}

// ✅ DESPUÉS - Opción 2: Early return
function getResult() {
  if (a && b) return c;
  if (a && !b) return d;
  if (!a && e) return f;
  return g;
}

// ✅ DESPUÉS - Opción 3: Object lookup
const RESULT_MAP = {
  'true-true': c,
  'true-false': d,
  'false-true': f,
  'false-false': g,
};
const key = `${a}-${b && e}`;
const result = RESULT_MAP[key];
```

---

### 4. typescript:S6479 - Array Index as Key (15 issues)

**Severidad:** MAJOR  
**Descripción:** Usar índice de array como `key` en React causa problemas de rendimiento.

**Problema:**
```typescript
// ❌ ANTES
{items.map((item, index) => (
  <Item key={index} data={item} />
))}
```

**Solución:**
```typescript
// ✅ DESPUÉS - Usar ID único
{items.map((item) => (
  <Item key={item.id} data={item} />
))}

// ✅ Si no hay ID, generar uno estable
{items.map((item) => (
  <Item key={`${item.type}-${item.name}`} data={item} />
))}

// ✅ O usar UUID en data loading
const itemsWithIds = items.map(item => ({ 
  ...item, 
  _id: crypto.randomUUID() 
}));
```

**Por qué es importante:**
- Índices cambian al reordenar → React recrea componentes innecesariamente
- Pierde estado interno de componentes
- Problemas de animaciones y transiciones

---

### 5. typescript:S6582 - Prefer Optional Chaining (6 issues)

**Severidad:** MAJOR  
**Descripción:** Usar optional chaining en lugar de chequeos anidados.

**Ejemplo:**
```typescript
// ❌ ANTES
if (user && user.profile && user.profile.address) {
  console.log(user.profile.address.city);
}

// ✅ DESPUÉS
console.log(user?.profile?.address?.city);

// ✅ Con nullish coalescing
const city = user?.profile?.address?.city ?? 'Unknown';
```

---

### 6. typescript:S6848 - Empty JSX Fragments (5 issues)

**Severidad:** MAJOR  
**Descripción:** Fragmentos JSX vacíos son redundantes.

**Ejemplo:**
```typescript
// ❌ ANTES
return (
  <>
    {condition && <Component />}
    {/* Empty fragment */}
  </>
);

// ✅ DESPUÉS
return condition ? <Component /> : null;
```

---

## 🟢 Reglas MINOR (193 issues)

### 7. typescript:S6759 - React Props Read-only (42 issues)

**Severidad:** MINOR  
**Tipo:** Code Smell

**Descripción:** Props de componentes React deben ser read-only.

**Problema:**
```typescript
// ❌ ANTES
interface Props {
  name: string;
  count: number;
}

function MyComponent(props: Props) {
  props.count++; // MUTABLE!
  return <div>{props.name}</div>;
}
```

**Solución:**
```typescript
// ✅ DESPUÉS - Opción 1: Readonly type
interface Props {
  readonly name: string;
  readonly count: number;
}

// ✅ DESPUÉS - Opción 2: Readonly utility
type Props = Readonly<{
  name: string;
  count: number;
}>;

// ✅ DESPUÉS - Opción 3: React.FC (incluye readonly)
const MyComponent: React.FC<{ name: string; count: number }> = (props) => {
  // props.count++ // ERROR: Cannot assign to 'count'
  return <div>{props.name}</div>;
};
```

**Por qué es importante:**
- Props son inmutables en React por diseño
- Mutarlos causa bugs difíciles de detectar
- Viola principio de one-way data flow

---

### 8. typescript:S4325 - Redundant Type Assertions (30 issues)

**Severidad:** MINOR  
**Descripción:** Type assertions innecesarias (as, !).

**Ejemplos:**
```typescript
// ❌ ANTES
const value = data as string; // Ya es string
const count = getCount()!; // Ya no es null

// ✅ DESPUÉS
const value = data;
const count = getCount();
```

**Archivos afectados:**
```
- src/components/dashboard/line-chart.tsx:118
- src/components/forms/departamento-form.tsx:92
- src/routes/auth/handlers.ts:263
- src/routes/auth/handlers.ts:282
- src/routes/plantillas/handlers.ts:50
```

**Fix automático:**
```bash
# Buscar todas las redundant assertions
grep -rn "as \w\+>" backend/src frontend/src | grep -v test
```

---

### 9. typescript:S1874 - Deprecated APIs (29 issues)

**Severidad:** MINOR  
**Descripción:** Uso de APIs deprecadas.

**Acción:** Revisar warnings del compilador TypeScript y migrar a APIs nuevas.

---

### 10. typescript:S7735 - Negated Conditions (21 issues)

**Severidad:** MINOR  
**Descripción:** Evitar condiciones negadas cuando hay else.

**Ejemplo:**
```typescript
// ❌ ANTES
if (!isActive) {
  handleInactive();
} else {
  handleActive();
}

// ✅ DESPUÉS
if (isActive) {
  handleActive();
} else {
  handleInactive();
}
```

---

### 11. typescript:S7723 - Prefer Nullish Coalescing (11 issues)

**Severidad:** MINOR  
**Descripción:** Usar `??` en lugar de `||` para valores nullish.

**Ejemplo:**
```typescript
// ❌ ANTES (falso positivo con 0, false, '')
const count = value || 0; // Si value = 0, devuelve 0 (correcto pero confuso)

// ✅ DESPUÉS
const count = value ?? 0; // Solo usa 0 si value es null/undefined
```

---

### 12. typescript:S1082 - Click Handlers Need Keyboard (4 issues - BUGS)

**Severidad:** MINOR  
**Tipo:** BUG (Accesibilidad)

**Descripción:** Elementos con onClick necesitan soporte de teclado.

**Archivos afectados:**
```
1. src/components/timetracking/timesheet-cell.tsx:62
2. src/components/onboarding/mi-onboarding-widget.tsx:163
3. src/app/(dashboard)/onboarding/page.tsx:392
4. src/components/layout/user-nav.tsx:44
```

**Solución:** (Ver sección de Bugs más arriba)

---

## 📋 Plan de Remediación por Prioridad

### 🔴 URGENTE (Esta semana)

**Esfuerzo:** 8-12 horas  
**Impacto:** Eliminar TODOS los issues críticos

- [ ] **S3776** - Refactorizar 3 funciones con alta complejidad (4h)
- [ ] **S2004** - Flatten funciones anidadas en Gantt Chart (4h)
- [ ] **S1082** - Añadir keyboard support (4 bugs) (1h)
- [ ] **S5256** - Añadir headers a tabla (30min)

---

### 🟡 ALTA (Este mes)

**Esfuerzo:** 12-16 horas  
**Impacto:** Reducir 60% de code smells MAJOR

- [ ] **S3358** - Refactorizar 33 ternarios anidados (6h)
- [ ] **S6479** - Reemplazar array index keys (15 casos) (3h)
- [ ] **S6582** - Aplicar optional chaining (6 casos) (1h)
- [ ] **S6848** - Eliminar fragmentos vacíos (5 casos) (1h)
- [ ] **S7785** - Usar top-level await (3 casos) (1h)

---

### 🟢 MEDIA (Próximo sprint)

**Esfuerzo:** 8-12 horas  
**Impacto:** Mejorar consistencia del código

- [ ] **S6759** - Props read-only (42 casos) (4h)
- [ ] **S4325** - Eliminar type assertions redundantes (30 casos) (2h)
- [ ] **S7735** - Evitar condiciones negadas (21 casos) (2h)
- [ ] **S7723** - Usar nullish coalescing (11 casos) (1h)

---

### 🔵 BAJA (Backlog)

**Esfuerzo:** Variable  
**Impacto:** Mejoras incrementales

- [ ] **S1874** - Migrar APIs deprecadas (29 casos)
- [ ] Resto de MINOR issues (~100 casos)

---

## 🔧 Scripts Útiles para Remediación

### Buscar Patterns Específicos

```bash
# Ternarios anidados
grep -rn "? .* ? .* :" backend/src frontend/src --include="*.ts" --include="*.tsx"

# Array index as key
grep -rn "key={.*index" frontend/src --include="*.tsx"

# Redundant type assertions
grep -rn " as \w\+" backend/src frontend/src --include="*.ts" | grep -v test

# Condiciones negadas con else
grep -rn "if (!.*) {" backend/src frontend/src --include="*.ts" -A3 | grep "} else {"

# Props no readonly
grep -rn "interface.*Props {" frontend/src --include="*.tsx" -A5 | grep -v "readonly"
```

### Verificar Progreso

```bash
# Issues por severidad
curl -u $SONAR_TOKEN: \
  "http://localhost:9000/api/issues/search?componentKeys=TeamHub-backend,TeamHub-frontend&facets=severities&ps=1" \
  | jq '.facets[0].values'

# Issues por regla (top 10)
curl -u $SONAR_TOKEN: \
  "http://localhost:9000/api/issues/search?componentKeys=TeamHub-backend,TeamHub-frontend&facets=rules&ps=1" \
  | jq '.facets[0].values[:10]'

# Comparar antes/después
echo "Antes: 271 issues"
npm run sonar:scan
curl -u $SONAR_TOKEN: \
  "http://localhost:9000/api/issues/search?componentKeys=TeamHub-backend,TeamHub-frontend&ps=1" \
  | jq '.total'
```

---

## 📊 Métricas de Éxito

### Objetivo en 1 Semana

| Regla | Actual | Objetivo | Reducción |
|-------|--------|----------|-----------|
| S3776 (CRITICAL) | 3 | 0 | -100% |
| S2004 (CRITICAL) | 3 | 0 | -100% |
| S1082 (BUG) | 4 | 0 | -100% |
| **Total CRITICAL** | **6** | **0** | **-100%** |

### Objetivo en 1 Mes

| Severidad | Actual | Objetivo | Reducción |
|-----------|--------|----------|-----------|
| CRITICAL | 6 | 0 | -100% |
| MAJOR | 72 | 20 | -72% |
| MINOR | 193 | 100 | -48% |
| **TOTAL** | **271** | **120** | **-56%** |

---

## 🎯 Quick Wins (< 2 horas)

Estos fixes tienen **alto impacto** y **bajo esfuerzo**:

1. ✅ **4 bugs de accesibilidad** (S1082) - 1 hora
2. ✅ **6 optional chaining** (S6582) - 30 min
3. ✅ **5 empty fragments** (S6848) - 30 min
4. ✅ **3 top-level await** (S7785) - 30 min

**Total:** 2.5 horas para eliminar 18 issues (7% del total).

---

## 📚 Referencias

- [SonarQube TypeScript Rules](https://rules.sonarsource.com/typescript/)
- [React Best Practices - Props Immutability](https://react.dev/learn/updating-objects-in-state)
- [WCAG 2.1 - Keyboard Accessibility](https://www.w3.org/WAI/WCAG21/Understanding/keyboard)
- [Cognitive Complexity Whitepaper](https://www.sonarsource.com/docs/CognitiveComplexity.pdf)

---

**Próxima revisión:** Después de implementar fixes URGENTES (1 semana)
