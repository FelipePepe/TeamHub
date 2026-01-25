# Decisiones del Proyecto (ADR)

Este archivo registra decisiones clave del proyecto con formato ADR para preparar las slides finales.

## ADR-001: Esquemas por entidad en Drizzle
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: El esquema de datos crece con multiples dominios y un solo archivo se vuelve dificil de mantener.
- Decision: Usar `backend/src/db/schema/` con un archivo por entidad en lugar de `schema.ts` unico.
- Consecuencias: Mejor modularidad y menos conflictos; requiere coordinar imports entre entidades.

## ADR-002: Barrel de reexportaciones de esquemas
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Importar entidades desde multiples archivos genera dispersion y ruido en servicios/rutas.
- Decision: Crear `backend/src/db/schema/index.ts` para reexportar los esquemas.
- Consecuencias: Imports centralizados; hay que mantener el barrel actualizado.

## ADR-003: Resumen por subfases en documentacion
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita un resumen estructurado para preparar las slides y dar vision rapida del plan.
- Decision: Incluir resumen por subfases en `CHECKLIST.md` y replicarlo en `README.md`.
- Consecuencias: Documentacion mas clara; requiere mantener ambos archivos sincronizados.

## ADR-004: Manual de operaciones unificado para agentes
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Hay tres archivos de instrucciones (AGENTS, claude y copilot) que deben estar alineados.
- Decision: Unificar el contenido base y mantener los tres archivos sincronizados.
- Consecuencias: Menos ambiguedad; requiere actualizar las tres fuentes en cada cambio.

## ADR-005: Fuentes de verdad y placeholders de scaffolding
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Las fuentes de verdad definidas no existian aun en el repositorio durante el scaffold.
- Decision: Crear placeholders para `docs/adr/`, `docs/api/`, `openapi.yaml` y `backend/src/shared/constants/business-rules.ts`.
- Consecuencias: La documentacion es navegable desde el inicio; se deben reemplazar los placeholders con contenido real.

## ADR-006: Documentacion funcional y tecnica del frontend
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita documentar el frontend antes de iniciar la implementacion.
- Decision: Crear `docs/frontend/funcional.md` y `docs/frontend/tecnico.md` como base.
- Consecuencias: Claridad temprana de requisitos y stack; se debe mantener actualizado.

## ADR-007: Indice de documentacion en docs/
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: La documentacion se esta expandiendo y necesita un punto de entrada unico.
- Decision: Crear `docs/README.md` como indice de documentacion.
- Consecuencias: Acceso rapido a documentos clave; hay que mantener el indice actualizado.

## ADR-008: Enlaces de documentacion en README
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere acceso rapido a la documentacion desde el README principal.
- Decision: Añadir seccion "Documentacion" con enlaces directos a docs clave.
- Consecuencias: Navegacion mas sencilla; hay que mantener enlaces actualizados.

## ADR-009: Enlace directo a documentacion desde el titulo
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Facilitar el acceso rapido al indice de documentacion desde el inicio del README.
- Decision: Añadir enlace directo a `docs/README.md` bajo el titulo principal.
- Consecuencias: Mejor accesibilidad; mantener enlace vigente si cambia la ruta.

## ADR-010: Enlace de retorno en docs/README.md
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Facilitar el retorno al README principal desde el indice de documentacion.
- Decision: Añadir enlace a `README.md` en `docs/README.md`.
- Consecuencias: Navegacion bidireccional; mantener enlace vigente si cambia la ruta.

## ADR-011: Documentacion funcional y tecnica del backend
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita documentar el backend antes de iniciar la implementacion.
- Decision: Crear `docs/backend/funcional.md` y `docs/backend/tecnico.md` como base.
- Consecuencias: Claridad temprana de requisitos y stack; se debe mantener actualizado.

## ADR-012: Checklist de pendientes de documentacion
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere consolidar tareas pendientes de documentacion en un solo lugar.
- Decision: Crear `docs/documentacion-checklist.md` con pendientes de frontend y backend.
- Consecuencias: Visibilidad de tareas de documentacion; mantener actualizado al cerrar pendientes.

## ADR-013: Uso de D3.js en graficos de dashboards
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere una libreria flexible para visualizaciones en dashboards.
- Decision: Usar D3.js para los graficos de dashboards.
- Consecuencias: Mayor control visual; requiere desarrollo de componentes custom.

