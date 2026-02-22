---
name: rule-no-lint-suppress
description: Strict rule against suppressing lint or TypeScript errors in this repo. Load this skill when encountering any lint error, TypeScript error, ESLint warning, or when tempted to add a suppression directive. Triggers on: eslint-disable, eslint-disable-next-line, @ts-ignore, @ts-expect-error, lint error, linting error, TypeScript error, type error, warning, suprimir error, ignorar error, silenciar warning.
---

# ⚠️ REGLA CRÍTICA: NUNCA SUPRIMIR ERRORES DE LINTING

## Prohibición Absoluta

**PROHIBIDO ABSOLUTAMENTE** usar cualquiera de estas directivas:
- `eslint-disable`
- `eslint-disable-next-line`
- `eslint-disable-line`
- `@ts-ignore`
- `@ts-expect-error`

**Única excepción válida:** NINGUNA.

## Por Qué Esta Regla Existe

| Directiva de supresión | Problema real que oculta |
|------------------------|--------------------------|
| `@ts-ignore` | Error de tipado → posible bug en runtime |
| `eslint-disable` | Code smell → deuda técnica invisible |
| `@ts-expect-error` | Contrato de tipos roto → pérdida de type safety |

Suprimir errores acumula deuda técnica invisible y hace el código menos mantenible.

## Protocolo cuando el Linter/TypeScript se queja

1. **Leer el error completo** — entender qué regla se violó y por qué.
2. **Corregir el código** — refactorizar, tipar correctamente, simplificar la lógica.
3. **Si la regla es incorrecta para el proyecto** → modificar `.eslintrc.json` o `tsconfig.json` a nivel **global** (NUNCA a nivel de línea).
4. **NUNCA usar directivas de supresión** como solución rápida.

## Consecuencias de Suprimir

- Bugs ocultos llegan a producción
- Pérdida de type safety en TypeScript
- Acumulación de deuda técnica
- Código más difícil de refactorizar
