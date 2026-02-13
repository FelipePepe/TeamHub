# 🚨 Plan de Acción Inmediato - Issues SonarQube

**Fecha:** 2026-02-13  
**Estado:** 271 issues totales | 6 CRITICAL | 4 BUGS

---

## 📊 Resumen Ejecutivo

### Situación Actual

| Categoría | Backend | Frontend | Total |
|-----------|---------|----------|-------|
| **Bugs** | 0 | 5 | **5** |
| **Vulnerabilidades** | 0 | 0 | **0** |
| **Code Smells CRITICAL** | 1 | 5 | **6** |
| **Code Smells MAJOR** | 13 | 59 | **72** |
| **Code Smells MINOR** | 55 | 138 | **193** |
| **Security Hotspots** | 6 | 3 | **9** |

### Top 10 Problemas (Por Impacto)

| # | Problema | Issues | Severidad | Esfuerzo | Dónde |
|---|----------|--------|-----------|----------|-------|
| 1 | Props no readonly | 42 | MINOR | 4h | Frontend |
| 2 | Ternarios anidados | 33 | MAJOR | 6h | Backend/Frontend |
| 3 | Type assertions redundantes | 30 | MINOR | 2h | Backend/Frontend |
| 4 | APIs deprecadas | 29 | MINOR | 4h | Frontend |
| 5 | Condiciones negadas | 21 | MINOR | 2h | Backend/Frontend |
| 6 | Array index como key | 15 | MAJOR | 3h | Frontend |
| 7 | **Complejidad cognitiva** | 3 | **CRITICAL** | 4h | Backend/Frontend |
| 8 | **Funciones muy anidadas** | 3 | **CRITICAL** | 4h | Frontend |
| 9 | **Click sin teclado (a11y)** | 4 | **MINOR (BUG)** | 1h | Frontend |
| 10 | Optional chaining | 6 | MAJOR | 1h | Backend |

---

## 🎯 FASE 1: CRÍTICOS (HOY - 2 horas)

### ✅ Priority 0: Bugs de Accesibilidad (4 bugs - 1 hora)

**Impacto:** Legal, UX, SEO  
**Esfuerzo:** 20 min total

**Archivos a arreglar:**
```
1. frontend/src/components/timetracking/timesheet-cell.tsx:62
2. frontend/src/components/onboarding/mi-onboarding-widget.tsx:163
3. frontend/src/app/(dashboard)/onboarding/page.tsx:392
4. frontend/src/components/layout/user-nav.tsx:44
5. frontend/src/components/ui/table.tsx:10 (tabla sin headers)
```

**Fix:**
```typescript
// ANTES
<div onClick={handleClick}>Click me</div>

// DESPUÉS
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

// O mejor: usar <button>
<button onClick={handleClick} className="...">
  Click me
</button>
```

---

### ✅ Priority 1: Tabla sin Headers (1 bug - 10 min)

**Archivo:** `frontend/src/components/ui/table.tsx:10`

**Fix:**
```tsx
// Documentar uso correcto
/**
 * Table component
 * @example
 * <Table>
 *   <thead><tr><th>Column</th></tr></thead>
 *   <tbody><tr><td>Data</td></tr></tbody>
 * </Table>
 */
```

---

### ✅ Priority 2: Optional Chaining (6 casos - 30 min)

**Backend:** 5 casos de `if (obj && obj.prop && obj.prop.nested)`

**Fix:**
```typescript
// ANTES
if (usuario && usuario.perfil && usuario.perfil.nombre) {
  console.log(usuario.perfil.nombre);
}

// DESPUÉS
const nombre = usuario?.perfil?.nombre;
if (nombre) {
  console.log(nombre);
}
```

**Comando para encontrar:**
```bash
cd backend/src
grep -rn "if.*&&.*&&" . --include="*.ts" | grep -v test
```

---

## 🔥 FASE 2: CRÍTICOS COMPLEJOS (ESTA SEMANA - 8 horas)

### 🔴 1. Complejidad Cognitiva (3 casos - 4 horas)

#### Caso 1: `backend/src/services/tareas.service.ts:141`
**Complejidad:** 16 → Objetivo: <15

**Estrategia:**
1. Identificar la función
2. Extraer validaciones en helpers
3. Usar early returns
4. Extraer lógica compleja

```typescript
// PATRÓN DE REFACTOR
async function funcionCompleja(data) {
  // ❌ ANTES: Lógica anidada
  
  // ✅ DESPUÉS: Early returns
  if (!validacion1) return null;
  if (!validacion2) return procesarCasoEspecial(data);
  
  const resultado = procesarCasoNormal(data);
  return resultado;
}

// Extraer helpers
function procesarCasoEspecial(data) { /* ... */ }
function procesarCasoNormal(data) { /* ... */ }
```

