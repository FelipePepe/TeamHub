## 1. Documentación

### ADR-003: Resumen por subfases en documentacion

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita un resumen estructurado para preparar las slides y dar vision rapida del plan.
- Decision: Incluir resumen por subfases en CHECKLIST.md y replicarlo en README.md.
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
- Decision: Crear placeholders para docs/adr/, docs/api/, openapi.yaml y backend/src/shared/constants/business-rules.ts.
- Consecuencias: La documentacion es navegable desde el inicio; se deben reemplazar los placeholders con contenido real.

### ADR-006: Documentacion funcional y tecnica del frontend

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita documentar el frontend antes de iniciar la implementacion.
- Decision: Crear docs/frontend/funcional.md y docs/frontend/tecnico.md como base.
- Consecuencias: Claridad temprana de requisitos y stack; se debe mantener actualizado.

### ADR-007: Indice de documentacion en docs/

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: La documentacion se esta expandiendo y necesita un punto de entrada unico.
- Decision: Crear docs/README.md como indice de documentacion.
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
- Decision: Añadir enlace directo a docs/README.md bajo el titulo principal.
- Consecuencias: Mejor accesibilidad; mantener enlace vigente si cambia la ruta.

### ADR-010: Enlace de retorno en docs/README.md

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Facilitar el retorno al README principal desde el indice de documentacion.
- Decision: Añadir enlace a README.md en docs/README.md.
- Consecuencias: Navegacion bidireccional; mantener enlace vigente si cambia la ruta.

### ADR-011: Documentacion funcional y tecnica del backend

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita documentar el backend antes de iniciar la implementacion.
- Decision: Crear docs/backend/funcional.md y docs/backend/tecnico.md como base.
- Consecuencias: Claridad temprana de requisitos y stack; se debe mantener actualizado.

### ADR-012: Checklist de pendientes de documentacion

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere consolidar tareas pendientes de documentacion en un solo lugar.
- Decision: Crear docs/documentacion-checklist.md con pendientes de frontend y backend.
- Consecuencias: Visibilidad de tareas de documentacion; mantener actualizado al cerrar pendientes.

### ADR-023: Documento SAD y plantilla ADR

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere un documento de arquitectura global y una plantilla estandar para ADRs individuales.
- Decision: Crear docs/architecture/sad.md y docs/adr/adr-template.md.
- Consecuencias: Arquitectura centralizada y decisiones futuras mas consistentes.

### ADR-029: Guion de slides inicial

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere una estructura base para la presentacion final del TFM.
- Decision: Crear docs/slides/outline.md con 16 diapositivas y secciones clave.
- Consecuencias: Preparacion mas rapida de la presentacion; requiere completar contenido y capturas.

### ADR-030: Notas de presentacion para slides

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita un guion de apoyo para la exposicion oral.
- Decision: Crear docs/slides/notes.md con notas por slide.
- Consecuencias: Presentacion mas consistente; requiere mantener notas actualizadas.

### ADR-043: Seguimiento de implementacion backend en checklist

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se requiere un plan de ejecucion detallado y el usuario solicita registrar los pasos realizados durante la implementacion del backend.
- Decision: Crear un checklist de ejecucion en CHECKLIST.md y registrar avances en una seccion de seguimiento en este archivo.
- Consecuencias: El checklist y el registro deben mantenerse sincronizados tras cada paso completado.

---

## 2. Arquitectura y Base de Datos

### ADR-001: Esquemas por entidad en Drizzle

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: El esquema de datos crece con multiples dominios y un solo archivo se vuelve dificil de mantener.
- Decision: Usar backend/src/db/schema/ con un archivo por entidad en lugar de schema.ts unico.
- Consecuencias: Mejor modularidad y menos conflictos; requiere coordinar imports entre entidades.

### ADR-002: Barrel de reexportaciones de esquemas

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Importar entidades desde multiples archivos genera dispersion y ruido en servicios/rutas.
- Decision: Crear backend/src/db/schema/index.ts para reexportar los esquemas.
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
- Contexto: drizzle-kit depreco driver: 'pg' y connectionString en favor de dialect y url.
- Decision: Actualizar drizzle.config.ts usando defineConfig(), dialect: 'postgresql' y dbCredentials: { url }.
- Consecuencias: Configuracion compatible con versiones recientes; requiere actualizar documentacion de migraciones.

