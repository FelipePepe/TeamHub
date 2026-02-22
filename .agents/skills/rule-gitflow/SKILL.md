---
name: rule-gitflow
description: GitFlow conventions, commit standards and git workflow rules for this repo. Load this skill when doing any git operation: commits, pushes, branches, PRs, merges, releases or hotfixes. Triggers on: git, commit, push, branch, pull request, PR, merge, release, hotfix, checkout, rebase, tag, --no-verify, conventional commits, rama, rama de integración, flujo de trabajo git.
---

# GitFlow y Convenciones de Git

## ⚠️ REGLA CRÍTICA: NUNCA USAR --no-verify

**PROHIBIDO ABSOLUTAMENTE:** `git commit --no-verify` · `git push --no-verify`

Los hooks de Husky son **quality gates obligatorios**. Si un hook falla → corregir el problema, no saltárselo.

**Única excepción válida:** NINGUNA.

## Flujo de Trabajo Obligatorio

### Antes de empezar cualquier tarea
```bash
git checkout main && git pull origin main
git checkout -b <tipo>/<nombre-descriptivo>
```

### Antes de hacer commit (checklist obligatorio)
1. `npm run lint` — 0 errores (warnings menores aceptados)
2. `npm test` — todos los tests pasando
3. **SI LOS TESTS FALLAN → NO HACER COMMIT NI PUSH**

### Para subir cambios
```bash
git add <archivos-específicos>   # NO usar git add .
git commit -m "tipo(scope): descripción"   # sin --no-verify
git push -u origin <rama>                  # sin --no-verify
gh pr create
```

## Estrategia de Branching

| Rama | Origen | Destino | Uso |
|------|--------|---------|-----|
| `main` | — | — | Producción. Solo recibe merges de `release/` y `hotfix/` |
| `develop` | — | — | Integración. Features se mergean aquí |
| `feature/xxx` | develop | develop | Nuevas funcionalidades |
| `bugfix/xxx` | develop | develop | Correcciones no urgentes |
| `release/x.x.x` | develop | main + develop | Preparación de release |
| `hotfix/xxx` | main | main + develop | Correcciones urgentes en producción |

### ⚠️ Release Branches son INMUTABLES tras el merge
Una vez mergeada una release branch a `main` y `develop`:
- ❌ **PROHIBIDO** hacer más commits en esa release branch
- ✅ Para cambios urgentes → `hotfix/nombre` desde `main`
- ✅ Para desarrollo → `bugfix/nombre` o `feature/nombre` desde `develop`

## Convención de Commits (Conventional Commits)

Formato: `tipo(scope): descripción`

| Tipo | Cuándo |
|------|--------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Cambios en documentación |
| `style` | Formato sin cambios de lógica |
| `refactor` | Refactorización sin cambios de funcionalidad |
| `test` | Añadir o modificar tests |
| `chore` | Mantenimiento (deps, config, etc.) |

Ejemplo: `feat(auth): add MFA backup codes support`

## Integración de Cambios
- Usar **rebase** (no merge) para integrar cambios de `develop` a feature branches.
- Antes de abrir PR: `git rebase develop` en la feature branch.
- Historial lineal y limpio.

## Protección de Ramas
- `main` y `develop`: push directo **prohibido** — solo via PR aprobado.
- CI debe pasar (lint + tests + build) antes de mergear.

## Preservación de Ramas
**NUNCA borrar ramas** después de mergear (ni local ni remotamente).
```bash
gh pr merge <number> --squash   # SIN --delete-branch
```
Las ramas se mantienen para trazabilidad histórica y auditorías.
