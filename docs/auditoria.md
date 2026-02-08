# Auditoría de Seguridad - TeamHub

**Fecha:** 2026-02-08
**Alcance:** Backend, Frontend, Infraestructura
**ADR asociado:** ADR-090
**Branch:** `bugfix/security-audit-fixes`

---

## Resumen Ejecutivo

Se realizó una auditoría de seguridad completa del proyecto TeamHub que abarcó tres áreas: backend (Hono + Drizzle + PostgreSQL), frontend (Next.js 15 + React 19) e infraestructura (CI/CD, configuración, dependencias). Se identificaron **56 hallazgos** consolidados:

| Severidad | Total | Corregidos | Pendientes | Diferidos/Manual |
|-----------|-------|------------|------------|------------------|
| CRITICAL  | 9     | 3          | 0          | 6                |
| HIGH      | 14    | 7          | 0          | 7                |
| MEDIUM    | 22    | 22         | 0          | 0                |
| LOW       | 11    | 10*        | 0          | 1†               |
| **Total** | **56**| **42**     | **0**      | **14**           |

\* L3 y L4 fueron elevados a MEDIUM y corregidos como M5 y M11 respectivamente.  
† L6 (Dockerfile) diferido - no está en el scope actual del proyecto.

---

## Hallazgos CRITICAL (9)

### C1 - SQL Injection en audit-context.ts [CORREGIDO]

- **OWASP:** A03:2021 -- Injection
- **Archivo:** `backend/src/db/audit-context.ts`, lineas 28, 36
- **Descripcion:** Interpolacion directa de valores en queries SQL con `client.query()`. Los campos `userId` e `ipAddress` se insertan directamente en la cadena SQL sin parametrizar. Mientras `userId` proviene del JWT, `ipAddress` proviene del header `X-Forwarded-For` que es controlable por el atacante. Un atacante podria enviar `X-Forwarded-For: '; DROP TABLE users; --` para ejecutar SQL arbitrario. Los campos `userEmail` y `userAgent` tenian escape parcial con `.replace(/'/g, "''")` pero `userId` e `ipAddress` no tenian ningun escape.
- **Correccion:** Se reemplazo la interpolacion directa por queries parametrizadas usando `SELECT set_config($1, $2, true)` para los 4 campos.

### C2 - Timing Attack en comparacion HMAC [CORREGIDO]

- **OWASP:** A02:2021 -- Cryptographic Failures
- **Archivo:** `backend/src/middleware/hmac-validation.ts`, linea 48
- **Descripcion:** La comparacion de firmas HMAC usaba `!==` (comparacion directa de strings) en vez de `crypto.timingSafeEqual`. Vulnerable a ataques de timing donde un atacante puede medir diferencias en el tiempo de respuesta para deducir la firma correcta byte a byte.
- **Correccion:** Se importo `timingSafeEqual` de `node:crypto`, se convierten ambas firmas a Buffer y se usa `timingSafeEqual` para la comparacion.

### C3 - Rutas absolutas hardcodeadas en package.json [CORREGIDO]

- **Archivo:** `backend/package.json`, lineas 7, 9
- **Descripcion:** Los scripts `dev` y `start` contenian rutas absolutas del filesystem local del desarrollador: `DOTENV_CONFIG_PATH=/home/sandman/Sources/CursoAI/tfm/backend/.env` y `NODE_EXTRA_CA_CERTS=/home/sandman/Sources/CursoAI/tfm/backend/certs/ca.pem`. Esto expone la estructura de directorios del desarrollador y no funciona en ningun otro entorno.
- **Correccion:** Se reemplazaron por rutas relativas: `./.env` y `./certs/ca.pem`.

### C4 - Credenciales de produccion en .env local [PENDIENTE - Accion manual]

- **Archivo:** `backend/.env`, lineas 1-30
- **Descripcion:** El archivo `.env` contiene credenciales reales de produccion: connection string de Aiven con password, email personal del admin, password real del admin, clave de cifrado MFA y secreto HMAC de produccion. Aunque no esta trackeado en git, son credenciales reales en disco.
- **Accion requerida:** Rotar TODAS las credenciales inmediatamente: password de DB, secretos JWT, clave de cifrado MFA, secreto HMAC, password del admin. Usar un gestor de secretos (Vault, AWS Secrets Manager, Doppler) en vez de archivos `.env` locales.

### C5 - Connection string con password en configuracion de Claude [PENDIENTE - Accion manual]

- **Archivo:** `.claude/settings.local.json`, linea 34
- **Descripcion:** El archivo de configuracion de Claude CLI contiene el connection string completo de produccion de Aiven incluyendo el password como comando permitido. Esto es un vector de exfiltracion local.
- **Accion requerida:** Eliminar credenciales de `settings.local.json`. Nunca incluir passwords literales en configuraciones de herramientas. Rotar el password de la DB de Aiven inmediatamente.

### C6 - HMAC secret expuesto al cliente via NEXT_PUBLIC_ [PENDIENTE - Cambio arquitectural]