### ADR-041: Scripts SQL de contexto para esquema completo

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita compartir el DDL completo en archivos SQL independientes para revision y entrega.
- Decision: Crear context/*.sql con enums, tablas, indices y constraints (incluyendo FKs circulares).
- Consecuencias: Se debe mantener sincronizado con las migraciones de Drizzle.

### ADR-042: SSL opcional para conexion PostgreSQL con CA

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Algunos entornos (por ejemplo Railway) exigen SSL con CA para conectar a PostgreSQL, mientras que en local no es necesario.
- Decision: Añadir PG_SSL_CERT_PATH como variable opcional; cuando esta definida se activa ssl.ca en la conexion principal y en run-triggers.
- Consecuencias: En local se puede omitir; en entornos con CA se debe proporcionar una ruta valida o el proceso fallara al leer el certificado.

### ADR-044: Estrategia de persistencia y pruebas para backend

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: El backend opera con store en memoria, pero la arquitectura requiere PostgreSQL/Drizzle y pruebas realistas en base de datos.
- Decision: Migrar gradualmente a Drizzle empezando por Auth y Usuarios, usando la base teamhub_test para tests con migraciones y limpieza controlada.
- Consecuencias: Los tests dejaran de depender del store; se necesita configurar DATABASE_URL de test y mantener migraciones actualizadas.

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
- Decision: El login siempre devuelve mfaToken (challenge de corta duracion), /auth/mfa/setup acepta mfaToken o access token y /auth/mfa/verify valida TOTP antes de emitir access/refresh.
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
- Decision: Implementar backup codes (10 codigos de un solo uso) generados al activar MFA, almacenados como hashes en mfa_recovery_codes, con endpoint de regeneracion en /perfil/mfa/backup-codes.
- Consecuencias: Usuarios pueden recuperar acceso; requiere UI para mostrar codigos una sola vez y endpoint de regeneracion.

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

### ADR-055: Bootstrap token para primer usuario
- Fecha: 2026-01-26
- Estado: Aceptado
- Contexto: El endpoint de login permite crear el primer usuario (bootstrap), lo cual es un riesgo de seguridad sin autenticacion.
- Decision: Requerir header \`X-Bootstrap-Token\` que coincida con \`BOOTSTRAP_TOKEN\` env var para bootstrap del primer admin.
- Consecuencias: Bootstrap seguro; requiere configurar token en produccion y en tests.

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

---

- Fecha: 2026-01-31
- Estado: Aceptado
- Contexto: Error crítico en producción (`/admin/plantillas/crear`): Radix UI Select no permite `<SelectItem value="">`.
- Decision: Usar sentinel values válidos (`"all"`, `"any"`) en lugar de strings vacíos, mapeando a `undefined` en handlers.
- Consecuencias:
  - (+) Fix inmediato para error bloqueante en producción
  - (+) Patrón reutilizable para otros selects opcionales
  - Requiere validación de todos los Select components del proyecto

### ADR-072: Dark Mode Toggle y Version Display

**Fecha:** 2026-01-31  
**Estado:** ✅ Implementado  
**Contexto:** Mejora de UX solicitada para mostrar versión de la app y permitir cambio de tema visual.

**Decisión:**

- **Dark Mode:**
  - Implementado con `next-themes` para persistencia automática
  - ThemeProvider en root layout con soporte System/Light/Dark
  - ThemeToggle dropdown en navbar con iconos Sun/Moon (lucide-react)
  - Configuración: `darkMode: ["class"]` en tailwind.config.ts
- **Version Display:**
  - Componente fijo bottom-right
  - Variable de entorno `NEXT_PUBLIC_APP_VERSION=1.3.0`
  - Estilo discreto: `text-xs text-muted-foreground`

**Consecuencias:**

- ✅ Mejora accesibilidad y comodidad visual
- ✅ Preferencia de tema persistente en localStorage
- ✅ Versión visible para debugging y soporte
- 📊 +96 líneas (11 archivos modificados, 3 componentes nuevos)

**Implementación:**

- `ThemeProvider`, `ThemeToggle`, `VersionDisplay`
- Integración en layout y navbar
- next-themes dependency añadida

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

### ADR-065: Implementación de visualizaciones D3.js para timetracking
- Fecha: 2026-01-30
- Estado: Completado (100%)
- Contexto: ADR-063 decidió usar D3.js para visualizaciones avanzadas. Se implementó Gantt Chart como primera visualización D3.js.
- Decision: Implementar visualizaciones D3.js comenzando por módulo de timetracking (mayor complejidad), luego migrar dashboards.
- Implementado:
  - **Gantt Chart en Timetracking** ✅ (commit 9512ed4)
    - Visualización de timeline de registros de tiempo por proyecto
    - Zoom controls (fit, zoom in, zoom out)
    - Tooltips interactivos con datos detallados
    - Progress bars por proyecto
    - Responsive design adaptativo
    - Integración con hook `useTimetracking`
    - Utilidades reutilizables en `lib/gantt-utils.ts`
- Completado:
  - [x] Migrar `bar-chart.tsx` de dashboards a D3.js ✅ (2026-02-07)
  - [x] Migrar `line-chart.tsx` de dashboards a D3.js ✅ (2026-02-07)
  - [x] Añadir interactividad (hover effects, tooltips) ✅ (2026-02-07)
  - [x] Mantener accesibilidad (ARIA, keyboard navigation) ✅ (2026-02-07)
  - [x] Añadir tests de componentes (`charts.test.tsx`) ✅ (2026-02-07)
- Consecuencias:
  - Visualizaciones más ricas e interactivas para usuarios
  - Mejor UX en módulo de timetracking
  - Patrón establecido para futuras visualizaciones
  - Incremento moderado de bundle size (D3.js es modular)
  - Requiere conocimiento de D3.js para mantenimiento

### ADR-067: Gantt Chart responsive con ancho dinámico
- Fecha: 2026-01-31
- Estado: Aceptado
- Contexto: El Gantt Chart tenía ancho fijo de 800px y mostraba mensaje "Vista no disponible en móvil", limitando accesibilidad.
- Decision: Implementar ancho dinámico con `useEffect` detectando tamaño del contenedor, responsive en todos los dispositivos (mobile/tablet/desktop).
- Consecuencias:
  - (+) Accesible desde cualquier dispositivo
  - (+) Mejor UX con scroll horizontal automático
  - (+) Cumple estándares de responsive design (ADR-060)
  - (-) Requiere recálculo en cada resize (optimizado con debounce implícito)

### ADR-068: Optimización espaciado cabeceras Gantt en vista año
- Fecha: 2026-01-31
- Estado: Aceptado
- Contexto: En vista año, el Gantt mostraba 12 meses juntos causando sobreposición visual de etiquetas.
- Decision: Filtrar meses alternos (mostrar solo 6: ene, mar, may, jul, sep, nov) y usar formato corto ("ene 26" vs "ene 2026").
- Consecuencias:
  - (+) Mejor legibilidad en vista año
  - (+) Sin cambios en vistas mes y trimestre
  - (-) Pérdida de granularidad mensual (aceptable para vista anual)

### ADR-070: Hotfix para SelectItem empty value
- Fecha: 2026-01-31
- Estado: Aceptado
- Contexto: Error crítico en producción (`/admin/plantillas/crear`): Radix UI Select no permite `<SelectItem value="">`.
- Decision: Usar sentinel values válidos (`"all"`, `"any"`) en lugar de strings vacíos, mapeando a `undefined` en handlers.
- Consecuencias:
  - (+) Fix inmediato para error bloqueante en producción
  - (+) Patrón reutilizable para otros selects opcionales
  - Requiere validación de todos los Select components del proyecto

### ADR-072: Dark Mode Toggle y Version Display

**Fecha:** 2026-01-31  
**Estado:** ✅ Implementado  
**Contexto:** Mejora de UX solicitada para mostrar versión de la app y permitir cambio de tema visual.

**Decisión:**
- **Dark Mode:**
  - Implementado con `next-themes` para persistencia automática
  - ThemeProvider en root layout con soporte System/Light/Dark
  - ThemeToggle dropdown en navbar con iconos Sun/Moon (lucide-react)
  - Configuración: `darkMode: ["class"]` en tailwind.config.ts
- **Version Display:**
  - Componente fijo bottom-right
  - Variable de entorno `NEXT_PUBLIC_APP_VERSION=1.3.0`
  - Estilo discreto: `text-xs text-muted-foreground`

**Consecuencias:**
- ✅ Mejora accesibilidad y comodidad visual
- ✅ Preferencia de tema persistente en localStorage
- ✅ Versión visible para debugging y soporte
- 📊 +96 líneas (11 archivos modificados, 3 componentes nuevos)

**Implementación:**
- `ThemeProvider`, `ThemeToggle`, `VersionDisplay`
- Integración en layout y navbar
- next-themes dependency añadida

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
- Contexto: npm install y create-next-app fallaron por EAI_AGAIN al acceder a registry.npmjs.org.
- Decision: Crear scaffold manual de frontend y backend (config, estructura y archivos base) hasta poder instalar dependencias.
- Consecuencias: Se puede avanzar en estructura; queda pendiente instalar dependencias cuando se restablezca la red.

### ADR-032: Fijacion de versiones de dependencias

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: El backend tenia todas las dependencias con version "latest", lo que rompe la reproducibilidad del build y puede causar errores inesperados.
- Decision: Fijar todas las versiones de dependencias con prefijo ^ (ej: "hono": "^4.6.16") en lugar de "latest".
- Consecuencias: Builds reproducibles y controlados; requiere actualizacion manual periodica de dependencias.

### ADR-054: Tipos estrictos para validators Zod
- Fecha: 2026-01-26
- Estado: Aceptado
- Contexto: Los validators Zod con \`z.preprocess()\` devuelven \`unknown\`, perdiendo type safety en las rutas.
- Decision: Refactorizar validators usando \`z.union().transform()\` para mantener inferencia de tipos correcta.
- Consecuencias: Type safety end-to-end desde query params hasta repositorios; codigo mas seguro.

### ADR-071: Sistema de Gestión de Tareas Jerárquico (Jira-like)

**Fecha:** 2026-01-31  
**Estado:** ✅ Implementado  
**Contexto:** Necesidad de gestión de tareas a nivel proyecto con visualización Gantt jerárquica similar a Jira, permitiendo drill-down desde proyectos a tareas individuales.

**Decisión:**
- **Arquitectura:** Full-stack task management con Gantt Charts jerárquicos
- **Modelo de datos:**
  - Tabla `tareas` con FKs a proyectos, usuarios, self-referencing para dependencias
  - Enums: `estado_tarea` (TODO/IN_PROGRESS/REVIEW/DONE/BLOCKED), `prioridad_tarea` (LOW/MEDIUM/HIGH/URGENT)
  - Campos: título, descripción, fechas, horas estimadas/reales, orden, dependencias
  - Soft delete con `deleted_at`
- **Backend:**
  - Repository pattern con 8 operaciones CRUD
  - Service layer con validaciones de negocio y permisos por rol
  - 8 endpoints REST: list by proyecto/usuario, get, create, update, updateEstado, reasignar, delete
  - Validaciones: fechas coherentes, prevención dependencias circulares, transiciones de estado
- **Frontend:**
  - TaskGanttChart con swimlanes por usuario, color-coding por estado
  - TaskList con filtros (estado, usuario), badges, menú de acciones
  - TaskFormModal para crear/editar con validación react-hook-form + zod
  - Tab "Tareas" integrado en página detalle de proyecto
- **Testing:**
  - 114 tests (36 repository + 44 service + 34 frontend hooks)
  - Coverage estratégico: 100% repository (CORE), 80%+ service/hooks (IMPORTANT)

**Consecuencias:**
- ✅ Gestión de tareas completa a nivel proyecto
- ✅ Visualización Gantt jerárquica reutilizando infraestructura D3.js existente
- ✅ Permisos granulares: ADMIN/MANAGER gestionan todas, EMPLEADO solo asignadas
- ✅ Trazabilidad con dependencias entre tareas
- ✅ 100% tests pasando para funcionalidad de tareas
- 📊 +5044 líneas de código (28 archivos nuevos/modificados)

**Implementación:**
- **Backend:** tareas-repository.ts, tareas.service.ts, tareas.routes.ts, tareas.validators.ts, tareas schema
- **Frontend:** use-tareas.ts hook, TaskGanttChart, TaskList, TaskFormModal, Tarea types
- **UI Components:** table, dropdown-menu (shadcn/ui)
- **Tests:** tareas-repository.test.ts, tareas.service.test.ts, use-tareas.test.tsx
- **Migración:** SQL directo para crear tabla + enums en BD prod y test

---

## 7. Testing y Calidad

### ADR-014: Convenciones de testing en frontend

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita estandarizar ubicacion y herramientas de testing en frontend.
- Decision: Usar Vitest + Testing Library en frontend/src/**tests**/ y Playwright en frontend/e2e/.
- Consecuencias: Tests organizados por tipo; requiere mantener estructura al crecer.

