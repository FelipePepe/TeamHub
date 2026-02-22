---
name: rule-testing
description: Testing strategy, coverage targets and quality gates for this repo. Load this skill when writing tests, checking coverage, setting up test suites, or working with Vitest, Playwright or Husky hooks. Triggers on: test, tests, testing, coverage, cobertura, vitest, jest, playwright, e2e, unit test, integration test, quality gate, Husky, pre-commit, pre-push, test failing, test roto.
---

# Calidad, Testing y Quality Gates

## Estrategia de Cobertura (100/80/0)

| Nivel | Target | Qué incluye |
|-------|--------|-------------|
| **CORE** | **100%** | Lógica que manipula dinero o cálculos críticos |
| **IMPORTANT** | **80%** | Funcionalidades visibles al usuario (UI/Features) |
| **INFRASTRUCTURE** | **0%** | Tipos TypeScript y constantes estáticas |

## Quality Gates con Husky

No eludir los hooks de Husky bajo ningún concepto.

| Hook | Ejecuta |
|------|---------|
| `pre-commit` | Linting rápido + tests unitarios |
| `pre-push` | Cobertura completa + validación E2E |

Si un hook falla → corregir el problema en el código. **Jamás usar `--no-verify`.**

## Stack de Testing

| Capa | Framework | Ubicación |
|------|-----------|-----------|
| Backend unit/integration | Vitest | `backend/src/**/__tests__/` |
| Frontend unit/component | Vitest + Testing Library | `frontend/src/**/__tests__/` |
| E2E | Playwright | `frontend/e2e/` |

## Métricas Actuales (v1.7.0)

| Componente | Tests | Cobertura |
|------------|-------|-----------|
| Backend | 664 ✅ | 81.01% |
| Frontend | 383 ✅ | 90.07% |
| **Total** | **1,047 ✅** | **85.54%** |
