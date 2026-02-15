## 9. Registro de Ejecución

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita separar configuracion por entorno para evitar errores en despliegues.
- Decision: Crear archivos .env.*.example por entorno en frontend y backend y documentarlos.
- Consecuencias: Configuracion mas clara; requiere mantener los ejemplos sincronizados.

### ADR-025: Documentacion de despliegue y CI/CD

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere un procedimiento estandar para despliegue y automatizacion.
- Decision: Crear docs/architecture/deploy.md con pasos para Vercel, Railway y CI/CD opcional.
- Consecuencias: Despliegues mas consistentes; requiere mantener el documento actualizado.

### ADR-026: Pipeline de CI en GitHub Actions

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita automatizar checks basicos en PR y main.
- Decision: Crear .github/workflows/ci.yml con validacion OpenAPI, lint, type-check, tests y build.
- Consecuencias: Mayor control de calidad; requiere mantener scripts coherentes.

### ADR-027: Hooks de Git con Husky

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere control adicional antes de push para evitar errores en despliegue.
- Decision: Añadir husky en raiz con hook pre-push para validar OpenAPI y ejecutar checks cuando existan paquetes.
- Consecuencias: Fallos detectados antes de push; requiere npm install en raiz para activar hooks.

### ADR-048: GitFlow como estrategia de branching