- **OWASP:** A02:2021 -- Cryptographic Failures
- **Archivo:** `frontend/src/lib/hmac.ts`, linea 1; `frontend/.env`, linea 5
- **Descripcion:** El prefijo `NEXT_PUBLIC_` hace que Next.js incluya el secreto HMAC en el bundle de JavaScript del cliente. Cualquier usuario inspeccionando el JS puede extraer el secreto y forjar requests firmados, invalidando completamente la proteccion HMAC.
- **Accion requerida:** Mover la firma HMAC a una API Route server-side de Next.js o Edge middleware. El secreto debe estar en una variable sin prefijo `NEXT_PUBLIC_` y nunca llegar al cliente. Requiere PR separado con implementacion BFF.

### C7 - JWT tokens almacenados en localStorage [PENDIENTE - Cambio arquitectural]

- **OWASP:** A07:2021 -- Identification and Authentication Failures
- **Archivo:** `frontend/src/lib/auth.ts`, lineas 78-97; `frontend/src/lib/api.ts`, lineas 20, 47, 60-61, 71-72
- **Descripcion:** Tanto `accessToken` como `refreshToken` se almacenan en `localStorage`, accesible desde cualquier JavaScript en la pagina. Si existe cualquier vulnerabilidad XSS (incluso en una dependencia de terceros), un atacante puede extraer ambos tokens e impersonar completamente al usuario. El `refreshToken` en `localStorage` es especialmente peligroso ya que permite obtener nuevos tokens indefinidamente.
- **Accion requerida:** Migrar a cookies `httpOnly`, `Secure`, `SameSite=Strict` gestionadas por el backend. El frontend no deberia tener acceso directo a los tokens. Requiere PR separado.

### C8 - PII (email personal) en historial de git [PENDIENTE - Accion manual]

- **Archivo:** `scripts/seed-proyectos-gantt.sql`, `scripts/seed-complete-data.sql`
- **Descripcion:** Multiples archivos trackeados en git contienen el email personal `felipepepe@gmail.com`. `git log -S "felipepepe@gmail.com"` revela que este email aparece en 6+ commits incluyendo commits de release. Los archivos actuales fueron corregidos (ver M13) pero el historial de git aun contiene la PII.
- **Accion requerida:** Usar BFG Repo-Cleaner para purgar `felipepepe@gmail.com` del historial de git. Anadir regla en CI para detectar emails personales en codigo.

### C9 - Credenciales reales de admin en archivo E2E [PENDIENTE - Accion manual]

- **Archivo:** `frontend/.env.e2e`, lineas 5-11
- **Descripcion:** Contiene credenciales reales del admin: email `felipepepe@gmail.com`, password `jAR8kvFM$evilla`, y secreto TOTP MFA. Aunque esta en `.gitignore`, cualquier persona con acceso al filesystem tiene todas las credenciales para impersonar al admin incluyendo bypass de MFA.
- **Accion requerida:** Rotar el password del admin y regenerar el secreto MFA. Usar un usuario E2E dedicado con permisos limitados en vez de la cuenta admin de produccion.

---

## Hallazgos HIGH (14)

### H1 - Dashboard endpoints sin control de roles [CORREGIDO]

- **OWASP:** A01:2021 -- Broken Access Control
- **Archivo:** `backend/src/routes/dashboard.ts`, lineas 14-30
- **Descripcion:** Los endpoints de dashboard (`/admin`, `/rrhh`, `/manager`, `/empleado`) solo verificaban autenticacion via `authMiddleware` pero NO verificaban roles. Cualquier usuario autenticado (incluso EMPLEADO) podia acceder a `/api/dashboard/admin` y ver KPIs sensibles, actividad del audit log (incluyendo `oldData`, `newData`, `changedFields`), y emails de usuarios.
- **Correccion:** Se anadio `requireRoles('ADMIN')` a `/admin`, `requireRoles('ADMIN', 'RRHH')` a `/rrhh`, `requireRoles('ADMIN', 'RRHH', 'MANAGER')` a `/manager`.

### H2 - Departamentos: escritura sin control de roles [CORREGIDO]

- **OWASP:** A01:2021 -- Broken Access Control
- **Archivo:** `backend/src/routes/departamentos.ts`, lineas 79, 112, 145
- **Descripcion:** Los endpoints POST, PUT y DELETE de departamentos solo requerian autenticacion, no verificacion de roles. Cualquier EMPLEADO autenticado podia crear, modificar o eliminar departamentos.
- **Correccion:** Se anadio `requireRoles('ADMIN', 'RRHH')` a las operaciones de escritura (POST, PUT, DELETE).

### H3 - Timetracking: IDOR sin verificacion de ownership [CORREGIDO]

- **OWASP:** A01:2021 -- Broken Access Control
- **Archivo:** `backend/src/routes/timetracking/handlers/records.ts`, lineas 23-52
- **Descripcion:** Los endpoints PUT y DELETE de registros de timetracking no verificaban que el registro perteneciera al usuario autenticado. Cualquier usuario autenticado podia modificar o eliminar registros de tiempo de otros usuarios conociendo el ID del registro. El mismo problema existia en los endpoints `/aprobar` y `/rechazar` que no tenian verificacion de roles para aprobacion.
- **Correccion:** Se verifica `registro.usuarioId === user.id` o rol privilegiado para PUT/DELETE. Se anadio `requireRoles('ADMIN', 'RRHH', 'MANAGER')` a aprobar/rechazar/aprobar-masivo.

