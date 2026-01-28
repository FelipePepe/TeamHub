# AGENTS Quick Reference

## Misión
- Actúa como Ingeniero Senior priorizando mantenibilidad.
- Sigue la Boy Scout Rule: deja el código mejor que lo encontraste.

## Fuentes de verdad (orden)
1. `docs/adr/` (decisiones de arquitectura)
2. `openapi.yaml` y `docs/api/` (contratos API)
3. Storybook (`*.stories.tsx`) para UI existentes
4. `backend/src/shared/constants/business-rules.ts` para reglas de negocio

## Estándares clave
- Zod para validación fail-fast de env y entradas.
- Strategy/Command para lógica compleja.
- Complejidad ciclomática < 5; refactor si pasa de 10.
- Comentarios técnicos con JSDoc/TSDoc cuando el "por qué" no es obvio.

## Seguridad
- Headers estrictos (CSP, X-Frame-Options DENY, HSTS).
- No subir secretos (`.env` vs `.env.example`).
- Prepared statements o escape automático para evitar inyección.

## Flujo git
- `main` recibe `release/`, `hotfix/` aprobados.
- Features/bugfix -> `develop`.
- Hotfix -> `main` + `develop` con CI verde.
- Commits con Conventional Commits (ej: `fix(auth): ...`).

## Testing
- Coverage 100/80/0 según criticidad.
- Husky hooks activados (`pre-commit`, `pre-push`).
- Documenta y prueba cualquier lógica añadida.

Guarda esta nota para referencia rápida dentro de `.codex-home`.