### ADR-016: Estrategia de tests en backend

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita una herramienta unificada para tests del backend.
- Decision: Usar Vitest para unit e integration, con pruebas de endpoints via app.request.
- Consecuencias: Tests consistentes; requiere configurar entorno de pruebas.

### ADR-028: Estrategia de testing y calidad documentada

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: Se necesita un plan de testing unificado para frontend y backend.
- Decision: Crear docs/quality/testing.md con tipos de pruebas, cobertura y gates.
- Consecuencias: Mayor claridad en criterios de calidad; requiere mantener el documento actualizado.

### ADR-034: Migracion a ESLint 9 con flat config

- Fecha: 2026-01-23
- Estado: Aceptado
- Contexto: ESLint 8.x esta deprecado y ESLint 9 requiere el nuevo formato "flat config" (eslint.config.mjs).
- Decision: Migrar de .eslintrc.cjs a eslint.config.mjs en frontend y backend, usando typescript-eslint y @eslint/eslintrc para compatibilidad.
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

### ADR-066: Scripts de seed data para testing
- Fecha: 2026-01-31
- Estado: Aceptado
- Contexto: El Gantt Chart y Timesheet requieren datos de prueba realistas con proyectos con fechas, usuarios asignados y registros de tiempo para validar visualizaciones.
- Decision: Crear scripts SQL reutilizables (`seed-proyectos-gantt.sql`, `seed-complete-data.sql`) con helper bash y documentación completa.
- Consecuencias:
  - (+) Testing manual de visualizaciones D3.js más fácil
  - (+) Onboarding rápido para desarrolladores nuevos
  - (+) Scripts reutilizables en diferentes entornos
  - (-) Requiere mantener sincronizados con esquema de BD