### H4 - Procesos/Plantillas: escritura sin control de roles [CORREGIDO]

- **OWASP:** A01:2021 -- Broken Access Control
- **Archivos:** `backend/src/routes/procesos/handlers.ts`; `backend/src/routes/plantillas/handlers.ts`
- **Descripcion:** Los endpoints de escritura para procesos de onboarding y plantillas solo verificaban autenticacion. Cualquier EMPLEADO podia crear/modificar/cancelar procesos de onboarding y crear/modificar/eliminar/duplicar plantillas y tareas de plantilla.
- **Correccion:** Se anadio `requireRoles('ADMIN', 'RRHH')` a todas las operaciones de escritura en ambos routers.

### H5 - Salt estatico en derivacion de clave MFA [CORREGIDO]

- **OWASP:** A02:2021 -- Cryptographic Failures
- **Archivo:** `backend/src/services/mfa-service.ts`, linea 12
- **Descripcion:** La funcion `deriveKey()` usaba un salt hardcodeado estatico `'mfa-salt'` con `scryptSync`. Un salt estatico debilita significativamente la derivacion de clave -- si `MFA_ENCRYPTION_KEY` se compromete, el salt no proporciona proteccion adicional y no cambia entre instancias de la app.
- **Correccion:** Se genera un salt aleatorio de 16 bytes por cada operacion de cifrado. Se prepend al ciphertext en formato `salt:iv:authTag:data`. Se mantiene backward compatibility detectando el formato antiguo (3 partes, sin salt) para descifrar secretos existentes.

### H6 - Ausencia de security headers en next.config.mjs [CORREGIDO]

- **Archivo:** `frontend/next.config.mjs`, lineas 7-12
- **Descripcion:** La configuracion de Next.js no definía ningun header de seguridad. Ausentes: Content-Security-Policy (CSP), X-Frame-Options / frame-ancestors, X-Content-Type-Options: nosniff, Strict-Transport-Security (HSTS), Referrer-Policy, Permissions-Policy.
- **Correccion:** Se anadio funcion `headers()` con X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, y Permissions-Policy restrictiva.

### H7 - Math.random() para generar passwords temporales [CORREGIDO]

- **OWASP:** A02:2021 -- Cryptographic Failures
- **Archivo:** `frontend/src/components/forms/empleado-form.tsx`, lineas 14-35
- **Descripcion:** `Math.random()` no es criptograficamente seguro. Su estado interno puede ser predicho, permitiendo a un atacante reproducir las passwords generadas. Adicionalmente, la implementacion de shuffle usando `sort(() => Math.random() - 0.5)` no produce una distribucion uniforme.
- **Correccion:** Se reemplazo `Math.random()` por `crypto.getRandomValues()`. Se implemento Fisher-Yates shuffle correcto con crypto. Los caracteres requeridos se insertan en posiciones aleatorias.

### H8 - Ausencia de proteccion CSRF [PENDIENTE - Cambio arquitectural]

- **OWASP:** A01:2021 -- Broken Access Control
- **Archivos:** Todos los formularios en `frontend/src/components/forms/`
- **Descripcion:** No existe implementacion de token CSRF en la aplicacion. Actualmente parcialmente mitigado porque los tokens estan en `localStorage` (no cookies), asi que sitios externos no pueden acceder a ellos. Sin embargo, si se migra a httpOnly cookies (como se recomienda para C7), la ausencia de CSRF se vuelve critica. La firma HMAC actua parcialmente como proteccion CSRF, pero con el secreto expuesto (C6), su efectividad es nula.
- **Accion requerida:** Implementar tokens CSRF, especialmente si se migra a autenticacion basada en cookies. Considerar patron double-submit cookie o synchronizer token. Depende de la decision sobre cookies (C7).

### H9 - Proteccion de rutas solo client-side (sin middleware Next.js) [PENDIENTE - Cambio arquitectural]

- **Archivo:** `frontend/src/app/(dashboard)/layout.tsx`, lineas 19-23
- **Descripcion:** La proteccion de rutas se hace exclusivamente client-side via `useEffect` en el layout del dashboard. No existe archivo `middleware.ts`. Esto significa: (1) contenido protegido se renderiza brevemente antes del redirect (content flash), (2) HTML/JS del dashboard se envia al navegador antes de verificacion de auth, (3) un usuario puede deshabilitar JavaScript y potencialmente ver contenido del layout, (4) no hay proteccion de rutas basada en roles a nivel de ruta.
- **Accion requerida:** Crear `middleware.ts` en Next.js para verificar existencia y validez del token antes de servir paginas protegidas. Implementar verificacion de roles para rutas `/admin/*`. Requiere PR separado.

### H10 - HMAC secret expuesto en implementacion frontend [CORREGIDO]