## ADR-014: Convenciones de testing en frontend
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita estandarizar ubicacion y herramientas de testing en frontend.
- Decision: Usar Vitest + Testing Library en `frontend/src/__tests__/` y Playwright en `frontend/e2e/`.
- Consecuencias: Tests organizados por tipo; requiere mantener estructura al crecer.

## ADR-015: Logging estructurado con pino en backend
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere logging estructurado para diagnostico y monitoreo.
- Decision: Usar pino como libreria de logging en backend.
- Consecuencias: Logs consistentes; requiere configurar output y niveles.

## ADR-016: Estrategia de tests en backend
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita una herramienta unificada para tests del backend.
- Decision: Usar Vitest para unit e integration, con pruebas de endpoints via `app.request`.
- Consecuencias: Tests consistentes; requiere configurar entorno de pruebas.

## ADR-017: Politica de rate limit global
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Proteger la API de abuso y ataques de fuerza bruta.
- Decision: 100 req/min por usuario en API general y 5 req/min por IP en /auth/login.
- Consecuencias: Limita abuso; requiere manejo de respuestas 429.

## ADR-018: Swagger para documentacion de APIs
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere una forma estandar de visualizar y validar el contrato de API.
- Decision: Usar Swagger (Swagger UI) para documentar y revisar la API basada en OpenAPI.
- Consecuencias: Documentacion navegable; requiere mantener openapi.yaml actualizado.

## ADR-019: Politica de autenticacion y seguridad
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere reforzar la seguridad de acceso para todos los usuarios.
- Decision: MFA obligatorio (Google Authenticator), password policy fuerte (12+ con mayus/minus/numero/especial) y bloqueo tras 3 intentos fallidos (30 min).
- Consecuencias: Mayor seguridad; requiere flujos de enrolamiento y recuperacion robustos.

## ADR-020: Desbloqueo manual de cuentas por ADMIN
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Los bloqueos temporales pueden requerir desbloqueo inmediato por soporte.
- Decision: Permitir que ADMIN desbloquee cuentas bloqueadas manualmente.
- Consecuencias: Se requiere accion de desbloqueo en UI y endpoint dedicado.

## ADR-021: Modularizacion de OpenAPI
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: `openapi.yaml` crecio demasiado y dificulta el mantenimiento.
- Decision: Modularizar rutas y esquemas en `docs/api/openapi/paths/` y `docs/api/openapi/components/`, dejando `openapi.yaml` como agregador con `$ref`.
- Consecuencias: Mantenimiento mas sencillo; se debe cuidar la coherencia de referencias.

## ADR-022: Script de validacion OpenAPI
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere una validacion reproducible del contrato OpenAPI.
- Decision: Crear `scripts/validate-openapi.sh` con Swagger CLI y timeout opcional.
- Consecuencias: Validacion consistente desde cualquier ruta; requiere tener `npx` disponible.

## ADR-023: Documento SAD y plantilla ADR
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere un documento de arquitectura global y una plantilla estandar para ADRs individuales.
- Decision: Crear `docs/architecture/sad.md` y `docs/adr/adr-template.md`.
- Consecuencias: Arquitectura centralizada y decisiones futuras mas consistentes.

## ADR-024: Variables de entorno por entorno
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita separar configuracion por entorno para evitar errores en despliegues.
- Decision: Crear archivos `.env.*.example` por entorno en frontend y backend y documentarlos.
- Consecuencias: Configuracion mas clara; requiere mantener los ejemplos sincronizados.

## ADR-025: Documentacion de despliegue y CI/CD
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere un procedimiento estandar para despliegue y automatizacion.
- Decision: Crear `docs/architecture/deploy.md` con pasos para Vercel, Railway y CI/CD opcional.
- Consecuencias: Despliegues mas consistentes; requiere mantener el documento actualizado.

## ADR-026: Pipeline de CI en GitHub Actions
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita automatizar checks basicos en PR y main.
- Decision: Crear `.github/workflows/ci.yml` con validacion OpenAPI, lint, type-check, tests y build.
- Consecuencias: Mayor control de calidad; requiere mantener scripts coherentes.