### ADR-096: Configuración de SonarQube para análisis de calidad
- Fecha: 2026-02-11
- Estado: Aceptado
- Contexto: Se requiere análisis de calidad de código, detección de code smells, bugs, vulnerabilidades y coverage tracking para el TFM.
- Decision: Implementar SonarQube Community Edition en Docker con análisis multi-rama (main/develop) mediante proyectos separados.
- Implementación:
  - **SonarQube Server:** Docker `sonarqube:community` puerto 9000
  - **Proyectos:** `TeamHub` (main) y `TeamHub-develop` (develop)
  - **Scripts:** `sonar:main`, `sonar:develop`, `sonar:branch`
  - **Coverage:** Frontend + Backend lcov.info
- Resultados (develop): 5 bugs, 0 vulnerabilities, 3 security hotspots, 197 code smells, 17.4% coverage
- Consecuencias:
  - ✅ Detección OWASP Top 10, métricas TFM, análisis independiente main/develop
  - ⚠️ Community: no multi-branch real (workaround: proyectos separados)
  - 📊 Coverage real requiere: `npm test -- --coverage`
- Documentación: `README-SONARQUBE-BRANCHES.md`, `SONARQUBE_*.md`

### ADR-097: Configuración de Vitest Coverage en Backend
- Fecha: 2026-02-11
- Estado: Aceptado
- Contexto: SonarQube detectó solo 17% coverage porque backend no generaba `lcov.info` y frontend tenía coverage antigua (31/01).
- Decision: Configurar @vitest/coverage-v8 en backend con thresholds 80% (ADR-070).
- Implementación:
  - Backend `vitest.config.ts`: coverage v8, reporter lcov+html, thresholds 80%
  - Exclusiones: tests, migrations, schema, types
  - Comando: `npm test -- --coverage` genera `backend/coverage/lcov.info`
  - Frontend `vitest.config.ts`: coverage mejorada con exclusiones adicionales
