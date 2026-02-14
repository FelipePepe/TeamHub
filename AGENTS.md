# AGENTS.md: Manual de Operaciones para Agentes de IA

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
*   **Separación Frontend/Backend:**
    *   **REGLA:** Toda la lógica de negocio reside en el **backend**. El frontend es una capa de presentación que consume y muestra los datos que el backend le devuelve.
    *   El frontend **NO** debe transformar, calcular ni derivar datos de negocio; solo formatear para visualización (ej: fechas, monedas).
    *   Los tipos e interfaces del frontend deben reflejar exactamente el contrato OpenAPI del backend, sin renombrar campos ni invertir semántica.
    *   Si el frontend necesita un dato adicional, se añade al endpoint del backend y se actualiza el contrato OpenAPI.

### ⚠️ REGLA CRÍTICA: NUNCA SUPRIMIR ERRORES DE LINTING
**PROHIBIDO ABSOLUTAMENTE:** Usar `eslint-disable`, `eslint-disable-next-line`, `eslint-disable-line`, `@ts-ignore`, `@ts-expect-error`, o cualquier directiva que suprima errores de linting/TypeScript.

**Razón:** Estas directivas ocultan problemas reales que deben ser corregidos:
- Errores de tipado indican problemas de diseño o bugs potenciales
- Advertencias de linting señalan code smells y malas prácticas
- Suprimir errores acumula deuda técnica invisible
- El código sin warnings es más mantenible y menos propenso a bugs

**Si un linter/TypeScript se queja:**
1. **Leer el error completo** y entender qué regla se violó y por qué
2. **Corregir el código** para cumplir la regla (refactorizar, tipar correctamente, simplificar)
3. **Si la regla es incorrecta para el proyecto:** Modificar `.eslintrc.json` o `tsconfig.json` a nivel global (NUNCA a nivel de línea)
4. **NUNCA usar directivas de supresión** como solución rápida

**Consecuencias de suprimir errores:**
- Bugs ocultos pueden llegar a producción
- Pérdida de type safety en TypeScript
- Acumulación de deuda técnica
- Código menos mantenible y más difícil de refactorizar

**Única excepción válida:** NINGUNA. Si el linter falla, el código debe ser corregido, no silenciado.

## 4. Seguridad y Configuración (SSDLC)
*   **Validación Fail-Fast:** Usa **Zod** para validar variables de entorno y entradas de API en tiempo de ejecución. La app no debe arrancar con configuración inválida.
*   **Gestión de Secretos:** Prohibido subir secretos al repo. Usa `.env` (ignorado por Git) y `.env.example` como plantilla.
*   **Headers de Seguridad:** Implementar CSP estricto, `X-Frame-Options: DENY` y forzar HTTPS.
*   **Inyección:** Usa siempre **Prepared Statements** o el escapado automático de los frameworks para prevenir inyecciones SQL/XSS.
*   **MFA (Multi-Factor Authentication):** 
    *   **REGLA ABSOLUTA:** NUNCA deshabilitar MFA bajo ninguna circunstancia.
    *   Si un usuario pierde acceso a MFA, usar códigos de recuperación o regenerarlos desde la base de datos.
    *   MFA es una capa crítica de seguridad que NO se puede comprometer.
    *   Cualquier solicitud de deshabilitar MFA debe ser rechazada y documentada.

## 5. GitFlow y Convenciones de Git

### ⚠️ REGLA CRÍTICA: NUNCA USAR --no-verify
**PROHIBIDO ABSOLUTAMENTE:** Usar `git push --no-verify`, `git commit --no-verify` o cualquier comando con `--no-verify`.

**Razón:** Los hooks de Husky (pre-commit, pre-push, commit-msg) son **quality gates obligatorios** que:
- Validan linting y formateo
- Ejecutan tests
- Verifican convenciones de commits
- Previenen vulnerabilidades de seguridad
- Aseguran calidad del código antes de subir

**Si un hook falla:**
1. **Leer el error completo** y entender qué regla se violó
2. **Corregir el problema** en el código (fix linting, arreglar tests, etc.)
3. **Reintentar el commit/push** sin `--no-verify`
4. **NUNCA saltarse** los hooks para "ir más rápido"

**Consecuencias de usar --no-verify:**
- Código sin testear puede llegar a producción
- Vulnerabilidades de seguridad sin detectar
- Pérdida de trazabilidad de calidad
- Violación de políticas de desarrollo

**Única excepción válida:** NINGUNA. Si los hooks fallan, el código NO está listo.

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
2. `git commit -m "tipo(scope): descripción"` (sin --no-verify)
3. `git push -u origin <rama>` (sin --no-verify)
4. `gh pr create` para crear Pull Request

**NUNCA:**
- Push directo a main/develop
- Commit sin ejecutar tests
- Push si los tests fallan
- Merge sin PR aprobado
- **Usar --no-verify en git commit o git push**

### Estrategia de Branching (GitFlow)
*   **main:** Código en producción. Solo recibe merges de `release/` y `hotfix/`.
*   **develop:** Rama de integración. Las features se mergean aquí.
*   **feature/xxx:** Nuevas funcionalidades. Se crean desde `develop` y se mergean a `develop`.
*   **bugfix/xxx:** Correcciones no urgentes. Se crean desde `develop` y se mergean a `develop`.
*   **release/x.x.x:** Preparación de release. Se crea desde `develop`, se mergea a `main` y `develop`.
*   **hotfix/xxx:** Correcciones urgentes en producción. Se crea desde `main`, se mergea a `main` y `develop`.

