# backend/AGENTS.md — Contexto del Subproyecto Backend

> Extiende las reglas del fichero raíz `../AGENTS.md`.
> Lee el raíz primero; este fichero añade contexto específico del backend.

---

## Stack Tecnológico

| Área | Tecnología |
|------|------------|
| Framework | **Hono v4** + `@hono/node-server` |
| ORM | **Drizzle ORM** + **PostgreSQL** (`pg`) |
| Validación | **Zod** (entradas de API + variables de entorno) |
| Auth | **JWT** (`jsonwebtoken`) + **bcryptjs** + **otpauth** (TOTP/MFA) |
| Logging | **Pino** |
| Monitorización | **Sentry** (`@sentry/node`) |
| Tests | **Vitest** (unit únicamente; sin E2E propios) |
| Migraciones | **drizzle-kit** |
| Runtime | **Node.js** + **tsx** (dev) |

---

## Reglas Específicas del Backend

- **Toda la lógica de negocio vive aquí.** El frontend es solo una capa de presentación.
- Usar siempre **Drizzle ORM** para queries. Prohibido SQL crudo sin pasar por el ORM o prepared statements.
- Validar **todas** las entradas de API con Zod antes de cualquier lógica de negocio.
- Variables de entorno validadas con Zod en startup (`src/config/`). La app no arranca con configuración inválida.
- **MFA (TOTP vía otpauth)** es obligatorio y no puede deshabilitarse bajo ninguna circunstancia.
- Los endpoints siguen el contrato definido en `../openapi.yaml` — fuente de verdad única para la API.
- La estructura de capas es: `routes` → `handlers` → `services` → `repositories`. No saltarse capas.

---

## Skills Relevantes para este Stack

| Skill | Cuándo cargarlo |
|-------|-----------------|
| `.agents/skills/rule-security/SKILL.md` | Al trabajar con JWT, MFA, bcrypt, Zod, headers de seguridad, SQL, secretos |
| `.agents/skills/rule-boy-scout/SKILL.md` | **SIEMPRE** al generar o modificar código: limpiar diagnósticos VS Code del archivo tocado |
| `.agents/skills/rule-clean-code/SKILL.md` | Al implementar handlers, services, repositories o hacer code review |
| `.agents/skills/rule-testing/SKILL.md` | Al escribir tests Vitest |
| `.agents/skills/rule-docs/SKILL.md` | Al completar un endpoint o decisión arquitectural |