## ADR-027: Hooks de Git con Husky
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere control adicional antes de push para evitar errores en despliegue.
- Decision: Añadir husky en raiz con hook `pre-push` para validar OpenAPI y ejecutar checks cuando existan paquetes.
- Consecuencias: Fallos detectados antes de push; requiere `npm install` en raiz para activar hooks.

Nota: Durante la instalacion se mostro el warning "husky - install command is DEPRECATED".

## ADR-028: Estrategia de testing y calidad documentada
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita un plan de testing unificado para frontend y backend.
- Decision: Crear `docs/quality/testing.md` con tipos de pruebas, cobertura y gates.
- Consecuencias: Mayor claridad en criterios de calidad; requiere mantener el documento actualizado.

## ADR-029: Guion de slides inicial
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere una estructura base para la presentacion final del TFM.
- Decision: Crear `docs/slides/outline.md` con 16 diapositivas y secciones clave.
- Consecuencias: Preparacion mas rapida de la presentacion; requiere completar contenido y capturas.

## ADR-030: Notas de presentacion para slides
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita un guion de apoyo para la exposicion oral.
- Decision: Crear `docs/slides/notes.md` con notas por slide.
- Consecuencias: Presentacion mas consistente; requiere mantener notas actualizadas.

## ADR-031: Scaffold manual por bloqueo de red
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: `npm install` y `create-next-app` fallaron por `EAI_AGAIN` al acceder a `registry.npmjs.org`.
- Decision: Crear scaffold manual de frontend y backend (config, estructura y archivos base) hasta poder instalar dependencias.
- Consecuencias: Se puede avanzar en estructura; queda pendiente instalar dependencias cuando se restablezca la red.

## ADR-032: Fijacion de versiones de dependencias
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: El backend tenia todas las dependencias con version `"latest"`, lo que rompe la reproducibilidad del build y puede causar errores inesperados.
- Decision: Fijar todas las versiones de dependencias con prefijo `^` (ej: `"hono": "^4.6.16"`) en lugar de `"latest"`.
- Consecuencias: Builds reproducibles y controlados; requiere actualizacion manual periodica de dependencias.

## ADR-033: Actualizacion a Next.js 15 y React 19
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Next.js 14 presentaba vulnerabilidades de seguridad y eslint-config-next 16.x era incompatible con Next.js 14.
- Decision: Actualizar a Next.js 15.1.4 con React 19.0.0 para resolver vulnerabilidades y mantener compatibilidad.
- Consecuencias: Stack moderno con ultimas features de React 19; requiere verificar compatibilidad de librerias de terceros.

## ADR-034: Migracion a ESLint 9 con flat config
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: ESLint 8.x esta deprecado y ESLint 9 requiere el nuevo formato "flat config" (`eslint.config.mjs`).
- Decision: Migrar de `.eslintrc.cjs` a `eslint.config.mjs` en frontend y backend, usando `typescript-eslint` y `@eslint/eslintrc` para compatibilidad.
- Consecuencias: Configuracion moderna y mantenible; requiere adaptar plugins legacy con FlatCompat.

## ADR-035: Actualizacion a Vitest 3
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Vitest 2.x dependia de vite con esbuild vulnerable (<=0.24.2).
- Decision: Actualizar a Vitest 3.0.4 y @vitest/coverage-v8 3.0.4 para resolver vulnerabilidades de esbuild.
- Consecuencias: Tests sin vulnerabilidades; requiere jsdom como dependencia explicita en frontend.

## ADR-036: Uso de drizzle-kit beta para evitar vulnerabilidades
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: drizzle-kit 0.18-0.31 dependia de @esbuild-kit con esbuild vulnerable. Solo la version beta 1.0.0 elimina esta dependencia.
- Decision: Usar drizzle-kit 1.0.0-beta.9 en backend para eliminar vulnerabilidades de seguridad.
- Consecuencias: 0 vulnerabilidades en backend; posibles bugs por ser version beta, requiere monitorear estabilidad.

## ADR-037: Configuracion de drizzle-kit con nuevo formato
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: drizzle-kit depreco `driver: 'pg'` y `connectionString` en favor de `dialect` y `url`.
- Decision: Actualizar `drizzle.config.ts` usando `defineConfig()`, `dialect: 'postgresql'` y `dbCredentials: { url }`.
- Consecuencias: Configuracion compatible con versiones recientes; requiere actualizar documentacion de migraciones.

