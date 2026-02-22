# frontend/AGENTS.md — Contexto del Subproyecto Frontend

> Extiende las reglas del fichero raíz `../AGENTS.md`.
> Lee el raíz primero; este fichero añade contexto específico del frontend.

---

## Stack Tecnológico

| Área | Tecnología |
|------|------------|
| Framework | **Next.js 15** (App Router) |
| UI Library | **React 19** + TypeScript |
| Estilos | **Tailwind CSS** + **shadcn/ui** (Radix UI) |
| Estado / Fetching | **TanStack Query v5** |
| Formularios | **React Hook Form** + **Zod** |
| Tests unitarios | **Vitest** |
| Tests E2E | **Playwright** |
| Monitorización | **Sentry** (`@sentry/nextjs`, `@sentry/react`) |
| Gráficos | **D3.js** |
| HTTP | **axios** |

---

## Reglas Específicas del Frontend

- **NUNCA** transformar, calcular ni derivar datos de negocio en el frontend. Solo formatear para visualización (fechas, monedas, etc.).
- Los tipos e interfaces deben reflejar exactamente el contrato OpenAPI del backend, sin renombrar campos ni invertir semántica.
- Si se necesita un dato adicional → añadirlo al endpoint del backend y actualizar `../openapi.yaml`, nunca calcularlo aquí.
- Usar **React Server Components** donde sea posible. Reservar `"use client"` para interactividad real.
- Los custom hooks en `src/hooks/` son la única capa que llama a la API. Páginas y componentes consumen hooks; nunca `axios` directamente desde un componente.
- No crear componentes que dupliquen los ya existentes en `src/components/` — consultar Storybook primero.

---

## Skills Relevantes para este Stack

| Skill | Cuándo cargarlo |
|-------|-----------------|
| `.agents/skills/vercel-react-best-practices/SKILL.md` | Al escribir componentes React, hooks, optimizar rendimiento, RSC vs Client Components |
| `.agents/skills/frontend-design/SKILL.md` | Al crear o modificar UI: componentes, páginas, layouts, estilos |
| `.agents/skills/rule-testing/SKILL.md` | Al escribir tests Vitest o Playwright E2E |
| `.agents/skills/rule-boy-scout/SKILL.md` | **SIEMPRE** al generar o modificar código: limpiar diagnósticos VS Code del archivo tocado |
| `.agents/skills/rule-clean-code/SKILL.md` | Al implementar features o hacer code review |
| `.agents/skills/rule-security/SKILL.md` | Al trabajar con auth, tokens, cookies, XSS |