**Archivo específico a revisar:**
```bash
cd /home/sandman/Sources/CursoAI/tfm
view backend/src/services/tareas.service.ts -l 130-160
```

---

#### Caso 2: `frontend/src/app/(dashboard)/admin/plantillas/page.tsx:43`
**Complejidad:** 17 → Objetivo: <15

**Estrategia:**
1. Extraer filtros en funciones puras
2. Usar custom hooks para estado complejo
3. Separar lógica de UI

---

#### Caso 3: `frontend/src/app/(dashboard)/onboarding/page.tsx:49`
**Complejidad:** 16 → Objetivo: <15

**Estrategia:** Similar a Caso 2

---

### 🔴 2. Funciones Muy Anidadas (3 casos - 4 horas)

#### Caso Principal: `frontend/src/components/tareas/task-gantt-chart.tsx:389,391`

**Problema:** 5 niveles de nesting

**Estrategia:**
```typescript
// ANTES (5 niveles)
const render = () => {
  return projects.map(p =>        // Nivel 1
    tasks.map(t =>                // Nivel 2
      days.map(d =>               // Nivel 3
        hours.map(h =>            // Nivel 4
          cells.map(c => <Cell/>) // Nivel 5 ❌
        )
      )
    )
  );
};

// DESPUÉS (3 niveles máximo)
const renderCell = (p, t, d, h, c) => <Cell key={...} />;

const renderHour = (p, t, d, h) => 
  cells.map(c => renderCell(p, t, d, h, c));

const renderDay = (p, t, d) =>
  hours.map(h => renderHour(p, t, d, h));

const renderTask = (p, t) =>
  days.map(d => renderDay(p, t, d));

const render = () =>
  projects.flatMap(p => 
    tasks.map(t => renderTask(p, t))
  );
```

---

## 🟡 FASE 3: MAJOR (ESTE MES - 12 horas)

### Priority 3: Ternarios Anidados (33 casos - 6 horas)

**Comando para encontrar:**
```bash
grep -rn "? .* ? .* :" backend/src frontend/src --include="*.ts" --include="*.tsx"
```

**Patrón de refactor:**
```typescript
// ANTES
const x = a ? b ? c : d : e ? f : g;

// DESPUÉS - Opción 1: If-else
function getX() {
  if (a) return b ? c : d;
  return e ? f : g;
}

// DESPUÉS - Opción 2: Guard clauses
function getX() {
  if (a && b) return c;
  if (a) return d;
  if (e) return f;
  return g;
}
```

---

### Priority 4: Array Index como Key (15 casos - 3 horas)

**Comando para encontrar:**
```bash
grep -rn "key={.*index" frontend/src --include="*.tsx"
```

**Fix:**
```typescript
// ANTES
{items.map((item, index) => <Item key={index} />)}

// DESPUÉS
{items.map((item) => <Item key={item.id} />)}

// Si no hay ID único
{items.map((item, i) => <Item key={`${item.type}-${item.name}-${i}`} />)}
```

---

### Priority 5: Top-level Await (3 casos - 1 hora)

**Archivos:** Migraciones y setup de DB

**Fix:**
```typescript
// ANTES
(async () => {
  await runMigrations();
})();

// DESPUÉS
await runMigrations();
```

---

### Priority 6: Empty JSX Fragments (5 casos - 1 hora)

**Fix:**
```typescript
// ANTES
return <>{condition && <Component />}</>;

// DESPUÉS
return condition ? <Component /> : null;
```

---

## 🔒 SECURITY HOTSPOTS (2 horas)

### 🔴 MEDIUM: Regex ReDoS Vulnerability

**Archivo:** `backend/src/services/mfa-service.ts`

**Problema:** Regex con backtracking puede causar DoS

