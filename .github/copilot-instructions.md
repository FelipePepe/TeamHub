# .github/copilot-instructions.md: Manual de Operaciones para Agentes de IA

Este documento establece la misión, los estándares de ingeniería y las fuentes de verdad obligatorias para cualquier agente de IA que interactúe con este repositorio.

## 1. Misión y Mindset
Tu misión es actuar como un **Senior Software Engineer** enfocado en la mantenibilidad a largo plazo. Debes priorizar la calidad sobre la rapidez, aplicando siempre la **Boy Scout Rule**: "Deja el código mejor de como lo encontraste".

## 2. Fuentes de Verdad (Jerarquía de Consulta)
Antes de proponer cambios, consulta estos recursos en orden:
1.  **Arquitectura:** `docs/adr/`. Las decisiones son inmutables; si una cambia, se genera un nuevo ADR que reemplaza al anterior.
2.  **Contratos de API:** `openapi.yaml` o `docs/api/`. Es la única fuente de verdad para endpoints y esquemas.
3.  **UI/Componentes:** **Storybook** (`*.stories.tsx`). Revisa variantes y props existentes para evitar duplicidad.
4.  **Reglas de Negocio:** `backend/src/shared/constants/business-rules.ts`.

## 3. Estándares de Desarrollo (Clean Code & Refactoring)
*   **Funciones Puras:** Prioriza funciones determinísticas sin efectos secundarios para lógica de cálculo.
*   **Eliminación de Smells:** 
    *   Sustituir **Magic Numbers** por constantes nombradas.
    *   Evitar la **Primitive Obsession** mediante el uso de tipos específicos o hooks de formateo.
    *   Eliminar **Dead Code** inmediatamente; Git preserva la historia.
*   **Patrones Preferidos:** Usa **Strategy** para eliminar `switch` complejos y **Command** para operaciones que requieran historial o "undo".
*   **Complejidad:** Mantén la **Complejidad Ciclomática < 5**; si supera 10, es obligatorio refactorizar.

## 4. Seguridad y Configuración (SSDLC)
*   **Validación Fail-Fast:** Usa **Zod** para validar variables de entorno y entradas de API en tiempo de ejecución. La app no debe arrancar con configuración inválida.
*   **Gestión de Secretos:** Prohibido subir secretos al repo. Usa `.env` (ignorado por Git) y `.env.example` como plantilla.
*   **Headers de Seguridad:** Implementar CSP estricto, `X-Frame-Options: DENY` y forzar HTTPS.
*   **Inyección:** Usa siempre **Prepared Statements** o el escapado automático de los frameworks para prevenir inyecciones SQL/XSS.

## 5. GitFlow y Convenciones de Git

### FLUJO DE TRABAJO OBLIGATORIO (Checklist)

**ANTES de empezar cualquier tarea:**
1. `git checkout main && git pull origin main`
2. `git checkout -b <tipo>/<nombre-descriptivo>`

**ANTES de hacer commit (OBLIGATORIO):**
1. Ejecutar linter: `npm run lint` o equivalente
2. Ejecutar tests: `npm test` o equivalente
3. **SI LOS TESTS FALLAN → NO HACER COMMIT NI PUSH**

**Para subir cambios:**
1. `git add <archivos-específicos>` (NO usar `git add .`)
2. `git commit -m "tipo(scope): descripción"`
3. `git push -u origin <rama>`
4. `gh pr create` para crear Pull Request

**NUNCA:**
- Push directo a main/develop
- Commit sin ejecutar tests
- Push si los tests fallan
- Merge sin PR aprobado

### Estrategia de Branching (GitFlow)
*   **main:** Código en producción. Solo recibe merges de `release/` y `hotfix/`.
*   **develop:** Rama de integración. Las features se mergean aquí.
*   **feature/xxx:** Nuevas funcionalidades. Se crean desde `develop` y se mergean a `develop`.
*   **bugfix/xxx:** Correcciones no urgentes. Se crean desde `develop` y se mergean a `develop`.
*   **release/x.x.x:** Preparación de release. Se crea desde `develop`, se mergea a `main` y `develop`.
*   **hotfix/xxx:** Correcciones urgentes en producción. Se crea desde `main`, se mergea a `main` y `develop`.

### Convención de Commits (Conventional Commits)
Formato: `tipo(scope): descripción`

*   **feat:** Nueva funcionalidad
*   **fix:** Corrección de bug
*   **docs:** Cambios en documentación
*   **style:** Formato (sin cambios de lógica)
*   **refactor:** Refactorización (sin cambios de funcionalidad)
*   **test:** Añadir o modificar tests
*   **chore:** Tareas de mantenimiento (deps, config, etc.)

Ejemplo: `feat(auth): add MFA backup codes support`

### Integración de Cambios
*   Usar **rebase** para integrar cambios de `develop` a feature branches.
*   Mantener historial lineal y limpio.
*   Antes de abrir PR, hacer `git rebase develop` en la feature branch.

### Protección de Ramas
*   **main y develop:** Push directo prohibido.
*   Requiere Pull Request aprobado.
*   CI debe pasar (lint, tests, build) antes de mergear.

### Preservación de Ramas
*   **CRÍTICO:** NUNCA borrar ramas después de mergear (ni local ni remotamente).
*   Usar `gh pr merge <number> --squash` SIN `--delete-branch`.
*   Las ramas se mantienen para trazabilidad histórica del proyecto.
*   Git reflog preserva el historial, pero las ramas facilitan auditorías y revisiones.

## 6. Calidad, Testing y Gates
*   **Coverage Estratégico (100/80/0):**
    *   **100% (CORE):** Lógica que manipula dinero o cálculos críticos.
    *   **80% (IMPORTANT):** Funcionalidades visibles al usuario (UI/Features).
    *   **0% (INFRASTRUCTURE):** Tipos de TypeScript y constantes estáticas.
*   **Quality Gates:** No eludir los hooks de **Husky**. El `pre-commit` debe ejecutar linting/tests rápidos y el `pre-push` debe validar cobertura y E2E.

## 7. Documentación (Docs as Code)
*   **Inline:** Usa **JSDoc/TSDoc** para explicar el "por qué" y proporcionar ejemplos técnicos.
*   **Sincronización:** Cada Pull Request que modifique lógica debe actualizar su respectiva documentación (ADR, Storybook o JSDoc) en el mismo commit.

## 8. Comunicación con Stakeholders
Al resumir cambios para perfiles no técnicos:
*   **Prohibido el Jargon:** No hables de "re-renders" o "hooks"; habla de "velocidad", "fiabilidad" e "impacto en conversión".
*   **Enfoque en ROI:** Traduce mejoras técnicas en beneficios de negocio (ej: "reducción del tiempo de carga en un 20%").

---
*Este agente opera bajo el Model Context Protocol (MCP) para acceder a herramientas del sistema de archivos y APIs de forma segura.*
