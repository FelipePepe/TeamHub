# Decisiones del Proyecto (ADR) — Índice

Este archivo es el **punto de entrada** para navegar las decisiones arquitecturales y el historial de evolución del proyecto TeamHub.

> El detalle completo está modularizado en `docs/decisiones/`. Cada subfichero agrupa un área temática.  
> Para volver al inicio del proyecto → [README principal](../README.md)

> **Nota sobre PRs documentados:** Este documento enfoca en **features funcionales significativas y decisiones arquitecturales** (PRs #30+). Los PRs #1-29 corresponden a setup inicial, fixes técnicos y configuración CI/CD, documentados implícitamente en los ADRs de infraestructura.

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

## 🆕 ADRs Recientes (2026-03)

| ADR | Fecha | Título | Estado |
|-----|-------|--------|--------|
| [ADR-121](decisiones/04-progreso-releases-cobertura.md#adr-121) | 2026-03-20 | Security Fixes + First-Time Experience README (v1.7.2) | ✅ Implementado |
| [ADR-120](decisiones/04-progreso-releases-cobertura.md#adr-120) | 2026-02-22 | Refactor TimetrackingPage — Extracción de Estado a Custom Hook | ✅ Implementado |
| [ADR-119](decisiones/04-progreso-releases-cobertura.md#adr-119) | 2026-02-22 | Skill rule-boy-scout — Protocolo de Diagnósticos VS Code | ✅ Implementado |
| [ADR-118](decisiones/04-progreso-releases-cobertura.md#adr-118) | 2026-02-22 | Fix Completo de Lint Warnings — 0 errores / 0 warnings | ✅ Implementado |
| [ADR-117](decisiones/04-progreso-releases-cobertura.md#adr-117) | 2026-02-22 | Modularización de Agent Instructions en Skills | ✅ Implementado |
| [ADR-116](decisiones/04-progreso-releases-cobertura.md#adr-116) | 2026-02-22 | Fix Unicidad Código Proyecto tras Soft-Delete | ✅ Implementado |
| [ADR-115](decisiones/04-progreso-releases-cobertura.md#adr-115) | 2026-02-22 | Filtro de Empleados por Proyecto y Rol en Tareas | ✅ Implementado |
| [ADR-114](decisiones/04-progreso-releases-cobertura.md#adr-114) | 2026-02-22 | Dashboard KPI — Proyectos con Desviación Presupuestaria | ✅ Implementado |
| [ADR-113](decisiones/04-progreso-releases-cobertura.md#adr-113) | 2026-02-21 | N:M Proyectos-Departamentos + Employee Filter | ✅ Implementado |
| [ADR-112](decisiones/04-progreso-releases-cobertura.md#adr-112) | 2026-02-21 | Fix totalTareas en Plantillas (LEFT JOIN) | ✅ Implementado |
| [ADR-111](decisiones/04-progreso-releases-cobertura.md#adr-111) | 2026-02-21 | Fix Uppercase Nombres de Usuario | ✅ Implementado |
| [ADR-110](decisiones/04-progreso-releases-cobertura.md#adr-110) | 2026-02-14 | CORS Dynamic Validation | ✅ Implementado |
| [ADR-109](decisiones/04-progreso-releases-cobertura.md#adr-109) | 2026-02-14 | SonarQube Security Hotspots Fixed | ✅ Implementado |

---

## 📊 Estado Actual del Proyecto

> **Versión:** v1.7.2 | **Fecha:** 20 de marzo de 2026

| Componente | Tests | Cobertura |
|------------|-------|-----------|
| Backend | 664 ✅ | 81.01% |
| Frontend | 383 ✅ | 90.07% |
| **Total** | **1,047 ✅** | **85.54%** |

**Calidad:**
- SonarQube: 0 bugs · 0 vulnerabilities · 0 hotspots
- Linting: 0 errores · **0 warnings** ✅
- API: OpenAPI v1.0.0 con 157 endpoints

**Features destacadas completadas en v1.7.0:**
- ✅ N:M Proyectos ↔ Departamentos (tabla pivote `proyectos_departamentos`)
- ✅ Dashboard KPI: proyectos con desviación presupuestaria (Admin + Manager)
- ✅ Selector de empleados en tareas filtrado por proyecto + muestra de rol
- ✅ Fix unicidad código proyecto tras soft-delete (constraint parcial DB)
- ✅ Fix onboarding cache + correcciones de mocks de tests
- ✅ Modularización agent instructions en skills (PR #141)
- ✅ Fix completo 0 warnings lint (PR #143)
- ✅ Skill rule-boy-scout — protocolo diagnósticos VS Code (PR #144)
- ✅ Refactor `TimetrackingPage` → `useTimetrackingPageState` hook (SRP + complejidad cognitiva)

---

## 🔍 Búsqueda Rápida de ADRs

| Rango | Contenido |
|-------|-----------|
| ADR-001 a ADR-050 | Setup inicial, arquitectura, seguridad, autenticación, API  → [01-adrs-por-categoria.md](decisiones/01-adrs-por-categoria.md) |
| ADR-048 a ADR-069 | GitFlow, Husky, colaboración LLM, D3.js, dark mode → [02-adrs-registro-ejecucion.md](decisiones/02-adrs-registro-ejecucion.md) |
| ADR-071 a ADR-079 | Sistema de tareas jerárquico (Jira-like), dashboards → [01-adrs-por-categoria.md](decisiones/01-adrs-por-categoria.md) |
| ADR-092 a ADR-120 | Optimización, SonarQube, cobertura, CORS, bugfixes, KPIs, tareas, agents/skills, refactors → [04-progreso-releases-cobertura.md](decisiones/04-progreso-releases-cobertura.md) |

---

*Para el historial completo antes de la modularización → [decisiones_legacy_full.md](decisiones/decisiones_legacy_full.md)*