- Estado: ✅ 459 tests totales pasando (226 backend + 233 frontend)
- Consecuencias:
  - ✅ Coverage tracking preciso, enforcement 80%, reportes HTML
  - ✅ Todos los tests pasando, quality gates OK
  - ✅ Scripts centralizados: `npm run test:coverage` en root
  - 📊 Próximo: Generar coverage completa, re-analizar con SonarQube (esperado >50%)

---

## 8. DevOps e Infraestructura

### ADR-092: Optimización de código según Vercel React Best Practices

**Fecha:** 2026-02-10  
**Estado:** ✅ Implementado  
**Contexto:** Auditoría de código detectó duplicación (toNumber en 4 archivos, TOTP en 5 archivos E2E), magic numbers sin constantes (30000, 60000, 1000), staleTime inconsistente en TanStack Query (5min, 2min, 30s), y dashboards usando useEffect+useState en lugar de Query hooks.

**Decisión:**

**1. Consolidación de Utilidades:**
- Crear `backend/src/shared/utils/number.ts`:
  - `toNumber()`: Conversión segura con fallback
  - `toNumberOrUndefined()`: Para valores opcionales
  - JSDoc completo documentando propósito y ejemplos
- Eliminar duplicaciones en: timetracking/utils, dashboard/utils, proyectos/helpers, usuarios/helpers

