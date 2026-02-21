# Decisiones del Proyecto (ADR) — Índice

Este archivo es el **punto de entrada** para navegar las decisiones arquitecturales y el historial de evolución del proyecto TeamHub.

> El detalle completo está modularizado en `docs/decisiones/`. Cada subfichero agrupa un área temática.  
> Para volver al inicio del proyecto → [README principal](../README.md)

---

## 📁 Módulos de Decisiones

| Fichero | Contenido |
|---------|-----------|
| [00 — Contexto e Índice Original](decisiones/00-contexto-e-indice-original.md) | Introducción del proyecto, problema que resuelve, propuesta de valor y contexto inicial |
| [01 — ADRs por Categoría](decisiones/01-adrs-por-categoria.md) | Todas las decisiones técnicas organizadas por tema: Documentación, Arquitectura, Seguridad, API, Frontend, Backend, Testing, DevOps |
| [02 — ADRs de Registro de Ejecución](decisiones/02-adrs-registro-ejecucion.md) | ADRs de proceso: GitFlow, CI/CD, Husky hooks, sistema multi-LLM, colaboración |
| [03 — Registro de Fases y Tareas](decisiones/03-registro-fases-y-tareas.md) | Progreso por fases (0-4), historial detallado de tareas completadas con fechas y PRs |
| [04 — Progreso, Releases y Cobertura](decisiones/04-progreso-releases-cobertura.md) | Historial de releases (v1.0.0 → v1.7.0), métricas de cobertura, SonarQube, ADRs recientes |

---

## 🆕 ADRs Recientes (2026-02)

| ADR | Fecha | Título | Estado |
|-----|-------|--------|--------|
| [ADR-113](decisiones/04-progreso-releases-cobertura.md#adr-113) | 2026-02-21 | N:M Proyectos-Departamentos + Employee Filter | ✅ Implementado |
| [ADR-112](decisiones/04-progreso-releases-cobertura.md#adr-112) | 2026-02-21 | Fix totalTareas en Plantillas (LEFT JOIN) | ✅ Implementado |
| [ADR-111](decisiones/04-progreso-releases-cobertura.md#adr-111) | 2026-02-21 | Fix Uppercase Nombres de Usuario | ✅ Implementado |
| [ADR-110](decisiones/04-progreso-releases-cobertura.md#adr-110) | 2026-02-14 | CORS Dynamic Validation | ✅ Implementado |
| [ADR-109](decisiones/04-progreso-releases-cobertura.md#adr-109) | 2026-02-14 | SonarQube Security Hotspots Fixed | ✅ Implementado |
| [ADR-108](decisiones/04-progreso-releases-cobertura.md#adr-108) | 2026-02-14 | SonarQube Bug & Vulnerability Fixes | ✅ Implementado |
| [ADR-107](decisiones/04-progreso-releases-cobertura.md#adr-107) | 2026-02-14 | Incremento de Cobertura Backend (app.ts / env.ts) | ✅ Completado |

---

## 📊 Estado Actual del Proyecto

> **Versión:** v1.7.0 | **Fecha:** 21 de febrero de 2026

| Componente | Tests | Cobertura |
|------------|-------|-----------|
| Backend | 663 ✅ | 81.01% |
| Frontend | 383 ✅ | 90.07% |
| **Total** | **1,046 ✅** | **85.54%** |

**Calidad:**
- SonarQube: 0 bugs · 0 vulnerabilities · 0 hotspots
- Linting: 0 errores (49 warnings, solo `any` en tests)
- API: OpenAPI v1.0.0 con 157 endpoints

**Features destacadas completadas en v1.7.0:**
- ✅ N:M Proyectos ↔ Departamentos (tabla pivote `proyectos_departamentos`)
- ✅ Filtro de empleados en modal "Añadir asignación" por departamentos del proyecto
- ✅ Corrección uppercase nombres de usuario en todas las pantallas
- ✅ Fix totalTareas en plantillas de onboarding (LEFT JOIN)

---

## 🔍 Búsqueda Rápida de ADRs

| Rango | Contenido |
|-------|-----------|
| ADR-001 a ADR-050 | Setup inicial, arquitectura, seguridad, autenticación, API  → [01-adrs-por-categoria.md](decisiones/01-adrs-por-categoria.md) |
| ADR-048 a ADR-069 | GitFlow, Husky, colaboración LLM, D3.js, dark mode → [02-adrs-registro-ejecucion.md](decisiones/02-adrs-registro-ejecucion.md) |
| ADR-071 a ADR-079 | Sistema de tareas jerárquico (Jira-like), dashboards → [01-adrs-por-categoria.md](decisiones/01-adrs-por-categoria.md) |
| ADR-092 a ADR-113 | Optimización, SonarQube, cobertura, CORS, bugfixes → [04-progreso-releases-cobertura.md](decisiones/04-progreso-releases-cobertura.md) |

---

*Para el historial completo antes de la modularización → [decisiones_legacy_full.md](decisiones/decisiones_legacy_full.md)*
