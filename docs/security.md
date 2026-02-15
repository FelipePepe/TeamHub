# Seguridad

Este documento detalla las medidas de seguridad implementadas en TeamHub, siguiendo las mejores prácticas de OWASP y SSDLC.

---

## Autenticación

### JWT (JSON Web Tokens)
- **Access Token**: Válido por 15 minutos por defecto (configurable), usado para autenticar requests
- **Refresh Token**: Válido por 30 días, usado para obtener nuevos access tokens
- **Rotación de Refresh Tokens**: Al usar un refresh token, se genera uno nuevo
- **MFA**: Obligatorio para todos los usuarios (Google Authenticator)

### Almacenamiento de Tokens
- **Access Token**: localStorage (frontend)
- **Refresh Token**: localStorage (frontend)

---

## Autorización

### Sistema de Roles
- **ADMIN**: Acceso total a todas las funcionalidades
- **RRHH**: Gestión de empleados, departamentos y onboarding
- **MANAGER**: Gestión de su equipo y proyectos
- **EMPLEADO**: Acceso self-service limitado

### Verificación de Permisos
- Middleware de autorización por roles en cada endpoint
- Verificación de propiedad de recursos
- Principio de mínimo privilegio

---

## Protección de Datos

### Passwords
- Hash con bcrypt (12 salt rounds)
- Nunca almacenados en texto plano
- Validación de fortaleza: mínimo 12 caracteres, mayúscula, minúscula, número y carácter especial

### Rate Limiting
- Login: 3 intentos fallidos → bloqueo 30 minutos (ADMIN puede desbloquear) y 5/min por IP
- API general: 100 requests por minuto por usuario

---

## Validación

- **Backend**: Todas las entradas validadas con Zod
- **Frontend**: Validación con Zod + React Hook Form
- **Sanitización**: React escapa HTML por defecto; CSP refuerza mitigación de XSS

---

## Headers de Seguridad

```
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload (solo en producción)
```

---

## CORS

Configuración estricta mediante `CORS_ORIGINS` (lista separada por comas).

**Desarrollo:** Regex `LOCAL_DEV_ORIGIN_REGEX` permite puertos dinámicos localhost.

**Producción:** Solo origins configurados explícitamente.

---

## Firmas HMAC

- **Request Signing**: Todas las requests API incluyen firma HMAC-SHA256
- **Validación**: Backend valida firma antes de procesar request
- **Secret**: `API_HMAC_SECRET` debe coincidir entre frontend y backend
- **Payload**: Incluye método HTTP, path y hash del body

---

## Security Gates (Husky Hooks)

### Pre-commit
1. ✅ **Secrets Detection (gitleaks)**: Bloquea commits con API keys, passwords o tokens hardcodeados
   - Herramienta: gitleaks v8.22.1
   - Ejecuta: `scripts/bin/gitleaks protect --staged`
   - Whitelist: `.gitleaksignore`

2. ✅ **Branch Naming Validation**: Verifica nombres GitFlow válidos (feature/*, bugfix/*, etc.)

### Pre-push
1. ✅ **Security Audit (npm audit)**: Detecta CVEs conocidos en dependencias
   - Nivel: high/critical
   - Bloquea push si hay vulnerabilidades críticas

2. ✅ **Code Quality**: Linting, type-check, tests
3. ✅ **OpenAPI Validation**: Schema válido según OpenAPI 3.1

### Setup
```bash
# Instalar Husky hooks
npm run prepare

# Instalar gitleaks
./scripts/setup-gitleaks.sh
```

**⚠️ IMPORTANTE:** Nunca usar `--no-verify` en commits/push. Los hooks son quality gates obligatorios.

---

## Monitoreo de Errores (Sentry)

- **Backend**: `@sentry/node` captura errores no manejados
- **Frontend**: `@sentry/nextjs` captura errores de React y API
- **DSN**: Configurado en `SENTRY_DSN` y `SENTRY_ENVIRONMENT`
- **Plan**: Free tier (5,000 errores/mes)
- **Skills instalados**: sentry-setup-logging, sentry-react-setup, sentry-fix-issues

---

## Auditorías de Seguridad

### OWASP Top 10 Coverage

| Vulnerabilidad | Mitigación |
|----------------|------------|
| **A01:2021 - Broken Access Control** | RBAC, middleware de autorización, verificación de propiedad |
| **A02:2021 - Cryptographic Failures** | bcrypt para passwords, JWT signing, HTTPS obligatorio |
| **A03:2021 - Injection** | Drizzle ORM con prepared statements, Zod validation |
| **A04:2021 - Insecure Design** | ADRs, threat modeling, security by design |
| **A05:2021 - Security Misconfiguration** | Security headers, CORS estricto, secrets en env |
| **A06:2021 - Vulnerable Components** | npm audit en pre-push, Dependabot, actualizaciones |
| **A07:2021 - Identification/Auth Failures** | MFA obligatorio, rate limiting, bloqueo tras intentos |
| **A08:2021 - Software and Data Integrity** | Git signatures, immutable releases, code review |
| **A09:2021 - Security Logging Failures** | Sentry, Pino structured logs, audit trail |
| **A10:2021 - Server-Side Request Forgery** | Validación URL, whitelist de dominios, no user input en requests |

---

## Referencias

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Decisiones de Seguridad (ADRs)](decisiones/)