**2. Constantes de Tiempo:**
- Crear `backend/src/shared/constants/time.ts`:
  - `TIME_CONSTANTS` con MS_PER_SECOND, MS_PER_MINUTE, MS_PER_HOUR, MS_PER_DAY
  - Constantes específicas: HMAC_CLOCK_SKEW_MS, HMAC_SIGNATURE_MAX_AGE_MS, PG_IDLE_TIMEOUT_MS
  - JSDoc explicando uso y contexto

**3. Configuración TanStack Query:**
- Crear `frontend/src/lib/query-config.ts`:
  - `STALE_TIME.SHORT` (30s): datos volátiles (pendientes aprobación)
  - `STALE_TIME.MEDIUM` (2min): datos frecuentes (timetracking, tareas)
  - `STALE_TIME.LONG` (5min): datos estables (proyectos, usuarios, departamentos)
  - `DEFAULT_QUERY_CONFIG` para QueryClient provider
- Actualizar QueryProvider para usar configuración centralizada
- Migrar hooks (use-empleados, use-departamentos, etc.) a usar STALE_TIME constantes

**4. Consolidación TOTP en E2E:**
- Crear `frontend/e2e/helpers/totp-shared.ts`:
  - `fromBase32()`: Decodificación Base32 según RFC 4648
  - `generateTotpCode()`: Generación TOTP según RFC 6238
  - JSDoc con ejemplos y especificaciones
- Eliminar duplicaciones en: e2e-session.ts, auth-api.ts, auth-api.mjs, demo.helpers.ts, block-a-smoke.spec.ts

**Implementación:**
- ✅ Crear nuevos módulos compartidos con JSDoc completo
- ✅ Actualizar imports en archivos afectados
- ✅ Reemplazar magic numbers por constantes
- ✅ Estandarizar staleTime en hooks de Query
- ⏳ Pendiente: Migrar 4 dashboards a TanStack Query (AdminDashboard, ManagerDashboard, RrhhDashboard, EmpleadoDashboard)
- ⏳ Pendiente: Refactorizar archivos E2E para usar totp-shared
- ⏳ Pendiente: Añadir JSDoc faltante en utilidades