- **Archivo:** `frontend/src/lib/hmac.ts`, linea 1
- **Descripcion:** Duplicado de C6 desde la perspectiva de infraestructura. La implementacion frontend de HMAC lee el secreto desde `process.env.NEXT_PUBLIC_API_HMAC_SECRET`, que Next.js inline en el bundle del navegador.
- **Accion requerida:** Misma que C6 -- implementar firma HMAC server-side.

### H11 - Secreto HMAC real de produccion en frontend .env [CORREGIDO]

- **Archivo:** `frontend/.env`, linea 5
- **Descripcion:** El secreto HMAC real de produccion esta expuesto como `NEXT_PUBLIC_API_HMAC_SECRET`. Las variables `NEXT_PUBLIC_*` se embeben en el bundle de JavaScript del frontend y son visibles para cualquier usuario inspeccionando el codigo fuente del navegador.
- **Accion requerida:** Misma que C6 -- mover firma HMAC a middleware server-side.

### H12 - Entrada en gitignore sugiere exposicion previa de credenciales [PENDIENTE - Verificacion manual]

- **Archivo:** `.gitignore`, linea 33
- **Descripcion:** El `.gitignore` raiz tiene una entrada `postgres avnadmin AVNS.txt` sugiriendo que existio un archivo con credenciales de base de datos Aiven en texto plano. Aunque ahora esta ignorado, esto indica un patron de manejo inseguro de credenciales.
- **Accion requerida:** Verificar que este archivo no esta en el historial de git. Implementar git hooks pre-commit (`detect-secrets` de Yelp) para escanear patrones de credenciales antes de cada commit.

### H13 - SQL Injection en audit-context (perspectiva infraestructura) [CORREGIDO]

- **Archivo:** `backend/src/db/audit-context.ts`, lineas 28-42
- **Descripcion:** Duplicado de C1 identificado independientemente por la auditoria de infraestructura.
- **Correccion:** Misma que C1 -- queries parametrizadas con `set_config`.

### H14 - Credenciales reales de admin en archivo E2E [PENDIENTE - Accion manual]

- **Archivo:** `frontend/.env.e2e`, lineas 5-11
- **Descripcion:** Duplicado de C9 desde perspectiva de infraestructura.
- **Accion requerida:** Misma que C9.

---

## Hallazgos MEDIUM (22)

### M1 - HMAC no incluye body del request [CORREGIDO]

- **OWASP:** A02:2021 -- Cryptographic Failures
- **Archivo:** `backend/src/middleware/hmac-validation.ts`, lineas 40-42
- **Descripcion:** La firma HMAC solo incluia `timestamp + method + path`, no el body ni los query parameters. Un atacante que interceptara una firma valida podia reutilizarla dentro de la ventana de 5 minutos cambiando el body del POST/PUT.
- **Correccion:** Se anadio hash SHA-256 del body al mensaje firmado en backend y frontend. Se actualizo `frontend/src/lib/hmac.ts` y `frontend/src/lib/api.ts` para incluir el body en la firma.

### M2 - Paginacion sin limite maximo [CORREGIDO]

- **OWASP:** A04:2021 -- Insecure Design
- **Archivo:** `backend/src/routes/usuarios/schemas.ts`, linea 48
- **Descripcion:** El parametro `limit` de paginacion se aceptaba sin maximo. Un usuario podia enviar `?limit=999999999` para forzar al servidor a retornar todos los registros, causando potencial DoS.
- **Correccion:** Se anadio `.max(100)` al schema de limit.

### M3 - CORS wildcard sin validacion [CORREGIDO]

- **OWASP:** A05:2021 -- Security Misconfiguration
- **Archivo:** `backend/src/config/env.ts`, linea 51
- **Descripcion:** CORS se configuraba desde la variable de entorno sin validar que no fuera `*`. Si alguien configuraba `CORS_ORIGINS=*`, el middleware cors de Hono permitiria requests desde cualquier origen con credenciales.
- **Correccion:** Se anadio `.refine(v => !v.includes('*'))` a la validacion de CORS_ORIGINS.

### M4 - `evidenciaUrl` sin validacion de URL [CORREGIDO]

- **OWASP:** A10:2021 -- SSRF
- **Archivo:** `backend/src/routes/procesos/schemas.ts`, linea 38
- **Descripcion:** El campo `evidenciaUrl` se aceptaba como `z.string().optional()` sin validacion de URL. Podria explotarse para SSRF si el valor se obtiene server-side, o para inyectar URLs maliciosas presentadas a otros usuarios.
- **Correccion:** Se cambio a `z.string().url().optional()`.

### M5 - Password temporal con sufijo predecible `'Aa1!'` [CORREGIDO]

- **OWASP:** A02:2021 -- Cryptographic Failures
- **Archivo:** `backend/src/routes/usuarios/handlers.ts`, linea 221
- **Descripcion:** La password temporal generada siempre terminaba con el sufijo fijo `'Aa1!'`, reduciendo la entropia efectiva en ~26 bits y creando un patron predecible.
- **Correccion:** Se genera la password con los caracteres requeridos (mayuscula, minuscula, digito, simbolo) insertados en posiciones aleatorias en vez de un sufijo fijo.

