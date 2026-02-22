```skill
---
name: rule-boy-scout
description: Boy Scout Rule and VS Code diagnostics cleanup protocol. Load this skill whenever generating or modifying code. Enforces "leave the code cleaner than you found it": fix existing TypeScript errors, lint warnings and VS Code Problems panel issues in every file you touch. Triggers on: generate code, new code, modify code, escribir código, generar código, modificar código, vscode problems, diagnostics, boy scout, dejar código limpio, panel de problemas, errores typescript, warnings lint.
---

# Regla del Boy Scout — Código Más Limpio Siempre

## Principio Fundamental

> "Deja el código **más limpio** de como lo encontraste."
> — Robert C. Martin (Uncle Bob)

**Esto no es opcional.** Cada vez que el agente genera o modifica código, debe:

1. Revisar los diagnósticos activos de VS Code (panel Problems) en los archivos tocados.
2. Corregir **todos** los errores y warnings encontrados, no solo los propios del cambio.
3. No introducir nuevos problemas en ningún archivo.

---

## Protocolo de Limpieza Obligatorio

### Antes de generar código en un archivo

```
get_errors([ruta del archivo])
```

Revisar y catalogar los problemas existentes. No ignorar ninguno.

### Durante la generación de código

- Generar el código nuevo correctamente tipado y sin warnings.
- Aprovechar el contexto del archivo para corregir problemas preexistentes en el mismo diff.

### Después de cada edición

```
get_errors([ruta del archivo])
```

Verificar que:
- ✅ 0 nuevos errores introducidos.
- ✅ Problemas preexistentes corregidos o al menos no empeorados.

---

## Tipos de Diagnósticos a Limpiar

### 🔴 Errores TypeScript (prioridad máxima)

| Problema habitual | Fix correcto |
|---|---|
| `Property 'X' does not exist on type 'Y'` | Usar tipos correctos o variables intermedias bien tipadas en el mock/test |
| `Type 'A' is not assignable to type 'B'` | Corregir el tipo, no añadir `as any` |
| `Conversion may be a mistake` | Pasar por `unknown` solo si es intencional y documentado |
| `Argument of type 'X' is not assignable` | Ajustar la firma o el tipo del argumento |

### 🟡 Warnings ESLint / Next.js (prioridad alta)

| Problema habitual | Fix correcto |
|---|---|
| `@typescript-eslint/no-explicit-any` | Tipar correctamente; usar `unknown` + narrowing si el tipo es realmente desconocido |
| `@next/next/no-img-element` | Usar `<Image>` de `next/image`, o `<span>` en mocks de test |
| `no-unused-vars` | Eliminar la variable o prefijar con `_` si es un parámetro obligatorio |
| `Cognitive Complexity` excede umbral | Extraer funciones auxiliares para reducir el nesting |

### 🔵 Problemas de SonarQube / calidad

| Problema habitual | Fix correcto |
|---|---|
| Cognitive Complexity > 15 | Refactorizar: extraer subfunciones, simplificar condicionales |
| `Do not pass function directly to .map()` | Envolver: `.map((x) => fn(x))` |
| Duplicación de código | Extraer utilidad compartida |

---

## Reglas de Oro

### ❌ NUNCA hacer esto

```typescript
// ❌ Suprimir para evitar trabajar
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const x: any = getValue();

// ❌ Ignorar el error de TypeScript
// @ts-ignore
doSomething(badArg);

// ❌ Dejar un archivo con más errores de los que tenía
```

### ✅ SIEMPRE hacer esto

```typescript
// ✅ Tipar correctamente
const x: ReturnType<typeof getValue> = getValue();

// ✅ Corregir la causa raíz
const validArg = transformToExpected(badArg);
doSomething(validArg);

// ✅ Entregar el archivo con ≤ problemas que al empezar
```

---

## Aplicación en Tests

Los archivos de test son código de primer nivel. Los mismos estándares aplican.

Patrones correctos para mocks de Hono Context:

```typescript
// ✅ Tipar el mock correctamente
import type { Context } from 'hono';

const createMockContext = (...): MockContext => ({
  req: { ... },
  res: new Response(null, { status: 200 }),  // Response real, no { status: 200 }
  header: (name: string, value?: string) => { ... },  // firma exacta de SetHeaders
  // ...
}) as unknown as Context;

// ✅ Acceder a propiedades internas del mock con tipo intermedio
const mockCtx = createMockContext() as unknown as MockContext;
expect(mockCtx._resHeaders.get('X-Frame-Options')).toBe('DENY');
```

---

## Integración con Otros Skills

Este skill **no reemplaza** a los demás — los complementa:

- **`rule-no-lint-suppress`** — detalla por qué nunca suprimir; este skill indica cuándo y cómo limpiar.
- **`rule-clean-code`** — define los estándares de arquitectura; este skill define el protocolo de limpieza activa.
- **`rule-testing`** — cubre cobertura; este skill cubre que los tests no tengan errores de tipos.

---

## Check Final Antes de Commit

```bash
# Backend
cd backend && npm run lint && npx tsc --noEmit

# Frontend
cd frontend && npm run lint && npx tsc --noEmit
```

**Si alguno falla → corregir antes de hacer commit.** Sin excepciones.
```
