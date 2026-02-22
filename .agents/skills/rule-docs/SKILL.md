---
name: rule-docs
description: Documentation standards and the mandatory update of decisiones.md for this repo. Load this skill when completing a feature, bug fix, refactor, or architectural decision, or when asked to update documentation. Triggers on: docs, documentation, JSDoc, TSDoc, ADR, decisiones.md, README, comment, changelog, actualizar documentación, documenta, documentación, actualizar ADR, nuevo ADR.
---

# Documentación (Docs as Code)

## JSDoc/TSDoc — Obligatorio en Métodos

Toda función/método debe llevar comentario `/** ... */`:

```typescript
/**
 * Calcula el total de horas consumidas por un proyecto.
 * 
 * @param proyectoId - UUID del proyecto a consultar
 * @returns Total de horas como número decimal, o 0 si no hay registros
 * @throws {NotFoundError} Si el proyecto no existe
 * @example
 *   const horas = await calcularHorasProyecto('uuid-aqui');
 */
async function calcularHorasProyecto(proyectoId: string): Promise<number> { ... }
```

Documenta: propósito, `@param`, `@returns`, `@throws` (si aplica), `@example` (si aporta).

## Sincronización con PRs

Cada Pull Request que modifique lógica debe actualizar **en el mismo commit**:
- ADR correspondiente en `docs/adr/` (si aplica decisión arquitectural)
- Storybook (`*.stories.tsx`) si cambian props de componentes
- JSDoc en las funciones modificadas

## decisiones.md — CRÍTICO ⚠️

**SIEMPRE** actualizar `docs/decisiones.md` al completar trabajo significativo.

### Cuándo actualizar
- Al completar una feature, bugfix o refactor relevante
- Al tomar una decisión arquitectural
- Al final de cada sesión de trabajo (PR específico si es necesario)

### Qué añadir
```markdown
### ADR-NNN: Título Descriptivo

**Fecha:** YYYY-MM-DD
**Estado:** ✅ Implementado | 🔄 En progreso | ❌ Rechazado
**Branch:** `tipo/nombre-rama`
**PR:** #número

#### Contexto
[Por qué era necesario este cambio]

#### Decisión
[Qué se decidió hacer y por qué, incluyendo alternativas descartadas]

#### Implementación
[Ficheros modificados, código relevante, migraciones]

#### Consecuencias
- ✅ Beneficios
- ⚠️ Trade-offs o deuda técnica asumida
```

### Estructura del índice
- `docs/decisiones.md` — índice principal y estado actual
- `docs/decisiones/04-progreso-releases-cobertura.md` — ADRs recientes y releases
- Los ADRs se numeran secuencialmente (último: ADR-116)

`docs/decisiones.md` es la **fuente única de verdad** para generar la memoria del TFM.