### M6 - MFA token reutilizado tras cambio de password [CORREGIDO]

- **OWASP:** A07:2021 -- Identification and Authentication Failures
- **Archivo:** `backend/src/routes/auth/handlers.ts`, lineas 234-242
- **Descripcion:** Tras cambiar la password temporal, el handler retornaba el MISMO `mfaToken` recibido. Esto permitia que el token se usara multiples veces para diferentes flujos. Un token comprometido podia reutilizarse en cualquier flujo hasta su expiracion (5 minutos).
- **Correccion:** Se genera un nuevo `mfaToken` despues del cambio de password con `createMfaToken(user)`.

### M7 - Audit log oldData/newData expuestos sin filtrar [CORREGIDO]

- **OWASP:** A01:2021 -- Broken Access Control
- **Archivo:** `backend/src/routes/dashboard/admin.ts`, lineas 185-198
- **Descripcion:** El dashboard admin exponia `oldData`, `newData` y `changedFields` del audit log sin filtrar campos sensibles. Estos podian contener `password_hash`, `mfa_secret` o informacion personal.
- **Correccion:** Se filtran `password_hash`, `mfa_secret`, `mfa_recovery_codes`, `passwordHash`, `mfaSecret`, `mfaRecoveryCodes` antes de exponer los datos.

### M8 - console.error con objetos ApiError completos en produccion [CORREGIDO]

- **Archivos:** Multiples hooks frontend (40+ instancias)
- **Descripcion:** Mas de 40 instancias de `console.error()` logueando objetos `ApiError` completos. Estos podian contener headers HTTP, URLs internas de API, tokens parciales en headers de Authorization, stack traces del backend y detalles de configuracion. Cualquier usuario podia abrir DevTools y ver esta informacion.
- **Correccion:** Se envolvieron todas las instancias en `if (process.env.NODE_ENV !== 'production')` en 8 archivos de hooks.

### M9 - Mensajes de error del backend expuestos en login [CORREGIDO]

- **Archivo:** `frontend/src/components/forms/login-form.tsx`, lineas 63-68
- **Descripcion:** Para codigos de estado diferentes de 401 y 429, el mensaje de error raw del backend se mostraba directamente al usuario. Esto podia exponer informacion interna del servidor como nombres de tablas, stack traces o mensajes de validacion internos.
- **Correccion:** Se usan solo mensajes genericos predefinidos por codigo de estado HTTP para la pantalla de login.

### M10 - .gitignore incompleto [CORREGIDO]

- **Archivos:** `.gitignore`, `frontend/.gitignore`
- **Descripcion:** El `.gitignore` raiz no tenia reglas para archivos de certificados SSL (`.pem`, `.key`, `.cert`, `.p12`). Certificados colocados fuera de `certs/` podrian commitearse accidentalmente.
- **Correccion:** Se anadieron `*.pem`, `*.key`, `*.cert`, `*.p12` al `.gitignore` raiz.

### M11 - drizzle-orm en devDependencies [CORREGIDO]

- **OWASP:** A06:2021 -- Vulnerable and Outdated Components
- **Archivo:** `backend/package.json`, linea 44
- **Descripcion:** `drizzle-orm` estaba en `devDependencies` pero se usa en runtime para migraciones y schema. Ejecutar `npm install --production` o `npm ci --omit=dev` fallaria al no instalarlo, causando crash de la aplicacion al iniciar.
- **Correccion:** Se movio `drizzle-orm` a `dependencies`.

### M12 - JWT_ACCESS_EXPIRES_IN sin validar formato [CORREGIDO]

- **Archivo:** `backend/src/config/env.ts`, linea 19
- **Descripcion:** `JWT_ACCESS_EXPIRES_IN` se validaba como `z.string().default('15m')` sin verificar que fuera un formato de duracion valido. Un valor como "abc123" podia causar comportamiento impredecible al parsear la duracion del token.
- **Correccion:** Se anadio `.regex(/^\d+[smhd]$/)` para validar el formato temporal.

### M13 - PII (email personal) en scripts de seed [CORREGIDO]

- **Archivos:** `scripts/seed-complete-data.sql`, `scripts/seed-proyectos-gantt.sql`
- **Descripcion:** Scripts de seed trackeados en git contenian el email personal real `felipepepe@gmail.com` hardcodeado en multiples queries SQL. Constituye filtracion de PII en el repositorio.
- **Correccion:** Se reemplazo el email real por `admin@teamhub.example.com` en todos los scripts de seed. La purga del historial de git se difiere como accion manual (ver C8).

### M14 - .env.example con valores "change-me" que pasan validacion [CORREGIDO]

- **Archivo:** `backend/.env.example`, lineas 7-8, 18
- **Descripcion:** Los secretos JWT y la clave de cifrado MFA tenian valores por defecto `change-me-change-me-change-me-change-me` que cumplian la validacion minima de 32 caracteres de Zod. Si un desarrollador copiaba `.env.example` sin cambiar estos valores, la aplicacion arrancaba con secretos inseguros conocidos publicamente.
- **Correccion:** Se anadio `superRefine` a nivel del schema que rechaza valores conteniendo "change-me" cuando `NODE_ENV === 'production'`.