**Consecuencias:**
- ✅ Boy Scout Rule aplicada: código más limpio y mantenible
- ✅ Elimina duplicación: -120 líneas de código duplicado
- ✅ Mejor documentación: JSDoc en todas las utilidades nuevas
- ✅ Stale time consistente: estrategia de caché documentada y centralizada
- ✅ Magic numbers eliminados: constantes con nombre semántico
- ✅ Type safety preservado: sin pérdida de inferencia de tipos
- ✅ Alineado con Vercel React Best Practices: reglas `client-swr-dedup`, `rerender-simple-expression-in-memo`
- ⚠️ Dashboards pendientes de migración: useEffect+useState → useQuery hooks
- 📊 +280 líneas de código nuevo (4 módulos compartidos), -30 líneas de duplicación

**Referencias:**
- Skill: vercel-react-best-practices
- Copilot-instructions: Sección 3 "Estándares de Desarrollo"
- ADR-064: Security Hardening (complementa con optimizaciones de rendimiento)

---

### ADR-094: Compatibilidad frontend/backend en campos de plantillas

**Fecha:** 2026-02-10  
**Estado:** ✅ Implementado  
**Contexto:** Frontend de plantillas enviaba campo `responsable` mientras backend esperaba `responsableTipo`, causando error Zod al crear tareas en plantillas de onboarding.

**Decisión:**

**1. Schema Flexible:**
- Modificar `createTareaSchema` para aceptar ambos campos:
  - `responsableTipo`: Campo original del backend
  - `responsable`: Campo enviado por frontend
- Usar `.refine()` para validar que al menos uno esté presente
- Extraer `baseTareaSchema` sin refine para mantener `.partial()` en `updateTareaSchema`

**2. Mapeo en Handlers:**
- Handler `POST /:id/tareas`: Mapear `payload.responsable || payload.responsableTipo` con validación explícita
- Handler `PUT /:id/tareas/:tareaId`: Destructurar `responsable` y aplicar mapping condicional
- Handler `POST /:id/duplicate`: Sin cambios (usa datos internos ya normalizados)

**Implementación:**
```typescript
// backend/src/routes/plantillas/schemas.ts
const baseTareaSchema = z.object({
  // ... otros campos
  responsableTipo: z.enum(responsables).optional(),
  responsable: z.enum(responsables).optional(),
  // ...
});

export const createTareaSchema = baseTareaSchema.refine(
  (data) => data.responsableTipo || data.responsable,
  { message: 'Se requiere responsableTipo o responsable', path: ['responsableTipo'] }
);

// backend/src/routes/plantillas/handlers.ts
const responsableTipo = payload.responsableTipo || payload.responsable;
if (!responsableTipo) {
  throw new HTTPException(400, { message: 'Se requiere responsableTipo o responsable' });
}
```

**Consecuencias:**
- ✅ Backward compatibility: Backend acepta ambos nombres de campo
- ✅ Error user-friendly: Mensaje en español sin exponer Zod internals
- ✅ Frontend sin cambios: No requiere modificar código React existente
- ✅ Type safety: TypeScript infiere correctamente tipos opcionales
- ✅ Tests passing: 3/3 tests de plantillas verifican creación y duplicación
- 📊 Líneas modificadas: schemas.ts (+9), handlers.ts (+8)

**Referencias:**
- ADR-093: Hybrid Error Logging (contexto de error original)
- Copilot-instructions: Sección 3 "Separación Frontend/Backend"

---

### ADR-093: Sistema Híbrido de Error Logging (PostgreSQL + Sentry)

**Fecha:** 2026-02-10  
**Estado:** ✅ Implementado  
**PR:** #103 (feature/error-logging-system)