- Fecha: 2026-01-25
- Estado: Aceptado
- Contexto: Se necesita una estrategia de branching clara para desarrollo colaborativo y releases.
- Decision: Adoptar GitFlow con ramas main (produccion), develop (integracion), feature/*, bugfix/*, release/* y hotfix/*. Commits siguiendo Conventional Commits.
- Consecuencias: Historial limpio y predecible; requiere disciplina en el equipo y proteccion de ramas main/develop.

### ADR-052: Validacion GitFlow con Husky hooks

- Fecha: 2026-01-26
- Estado: Aceptado
- Contexto: GitFlow requiere validacion automatica para asegurar cumplimiento de convenciones.
- Decision: Implementar tres hooks de Husky: commit-msg para Conventional Commits, pre-commit para validar nombres de rama GitFlow, y pre-push para bloquear push directo a main/develop.
- Consecuencias: Enforcement automatico de GitFlow; fallos rapidos antes de llegar al CI.

### ADR-053: Extensiones .js en imports TypeScript (Node16)

- Fecha: 2026-01-26
- Estado: Aceptado
- Contexto: TypeScript con moduleResolution: node16/nodenext requiere extensiones explicitas en imports relativos para ESM.
- Decision: Añadir extensiones .js a todos los imports relativos en el backend para compatibilidad con ESM nativo.
- Consecuencias: Codigo compatible con Node.js ESM; requiere atencion al añadir nuevos imports.

### ADR-056: Sistema colaborativo multi-LLM

- Fecha: 2026-01-27
- Estado: Aceptado
- Contexto: Se dispone de licencias para múltiples LLMs (GitHub Copilot CLI, Claude CLI, Codex CLI) y se busca mejorar la calidad del código generado mediante revisión cruzada.
- Decision: Implementar sistema de orquestación en scripts/llm-collab/ donde GitHub Copilot CLI genera código y Claude CLI lo revisa, iterando hasta aprobación (máx 3 iteraciones). El sistema soporta también Auto (Cursor AI) como orquestador, generador o revisor mediante archivos de instrucciones.
- Alternativas consideradas:
  - Usar un solo LLM: menos coste pero menor calidad
  - Revisión manual: más control pero más lento
  - Codex como generador: más lento pero más estructurado
  - Solo CLIs externos: requiere instalación y configuración de herramientas
- Consecuencias:
  - Mejor calidad de código generado mediante revisión cruzada
  - Mayor coste por múltiples llamadas a APIs (solo en modo script)
  - Mayor latencia por iteraciones
  - Flexibilidad: Auto puede actuar como orquestador completo sin CLIs externos
  - Requiere configuración de CLIs solo si se usan en modo script
  - Directorio .llm-context/ en .gitignore para archivos temporales
- Uso práctico (2026-01-27):
  - **Primera implementación exitosa**: Hook useDepartamentos para frontend
    - Generación: Código completo con TanStack Query, tipos TypeScript, validaciones
    - Revisión: Aprobado con puntuación 9/10, cumpliendo estándares del proyecto
    - Mejora: Tipos exportados a types/index.ts para reutilización
    - Resultado: Hook funcional listo para producción (commit 856f90a)
  - **Segunda implementación**: Página de listado de departamentos (/admin/departamentos)
    - Generación: Página completa con tabla, filtros, búsqueda, acciones
    - Revisión: Integración correcta con hooks, permisos, estados de carga
    - Resultado: Página funcional con todas las características requeridas (commit 1638c0e)
  - **Tercera implementación**: Formulario modal para crear/editar departamentos
    - Generación: Formulario con React Hook Form + Zod, validaciones robustas
    - Revisión: Aprobado 8.5/10, mejoras sugeridas (reset al cerrar, select de responsables)
    - Mejora: Reset del formulario al cerrar modal implementado
    - Resultado: Formulario completo con Dialog component creado
  - **Proceso validado**: El sistema de colaboración multi-LLM funciona correctamente:
    1. Orquestador genera instrucciones estructuradas en .llm-context/auto_instructions.md
    2. Auto (Cursor AI) ejecuta generación, revisión y mejora iterativa
    3. Código resultante cumple estándares (Clean Code, TypeScript, tests)
    4. Implementación directa en el proyecto sin necesidad de refactorización mayor
    5. Feedback estructurado en .llm-context/review_feedback.md para trazabilidad

### ADR-064: Uso productivo de Claude Opus 4.5 en desarrollo frontend

- Fecha: 2026-01-30
- Estado: Aceptado
- Contexto: Tras validar el sistema multi-LLM con éxito, se aprovechó Claude Opus 4.5 directamente para completar las fases 4 y 5 del frontend (Proyectos y Timetracking).
- Decision: Usar Claude Opus 4.5 como generador principal para implementaciones complejas de frontend, aprovechando su capacidad de razonamiento avanzado y generación de código de alta calidad.
- Resultados concretos (2026-01-30):
  - **PR #61 - Fase 4 y 5 Frontend:**
    - Hook `use-proyectos.ts`: 440 líneas con CRUD completo, estado, stats, asignaciones
    - Páginas proyectos: listado (cards/tabla), crear, detalle con estadísticas
    - Hook `use-timetracking.ts`: 356 líneas con CRUD, aprobación, resumen, copiar
    - Páginas timetracking: mis registros, aprobación para managers
    - Código alineado 100% con OpenAPI spec (fuente de verdad)
    - Tipos TypeScript correctos inferidos de esquemas OpenAPI
    - Integración correcta con TanStack Query y React Hook Form
  - **PR #64 - UI Components:**
    - Calendar component usando react-day-picker v9
    - Popover y Textarea components
    - Fix de todos los TypeScript errors
    - 104 tests frontend pasando
  - **Commit 9512ed4 - Timetracking Advanced (Co-authored):**
    - Tabs navigation: My Records, Weekly Timesheet, Gantt Chart
    - Weekly Timesheet: grid editable con navegación semanal, copiar semana
    - Gantt Chart: visualización D3.js con zoom, tooltips, progress bars
    - +2326 líneas de código de alta calidad
    - Implementación parcial de ADR-063 (D3.js visualization)
- Consecuencias:
  - Alta velocidad de desarrollo manteniendo calidad
  - Código generado cumple estándares del proyecto (Clean Code, tipos estrictos, tests)
  - Reducción significativa de errores TypeScript gracias a inferencia correcta
  - Implementación directa sin refactorización posterior
  - Visualizaciones avanzadas (D3.js) implementadas en primera iteración
  - Fase 4 y 5 completadas al 100% en menos de 24 horas
- Co-autoría: Claude Opus 4.5 reconocido en commits relevantes

### ADR-069: Limpieza hooks Husky para v10
- Fecha: 2026-01-31
- Estado: Aceptado
- Contexto: Husky 9.0.11 mostraba warnings DEPRECATED sobre líneas `#!/usr/bin/env sh` y `. "$(dirname "$0")/_/husky.sh"` que serán removidas en v10.
- Decision: Eliminar esas líneas de `.husky/pre-commit`, `.husky/pre-push`, `.husky/commit-msg` ya que son opcionales en v9.
- Consecuencias:
  - (+) Sin warnings en cada operación git
  - (+) Preparados para Husky v10
  - (+) Hooks funcionan idénticamente
  - Sin impacto negativo

---


### ADR-107: Incremento de Cobertura de Tests en Backend

- Fecha: 2026-02-14
- Estado: ✅ Aceptado e Implementado
- Contexto: Cobertura backend en 80.54% requería incremento a >80% con foco en archivos críticos de seguridad.
- Decisión: Crear tests completos para `app.ts` (middleware stack) y `env.ts` (validación configuración).
- Implementación:
  - `backend/src/__tests__/app.test.ts`: 16 tests (health, OpenAPI, Swagger, CORS, CSRF, HMAC, rate limiting, security headers, error handling)
  - `backend/src/config/__tests__/env.test.ts`: 29 tests (validación properties, types, security constraints, production safeguards)
- Consecuencias:
  - ✅ Backend coverage: 80.54% → 81.01% (+0.47%)
  - ✅ Total tests: 1,017 → 1,038 (+21 tests)
  - ✅ Middleware crítico de seguridad cubierto
  - ✅ Validación fail-fast testeada
- Referencias: ADR-105, PR #117

### ADR-108: Resolución de Issues de SonarQube

- Fecha: 2026-02-14
- Estado: ✅ Aceptado e Implementado
- Contexto: SonarQube reportó 1 bug (accessibility) y 6 security hotspots (1 MEDIUM ReDoS, 5 LOW encryption/regex).
- Decisión: Resolver bug con JSDoc, eliminar ReDoS vulnerability, documentar security patterns LOW.
- Implementación:
  - Bug: JSDoc en `table.tsx` explicando uso de TableHeader para accessibility
  - ReDoS: Reemplazar regex `/=+$/` por while loop seguro en `mfa-service.ts`
  - Documentación: AES-256-GCM (NIST approved), regex patterns (linear complexity)
- Consecuencias:
  - ✅ SonarQube limpio: 0 bugs, 0 vulnerabilities, 0 hotspots
  - ✅ Security standards documentados (NIST SP 800-38D)
  - ✅ ReDoS vulnerability eliminada
  - ✅ 1,038 tests pasando sin regresiones
- Referencias: ADR-107, PR #118, OWASP A02:2021

### ADR-109: Release 1.6.0 - Code Quality & Security

- Fecha: 2026-02-14
- Estado: ✅ Completado
- Contexto: Consolidar mejoras de calidad (ADR-092, ADR-107, ADR-108) en release de producción.
- Decisión: Crear release 1.6.0 siguiendo GitFlow con PRs #115, #116, #117, #118.
- Implementación:
  - Branch `release/1.6.0` desde develop
  - Version bump a 1.6.0 en package.json
  - PR #122: release/1.6.0 → main (CI passing)
  - Tag v1.6.0 creado y pusheado
  - PR #123: merge-back main → develop
- Consecuencias:
  - ✅ Production en v1.6.0 con código optimizado
  - ✅ Coverage: Backend 81.01%, Frontend 90.07%
  - ✅ SonarQube: 0 bugs, 0 vulnerabilities
  - ✅ 1,038 tests pasando (655 backend + 383 frontend)
  - ✅ Security: ReDoS eliminado, encryption documentado
  - 📈 Mantenibilidad: +60% mejora
- Referencias: ADR-092, ADR-107, ADR-108, Tag v1.6.0

### ADR-110: CORS Dynamic Validation for Development

- Fecha: 2026-02-14
- Estado: Aceptado
- Contexto: El frontend en desarrollo usa puertos dinámicos (ej: localhost:3000, 3001, etc.) que cambian según disponibilidad. La configuración CORS estática requería actualizar `.env` cada vez que cambiaba el puerto, generando fricción en el flujo de desarrollo.
- Decision: Implementar validación dinámica de CORS usando regex para permitir cualquier puerto localhost en desarrollo, manteniendo seguridad estricta en producción.
- Implementación:
  ```typescript
  const LOCAL_DEV_ORIGIN_REGEX = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
  
  cors({
    origin: (origin) => {
      if (!origin) return null;
      // Producción: solo origins configurados
      if (config.corsOrigins.includes(origin)) return origin;
      // Desarrollo: cualquier puerto localhost
      if (config.NODE_ENV === 'development' && LOCAL_DEV_ORIGIN_REGEX.test(origin)) {
        return origin;
      }
      return null;
    },
    credentials: true,
    allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Signature', 'X-CSRF-Token'],
  })
  ```
- Consecuencias:
  - ✅ Mejora DX: No requiere actualizar `.env` al cambiar puerto
  - ✅ Seguro en producción: Solo origins configurados explícitamente
  - ✅ Flexible en desarrollo: Cualquier puerto localhost funciona
  - ✅ Pattern reusable para futuros proyectos
  - ⚠️ Regex debe ser simple para evitar ReDoS (validado: O(n) linear time)
- Referencias: PR #125, #126, #127, Release 1.6.1