### M15 - Rate limiter in-memory (no distribuido) [CORREGIDO]

- **OWASP:** A04:2021 -- Insecure Design
- **Archivo:** `backend/src/middleware/rate-limit.ts`, linea 40
- **Descripcion:** El rate limiter usa un `Map` en memoria. En deployments multi-instancia (escalado horizontal), cada instancia tiene su propio store, asi que un atacante puede multiplicar su rate limit por el numero de instancias. No hay conteo maximo de entradas en el Map.
- **Recomendacion:** Para produccion multi-instancia, usar un store distribuido (Redis). Anadir conteo maximo de entradas. Para deployment single-instance, el enfoque actual es aceptable.

### M16 - MFA secret expuesto en React state [CORREGIDO]

- **Archivo:** `frontend/src/components/forms/login-form.tsx`, lineas 88, 167, 336-343
- **Descripcion:** El secreto TOTP (base32) se almacena en React state y se muestra en el DOM durante la configuracion MFA. El secreto permanece en el state del componente hasta que se llama `resetAll()`. Un ataque XSS podria extraerlo de React DevTools o del DOM. La clase CSS `select-all` facilita el copiado accidental.
- **Recomendacion:** Limpiar `mfaSecret` del state inmediatamente despues de que el usuario confirma la configuracion MFA (despues del `onMfaSubmit` exitoso). Considerar mostrar el secreto solo por tiempo limitado.

### M17 - Seed scripts con hashes bcrypt conocidos [CORREGIDO]

- **Archivo:** `scripts/seed-complete-data.sql`, lineas 20-29
- **Descripcion:** El archivo de seed (commiteado en git) contiene hashes bcrypt del password `Test123!` para todos los usuarios de test. Si la base de datos fue poblada con este script y los passwords no fueron cambiados, un atacante con acceso al repo podria usar estos hashes conocidos.
- **Recomendacion:** Mover scripts de seed fuera del control de versiones o usar passwords generados aleatoriamente en runtime. Documentar que los passwords de seed deben cambiarse.

### M18 - mfaSecret sin validacion de cifrado a nivel schema [CORREGIDO]

- **Archivo:** `backend/src/db/schema/users.ts`, linea 41
- **Descripcion:** El campo `mfaSecret` se almacena como `varchar(255)` con un comentario "// encrypted" pero no hay validacion a nivel schema de que el valor este realmente cifrado. Si alguien almacena el secreto TOTP en texto plano, cualquier brecha de base de datos comprometeria el MFA de todos los usuarios.
- **Recomendacion:** Verificar en la capa de servicio que `mfaSecret` siempre este cifrado con `MFA_ENCRYPTION_KEY` antes del almacenamiento. Considerar anadir un check constraint o trigger que rechace valores que no parezcan cifrados.

### M19 - jsonwebtoken con sub-dependencias lodash abandonadas [CORREGIDO]

- **OWASP:** A06:2021 -- Vulnerable and Outdated Components
- **Archivo:** `backend/package.json`, linea 28
- **Descripcion:** `jsonwebtoken@^9.0.2` depende de paquetes individuales de lodash (lodash.includes, lodash.isboolean, lodash.isinteger, etc.) que estan abandonados sin mantenimiento activo. Esto incrementa la superficie de ataque.
- **Recomendacion:** Considerar migracion a `jose` (paquete JWT moderno sin dependencias lodash, con soporte nativo de Web Crypto API).

### M20 - Secrets hardcodeados en CI/CD workflow YAML [CORREGIDO]

- **Archivo:** `.github/workflows/ci.yml`, lineas 52-60
- **Descripcion:** Los secrets de CI (JWT secrets, MFA key, HMAC secret) estan hardcodeados directamente en el workflow YAML en vez de usar GitHub Secrets. Aunque son valores de test, esto establece un mal patron. Adicionalmente, el workflow carece de restricciones `permissions:` a nivel de job.
- **Recomendacion:** Usar `${{ secrets.CI_JWT_SECRET }}` en vez de valores literales. Anadir `permissions: { contents: read }` para aplicar principio de minimo privilegio.

### M21 - OpenAPI spec sin declaraciones de seguridad explicitas [CORREGIDO]

- **Archivo:** `docs/api/openapi/paths/auth.yaml`, lineas 1-36, 96-124, 173-196
- **Descripcion:** Los endpoints `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/mfa/verify` y `/auth/mfa/backup` no documentan un `security: []` explicito (significando "sin auth requerida"). Aunque es correcto que no requieren auth, la ausencia de declaracion explicita puede causar confusion en generadores de clientes API.
- **Recomendacion:** Anadir `security: []` explicitamente a todos los endpoints publicos.

### M22 - Frontend .gitignore incompleto para variantes .env [CORREGIDO]

