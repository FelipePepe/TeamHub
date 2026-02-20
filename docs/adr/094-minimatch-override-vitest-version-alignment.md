# ADR-094: Resolución de vulnerabilidades HIGH en minimatch mediante npm overrides y alineación de versiones vitest

**Fecha:** 2026-02-20  
**Estado:** Aceptado  
**Rama:** `feature/proyectos-asignaciones-activas`

---

## Contexto

El hook `pre-push` de Husky ejecuta `npm audit --audit-level=high` en el backend
antes de permitir el push a remoto. Al intentar publicar la rama
`feature/proyectos-asignaciones-activas`, el audit reportó **16 vulnerabilidades
HIGH** que bloqueaban el push:

- **minimatch < 10.2.1** (ReDoS via repeated wildcards): arrastrada por
  `@sentry/node`, `@typescript-eslint/typescript-estree`, `glob`, `eslint`,
  `@eslint/config-array`, `@eslint/eslintrc`, `@vitest/coverage-v8`.
- **ajv < 6.14.0** (ReDoS con opción `$data`).
- **hono < 4.11.10** (timing comparison en basicAuth/bearerAuth).

Todas las dependencias afectadas son **dev-only** (linters, type-checkers,
cobertura) sin superficie de ataque en runtime.

Se intentó `npm audit fix` y `npm audit fix --force` pero ambos fallaron porque:
1. Sin `--force`: conflicto de peer deps entre `vitest@3.x` y
   `@vitest/coverage-v8@4.x` (declarados con versiones mayores distintas en
   `package.json`).
2. Con `--force`: `npm` reportó "up to date" porque no existe aún una versión
   publicada de `@typescript-eslint` que use `minimatch >= 10.2.1`.

También se detectó que `@vitest/coverage-v8` estaba en `^4.0.18` mientras que
`vitest` estaba en `^3.0.4`, lo que forzaba el uso de `--legacy-peer-deps` en
todos los `npm install`.

---

## Decisión

### 1. Fijar `minimatch` a `^10.2.1` mediante `overrides` en `backend/package.json`

```json
"overrides": {
  "minimatch": "^10.2.1"
}
```

Esto fuerza a npm a resolver **todas** las instancias transitivas de `minimatch`
a la versión segura `>= 10.2.1`, eliminando las 14 HIGH de minimatch sin
necesidad de esperar a que los autores de `@typescript-eslint` o `@sentry/node`
publiquen nuevas versiones.

### 2. Alinear `@vitest/coverage-v8` con `vitest@3.x`

Se bajó `@vitest/coverage-v8` de `^4.0.18` a `^3.2.4` para que coincida con
la versión mayor de `vitest` instalada (`^3.2.4`). Esto elimina el conflicto de
peer deps y permite `npm install` sin `--legacy-peer-deps`.

Se intentó subir `vitest` a `^4.0.18` primero (la dirección "hacia adelante"),
pero vitest v4 cambió los patrones de inclusión de tests por defecto, lo que
causó que los tests de integración de `dist/` se ejecutasen y fallasen por
contaminación de estado de BD (8 tests) incluso con `include` explícito en
`vitest.config.ts`. Se descartó esta opción.

---

## Consecuencias

**Positivas:**
- `npm audit` pasa con 0 vulnerabilidades en backend.
- `npm install` funciona sin `--legacy-peer-deps`.
- El hook `pre-push` ya no se bloquea por vulnerabilidades de dev deps.
- Los 655 tests de backend siguen pasando.

**Negativas / Deuda técnica:**
- El `override` de `minimatch` es un parche transitorio. Si en el futuro
  `@typescript-eslint` publica una versión que ya dependa de `minimatch >= 10.2.1`,
  el override queda obsoleto (innocuo, pero innecesario).
- Quedamos en `vitest@3.x`. La migración a `vitest@4.x` requiere una tarea
  dedicada para estudiar los cambios de comportamiento en la pool de tests
  de integración (especialmente `singleFork` y el orden de ejecución).

**Tarea pendiente:**
- `chore(deps): migrate vitest to v4` — investigar cambios en `singleFork`,
  actualizar `vitest.config.ts` y verificar que los tests de integración con BD
  no se contaminen.
