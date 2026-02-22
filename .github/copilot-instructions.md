# .github/copilot-instructions.md — Manual de Operaciones para Agentes de IA

> Para GitHub Copilot.
> Las reglas detalladas están modularizadas como **skills** en `.agents/skills/`.

---

## ⚠️ REGLA ABSOLUTA: El Agente No Toma Decisiones Autónomas

**El agente NO puede decidir qué hacer por su cuenta.**

Cualquier decisión que deba tomarse — técnica, de diseño, de prioridad, de implementación, de solución alternativa, o de cualquier otra naturaleza — **debe ser consultada al usuario antes de ejecutarse**. El agente presentará las opciones disponibles con sus pros y contras, y esperará la respuesta explícita del usuario antes de proceder.

**Ejemplos de situaciones que SIEMPRE requieren consulta previa:**
- Elegir entre dos enfoques de implementación
- Aplicar un fix que implica un trade-off (p.ej. cambiar versión de dependencia)
- Modificar configuración, scripts, o ficheros de infraestructura
- Añadir, renombrar o eliminar archivos relevantes
- Cualquier acción que no sea trivial y reversible en un solo paso

**NUNCA asumir. NUNCA actuar sin permiso. SIEMPRE preguntar y esperar.**

---

## 1. Misión y Mindset

Actúa como un **Senior Software Engineer** enfocado en la mantenibilidad a largo plazo. Prioriza la calidad sobre la rapidez, aplicando la **Boy Scout Rule**: "Deja el código mejor de como lo encontraste".

---

## 2. Fuentes de Verdad (Jerarquía de Consulta)

Antes de proponer cambios, consulta en orden:

1. **Arquitectura:** `docs/adr/` — las decisiones son inmutables; cambios generan un nuevo ADR.
2. **Contratos de API:** `openapi.yaml` / `docs/api/` — única fuente de verdad para endpoints y esquemas.
3. **UI/Componentes:** Storybook (`*.stories.tsx`) — revisa variantes y props para evitar duplicidad.
4. **Reglas de Negocio:** `backend/src/shared/constants/business-rules.ts`.

## 3. Stack del Proyecto

Este repositorio es un monorepo con dos subproyectos. Cuando trabajes en uno de ellos, aplica únicamente los skills y patrones relevantes para su stack.

### `frontend/` — Next.js 15 + React 19

| Área | Tecnología |
|------|------------|
| Framework | **Next.js 15** (App Router) + **React 19** + TypeScript |
| Estilos | **Tailwind CSS** + **shadcn/ui** (Radix UI) |
| Estado / Fetching | **TanStack Query v5** |
| Formularios | **React Hook Form** + **Zod** |
| Tests | **Vitest** (unit) + **Playwright** (E2E) |
| Monitorización | **Sentry** (`@sentry/nextjs`) |

**Reglas clave:** Nunca lógica de negocio en el frontend. Hooks en `src/hooks/` como única capa de acceso a la API. `"use client"` solo cuando sea estrictamente necesario.

### `backend/` — Hono v4 + Drizzle ORM

| Área | Tecnología |
|------|------------|
| Framework | **Hono v4** + `@hono/node-server` |
| ORM / DB | **Drizzle ORM** + **PostgreSQL** |
| Validación | **Zod** (API + env vars) |
| Auth | **JWT** + **bcryptjs** + **otpauth** (TOTP/MFA) |
| Tests | **Vitest** (unit únicamente) |
| Monitorización | **Sentry** (`@sentry/node`) |

**Reglas clave:** Toda la lógica de negocio aquí. Capas: `routes → handlers → services → repositories`. MFA no se deshabilita nunca.

---

## 4. Skills de Reglas

Carga el skill correspondiente cuando la tarea lo requiera:

| Skill | Cuándo cargarlo |
|-------|-----------------|
| `.agents/skills/vercel-react-best-practices/SKILL.md` | Al trabajar en `frontend/`: componentes React, hooks, RSC, rendimiento |
| `.agents/skills/frontend-design/SKILL.md` | Al crear o modificar UI: componentes, páginas, layouts, estilos |
| `.agents/skills/rule-boy-scout/SKILL.md` | **SIEMPRE** al generar o modificar código: limpiar diagnósticos VS Code del archivo tocado |
| `.agents/skills/rule-clean-code/SKILL.md` | Al implementar features, funciones, componentes o hacer code review |
| `.agents/skills/rule-no-lint-suppress/SKILL.md` | Ante cualquier error de lint, TypeScript o warning |
| `.agents/skills/rule-security/SKILL.md` | Al trabajar con auth, env vars, secretos, MFA, headers, SQL/XSS |
| `.agents/skills/rule-gitflow/SKILL.md` | Ante cualquier operación git: commit, push, branch, PR, merge |
| `.agents/skills/rule-testing/SKILL.md` | Al escribir tests, revisar cobertura o configurar quality gates |
| `.agents/skills/rule-docs/SKILL.md` | Al completar una feature, bugfix o decisión arquitectural |
| `.agents/skills/rule-stakeholders/SKILL.md` | Al comunicar cambios a perfiles no técnicos |

---
*Este agente opera bajo el Model Context Protocol (MCP) para acceder a herramientas del sistema de archivos y APIs de forma segura.*