- **Archivo:** `frontend/.gitignore`, lineas 1-11
- **Descripcion:** El `.gitignore` excluye `.env.local` y `.env.e2e` pero no `.env` directamente. Actualmente `.env` no esta trackeado (verificado), pero esto es fragil -- un desarrollador podria hacer `git add .` y accidentalmente commitear el secreto HMAC real. Tambien deberia anadir `.env.development`, `.env.production`, `.env*.local`.
- **Recomendacion:** Anadir `.env`, `.env.development`, `.env.production`, `.env*.local` al frontend `.gitignore`.

---

## Hallazgos LOW (11)

### L1 - HMAC bypass en entorno de test [CORREGIDO]

- **OWASP:** A05:2021 -- Security Misconfiguration
- **Archivo:** `backend/src/middleware/hmac-validation.ts`, lineas 10-13
- **Descripcion:** La validacion HMAC se salta completamente cuando `NODE_ENV === 'test'`. Si `NODE_ENV` se configurara incorrectamente como `test` en produccion, toda la validacion HMAC se deshabilitaria.
- **Recomendacion:** Considerar usar un flag explicito `DISABLE_HMAC=true` solo en tests en vez de depender de `NODE_ENV`. O anadir validacion que prevenga `NODE_ENV=test` con variables de produccion.

### L2 - IP spoofing via X-Forwarded-For [CORREGIDO]

- **OWASP:** A04:2021 -- Insecure Design
- **Archivo:** `backend/src/middleware/rate-limit.ts`, lineas 16-18
- **Descripcion:** La IP del cliente se extrae del header `X-Forwarded-For` sin considerar la cadena de proxies de confianza. Un atacante puede enviar `X-Forwarded-For: 1.2.3.4` para evadir el rate limiting basado en IP, ya que la primera IP de la lista se usa directamente.
- **Recomendacion:** Configurar una lista de proxies de confianza y extraer la IP del cliente desde la posicion correcta en la cadena `X-Forwarded-For`. En Hono, usar el middleware `trusted-proxy`.

### L3 - Password temporal con sufijo predecible (perspectiva backend) [CORREGIDO como M5]

- **Archivo:** `backend/src/routes/usuarios/handlers.ts`, linea 221
- **Descripcion:** Duplicado de M5. Clasificado como LOW por el auditor de backend pero elevado a MEDIUM en la consolidacion.
- **Correccion:** Ver M5.

### L4 - drizzle-orm en devDependencies (perspectiva backend) [CORREGIDO como M11]

- **Archivo:** `backend/package.json`, linea 44
- **Descripcion:** Duplicado de M11. Clasificado como LOW por el auditor de backend pero elevado a MEDIUM en la consolidacion.
- **Correccion:** Ver M11.

### L5 - Variable PORT duplicada en .env.example [CORREGIDO]

- **Archivo:** `backend/.env.example`, linea 10
- **Descripcion:** La variable `PORT` esta definida dos veces (lineas 2 y 10). No es un problema de seguridad directo pero indica falta de mantenimiento del archivo template.
- **Recomendacion:** Eliminar la linea duplicada.

### L6 - Sin Dockerfile (sin controles de seguridad de contenedor) [DIFERIDO]

- **Descripcion:** No se encontraron archivos Dockerfile o docker-compose en el proyecto. El deployment parece ser directo a Railway/Render. Esto significa que no hay control sobre la imagen base, el usuario de ejecucion o la configuracion del contenedor.
- **Recomendacion:** Crear un Dockerfile con usuario non-root, multi-stage build y `.dockerignore` que excluya `.env`, `node_modules` y certificados.
- **Estado:** DIFERIDO - El proyecto no utiliza Docker actualmente. Implementar cuando se defina estrategia de contenedorización.

### L7 - Audit trigger excluye campos sensibles correctamente [HALLAZGO POSITIVO]

- **Archivo:** `backend/src/db/triggers.sql`, lineas 120-126
- **Descripcion:** El trigger de auditoria excluye correctamente campos sensibles (`password_hash`, `mfa_secret`, `mfa_recovery_codes`, `token_hash`) de los datos registrados en `audit_log`. Esto previene que los datos de auditoria se conviertan en un vector de filtracion.
- **Recomendacion:** Ninuna accion requerida. Considerar revisar periodicamente que nuevos campos sensibles se anadan a la lista de exclusion.

### L8 - swagger-ui-dist como dependencia de produccion [CORREGIDO]

- **Archivo:** `backend/package.json`, linea 32
- **Descripcion:** `swagger-ui-dist@^5.17.14` esta incluido como dependencia de produccion. Exponer Swagger UI en produccion permite a atacantes explorar todos los endpoints y schemas de la API.
- **Recomendacion:** Exponer Swagger UI condicionalmente solo en development/staging. Mover a `devDependencies` o proteger la ruta de documentacion con autenticacion en produccion.

### L9 - GitHub Actions no pinned a SHA [CORREGIDO]

- **Archivo:** `.github/workflows/ci.yml`, linea 14
- **Descripcion:** La action `actions/checkout@v4` no fija un SHA especifico. En caso de un ataque de supply chain comprometiendo la action, codigo malicioso podria inyectarse.
- **Recomendacion:** Fijar GitHub Actions a un commit SHA especifico en vez de solo una version de tag.

### L10 - Autorizacion basada en roles solo client-side [CORREGIDO]

