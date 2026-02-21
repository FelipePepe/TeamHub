# 🚀 Releases

Historial de versiones y releases del proyecto TeamHub.

Para ver el historial completo de decisiones arquitecturales, consultar [docs/decisiones/](decisiones/).

---

## v1.7.0 - Proyectos Multi-departamento + Bugfixes (2026-02-21)

**N:M Proyectos ↔ Departamentos, filtro de empleados, fixes de calidad**

### 🎯 Features y Fixes
- ✅ **N:M Proyectos-Departamentos** (ADR-113)
  - Tabla pivote `proyectos_departamentos` con relación many-to-many
  - Proyectos pueden pertenecer a múltiples departamentos simultáneamente
  - Script de migración `migrate-proyectos-departamentos.ts` (workaround Node 25 / drizzle-kit)
  - Nuevas funciones de repositorio: `addDepartamentoToProyecto`, `removeDepartamentoFromProyecto`, `getProyectosByDepartamento`
  - Frontend: selector multi-departamento en formulario de proyecto
  - Filtro de empleados en "Añadir asignación" limitado por departamentos del proyecto

- ✅ **Fix uppercase nombres de usuario** (ADR-111, PR #137)
  - Corrección en endpoint de actualización de perfil: nombres se guardan con case original

- ✅ **Fix totalTareas en plantillas onboarding** (ADR-112, PR #138)
  - Cambio de `inner join` → `left join` + `countDistinct` en consulta de plantillas
  - Corregía conteo incorrecto cuando una plantilla no tenía tareas asignadas

### 📊 Métricas
- Tests: **1,046 pasando** (663 backend + 383 frontend)
- Coverage: Backend ≥81%, Frontend ≥90%
- SonarQube: 0 bugs, 0 vulnerabilities, 0 hotspots

### 🔗 Referencias
- Branch: `feature/proyectos-departamentos` (commit `0fdc618`)
- PRs: #137 (uppercase fix), #138 (totalTareas fix), PR pendiente (N:M)
- ADR-111, ADR-112, ADR-113

---

## v1.6.1 - CORS Dynamic Validation & Docs Modularization (2026-02-14)

**Mejoras de Configuración y Documentación**

### 🎯 Features
- ✅ **CORS Dynamic Validation** (ADR-110)
  - Regex `LOCAL_DEV_ORIGIN_REGEX` para puertos dinámicos localhost en desarrollo
  - Seguro en producción: solo origins configurados
  - Flexible en desarrollo: cualquier puerto localhost
  - Configuración explícita de credentials, methods y headers

- ✅ **Documentación Modularizada**
  - `docs/decisiones.md` separado en 7 archivos modulares
  - Índice central para navegación fácil
  - Mejora en mantenibilidad y búsqueda de información

### 📊 Métricas
- Tests: 1,038 pasando (655 backend + 383 frontend)
- Coverage: Backend 81.01%, Frontend 90.07%
- SonarQube: 0 bugs, 0 vulnerabilities, 0 hotspots

### 🔗 Referencias
- PRs: #125, #126, #127
- ADR-110: CORS Dynamic Validation
- Tag: [v1.6.1](https://github.com/FelipePepe/TeamHub/releases/tag/v1.6.1)

---

## v1.6.0 - Code Quality & Security (2026-02-14)

**Optimización, Coverage y SonarQube Clean**

### 🎯 Objetivos Completados
- ✅ **Code Optimization** (ADR-092)
  - Reducción de complejidad ciclomática
  - Eliminación de duplicación y magic numbers
  - Consolidación de utilidades compartidas
  - Mejora en mantenibilidad: +60%

- ✅ **Coverage Improvements** (ADR-107)
  - Nueva suite tests `app.ts` (16 tests)
  - Suite ampliada `env.ts` (29 tests)
  - Backend: 81.01% (objetivo >80% ✅)
  - Frontend: 90.07% (objetivo >90% ✅)

- ✅ **SonarQube Fixes** (ADR-108)
  - 1 bug resuelto (accessibility)
  - 6 security hotspots resueltos/documentados
  - ReDoS vulnerability eliminada
  - Estado final: 0 bugs, 0 vulnerabilities

### 📊 Métricas Finales
- Total tests: 1,038 (655 backend + 383 frontend)
- Coverage strategy 100/80/0 cumplida
- Linting: 49 warnings (solo `any` en tests, no bloquea)

### 🔗 Referencias
- PRs: #115, #116, #117, #118, #122, #123
- ADRs: 092, 107, 108, 109
- Tag: [v1.6.0](https://github.com/FelipePepe/TeamHub/releases/tag/v1.6.0)

---

## Historial de Releases Anteriores

Para consultar releases y decisiones arquitecturales anteriores, ver:
- [docs/decisiones/](decisiones/) - Historial completo de ADRs y evolución del proyecto
- [CHANGELOG.md](../CHANGELOG.md) - Log detallado de cambios por versión (si existe)
- [GitHub Releases](https://github.com/FelipePepe/TeamHub/releases) - Tags y releases oficiales