## ADR-038: Flujo MFA obligatorio con token de desafio
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: MFA es obligatorio para todos los usuarios y se necesita un flujo que permita completar el enrolamiento antes de emitir tokens de acceso.
- Decision: El login siempre devuelve `mfaToken` (challenge de corta duracion), `/auth/mfa/setup` acepta `mfaToken` o access token y `/auth/mfa/verify` valida TOTP antes de emitir access/refresh.
- Consecuencias: Login en dos pasos, el frontend debe manejar el challenge y enrolamiento; tests deben usar el flujo MFA.

## ADR-039: Rate limiting en memoria para backend
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: La politica de rate limit requiere proteccion en login y en endpoints globales, con una implementacion simple para el entorno actual.
- Decision: Implementar rate limiting in-memory con llave por usuario (sub del token) o IP como fallback, y limitar login por IP.
- Consecuencias: Limites por instancia (no compartidos en multi-replica); requiere store distribuido si se despliega con escalado horizontal.

## ADR-040: Alineacion de contrato Timetracking con restricciones DB
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: La base de datos exige `descripcion` no nula y `horas` en rango (0-24), mientras que el contrato permitia valores mas laxos.
- Decision: Hacer `descripcion` requerida y validar `horas` en el API y OpenAPI con los limites del esquema.
- Consecuencias: Clientes deben enviar descripcion y horas validas; se evitan errores al persistir.

## ADR-041: Scripts SQL de contexto para esquema completo
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita compartir el DDL completo en archivos SQL independientes para revision y entrega.
- Decision: Crear `context/*.sql` con enums, tablas, indices y constraints (incluyendo FKs circulares).
- Consecuencias: Se debe mantener sincronizado con las migraciones de Drizzle.

## ADR-042: SSL opcional para conexion PostgreSQL con CA
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Algunos entornos (por ejemplo Railway) exigen SSL con CA para conectar a PostgreSQL, mientras que en local no es necesario.
- Decision: Añadir `PG_SSL_CERT_PATH` como variable opcional; cuando esta definida se activa `ssl.ca` en la conexion principal y en `run-triggers`.
- Consecuencias: En local se puede omitir; en entornos con CA se debe proporcionar una ruta valida o el proceso fallara al leer el certificado.

## ADR-043: Seguimiento de implementacion backend en checklist
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere un plan de ejecucion detallado y el usuario solicita registrar los pasos realizados durante la implementacion del backend.
- Decision: Crear un checklist de ejecucion en `CHECKLIST.md` y registrar avances en una seccion de seguimiento en este archivo.
- Consecuencias: El checklist y el registro deben mantenerse sincronizados tras cada paso completado.

## ADR-044: Estrategia de persistencia y pruebas para backend
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: El backend opera con store en memoria, pero la arquitectura requiere PostgreSQL/Drizzle y pruebas realistas en base de datos.
- Decision: Migrar gradualmente a Drizzle empezando por Auth y Usuarios, usando la base `teamhub_test` para tests con migraciones y limpieza controlada.
- Consecuencias: Los tests dejaran de depender del store; se necesita configurar `DATABASE_URL` de test y mantener migraciones actualizadas.