**Fix:**
```typescript
// ANTES (vulnerable)
const pattern = /^([A-Z2-7]{8})+$/;

// DESPUÉS (safe)
const pattern = /^[A-Z2-7]+$/;
if (secret.length % 8 !== 0) throw new Error('Invalid length');

// O validar longitud primero
if (secret.length > 100) throw new Error('Too long');
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### HOY (2 horas)
- [ ] 1. Arreglar 4 bugs de accesibilidad (click handlers)
- [ ] 2. Añadir headers a tabla
- [ ] 3. Aplicar optional chaining (6 casos backend)
- [ ] 4. Commit: `fix(a11y): add keyboard support to interactive elements`
- [ ] 5. Ejecutar tests: `npm test`
- [ ] 6. Análisis SonarQube: `npm run sonar:scan`

### ESTA SEMANA (8 horas)
- [ ] 7. Refactorizar tareas.service.ts (complejidad)
- [ ] 8. Refactorizar admin/plantillas/page.tsx (complejidad)
- [ ] 9. Refactorizar onboarding/page.tsx (complejidad)
- [ ] 10. Flatten task-gantt-chart.tsx (nesting)
- [ ] 11. Fix regex ReDoS en mfa-service.ts
- [ ] 12. Commit: `refactor(core): reduce cognitive complexity`

### ESTE MES (12 horas)
- [ ] 13. Refactorizar 33 ternarios anidados
- [ ] 14. Reemplazar 15 array index keys
- [ ] 15. Top-level await (3 casos)
- [ ] 16. Empty fragments (5 casos)
- [ ] 17. Commit: `refactor(quality): improve code maintainability`

---

## 🧪 WORKFLOW DE IMPLEMENTACIÓN

### Por cada fix:

```bash
# 1. Crear rama
git checkout -b fix/sonar-accessibility

# 2. Hacer cambios
# ... editar archivos ...

# 3. Ejecutar tests
npm test

# 4. Linting
npm run lint

# 5. Verificar que compila
npm run build

# 6. Commit (Husky ejecutará hooks)
git add <archivos>
git commit -m "fix(a11y): add keyboard support to click handlers"

# 7. Push
git push -u origin fix/sonar-accessibility

# 8. Crear PR
gh pr create --title "fix(a11y): add keyboard support" --body "Fixes 4 SonarQube accessibility bugs"

# 9. Después del merge, analizar de nuevo
npm run sonar:scan

# 10. Verificar que issues desaparecieron
open http://localhost:9000/dashboard?id=TeamHub-frontend
```

---

## 📊 MÉTRICAS DE ÉXITO

### Después de FASE 1 (Hoy, 2h)

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Bugs | 5 | 0 | -100% ✅ |
| Issues Rápidos | 16 | 5 | -69% |
| Total Issues | 271 | 260 | -4% |

### Después de FASE 2 (Esta semana, 8h)

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| CRITICAL | 6 | 0 | -100% ✅ |
| Security MEDIUM | 1 | 0 | -100% ✅ |
| Total Issues | 260 | 254 | -6% |

### Después de FASE 3 (Este mes, 12h)

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| MAJOR | 72 | 15 | -79% ✅ |
| Total Issues | 254 | 180 | -34% |

### Meta Final (1 mes, 22h total)

```
Antes:  271 issues (6 CRITICAL, 5 BUGS, 9 Security Hotspots)
Después: 180 issues (0 CRITICAL, 0 BUGS, 3 Security Hotspots)
Reducción: -34% issues, -100% críticos
```

---

## 🚀 EMPEZAR AHORA

### Los 5 archivos a editar primero (30 minutos):

```bash
cd /home/sandman/Sources/CursoAI/tfm/frontend

# 1. timesheet-cell.tsx (5 min)
code src/components/timetracking/timesheet-cell.tsx

# 2. mi-onboarding-widget.tsx (5 min)
code src/components/onboarding/mi-onboarding-widget.tsx

# 3. onboarding/page.tsx (5 min)
code src/app/(dashboard)/onboarding/page.tsx

# 4. user-nav.tsx (5 min)
code src/components/layout/user-nav.tsx

# 5. table.tsx (5 min)
code src/components/ui/table.tsx
```

### Patrón a aplicar (copy-paste):

```typescript
// Buscar líneas con: onClick={...} en elementos <div>

// Añadir estas props:
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    // llamar al mismo handler de onClick
  }
}}
role="button"
tabIndex={0}
```

---

## ⚡ Quick Reference

### Comandos más usados

```bash
# Ver issues actuales
curl -u $SONAR_TOKEN: "http://localhost:9000/api/issues/search?componentKeys=TeamHub-backend,TeamHub-frontend&ps=1" | jq '.total'

# Analizar
npm run sonar:scan

# Tests
npm test

# Ver dashboard
open http://localhost:9000
```

### Reglas más importantes

- **S3776** = Complejidad cognitiva
- **S2004** = Funciones anidadas
- **S1082** = Click sin teclado (a11y)
- **S3358** = Ternarios anidados
- **S6479** = Array index como key
- **S6582** = Optional chaining

---

## 🎯 DECISIÓN: ¿Empezamos?

**Opción A:** Quick wins ahora (30 min)
- Arreglar 5 bugs de accesibilidad
- Commit, push, ver resultados en SonarQube

**Opción B:** Full FASE 1 ahora (2h)
- Quick wins + optional chaining
- Mayor impacto, más tiempo

**Opción C:** Planificar y ejecutar mañana
- Revisar plan, priorizar con equipo

**¿Qué opción eliges?**
