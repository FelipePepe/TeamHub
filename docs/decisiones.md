# Decisiones del Proyecto (ADR)

Este archivo registra decisiones clave del proyecto con formato ADR, organizadas por categoría para facilitar la navegación.

---

## Índice por Categoría

1. [Documentación](#1-documentación)
2. [Arquitectura y Base de Datos](#2-arquitectura-y-base-de-datos)
3. [Seguridad y Autenticación](#3-seguridad-y-autenticación)
4. [API y Contratos](#4-api-y-contratos)
5. [Frontend](#5-frontend)
6. [Backend](#6-backend)
7. [Testing y Calidad](#7-testing-y-calidad)
8. [DevOps e Infraestructura](#8-devops-e-infraestructura)
9. [Registro de Ejecución](#registro-de-ejecución)

---

## 1. Documentación

### ADR-003: Resumen por subfases en documentacion
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita un resumen estructurado para preparar las slides y dar vision rapida del plan.
- Decision: Incluir resumen por subfases en \`CHECKLIST.md\` y replicarlo en \`README.md\`.
- Consecuencias: Documentacion mas clara; requiere mantener ambos archivos sincronizados.

### ADR-004: Manual de operaciones unificado para agentes
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Hay tres archivos de instrucciones (AGENTS, claude y copilot) que deben estar alineados.
- Decision: Unificar el contenido base y mantener los tres archivos sincronizados.
- Consecuencias: Menos ambiguedad; requiere actualizar las tres fuentes en cada cambio.

### ADR-005: Fuentes de verdad y placeholders de scaffolding
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Las fuentes de verdad definidas no existian aun en el repositorio durante el scaffold.
- Decision: Crear placeholders para \`docs/adr/\`, \`docs/api/\`, \`openapi.yaml\` y \`backend/src/shared/constants/business-rules.ts\`.
- Consecuencias: La documentacion es navegable desde el inicio; se deben reemplazar los placeholders con contenido real.

### ADR-006: Documentacion funcional y tecnica del frontend
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita documentar el frontend antes de iniciar la implementacion.
- Decision: Crear \`docs/frontend/funcional.md\` y \`docs/frontend/tecnico.md\` como base.
- Consecuencias: Claridad temprana de requisitos y stack; se debe mantener actualizado.

### ADR-007: Indice de documentacion en docs/
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: La documentacion se esta expandiendo y necesita un punto de entrada unico.
- Decision: Crear \`docs/README.md\` como indice de documentacion.
- Consecuencias: Acceso rapido a documentos clave; hay que mantener el indice actualizado.

### ADR-008: Enlaces de documentacion en README
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere acceso rapido a la documentacion desde el README principal.
- Decision: Añadir seccion "Documentacion" con enlaces directos a docs clave.
- Consecuencias: Navegacion mas sencilla; hay que mantener enlaces actualizados.

### ADR-009: Enlace directo a documentacion desde el titulo
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Facilitar el acceso rapido al indice de documentacion desde el inicio del README.
- Decision: Añadir enlace directo a \`docs/README.md\` bajo el titulo principal.
- Consecuencias: Mejor accesibilidad; mantener enlace vigente si cambia la ruta.

### ADR-010: Enlace de retorno en docs/README.md
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Facilitar el retorno al README principal desde el indice de documentacion.
- Decision: Añadir enlace a \`README.md\` en \`docs/README.md\`.
- Consecuencias: Navegacion bidireccional; mantener enlace vigente si cambia la ruta.

### ADR-011: Documentacion funcional y tecnica del backend
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita documentar el backend antes de iniciar la implementacion.
- Decision: Crear \`docs/backend/funcional.md\` y \`docs/backend/tecnico.md\` como base.
- Consecuencias: Claridad temprana de requisitos y stack; se debe mantener actualizado.

### ADR-012: Checklist de pendientes de documentacion
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere consolidar tareas pendientes de documentacion en un solo lugar.
- Decision: Crear \`docs/documentacion-checklist.md\` con pendientes de frontend y backend.
- Consecuencias: Visibilidad de tareas de documentacion; mantener actualizado al cerrar pendientes.

### ADR-023: Documento SAD y plantilla ADR
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere un documento de arquitectura global y una plantilla estandar para ADRs individuales.
- Decision: Crear \`docs/architecture/sad.md\` y \`docs/adr/adr-template.md\`.
- Consecuencias: Arquitectura centralizada y decisiones futuras mas consistentes.

### ADR-029: Guion de slides inicial
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere una estructura base para la presentacion final del TFM.
- Decision: Crear \`docs/slides/outline.md\` con 16 diapositivas y secciones clave.
- Consecuencias: Preparacion mas rapida de la presentacion; requiere completar contenido y capturas.

### ADR-030: Notas de presentacion para slides
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita un guion de apoyo para la exposicion oral.
- Decision: Crear \`docs/slides/notes.md\` con notas por slide.
- Consecuencias: Presentacion mas consistente; requiere mantener notas actualizadas.

### ADR-043: Seguimiento de implementacion backend en checklist
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere un plan de ejecucion detallado y el usuario solicita registrar los pasos realizados durante la implementacion del backend.
- Decision: Crear un checklist de ejecucion en \`CHECKLIST.md\` y registrar avances en una seccion de seguimiento en este archivo.
- Consecuencias: El checklist y el registro deben mantenerse sincronizados tras cada paso completado.

---

## 2. Arquitectura y Base de Datos

### ADR-001: Esquemas por entidad en Drizzle
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: El esquema de datos crece con multiples dominios y un solo archivo se vuelve dificil de mantener.
- Decision: Usar \`backend/src/db/schema/\` con un archivo por entidad en lugar de \`schema.ts\` unico.
- Consecuencias: Mejor modularidad y menos conflictos; requiere coordinar imports entre entidades.

### ADR-002: Barrel de reexportaciones de esquemas
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Importar entidades desde multiples archivos genera dispersion y ruido en servicios/rutas.
- Decision: Crear \`backend/src/db/schema/index.ts\` para reexportar los esquemas.
- Consecuencias: Imports centralizados; hay que mantener el barrel actualizado.

### ADR-036: Uso de drizzle-kit beta para evitar vulnerabilidades
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: drizzle-kit 0.18-0.31 dependia de @esbuild-kit con esbuild vulnerable. Solo la version beta 1.0.0 elimina esta dependencia.
- Decision: Usar drizzle-kit 1.0.0-beta.9 en backend para eliminar vulnerabilidades de seguridad.
- Consecuencias: 0 vulnerabilidades en backend; posibles bugs por ser version beta, requiere monitorear estabilidad.

### ADR-037: Configuracion de drizzle-kit con nuevo formato
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: drizzle-kit depreco \`driver: 'pg'\` y \`connectionString\` en favor de \`dialect\` y \`url\`.
- Decision: Actualizar \`drizzle.config.ts\` usando \`defineConfig()\`, \`dialect: 'postgresql'\` y \`dbCredentials: { url }\`.
- Consecuencias: Configuracion compatible con versiones recientes; requiere actualizar documentacion de migraciones.

### ADR-041: Scripts SQL de contexto para esquema completo
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita compartir el DDL completo en archivos SQL independientes para revision y entrega.
- Decision: Crear \`context/*.sql\` con enums, tablas, indices y constraints (incluyendo FKs circulares).
- Consecuencias: Se debe mantener sincronizado con las migraciones de Drizzle.

### ADR-042: SSL opcional para conexion PostgreSQL con CA
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Algunos entornos (por ejemplo Railway) exigen SSL con CA para conectar a PostgreSQL, mientras que en local no es necesario.
- Decision: Añadir \`PG_SSL_CERT_PATH\` como variable opcional; cuando esta definida se activa \`ssl.ca\` en la conexion principal y en \`run-triggers\`.
- Consecuencias: En local se puede omitir; en entornos con CA se debe proporcionar una ruta valida o el proceso fallara al leer el certificado.

### ADR-044: Estrategia de persistencia y pruebas para backend
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: El backend opera con store en memoria, pero la arquitectura requiere PostgreSQL/Drizzle y pruebas realistas en base de datos.
- Decision: Migrar gradualmente a Drizzle empezando por Auth y Usuarios, usando la base \`teamhub_test\` para tests con migraciones y limpieza controlada.
- Consecuencias: Los tests dejaran de depender del store; se necesita configurar \`DATABASE_URL\` de test y mantener migraciones actualizadas.

---

## 3. Seguridad y Autenticación

### ADR-017: Politica de rate limit global
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Proteger la API de abuso y ataques de fuerza bruta.
- Decision: 100 req/min por usuario en API general y 5 req/min por IP en /auth/login.
- Consecuencias: Limita abuso; requiere manejo de respuestas 429.

### ADR-019: Politica de autenticacion y seguridad
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere reforzar la seguridad de acceso para todos los usuarios.
- Decision: MFA obligatorio (Google Authenticator), password policy fuerte (12+ con mayus/minus/numero/especial) y bloqueo tras 3 intentos fallidos (30 min).
- Consecuencias: Mayor seguridad; requiere flujos de enrolamiento y recuperacion robustos.

### ADR-020: Desbloqueo manual de cuentas por ADMIN
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Los bloqueos temporales pueden requerir desbloqueo inmediato por soporte.
- Decision: Permitir que ADMIN desbloquee cuentas bloqueadas manualmente.
- Consecuencias: Se requiere accion de desbloqueo en UI y endpoint dedicado.

### ADR-038: Flujo MFA obligatorio con token de desafio
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: MFA es obligatorio para todos los usuarios y se necesita un flujo que permita completar el enrolamiento antes de emitir tokens de acceso.
- Decision: El login siempre devuelve \`mfaToken\` (challenge de corta duracion), \`/auth/mfa/setup\` acepta \`mfaToken\` o access token y \`/auth/mfa/verify\` valida TOTP antes de emitir access/refresh.
- Consecuencias: Login en dos pasos, el frontend debe manejar el challenge y enrolamiento; tests deben usar el flujo MFA.

### ADR-039: Rate limiting en memoria para backend
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: La politica de rate limit requiere proteccion en login y en endpoints globales, con una implementacion simple para el entorno actual.
- Decision: Implementar rate limiting in-memory con llave por usuario (sub del token) o IP como fallback, y limitar login por IP.
- Consecuencias: Limites por instancia (no compartidos en multi-replica); requiere store distribuido si se despliega con escalado horizontal.

### ADR-045: MFA Backup Codes
- Fecha: 2026-01-25
- Estado: Aceptado
- Contexto: Los usuarios pueden perder acceso a su dispositivo MFA y necesitan un mecanismo de recuperacion.
- Decision: Implementar backup codes (10 codigos de un solo uso) generados al activar MFA, almacenados como hashes en \`mfa_recovery_codes\`, con endpoint de regeneracion en \`/perfil/mfa/backup-codes\`.
- Consecuencias: Usuarios pueden recuperar acceso; requiere UI para mostrar codigos una sola vez y endpoint de regeneracion.

### ADR-057: Generacion local de QR codes para MFA
- Fecha: 2026-01-28
- Estado: Aceptado
- Contexto: La generacion de QR codes para MFA usando servicios externos (Google Charts, QuickChart) causa errores CORB (Cross-Origin Read Blocking) porque estos servicios no envian headers CORS adecuados.
- Decision: Generar QR codes localmente en el frontend usando la libreria `qrcode`, que produce data URLs base64 sin necesidad de peticiones externas.
- Consecuencias: Eliminacion de errores CORB; requiere tener `qrcode` instalado en el frontend; QR se genera instantaneamente sin latencia de red.

### ADR-058: Sincronizacion de tiempo para TOTP
- Fecha: 2026-01-28
- Estado: Aceptado
- Contexto: La verificacion TOTP fallaba porque el reloj del servidor estaba desincronizado respecto al dispositivo del usuario.
- Decision: Documentar como requisito que el servidor debe tener NTP habilitado para sincronizacion de tiempo. En Linux: `timedatectl set-ntp true`.
- Consecuencias: Los codigos TOTP coinciden entre servidor y cliente; requisito de infraestructura documentado en troubleshooting.

### ADR-059: Autenticación de Origen con HMAC
- Fecha: 2026-01-29
- Estado: Aceptado
- Contexto: Las APIs están expuestas públicamente y cualquier cliente podría intentar acceder sin pasar por el frontend oficial.
- Decision: Implementar validación HMAC con timestamp en todas las peticiones a `/api/*`.
- Alternativas consideradas:
  1. API Key estática - Menos segura, vulnerable a replay attacks
  2. CORS estricto - Headers se pueden falsificar
  3. **HMAC con timestamp** - Elegida: Segura y sin necesidad de SSO
- Consecuencias:
  - (+) Solo clientes con el secreto pueden acceder
  - (+) Protección contra replay attacks con timestamp (máximo 5 minutos)
  - (-) Requiere sincronización de secreto entre frontend y backend
  - (-) Pequeño overhead en cada request
- Implementación:
  - Header: `X-Request-Signature` con formato `t=<timestamp>,s=<signature>`
  - Firma: HMAC-SHA256(timestamp + method + path, SECRET)
  - Backend: Middleware `hmac-validation.ts` valida antes del rate limiting
  - Frontend: Interceptor axios genera firma en cada request

### ADR-060: Diseño Responsive y Accesibilidad (A11y)
- Fecha: 2026-01-29
- Estado: Aceptado
- Contexto: El frontend no era responsive al cargar en móvil tras despliegue en Vercel, no cumplía con estándares de accesibilidad.
- Decision: Implementar diseño responsive mobile-first con Tailwind breakpoints y cumplir con WCAG 2.1 AA.
- Estándares:
  - **Responsive**: Mobile-first desde 320px, breakpoints estándar (sm:640px, md:768px, lg:1024px)
  - **A11y**: Navegación por teclado, ARIA labels, contraste 4.5:1, HTML semántico
- Consecuencias:
  - (+) Experiencia consistente en todos los dispositivos
  - (+) Cumplimiento de estándares de accesibilidad
  - (-) Requiere refactorizar componentes existentes
- Implementación:
  - Sheet UI component para menú móvil (slide-in)
  - MobileSidebar con hamburger menu
  - Grids responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
  - ARIA: `aria-label`, `aria-current`, `aria-hidden`, `role="list"`

### ADR-061: Troubleshooting de Configuración HMAC
- Fecha: 2026-01-29
- Estado: Aceptado
- Contexto: Desarrolladores encontraban error "HMAC key data must not be empty" al ejecutar el proyecto localmente porque faltaba `API_HMAC_SECRET` en `.env`.
- Decision: Documentar guía completa de troubleshooting en `docs/troubleshooting.md` con diagnóstico, solución y verificación.
- Consecuencias:
  - (+) Reduce tiempo de onboarding de nuevos desarrolladores
  - (+) Centraliza soluciones a problemas comunes
  - Los archivos `.env` no se versionan (están en `.gitignore`)

### ADR-062: Preservación Explícita de Ramas en GitFlow
- Fecha: 2026-01-29
- Estado: Aceptado
- Contexto: Ocurrió un incidente donde se usó `--delete-branch` al mergear PR, borrando rama `bugfix/hmac-env-config`. Aunque se recuperó, violó la política del proyecto.
- Decision: Añadir sección explícita "Preservación de Ramas" en archivos de instrucciones de agentes (AGENTS.md, claude.md, copilot-instructions.md).
- Regla: **CRÍTICO - NUNCA borrar ramas después de mergear (ni local ni remotamente)**. Usar `gh pr merge <number> --squash` SIN `--delete-branch`.
- Consecuencias:
  - (+) Previene borrado accidental de ramas
  - (+) Facilita auditorías y revisiones históricas
  - (+) Mantiene trazabilidad completa del proyecto
  - Los 3 archivos de agentes deben mantenerse sincronizados

### ADR-063: Uso de D3.js para Visualizaciones de Datos
- Fecha: 2026-01-29
- Estado: Aceptado
- Contexto: Los dashboards actualmente usan gráficos simples con CSS/HTML (divs con Tailwind). D3.js está instalado pero no se usa. Se necesita decidir la tecnología definitiva para visualizaciones.
- Decision: Utilizar **D3.js v7** para todos los componentes de gráficos y visualizaciones de datos.
- Alternativas consideradas:
  1. CSS/HTML simple - Limitado, sin interactividad
  2. **D3.js** - Elegida: Máxima flexibilidad y control
  3. Recharts - Más simple pero menos personalizable
  4. Chart.js - Muy simple pero limitado para casos avanzados
- Consecuencias:
  - (+) Gráficos interactivos (tooltips, hover, zoom)
  - (+) Animaciones fluidas y profesionales
  - (+) Amplia variedad de tipos de visualizaciones
  - (+) Escalabilidad para datos complejos
  - (+) Control total sobre renderizado y comportamiento
  - (-) Mayor complejidad de código
  - (-) Incremento en tamaño del bundle (~200KB)
  - (-) Requiere conocimiento de D3.js
- Implementación pendiente:
  - Refactorizar `bar-chart.tsx` con D3.js
  - Refactorizar `line-chart.tsx` con D3.js
  - Añadir interactividad (tooltips, hover effects)
  - Mantener responsive design y accesibilidad
  - Tests de componentes actualizados

### ADR-046: Endpoints de Perfil separados de Usuarios
- Fecha: 2026-01-25
- Estado: Aceptado
- Contexto: Los usuarios autenticados necesitan gestionar su propio perfil sin requerir permisos de ADMIN/RRHH.
- Decision: Crear grupo de endpoints \`/perfil\` (GET/PUT perfil, cambio password, avatar, gestion MFA) separados de \`/usuarios/{id}\` que requiere roles privilegiados.
- Consecuencias: Mejor separacion de concerns; el usuario gestiona su perfil sin exponer endpoints administrativos.

### ADR-047: Configuracion JWT con tiempos de expiracion
- Fecha: 2026-01-25
- Estado: Aceptado
- Contexto: Se necesita definir la politica de expiracion de tokens JWT para balancear seguridad y UX.
- Decision: Access token expira en 15 minutos (\`JWT_ACCESS_EXPIRES_IN=15m\`), refresh token en 30 dias (\`JWT_REFRESH_EXPIRES_IN=30d\`), MFA token en 5 minutos. Algoritmo HS256 con secrets minimo 32 caracteres.
- Consecuencias: Sesiones seguras con refresh automatico; requiere interceptor en frontend para renovar tokens.

---

## 4. API y Contratos

### ADR-018: Swagger para documentacion de APIs
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere una forma estandar de visualizar y validar el contrato de API.
- Decision: Usar Swagger (Swagger UI) para documentar y revisar la API basada en OpenAPI.
- Consecuencias: Documentacion navegable; requiere mantener openapi.yaml actualizado.

### ADR-021: Modularizacion de OpenAPI
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: \`openapi.yaml\` crecio demasiado y dificulta el mantenimiento.
- Decision: Modularizar rutas y esquemas en \`docs/api/openapi/paths/\` y \`docs/api/openapi/components/\`, dejando \`openapi.yaml\` como agregador con \`\$ref\`.
- Consecuencias: Mantenimiento mas sencillo; se debe cuidar la coherencia de referencias.

### ADR-022: Script de validacion OpenAPI
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere una validacion reproducible del contrato OpenAPI.
- Decision: Crear \`scripts/validate-openapi.sh\` con Swagger CLI y timeout opcional.
- Consecuencias: Validacion consistente desde cualquier ruta; requiere tener \`npx\` disponible.

### ADR-040: Alineacion de contrato Timetracking con restricciones DB
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: La base de datos exige \`descripcion\` no nula y \`horas\` en rango (0-24), mientras que el contrato permitia valores mas laxos.
- Decision: Hacer \`descripcion\` requerida y validar \`horas\` en el API y OpenAPI con los limites del esquema.
- Consecuencias: Clientes deben enviar descripcion y horas validas; se evitan errores al persistir.

---

## 5. Frontend

### ADR-013: Uso de D3.js en graficos de dashboards
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere una libreria flexible para visualizaciones en dashboards.
- Decision: Usar D3.js para los graficos de dashboards.
- Consecuencias: Mayor control visual; requiere desarrollo de componentes custom.

### ADR-033: Actualizacion a Next.js 15 y React 19
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Next.js 14 presentaba vulnerabilidades de seguridad y eslint-config-next 16.x era incompatible con Next.js 14.
- Decision: Actualizar a Next.js 15.1.4 con React 19.0.0 para resolver vulnerabilidades y mantener compatibilidad.
- Consecuencias: Stack moderno con ultimas features de React 19; requiere verificar compatibilidad de librerias de terceros.

### ADR-049: Arquitectura del Frontend con AuthProvider y dashboards por rol
- Fecha: 2026-01-25
- Estado: Aceptado
- Contexto: El frontend necesita gestionar estado de autenticacion global y mostrar dashboards diferenciados por rol.
- Decision: Implementar AuthProvider con Context API para estado de auth, dashboards especificos por rol (Admin, RRHH, Manager, Empleado) con metricas y graficos D3.
- Consecuencias: UX adaptada a cada rol; requiere mantener sincronizados los dashboards con los endpoints del backend.

### ADR-050: Axios interceptors con refresh automatico de tokens
- Fecha: 2026-01-25
- Estado: Aceptado
- Contexto: Los access tokens expiran cada 15 minutos y el usuario no debe perder su sesion por expiracion.
- Decision: Implementar interceptor en Axios que detecta 401, intenta refresh con el refresh token, y reintenta la peticion original. Si falla el refresh, redirige a login.
- Consecuencias: UX transparente para el usuario; requiere manejo cuidadoso de race conditions en peticiones concurrentes.

---

## 6. Backend

### ADR-015: Logging estructurado con pino en backend
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere logging estructurado para diagnostico y monitoreo.
- Decision: Usar pino como libreria de logging en backend.
- Consecuencias: Logs consistentes; requiere configurar output y niveles.

### ADR-031: Scaffold manual por bloqueo de red
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: \`npm install\` y \`create-next-app\` fallaron por \`EAI_AGAIN\` al acceder a \`registry.npmjs.org\`.
- Decision: Crear scaffold manual de frontend y backend (config, estructura y archivos base) hasta poder instalar dependencias.
- Consecuencias: Se puede avanzar en estructura; queda pendiente instalar dependencias cuando se restablezca la red.

### ADR-032: Fijacion de versiones de dependencias
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: El backend tenia todas las dependencias con version \`"latest"\`, lo que rompe la reproducibilidad del build y puede causar errores inesperados.
- Decision: Fijar todas las versiones de dependencias con prefijo \`^\` (ej: \`"hono": "^4.6.16"\`) en lugar de \`"latest"\`.
- Consecuencias: Builds reproducibles y controlados; requiere actualizacion manual periodica de dependencias.

---

## 7. Testing y Calidad

### ADR-014: Convenciones de testing en frontend
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita estandarizar ubicacion y herramientas de testing en frontend.
- Decision: Usar Vitest + Testing Library en \`frontend/src/__tests__/\` y Playwright en \`frontend/e2e/\`.
- Consecuencias: Tests organizados por tipo; requiere mantener estructura al crecer.

### ADR-016: Estrategia de tests en backend
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita una herramienta unificada para tests del backend.
- Decision: Usar Vitest para unit e integration, con pruebas de endpoints via \`app.request\`.
- Consecuencias: Tests consistentes; requiere configurar entorno de pruebas.

### ADR-028: Estrategia de testing y calidad documentada
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita un plan de testing unificado para frontend y backend.
- Decision: Crear \`docs/quality/testing.md\` con tipos de pruebas, cobertura y gates.
- Consecuencias: Mayor claridad en criterios de calidad; requiere mantener el documento actualizado.

### ADR-034: Migracion a ESLint 9 con flat config
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: ESLint 8.x esta deprecado y ESLint 9 requiere el nuevo formato "flat config" (\`eslint.config.mjs\`).
- Decision: Migrar de \`.eslintrc.cjs\` a \`eslint.config.mjs\` en frontend y backend, usando \`typescript-eslint\` y \`@eslint/eslintrc\` para compatibilidad.
- Consecuencias: Configuracion moderna y mantenible; requiere adaptar plugins legacy con FlatCompat.

### ADR-035: Actualizacion a Vitest 3
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Vitest 2.x dependia de vite con esbuild vulnerable (<=0.24.2).
- Decision: Actualizar a Vitest 3.0.4 y @vitest/coverage-v8 3.0.4 para resolver vulnerabilidades de esbuild.
- Consecuencias: Tests sin vulnerabilidades; requiere jsdom como dependencia explicita en frontend.

### ADR-051: Correccion de warnings ESLint para calidad de codigo
- Fecha: 2026-01-25
- Estado: Pendiente
- Contexto: La revision de codigo detecto multiples warnings de ESLint (imports node:*, optional chaining, Set vs Array, etc.).
- Decision: Corregir todos los warnings identificados en backend y frontend para mantener codigo limpio y consistente con las reglas establecidas.
- Consecuencias: Codigo mas mantenible; requiere tiempo dedicado a refactoring sin cambios funcionales.

---

## 8. DevOps e Infraestructura

### ADR-024: Variables de entorno por entorno
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita separar configuracion por entorno para evitar errores en despliegues.
- Decision: Crear archivos \`.env.*.example\` por entorno en frontend y backend y documentarlos.
- Consecuencias: Configuracion mas clara; requiere mantener los ejemplos sincronizados.

### ADR-025: Documentacion de despliegue y CI/CD
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere un procedimiento estandar para despliegue y automatizacion.
- Decision: Crear \`docs/architecture/deploy.md\` con pasos para Vercel, Railway y CI/CD opcional.
- Consecuencias: Despliegues mas consistentes; requiere mantener el documento actualizado.

### ADR-026: Pipeline de CI en GitHub Actions
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita automatizar checks basicos en PR y main.
- Decision: Crear \`.github/workflows/ci.yml\` con validacion OpenAPI, lint, type-check, tests y build.
- Consecuencias: Mayor control de calidad; requiere mantener scripts coherentes.

### ADR-027: Hooks de Git con Husky
- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere control adicional antes de push para evitar errores en despliegue.
- Decision: Añadir husky en raiz con hook \`pre-push\` para validar OpenAPI y ejecutar checks cuando existan paquetes.
- Consecuencias: Fallos detectados antes de push; requiere \`npm install\` en raiz para activar hooks.

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
- Decision: Implementar tres hooks de Husky: \`commit-msg\` para Conventional Commits, \`pre-commit\` para validar nombres de rama GitFlow, y \`pre-push\` para bloquear push directo a main/develop.
- Consecuencias: Enforcement automatico de GitFlow; fallos rapidos antes de llegar al CI.

### ADR-053: Extensiones .js en imports TypeScript (Node16)
- Fecha: 2026-01-26
- Estado: Aceptado
- Contexto: TypeScript con \`moduleResolution: node16/nodenext\` requiere extensiones explicitas en imports relativos para ESM.
- Decision: Añadir extensiones \`.js\` a todos los imports relativos en el backend para compatibilidad con ESM nativo.
- Consecuencias: Codigo compatible con Node.js ESM; requiere atencion al añadir nuevos imports.

### ADR-054: Tipos estrictos para validators Zod
- Fecha: 2026-01-26
- Estado: Aceptado
- Contexto: Los validators Zod con \`z.preprocess()\` devuelven \`unknown\`, perdiendo type safety en las rutas.
- Decision: Refactorizar validators usando \`z.union().transform()\` para mantener inferencia de tipos correcta.
- Consecuencias: Type safety end-to-end desde query params hasta repositorios; codigo mas seguro.

### ADR-055: Bootstrap token para primer usuario
- Fecha: 2026-01-26
- Estado: Aceptado
- Contexto: El endpoint de login permite crear el primer usuario (bootstrap), lo cual es un riesgo de seguridad sin autenticacion.
- Decision: Requerir header \`X-Bootstrap-Token\` que coincida con \`BOOTSTRAP_TOKEN\` env var para bootstrap del primer admin.
- Consecuencias: Bootstrap seguro; requiere configurar token en produccion y en tests.

### ADR-056: Sistema colaborativo multi-LLM
- Fecha: 2026-01-27
- Estado: Aceptado
- Contexto: Se dispone de licencias para múltiples LLMs (GitHub Copilot CLI, Claude CLI, Codex CLI) y se busca mejorar la calidad del código generado mediante revisión cruzada.
- Decision: Implementar sistema de orquestación en \`scripts/llm-collab/\` donde GitHub Copilot CLI genera código y Claude CLI lo revisa, iterando hasta aprobación (máx 3 iteraciones). El sistema soporta también Auto (Cursor AI) como orquestador, generador o revisor mediante archivos de instrucciones.
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
  - Directorio \`.llm-context/\` en \`.gitignore\` para archivos temporales
- Uso práctico (2026-01-27):
  - **Primera implementación exitosa**: Hook \`useDepartamentos\` para frontend
    - Generación: Código completo con TanStack Query, tipos TypeScript, validaciones
    - Revisión: Aprobado con puntuación 9/10, cumpliendo estándares del proyecto
    - Mejora: Tipos exportados a \`types/index.ts\` para reutilización
    - Resultado: Hook funcional listo para producción (commit \`856f90a\`)
  - **Segunda implementación**: Página de listado de departamentos (\`/admin/departamentos\`)
    - Generación: Página completa con tabla, filtros, búsqueda, acciones
    - Revisión: Integración correcta con hooks, permisos, estados de carga
    - Resultado: Página funcional con todas las características requeridas (commit \`1638c0e\`)
  - **Tercera implementación**: Formulario modal para crear/editar departamentos
    - Generación: Formulario con React Hook Form + Zod, validaciones robustas
    - Revisión: Aprobado 8.5/10, mejoras sugeridas (reset al cerrar, select de responsables)
    - Mejora: Reset del formulario al cerrar modal implementado
    - Resultado: Formulario completo con Dialog component creado
  - **Proceso validado**: El sistema de colaboración multi-LLM funciona correctamente:
    1. Orquestador genera instrucciones estructuradas en \`.llm-context/auto_instructions.md\`
    2. Auto (Cursor AI) ejecuta generación, revisión y mejora iterativa
    3. Código resultante cumple estándares (Clean Code, TypeScript, tests)
    4. Implementación directa en el proyecto sin necesidad de refactorización mayor
    5. Feedback estructurado en \`.llm-context/review_feedback.md\` para trazabilidad
---

## Registro de Ejecución

### Resumen de progreso

| Fase | Estado | Progreso |
|------|--------|----------|
| Fase 0: Preparacion y pruebas | ✅ Completada | 100% |
| Fase 1: Auth y Usuarios | ✅ Completada | 100% |
| Fase 2: Dominios principales | ✅ Completada | 100% |
| Fase 3: Dashboards | ✅ Completada | 100% |
| Fase 4: Hardening y documentacion | ✅ Completada | 100% |

### Fase 0: Preparacion y pruebas (100%)
- [x] Revisar fuentes de verdad (docs/adr, OpenAPI, reglas de negocio) y gaps. (2026-01-23)
- [x] Definir alcance y estrategia de persistencia (Drizzle vs store) y actualizar \`docs/decisiones.md\`. (2026-01-23)
- [x] Preparar entorno de BD de pruebas (migraciones, seed, config) o alternativa para tests. (2026-01-23)
- [x] Reconfigurar \`backend/.env.test\` y \`backend/.env.test.example\` para PostgreSQL local. (2026-01-23)
- [x] Serializar migraciones de tests con advisory lock para evitar conflictos entre workers. (2026-01-23)
- [x] Forzar ejecucion secuencial de tests para evitar colisiones en BD compartida. (2026-01-23)
- [x] Configurar Vitest con \`pool=forks\` y \`singleFork\` para evitar paralelismo entre archivos. (2026-01-23)

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

### Fase 4: Hardening y documentacion (100%)
- [x] Exponer Swagger UI en \`/docs\` y servir \`openapi.yaml\` en \`/openapi.yaml\`. (2026-01-23)
- [x] Validar Swagger UI con resolucion de \`\$ref\` y assets locales. (2026-01-23)
- [x] Añadir migracion de \`password_temporal\` y sincronizar SQL de contexto/tests. (2026-01-24)
- [x] Ajustar tests de dashboard para cargar env antes de importar DB. (2026-01-24)
- [x] Documentar ADRs faltantes (MFA backup codes, perfil, JWT, GitFlow, frontend, interceptors). (2026-01-25)
- [x] Reorganizar ADRs por categorias tematicas. (2026-01-25)
- [x] Refactorizar frontend para responsive design - Layout (ADR-060). (2026-01-29)
- [x] Refactorizar frontend para responsive design - Dashboards admin/RRHH (ADR-060). (2026-01-29)
- [x] Implementar mejoras A11y en navegación (ADR-060). (2026-01-29)
- [x] Documentar troubleshooting de configuración HMAC en entornos locales (ADR-061). (2026-01-29)
- [x] Añadir regla explícita de preservación de ramas en GitFlow (ADR-062). (2026-01-29)
- [x] Decidir tecnología de visualización: D3.js (ADR-063). (2026-01-29)
- [x] Auditar backend y clarificar estado real (100% completo con 149 endpoints). (2026-01-29)
- [x] Implementar hook usePlantillas para frontend de Fase 3: Onboarding (PR #30). (2026-01-29)
- [x] Implementar hook useProcesos para frontend de Fase 3: Onboarding (PR #32). (2026-01-29)
- [x] Implementar página de listado de plantillas para Fase 3: Onboarding (PR #34). (2026-01-29)
- [x] Implementar páginas de procesos (listado + detalle) para Fase 3: Onboarding (PR #36). (2026-01-29)
- [x] Implementar editor completo de plantillas (crear + editar) para Fase 3: Onboarding (PR #38). (2026-01-29)
- [x] Implementar modal iniciar proceso de onboarding para Fase 3: Onboarding (PR #40). (2026-01-29)
- [x] Implementar página Mis Tareas para Fase 3: Onboarding (PR #42). (2026-01-29)
- [x] Implementar widget Mi Onboarding para dashboard empleado - Fase 3: Onboarding (PR #44). (2026-01-29)
- [x] Corregir warnings ESLint frontend y verificar tests backend/frontend (PR #46). (2026-01-29)
- [x] Actualizar README con estado actual del proyecto (PR #48). (2026-01-29)
- [x] Endurecer seguridad con headers mejorados y rate limiting robusto - ADR-064 (PR #50). (2026-01-29)
- [x] Actualizar OpenAPI a v1.0.0 y mejorar docs/api/README.md (PR #52). (2026-01-29)
- [x] Completar Fase 2: Empleados con formulario y vista detalle (PR #54). (2026-01-29)
  - **Componentes implementados:**
    - `EmpleadoForm`: Modal formulario con React Hook Form + Zod para crear/editar empleados
      - Campos: email, nombre, apellidos, rol, departamento, teléfono, fecha de nacimiento
      - Integración con `useEmpleados` (create/update mutations)
      - Validación fail-fast en tiempo de ejecución con Zod
      - Selector de departamentos integrado con `useDepartamentos`
    - `EmpleadoDetailPage`: Vista detalle completa con información personal y organizacional
      - Grid responsive 2 columnas (info básica + organizacional)
      - Formato de fechas con date-fns (locale español)
      - Badges para rol y estado activo/inactivo
      - Acciones: editar, eliminar con confirmación
    - `Select UI Component`: Componente basado en Radix UI siguiendo patrón shadcn/ui
      - Accesibilidad completa (keyboard navigation, ARIA)
      - Consistente con resto de componentes UI
  - **Modificaciones:**
    - `frontend/src/app/(dashboard)/admin/empleados/page.tsx`: Actualizada para usar modal en lugar de rutas
      - Botón "Crear" abre EmpleadoForm en modo creación
      - Botón "Editar" abre EmpleadoForm con datos del empleado
      - Botón "Ver" navega a página de detalle
  - **Archivos nuevos:**
    - `frontend/src/components/forms/empleado-form.tsx` (361 líneas)
    - `frontend/src/app/(dashboard)/admin/empleados/[id]/page.tsx` (277 líneas)
    - `frontend/src/components/ui/select.tsx` (150 líneas)
  - **Progreso:** Fase 2 completada al 100% (antes estaba en 90%)
  - **ESLint:** 0 errores, 0 warnings
- [x] Añadir tests para componentes empleados (PR #56). (2026-01-29)
- [x] Corregir mocks faltantes en tests de empleados (PR #57). (2026-01-29)
- [x] Añadir dependencias date-fns y @radix-ui/react-select (commit directo). (2026-01-29)

### Historial detallado de tareas
- [x] Revisar fuentes de verdad (docs/adr, OpenAPI, reglas de negocio) y gaps. (2026-01-23)
- [x] Definir alcance y estrategia de persistencia (Drizzle vs store) y actualizar \`docs/decisiones.md\`. (2026-01-23)
- [x] Actualizar \`DATABASE_URL\` de tests a \`teamhub_test\` en \`backend/src/test-utils/index.ts\`. (2026-01-23)
- [x] Ajustar \`backend/.env.test.example\` para \`teamhub_test\` y SSL opcional con CA. (2026-01-23)
- [x] Preparar entorno de BD de pruebas (migraciones, seed, config) o alternativa para tests. (2026-01-23)
- [x] Crear \`backend/.env.test\` con conexion a \`teamhub_test\` y CA SSL. (2026-01-23)
- [x] Reconfigurar \`backend/.env.test\` y \`backend/.env.test.example\` para PostgreSQL local. (2026-01-23)
- [x] Verificar conectividad a PostgreSQL local; bloqueado por permisos del entorno sandbox (sockets TCP/Unix). (2026-01-23)
- [x] Serializar migraciones de tests con advisory lock para evitar conflictos entre workers. (2026-01-23)
- [x] Forzar ejecucion secuencial de tests para evitar colisiones en BD compartida. (2026-01-23)
- [x] Configurar Vitest con \`pool=forks\` y \`singleFork\` para evitar paralelismo entre archivos. (2026-01-23)
- [x] Migrar Auth a DB (login, MFA, refresh/reset) con validaciones y tests. (2026-01-23)
- [x] Migrar Usuarios (CRUD, password, unlock) con RBAC y tests. (2026-01-23)
- [x] Migrar Departamentos con tests. (2026-01-23)
- [x] Migrar Plantillas con tests. (2026-01-23)
- [x] Migrar Procesos con tests. (2026-01-23)
- [x] Exponer Swagger UI en \`/docs\` y servir \`openapi.yaml\` en \`/openapi.yaml\`. (2026-01-23)
- [x] Validar Swagger UI con resolucion de \`\$ref\` y assets locales. (2026-01-23)
- [x] Migrar Proyectos/Asignaciones con tests. (2026-01-24)
- [x] Migrar Timetracking con tests. (2026-01-24)
- [x] Implementar Dashboards con metricas reales y tests. (2026-01-24)
- [x] Añadir migracion de \`password_temporal\` y sincronizar SQL de contexto/tests. (2026-01-24)
- [x] Ajustar tests de dashboard para cargar env antes de importar DB. (2026-01-24)
- [x] Documentar ADRs faltantes (MFA backup codes, perfil, JWT, GitFlow, frontend, interceptors). (2026-01-25)
- [x] Reorganizar ADRs por categorias tematicas. (2026-01-25)
- [x] Implementar sistema colaborativo multi-LLM (orquestador, generador, revisor). (2026-01-27)
- [x] Probar sistema multi-LLM generando hook useDepartamentos. (2026-01-27)
- [x] Implementar página de listado de departamentos usando sistema multi-LLM. (2026-01-27)
- [x] Implementar formulario modal de departamentos usando sistema multi-LLM. (2026-01-27)
- [x] Corregir error CORB en generacion de QR codes para MFA (ADR-057). (2026-01-28)
- [x] Documentar requisito de sincronizacion NTP para TOTP (ADR-058). (2026-01-28)
- [x] Crear guia de troubleshooting (`docs/troubleshooting.md`). (2026-01-28)
- [x] Implementar autenticacion HMAC para API (ADR-059). (2026-01-29)
- [x] Implementar diseño responsive y accesibilidad (ADR-060). (2026-01-29)
- [x] Documentar troubleshooting de configuración HMAC (ADR-061). (2026-01-29)
- [x] Añadir regla explícita de preservación de ramas (ADR-062). (2026-01-29)
- [x] Decidir tecnología de visualización de datos: D3.js (ADR-063). (2026-01-29)
- [x] Auditar backend y clarificar estado real del proyecto (2026-01-29)
- [x] Implementar hook usePlantillas con TanStack Query para Fase 3: Onboarding (2026-01-29)
- [x] Implementar hook useProcesos con TanStack Query para Fase 3: Onboarding (2026-01-29)
- [x] Implementar página de listado de plantillas para Fase 3: Onboarding (2026-01-29)
- [x] Implementar páginas de procesos (listado + detalle) para Fase 3: Onboarding (2026-01-29)
- [x] Implementar editor completo de plantillas (crear + editar) para Fase 3: Onboarding (2026-01-29)
- [x] Implementar modal iniciar proceso de onboarding para Fase 3: Onboarding (2026-01-29)
- [x] Implementar página Mis Tareas para Fase 3: Onboarding (2026-01-29)
- [x] Implementar widget Mi Onboarding para dashboard empleado - Fase 3: Onboarding (2026-01-29)
- [x] Corregir warnings ESLint frontend y verificar tests backend/frontend pasando (2026-01-29)
- [x] Actualizar README con estado actual del proyecto, features, tests y deployment (2026-01-29)
- [x] Endurecer seguridad con headers mejorados, rate limiting y ADR-064 (OWASP 96.5%) (2026-01-29)
- [x] Actualizar OpenAPI a v1.0.0 con 149 endpoints y mejorar docs/api/README.md (2026-01-29)
- [x] Completar Fase 2: Empleados con formulario crear/editar y vista detalle (PR #54) (2026-01-29)
- [x] Añadir tests para EmpleadoForm y EmpleadoDetailPage (PR #56) (2026-01-29)
- [x] Corregir mocks faltantes en tests de empleados (PR #57) (2026-01-29)
- [x] Añadir dependencias date-fns y @radix-ui/react-select al package.json (2026-01-29)
- [x] Implementar frontend Fase 4 (Proyectos) y Fase 5 (Timetracking) según OpenAPI (2026-01-30)
  - **Fuente de verdad:** `docs/api/openapi/paths/proyectos.yaml`, `docs/api/openapi/paths/timetracking.yaml`, schemas en `docs/api/openapi/components/schemas/`.
  - **Hook use-proyectos.ts:** list, get, create, update, delete, estado, stats, asignaciones (CRUD y finalizar). Tipos alineados con ProyectoResponse, AsignacionResponse, CreateProyectoRequest, etc.
  - **Páginas proyectos:** listado (cards/tabla), crear (form CreateProyectoRequest), detalle [id] con estadísticas (ProyectoStatsResponse) y gestión de asignaciones (modal CreateAsignacionRequest).
  - **Hook use-timetracking.ts:** list, mis-registros, semana, create, update, delete, aprobar, rechazar, aprobar-masivo, pendientes-aprobacion, resumen, copiar. Tipos alineados con TimetrackingResponse, CreateTimetrackingRequest, PendientesAprobacionResponse, etc.
  - **Páginas timetracking:** vista principal (mis registros + resumen + formulario crear), aprobación (pendientes para managers, aprobar/rechazar individual y masivo).
  - **Permiso:** `canManageProjects` en use-permissions para ADMIN, RRHH, MANAGER.
  - **Rama:** feature/fase4-fase5-proyectos-timetracking (GitFlow).
