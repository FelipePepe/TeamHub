# Reporte de Issues de SonarQube

**Fecha:** 2026-02-13  
**Proyectos Analizados:** TeamHub Backend, TeamHub Frontend

---

## 📊 Resumen General

### Backend (TeamHub-backend)
| Métrica | Valor | Estado |
|---------|-------|--------|
| **Bugs** | 0 | ✅ Excelente |
| **Vulnerabilities** | 0 | ✅ Excelente |
| **Security Hotspots** | 6 | ⚠️ Revisar |
| **Code Smells** | 64 | ⚠️ Moderado |
| **Coverage** | 62.3% | ⚠️ Bajo (objetivo: 80%) |
| **Duplicación** | 0.5% | ✅ Excelente |

### Frontend (TeamHub-frontend)
| Métrica | Valor | Estado |
|---------|-------|--------|
| **Bugs** | 5 | ⚠️ Accesibilidad |
| **Vulnerabilities** | 0 | ✅ Excelente |
| **Security Hotspots** | 3 | ⚠️ Revisar |
| **Code Smells** | 202 | 🔴 Alto |
| **Coverage** | 0.0% | 🔴 Sin coverage |
| **Duplicación** | 6.9% | ⚠️ Moderado |

---

## 🔴 Issues Críticos (CRITICAL)

### Backend (1 issue)

#### 1. Complejidad Cognitiva Alta
**Archivo:** `src/services/tareas.service.ts:141`  
**Severidad:** CRITICAL  
**Tipo:** Code Smell

```
Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
```

**Impacto:** Dificulta mantenimiento y aumenta riesgo de bugs.

**Solución:**
- Extraer lógica en funciones helper
- Simplificar condiciones anidadas
- Usar early returns para reducir indentación

---

### Frontend (5 issues críticos)

#### 1. Complejidad Cognitiva - Plantillas Admin
**Archivo:** `src/app/(dashboard)/admin/plantillas/page.tsx:43`  
**Severidad:** CRITICAL

```
Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.
```

**Solución:** Extraer lógica de manejo de estado en hooks personalizados.

---

#### 2-3. Funciones Anidadas - Gantt Chart
**Archivo:** `src/components/tareas/task-gantt-chart.tsx:389, 391`  
**Severidad:** CRITICAL

```
Refactor this code to not nest functions more than 4 levels deep.
```

**Impacto:** Código difícil de leer y mantener.

**Solución:**
```typescript
// Antes (nested)
function render() {
  return items.map(item => {
    return days.map(day => {
      return hours.map(hour => {
        return minutes.map(minute => {
          return <Cell />; // 5 niveles
        });
      });
    });
  });
}

// Después (flat)
const renderCell = (item, day, hour, minute) => <Cell />;
const renderHours = (item, day) => hours.map(hour => renderMinutes(item, day, hour));
const renderDays = (item) => days.map(day => renderHours(item, day));
const renderItems = () => items.map(item => renderDays(item));
```

---

#### 4. Funciones Anidadas - Crear Plantilla
**Archivo:** `src/app/(dashboard)/admin/plantillas/crear/page.tsx:162`  
**Severidad:** CRITICAL

**Solución:** Similar a Gantt Chart - extraer funciones.

---

#### 5. Complejidad Cognitiva - Onboarding
**Archivo:** `src/app/(dashboard)/onboarding/page.tsx:49`  
**Severidad:** CRITICAL

```
Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
```

**Solución:** Extraer lógica de filtrado/búsqueda en funciones puras.

---

## 🐛 Bugs (5 en Frontend)

Todos los bugs son de **accesibilidad** (a11y):

### 1-5. Click Handlers sin Keyboard Listeners

**Archivos:**
- `src/components/timetracking/timesheet-cell.tsx:62`
- `src/components/onboarding/mi-onboarding-widget.tsx:163`
- `src/app/(dashboard)/onboarding/page.tsx:392`
- `src/components/layout/user-nav.tsx:44`

**Problema:**
```tsx
// ❌ No accesible
<div onClick={handleClick}>Click me</div>
```

**Solución:**
```tsx
// ✅ Accesible
<div 
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabIndex={0}
>
  Click me
</div>

// ✅ Mejor aún: usar <button>
<button onClick={handleClick}>Click me</button>
```

---

### Bug Adicional: Tabla sin Headers

**Archivo:** `src/components/ui/table.tsx:10`  
**Severidad:** MAJOR

```
Add a valid header row or column to this "<table>".
```

**Problema:**
```tsx
// ❌ Sin headers
<table>
  <tbody>
    <tr><td>Data</td></tr>
  </tbody>
</table>
```

**Solución:**
```tsx
// ✅ Con headers
<table>
  <thead>
    <tr><th>Column</th></tr>
  </thead>
  <tbody>
    <tr><td>Data</td></tr>
  </tbody>
</table>
```

---

## 🔒 Security Hotspots

### Backend (6 hotspots)

#### 1. Regex con Backtracking (MEDIUM)
**Archivo:** `src/services/mfa-service.ts`

**Problema:** Regex vulnerable a ReDoS (Regex Denial of Service).

**Solución:**
- Usar regex simple sin backtracking
- Validar longitud de input antes de aplicar regex
- Usar timeout en regex matching

```typescript
// ❌ Vulnerable a ReDoS
const regex = /^(a+)+$/;

// ✅ Safe
const regex = /^a+$/;
// O validar longitud primero
if (input.length > 100) throw new Error('Too long');
```

---

#### 2-3. Encriptación (LOW)
**Archivo:** `src/services/mfa-service.ts`