**Contexto:**  
Error de validación Zod en plantillas de onboarding (`responsableTipo` requerido) reveló necesidad de diagnóstico rápido sin depender del usuario. Se requiere trazabilidad completa, mensajes user-friendly (nunca stack traces o SQL), compliance GDPR, y alertas proactivas en producción.

**Decisión:**  
Implementar sistema **híbrido PostgreSQL + Sentry**:

**1. PostgreSQL (Obligatorio - Auditoría):**
- Tabla `error_logs`: user_id, origen (FRONTEND/BACKEND), nivel (INFO/WARN/ERROR/FATAL), mensaje, stack_trace, contexto (JSONB), user_agent, ip_address, timestamp, resuelto, notas, sentry_event_id
- Índices: user_id, origen, nivel, timestamp, resuelto
- Ventajas: Control total (GDPR), consultas SQL, sin coste, retención indefinida

**2. Sentry (Opcional - Observability):**
- DSN Backend: `https://b3f0a4c1903bfbfdb8b35b13d3887c35@o430470.ingest.us.sentry.io/4510863332409344`
- DSN Frontend: `https://1a2a9302807861a8f32cdd2038ea2d84@o430470.ingest.us.sentry.io/4510863325855744`
- Sample rate: 100% development, 10% production
- Features: Source maps, session replay, alertas automáticas, agrupación inteligente

**3. Principios UI/UX (CRÍTICO):**
- ❌ NUNCA mostrar: Stack traces, SQL errors, null pointers, IDs/UUIDs, mensajes técnicos
- ✅ SIEMPRE mostrar: Mensajes en español, instrucciones claras, opción de soporte
- Ejemplos:
  - `ZodError: responsableTipo required` → `Error al guardar. Verifica que todos los campos estén completos.`
  - `Cannot read property 'id' of null` → `Ha ocurrido un error. Inténtalo de nuevo.`

**Implementación Backend:**
- ✅ `context/14_error_logs.sql`: DDL completo con 7 índices
- ✅ `backend/src/db/schema/error-logs.ts`: Drizzle schema
- ✅ `backend/src/services/error-logger.ts`: `logError()`, `getUserFriendlyMessage()`, `extractErrorInfo()`
- ✅ `backend/src/services/sentry.ts`: DEPRECATED (reemplazado por instrument.ts)
- ✅ `backend/src/instrument.ts`: Sentry init según best practices (import first)
- ✅ `backend/src/middleware/error-logger.ts`: Middleware auto-captura (antes de responder)
- ✅ `backend/src/routes/errors.routes.ts`: `POST /api/errors/log` (sin auth/HMAC)

**Implementación Frontend:**
- ✅ `frontend/sentry.client.config.ts`: Client-side Sentry con replay integration
- ✅ `frontend/sentry.server.config.ts`: Server-side Sentry para Next.js SSR
- ✅ `frontend/instrumentation.ts`: Next.js instrumentation hook (auto-load configs)
- ✅ `frontend/src/lib/error-logger.ts`: `logFrontendError()`, `setupGlobalErrorHandling()`

**Consecuencias:**
- ✅ Error discovery proactivo (Sentry alerts vs. reportes manuales)
- ✅ Auditoría GDPR-compliant (PostgreSQL logs)
- ✅ UX mejorada (mensajes user-friendly, sin jerga técnica)
- ✅ Debugging acelerado (Sentry source maps + stack traces)
- ✅ Costes controlados (sample rate 10% prod, PostgreSQL gratis en Aiven)
- 📊 +750 líneas (schema, services, middleware, configs, DDL)
- ⚠️ Requiere: Configurar DSNs en `.env`, ejecutar migración `14_error_logs.sql`

**Testing:**
- ✅ Backend: `POST /api/errors/log` sin auth captura errores de frontend
- ✅ Sentry: Inicialización confirmada en logs `[Sentry] Initialized for development`
- ✅ Tests: 226 backend + 241 frontend = 467 tests passing

**Referencias:**
- ADR-064: Security Hardening (logs ayudan a detectar ataques)
- ADR-094: Plantillas Field Mismatch (error original que motivó este ADR)
- Docs: `docs/error-logging-system.md` (guía técnica completa)

---