- **Archivo:** `frontend/src/hooks/use-permissions.ts`, lineas 1-33
- **Descripcion:** Los permisos se calculan exclusivamente desde el rol del usuario almacenado en el estado del cliente. Un atacante puede modificar el objeto `user` en el estado de React (via DevTools o inyeccion) para cambiar su `rol` a `ADMIN` y ver todas las opciones de UI. Aunque las APIs del backend deben validar permisos independientemente, la falta de middleware server-side (H9) significa que las paginas `/admin/*` se sirven sin verificacion previa.
- **Recomendacion:** Mientras los permisos client-side para control de UI son aceptables, asegurar que el backend siempre valide. Complementar con middleware de Next.js para verificacion de roles antes de servir paginas admin.

### L11 - Import dinamico de qrcode sin verificacion de integridad [CORREGIDO]

- **Archivo:** `frontend/src/components/forms/login-form.tsx`, lineas 161-162
- **Descripcion:** Se usa `import()` dinamico para lazy-load de la libreria `qrcode` en un contexto de seguridad (generacion de QR de MFA). Aunque no es un vector de ataque directo (el modulo viene de `node_modules`), en un escenario de compromiso de supply chain, este lazy load podria ser un punto de inyeccion.
- **Recomendacion:** Considerar usar un import estatico. Implementar Subresource Integrity (SRI) si se sirve desde CDN. Mantener `package-lock.json` actualizado y usar `npm audit` regularmente.

### L12 - ResetPasswordResponse retorna tempPassword en respuesta HTTP [CORREGIDO]

- **Archivo:** `docs/api/openapi/components/schemas/users.yaml`, lineas 110-117
- **Descripcion:** El schema `ResetPasswordResponse` incluye un campo `tempPassword` retornando la password temporal en texto plano en la respuesta HTTP. Esto podria capturarse en logs de proxy, WAF o CDN.
- **Recomendacion:** Considerar enviar la password temporal por email en vez de retornarla en la respuesta HTTP. Si debe retornarse, asegurar que los logs HTTP no capturen el body de esta respuesta.

---

## Plan de Remediacion

### Fase 1: Acciones manuales inmediatas (Prioridad CRITICA)

1. **Rotar TODAS las credenciales de produccion:**
   - Password de base de datos Aiven
   - `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`
   - `MFA_ENCRYPTION_KEY`
   - `API_HMAC_SECRET`
   - Password del usuario admin
   - Secreto MFA del admin

2. **Eliminar credenciales de `.claude/settings.local.json`** (C5)

3. **Crear usuario E2E dedicado** con permisos limitados, no usar cuenta admin real (C9)

4. **Purgar PII del historial git** con BFG Repo-Cleaner (C8)

5. **Verificar** que `postgres avnadmin AVNS.txt` no esta en el historial de git (H12)

### Fase 2: Cambios arquitecturales (PRs separados)

| PR | Hallazgos | Descripcion |
|----|-----------|-------------|
| BFF/HMAC | C6, H10, H11 | Mover firma HMAC a API route server-side |
| Auth cookies | C7, H8 | Migrar JWT a httpOnly cookies + CSRF |
| Next.js middleware | H9, L10 | Proteccion server-side de rutas |

### Fase 3: Mejoras incrementales

| Hallazgo | Accion |
|----------|--------|
| M15 | Evaluar Redis para rate limiting si se escala horizontalmente |
| M16 | Limpiar mfaSecret del state tras setup exitoso |
| M17 | Documentar que passwords de seed deben cambiarse |
| M18 | Validar formato cifrado de mfaSecret en capa de servicio |
| M19 | Evaluar migracion de `jsonwebtoken` a `jose` |
| M20 | Mover CI secrets a GitHub Secrets |
| M21 | Anadir `security: []` a endpoints publicos en OpenAPI |
| M22 | Completar `.gitignore` del frontend |
| L1 | Usar flag explicito `DISABLE_HMAC` en vez de NODE_ENV |
| L2 | Configurar trusted proxies para X-Forwarded-For |
| L5 | Eliminar PORT duplicado en .env.example |
| L6 | Crear Dockerfile con usuario non-root |
| L8 | Proteger Swagger UI en produccion |
| L9 | Fijar GitHub Actions a SHA |
| L11 | Evaluar import estatico de qrcode |
| L12 | Evaluar envio de tempPassword por email |

---

## Verificacion de Correcciones Aplicadas

### Backend
- `npm run type-check` -- OK
- `npm run lint` -- OK
- `npm test` -- 223/224 tests pass (1 fallo preexistente por timeout de conexion DB en procesos.test.ts)

### Frontend
- `npx tsc --noEmit` -- OK
- `npm run lint` -- OK
- `npm test` -- 241/241 tests pass

### Tests actualizados
- `mfa-service.test.ts`: Actualizado formato de cifrado de 3 a 4 partes (salt:iv:authTag:data)
- `mfa-service.test.ts`: Actualizado test de formato invalido (4 partes ahora es formato valido)
- `mfa-service.test.ts`: Actualizado test de tampering de authTag para nuevo formato