**Review:** Verificar que:
- Se usa algoritmo seguro (AES-256-GCM recomendado)
- IV/nonce es único por operación
- Key tiene entropía suficiente (32 bytes mínimo)

---

#### 4-6. Regex Usage (LOW)
**Archivos:**
- `src/services/mfa-service.ts`
- `src/test-utils/index.ts`
- `src/validators/common.ts`

**Review:** Verificar que regex no son user-controlled.

---

### Frontend (3 hotspots)

*(No se obtuvieron detalles, similar a backend - revisar uso de regex y crypto)*

---

## 📝 Code Smells Importantes

### Backend (64 total)

#### Más Frecuentes:

1. **Optional Chain Expressions** (5 ocurrencias)
   ```typescript
   // ❌ Verboso
   if (obj && obj.prop && obj.prop.nested) {
     return obj.prop.nested.value;
   }
   
   // ✅ Conciso
   return obj?.prop?.nested?.value;
   ```

2. **Nested Ternary Operations** (3 ocurrencias)
   ```typescript
   // ❌ Difícil de leer
   const result = a ? b ? c : d : e ? f : g;
   
   // ✅ Legible
   if (a) {
     return b ? c : d;
   }
   return e ? f : g;
   ```

3. **Redundant Assignments** (1 ocurrencia)
   ```typescript
   // ❌ Redundante
   let nivel = 1;
   if (condition) {
     nivel = 1; // Ya es 1
   }
   
   // ✅ Simplificado
   let nivel = 1;
   ```

4. **Top-level Await** (3 ocurrencias)
   ```typescript
   // ❌ Old style
   (async () => {
     await runMigrations();
   })();
   
   // ✅ Modern (ES2022)
   await runMigrations();
   ```

---

### Frontend (202 total)

**Alto volumen** sugiere necesidad de refactoring general. Patrones comunes:
- Complejidad cognitiva alta
- Funciones anidadas profundamente
- Lógica duplicada

---

## 🎯 Plan de Acción Recomendado

### Prioridad 1 - CRÍTICO (Esta semana)

1. ✅ **Arreglar bugs de accesibilidad** (5 bugs)
   - Tiempo: 2-3 horas
   - Impacto: Legal/compliance + UX

2. ✅ **Refactorizar función compleja en tareas.service.ts**
   - Tiempo: 1-2 horas
   - Impacto: Mantenibilidad

3. ✅ **Añadir headers a tabla** (`table.tsx`)
   - Tiempo: 30 minutos
   - Impacto: Accesibilidad + SEO

---

### Prioridad 2 - ALTO (Este mes)

4. ⚠️ **Refactorizar código anidado en Gantt Chart**
   - Tiempo: 4-6 horas
   - Impacto: Rendimiento + mantenibilidad

5. ⚠️ **Simplificar páginas complejas** (plantillas, onboarding)
   - Tiempo: 6-8 horas
   - Impacto: Mantenibilidad

6. ⚠️ **Revisar security hotspots de MFA**
   - Tiempo: 2-3 horas
   - Impacto: Seguridad

---

### Prioridad 3 - MEDIO (Próximo sprint)

7. 📊 **Incrementar coverage backend** (62% → 80%)
   - Tiempo: 2-3 días
   - Foco: Lógica de negocio crítica

8. 📊 **Implementar coverage frontend** (0% → 60%)
   - Tiempo: 3-5 días
   - Foco: Componentes core + páginas principales

9. 🧹 **Refactorizar code smells MAJOR**
   - Tiempo: 1-2 semanas
   - Aplicar optional chaining, eliminar ternarios anidados

---

### Prioridad 4 - BAJO (Backlog)

10. 🔧 **Reducir duplicación frontend** (6.9% → <3%)
11. 🔧 **Refactorizar code smells restantes** (MINOR)

---

## 📈 Métricas de Éxito

**Objetivo en 1 mes:**

| Métrica | Actual | Objetivo | Gap |
|---------|--------|----------|-----|
| Backend Bugs | 0 | 0 | ✅ |
| Frontend Bugs | 5 | 0 | -5 |
| Backend Coverage | 62.3% | 80% | -17.7% |
| Frontend Coverage | 0% | 60% | -60% |
| Critical Code Smells | 6 | 0 | -6 |
| Security Hotspots | 9 | <5 | -4 |

---

## 🔍 Comandos Útiles

### Revisar Issues Específicos

```bash
# Backend bugs
curl -u $SONAR_TOKEN: "http://localhost:9000/api/issues/search?componentKeys=TeamHub-backend&types=BUG&ps=50" | jq .

# Frontend code smells críticos
curl -u $SONAR_TOKEN: "http://localhost:9000/api/issues/search?componentKeys=TeamHub-frontend&types=CODE_SMELL&severities=CRITICAL&ps=50" | jq .

# Security hotspots
curl -u $SONAR_TOKEN: "http://localhost:9000/api/hotspots/search?projectKey=TeamHub-backend&ps=50" | jq .
```

### Ejecutar Análisis

```bash
# Análisis completo
npm run sonar:scan

# Solo backend
npm run sonar:scan:backend

# Solo frontend
npm run sonar:scan:frontend
```

---

## 📚 Referencias

- [SonarQube Dashboard Backend](http://localhost:9000/dashboard?id=TeamHub-backend)
- [SonarQube Dashboard Frontend](http://localhost:9000/dashboard?id=TeamHub-frontend)
- [SonarQube Rules TypeScript](https://rules.sonarsource.com/typescript/)
- [WCAG 2.1 Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Próxima revisión:** Después de implementar Prioridad 1 y 2