## Registro de ejecucion (implementacion backend)
- [x] Revisar fuentes de verdad (docs/adr, OpenAPI, reglas de negocio) y gaps. (2026-01-23)
- [x] Definir alcance y estrategia de persistencia (Drizzle vs store) y actualizar `docs/decisiones.md`. (2026-01-23)
- [x] Actualizar `DATABASE_URL` de tests a `teamhub_test` en `backend/src/test-utils/index.ts`. (2026-01-23)
- [x] Ajustar `backend/.env.test.example` para `teamhub_test` y SSL opcional con CA. (2026-01-23)
- [x] Preparar entorno de BD de pruebas (migraciones, seed, config) o alternativa para tests. (2026-01-23)
- [x] Crear `backend/.env.test` con conexion a `teamhub_test` y CA SSL. (2026-01-23)
- [x] Reconfigurar `backend/.env.test` y `backend/.env.test.example` para PostgreSQL local. (2026-01-23)
- [x] Verificar conectividad a PostgreSQL local; bloqueado por permisos del entorno sandbox (sockets TCP/Unix). (2026-01-23)
- [x] Serializar migraciones de tests con advisory lock para evitar conflictos entre workers. (2026-01-23)
- [x] Forzar ejecucion secuencial de tests para evitar colisiones en BD compartida. (2026-01-23)
- [x] Configurar Vitest con `pool=forks` y `singleFork` para evitar paralelismo entre archivos. (2026-01-23)
- [x] Migrar Auth a DB (login, MFA, refresh/reset) con validaciones y tests. (2026-01-23)
- [x] Migrar Usuarios (CRUD, password, unlock) con RBAC y tests. (2026-01-23)
- [x] Migrar Departamentos con tests. (2026-01-23)
- [x] Migrar Plantillas con tests. (2026-01-23)
- [x] Migrar Procesos con tests. (2026-01-23)
- [x] Exponer Swagger UI en `/docs` y servir `openapi.yaml` en `/openapi.yaml`. (2026-01-23)
- [x] Validar Swagger UI con resolucion de `$ref` y assets locales. (2026-01-23)
- [x] Migrar Proyectos/Asignaciones con tests. (2026-01-24)
- [x] Migrar Timetracking con tests. (2026-01-24)
- [x] Implementar Dashboards con metricas reales y tests. (2026-01-24)
- [x] Añadir migracion de `password_temporal` y sincronizar SQL de contexto/tests. (2026-01-24)
- [x] Ajustar tests de dashboard para cargar env antes de importar DB. (2026-01-24)
- [ ] Endurecer seguridad (RBAC, rate limiting, headers, Zod) y revisar regresiones.
- [ ] Actualizar OpenAPI y docs backend segun cambios.
- [ ] Ejecutar lint/tests y resolver fallos (bloqueado: sandbox sin sockets para PostgreSQL).

### Fase 0: Preparacion y pruebas (100%)
- [x] Revisar fuentes de verdad (docs/adr, OpenAPI, reglas de negocio) y gaps. (2026-01-23)
- [x] Definir alcance y estrategia de persistencia (Drizzle vs store) y actualizar `docs/decisiones.md`. (2026-01-23)
- [x] Preparar entorno de BD de pruebas (migraciones, seed, config) o alternativa para tests. (2026-01-23)
- [x] Reconfigurar `backend/.env.test` y `backend/.env.test.example` para PostgreSQL local. (2026-01-23)
- [x] Serializar migraciones de tests con advisory lock para evitar conflictos entre workers. (2026-01-23)
- [x] Forzar ejecucion secuencial de tests para evitar colisiones en BD compartida. (2026-01-23)
- [x] Configurar Vitest con `pool=forks` y `singleFork` para evitar paralelismo entre archivos. (2026-01-23)

### Fase 1: Auth y Usuarios (100%)
- [x] Migrar Auth a DB (login, MFA, refresh/reset) con validaciones y tests. (2026-01-23)
- [x] Migrar Usuarios (CRUD, password, unlock) con RBAC y tests. (2026-01-23)

### Fase 2: Dominios principales (100%)
- [x] Migrar Departamentos con tests. (2026-01-23)
- [x] Migrar Plantillas con tests. (2026-01-23)
- [x] Migrar Procesos con tests. (2026-01-23)
- [x] Migrar Proyectos/Asignaciones con tests. (2026-01-24)
- [x] Migrar Timetracking con tests. (2026-01-24)

### Fase 3: Dashboards (100%)
- [x] Implementar Dashboards con metricas reales y tests. (2026-01-24)

### Fase 4: Hardening y documentacion (40%)
- [ ] Endurecer seguridad (RBAC, rate limiting, headers, Zod) y revisar regresiones.
- [ ] Actualizar OpenAPI y docs backend segun cambios.
- [ ] Ejecutar lint/tests y resolver fallos (bloqueado: sandbox sin sockets para PostgreSQL).
- [x] Exponer Swagger UI en `/docs` y servir `openapi.yaml` en `/openapi.yaml`. (2026-01-23)
- [x] Ajustar tests de dashboard para cargar env antes de importar DB. (2026-01-24)