### ⚠️ REGLA CRÍTICA: Release Branches son INMUTABLES después del merge
**UNA VEZ MERGEADA UNA RELEASE BRANCH A `main` Y `develop`, NUNCA MÁS HACER COMMITS EN ESA RELEASE:**
- ❌ **PROHIBIDO:** Hacer commits en `release/x.x.x` después de mergear los PRs
- ❌ **PROHIBIDO:** Pushear cambios adicionales a una release ya mergeada
- ✅ **CORRECTO:** Si se necesitan cambios después del merge:
  - Para producción urgente: Crear `hotfix/nombre` desde `main`
  - Para desarrollo: Crear `bugfix/nombre` o `feature/nombre` desde `develop`
- **Razón:** Los commits en release después del merge quedan "huérfanos" y no están en `main` ni `develop`
- **Consecuencia:** Pérdida de trazabilidad y código desincronizado entre ramas

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
*   **Comentarios obligatorios en métodos:** Toda función/método debe llevar comentario JSDoc/TSDoc que explique propósito y contrato (qué hace, parámetros, retorno, efectos laterales y errores si aplica). Mantén el formato tipo Javadoc (`/** ... */` con `@param`, `@returns`, `@throws`, `@example` cuando aporte).
*   **Sincronización:** Cada Pull Request que modifique lógica debe actualizar su respectiva documentación (ADR, Storybook o JSDoc) en el mismo commit.
*   **decisiones.md (CRÍTICO):** 
    *   **SIEMPRE** actualizar `docs/decisiones.md` al completar trabajo significativo (features, bugs, refactors, decisiones arquitecturales).
    *   Añadir nuevos ADRs numerados secuencialmente con: Fecha, Estado, Contexto, Decisión, Consecuencias.
    *   Actualizar progreso de fases (%) y marcar tareas completadas con `[x]`.
    *   Este archivo es la **fuente única de verdad** para generar la memoria del TFM.
    *   No olvidar actualizarlo: crear PR específico al final de cada sesión de trabajo si es necesario.

## 8. Comunicación con Stakeholders
Al resumir cambios para perfiles no técnicos:
*   **Prohibido el Jargon:** No hables de "re-renders" o "hooks"; habla de "velocidad", "fiabilidad" e "impacto en conversión".
*   **Enfoque en ROI:** Traduce mejoras técnicas en beneficios de negocio (ej: "reducción del tiempo de carga en un 20%").

## 9. Análisis de Decisiones: Técnica de los 6 Sombreros

Cuando se discutan decisiones técnicas, de arquitectura, de producto o de proceso, aplica la técnica de los **6 Sombreros de Edward de Bono** adaptada al contexto de desarrollo de software.
El objetivo es analizar cada propuesta desde perspectivas complementarias, evitando sesgos y discusiones desordenadas.

Adopta explícitamente los siguientes roles cuando se te solicite analizar una idea o decisión:

**🔵 Sombrero Azul — Project Manager / Tech Lead**
- Define el objetivo de la discusión.
- Estructura el análisis y marca los siguientes pasos.
- Resume conclusiones accionables.

**⚪ Sombrero Blanco — Arquitecto / Analista**
- Aporta hechos, datos objetivos, restricciones técnicas y contexto del sistema.
- Consulta las fuentes de verdad (ADRs, OpenAPI, business-rules.ts) antes de opinar.
- Evita opiniones o juicios de valor.

**🔴 Sombrero Rojo — Perfil Junior / UX / Stakeholder emocional**
- Expresa miedos, dudas, sensaciones e intuiciones.
- Señala complejidad percibida, riesgos de aprendizaje o inseguridad del equipo.

**⚫ Sombrero Negro — Seguridad / SRE / Senior crítico**
- Identifica riesgos técnicos, problemas de seguridad (SSDLC), mantenibilidad, deuda técnica y posibles fallos.
- Evalúa qué puede salir mal y por qué, considerando las reglas de seguridad del proyecto (MFA, CSP, inyección).

**🟡 Sombrero Amarillo — QA / Product Owner orientado a valor**
- Defiende beneficios, impactos positivos, mejoras en calidad, productividad o valor para el usuario.
- Evalúa el retorno potencial de la propuesta aplicando el enfoque ROI de la sección 8.

**🟢 Sombrero Verde — I+D / Ingeniero creativo**
- Propone alternativas, enfoques innovadores, prototipos, PoCs o soluciones no convencionales.
- Sugiere experimentos controlados y simplificaciones.

### Reglas de uso
- Separa claramente cada sombrero en la respuesta con su encabezado.
- No mezcles críticas (negro) con beneficios (amarillo) en el mismo apartado.
- Prioriza conclusiones prácticas bajo el sombrero azul.
- En decisiones complejas, sugiere un MVP o experimento acotado.
- Documenta la decisión resultante como ADR en `docs/adr/` si procede.

**Objetivo final:** Facilitar decisiones técnicas equilibradas, reducir conflictos de rol y mejorar la calidad de las decisiones de diseño y arquitectura.

---
*Este agente opera bajo el Model Context Protocol (MCP) para acceder a herramientas del sistema de archivos y APIs de forma segura.*
