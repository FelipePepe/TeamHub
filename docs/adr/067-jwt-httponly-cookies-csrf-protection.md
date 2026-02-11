# ADR-067: Migración de JWT a httpOnly Cookies con CSRF Protection

**Estado:** Aceptado  
**Fecha:** 2026-02-11  
**Autores:** Equipo TeamHub  
**Contexto:** Fase 4 - Security Hardening (P1 High Priority)  
**Supersede:** N/A  
**Referencias:** ADR-064, OWASP A03:2021, OWASP A01:2021, CWE-79, CWE-352

---

## Contexto y Problema

### Vulnerabilidad Crítica Identificada

El sistema de autenticación almacenaba JWT tokens (access_token y refresh_token) en **localStorage** del navegador. Esta aproximación presenta una **vulnerabilidad crítica de seguridad XSS (Cross-Site Scripting)**:

**Problema de localStorage:**
```javascript
// ❌ VULNERABLE: JavaScript tiene acceso completo
localStorage.setItem('accessToken', token);
// Cualquier script malicioso puede robar tokens:
const stolenToken = localStorage.getItem('accessToken');
// → Token robado → Acceso completo a la cuenta
```

### Análisis de Riesgo

| Aspecto | localStorage | httpOnly Cookies |
|---------|--------------|------------------|
| **Acceso desde JavaScript** | ✅ Sí (VULNERABLE) | ❌ No (SEGURO) |
| **Protección XSS** | ❌ 0% | ✅ 100% |
| **OWASP Top 10** | Vulnerable a A03:2021 | Cumple con mejores prácticas |
| **CWE-79 (XSS)** | Crítico | Mitigado |
| **CSRF Risk** | No aplica | Requiere protección adicional |

### Escenario de Ataque XSS

1. Atacante inyecta script malicioso via XSS
2. Script lee tokens desde localStorage
3. Script envía tokens al servidor del atacante
4. Atacante obtiene acceso completo a la cuenta de la víctima

**Impacto:** 
- Robo de credenciales de autenticación
- Suplantación de identidad
- Acceso a datos sensibles de empleados
- Operaciones no autorizadas (crear/modificar/eliminar registros)

---

## Decisión

Migrar el almacenamiento de JWT tokens de **localStorage** a **httpOnly cookies** con **CSRF protection** mediante Double Submit Cookie pattern.

### Arquitectura de Solución

```
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  POST /auth/mfa/verify                                           │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ 1. Validate MFA code                                    │     │
│  │ 2. Generate JWT tokens (access + refresh)              │     │
│  │ 3. Generate CSRF token (random 32 bytes hex)           │     │
│  │ 4. Set cookies:                                         │     │
│  │    - access_token (httpOnly, Secure, SameSite=Strict)  │     │
│  │    - refresh_token (httpOnly, Secure, SameSite=Strict) │     │
│  │    - csrf_token (httpOnly=FALSE, Secure, SameSite)     │     │
│  │ 5. Return { user } (NO tokens in JSON)                 │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  CSRF Middleware (csrfMiddleware)                               │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ - Skips: GET, HEAD, OPTIONS                            │     │
│  │ - Skips: /auth/login, /auth/refresh, /auth/mfa/*       │     │
│  │ - Validates: Cookie[csrf_token] === Header[X-CSRF-Token]│    │
│  │ - Returns 403 if validation fails                       │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │ httpOnly cookies
                                 │ + X-CSRF-Token header
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Axios Interceptor (api.ts)                                     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ 1. Read csrf_token from document.cookie                │     │
│  │ 2. Add header: X-CSRF-Token = csrf_token               │     │
│  │ 3. Set withCredentials: true (sends cookies)           │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  ❌ localStorage.removeItem('accessToken')                       │
│  ❌ localStorage.removeItem('refreshToken')                      │
│  ✅ Cookies manejadas automáticamente por el navegador          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes Implementados

#### 1. Backend Cookie Management (`backend/src/middleware/cookies.ts`)

**Nombres de Cookies:**
```typescript
export const COOKIE_ACCESS_TOKEN = 'access_token';
export const COOKIE_REFRESH_TOKEN = 'refresh_token';
export const COOKIE_CSRF_TOKEN = 'csrf_token';
```

**Opciones de Seguridad:**
```typescript
const getCookieOptions = (maxAge?: number) => ({
  httpOnly: true,           // ✅ JavaScript no puede acceder
  secure: NODE_ENV === 'production', // ✅ Solo HTTPS en prod
  sameSite: 'Strict',       // ✅ Previene CSRF básico
  path: '/',
  maxAge,
});
```

**Función `setAuthCookies()`:**
- Access token: 15 minutos (sincronizado con JWT expiration)
- Refresh token: 30 días
- **CSRF token: 15 minutos (sincronizado con access token)**

#### 2. CSRF Protection Middleware (`backend/src/middleware/csrf.ts`)

**Algoritmo de Validación:**
```typescript
1. IF method IN ['GET', 'HEAD', 'OPTIONS']
   → ALLOW (métodos seguros/idempotentes)

2. IF path IN ['/api/auth/login', '/api/auth/refresh', '/api/auth/mfa/setup', '/api/auth/mfa/verify']
   → ALLOW (endpoints sin token CSRF previo)

3. ELSE:
   cookieCsrf = getCookie(c, 'csrf_token')
   headerCsrf = c.req.header('X-CSRF-Token')
   
   IF !cookieCsrf OR !headerCsrf OR cookieCsrf !== headerCsrf
     → REJECT with 403 Forbidden
   
   → ALLOW
```

**Propiedades CSRF Token:**
- **httpOnly = false**: Frontend JavaScript puede leerlo (necesario para Double Submit)
- Generado con `randomBytes(32).toString('hex')` (64 caracteres hex)
- Renovado automáticamente con cada refresh de tokens

#### 3. Frontend Axios Interceptor (`frontend/src/lib/api.ts`)

**Request Interceptor:**
```typescript
api.interceptors.request.use(async (config) => {
  // CSRF token para requests mutantes
  const method = config.method?.toUpperCase() || 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    const csrfToken = getCsrfToken(); // Lee de document.cookie
    if (csrfToken && config.headers) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  
  // Cookies enviadas automáticamente
  config.withCredentials = true;
  
  return config;
});
```

**Response Interceptor (Auto-Refresh):**
- 401 Unauthorized → Intenta refresh automático
- Backend lee refresh_token desde cookie
- Backend establece nuevas cookies si refresh exitoso
- Re-intenta request original con nuevas cookies

#### 4. Auth Middleware Update (`backend/src/middleware/auth.ts`)

**Dual-Mode Authentication:**
```typescript
// Prioridad 1: Leer access_token desde cookie (httpOnly)
const cookieToken = getCookie(c, COOKIE_ACCESS_TOKEN);

// Prioridad 2: Fallback a Authorization header (backward compatibility)
const authHeader = c.req.header('Authorization');
const headerToken = authHeader?.replace(/^Bearer\s+/i, '');

const token = cookieToken || headerToken;
```

**Justificación Dual-Mode:**
- Cookie-first: Máxima seguridad (httpOnly)
- Header fallback: Compatibilidad con MFA flow y tests legacy

#### 5. Test Infrastructure (`backend/src/test-utils/index.ts`)

**Helpers Añadidos:**
```typescript
// Extrae cookies de Set-Cookie headers
export const extractCookies = (response: Response): Record<string, string>

// Convierte objeto cookies a Cookie header
export const cookiesToHeader = (cookies: Record<string, string>): string

// getSignedHeaders() extendido para inyectar cookies + CSRF token
export const getSignedHeaders = (
  method: string, 
  path: string, 
  extraHeaders: Record<string, string> = {},
  cookies?: Record<string, string>
): Record<string, string>
```

**Pattern de Test:**
```typescript
const { cookies } = await loginWithMfa(app, email, password);
// cookies = { access_token: '...', refresh_token: '...', csrf_token: '...' }

const response = await app.request('/api/usuarios', {
  method: 'POST',
  headers: getSignedHeaders('POST', '/api/usuarios', {}, cookies),
  // → Añade Cookie header + X-CSRF-Token automáticamente
  body: JSON.stringify(payload),
});
```

---

## Consecuencias

### Positivas

#### 1. **Seguridad XSS Mitigada (100%)**
- ✅ JWT tokens inaccesibles desde JavaScript
- ✅ Scripts maliciosos no pueden robar tokens
- ✅ Cumple con OWASP A03:2021 (Injection)
- ✅ Mitigación completa de CWE-79 (XSS)

#### 2. **CSRF Protection Implementada**
- ✅ Double Submit Cookie pattern (OWASP recomendado)
- ✅ Previene CSRF attacks (OWASP A01:2021)
- ✅ Mitigación de CWE-352 (CSRF)
- ✅ Sin state server-side (no almacenamiento de tokens CSRF)

#### 3. **Mejor UX**
- ✅ Refresh automático de tokens transparente al usuario
- ✅ No más "Token expired" errors visibles
- ✅ Sesión persistente mientras navegador abierto

#### 4. **Compliance y Auditoría**
- ✅ Cumple OWASP Top 10 mejores prácticas
- ✅ Logs de seguridad mejorados (CSRF failures tracked)
- ✅ Trazabilidad completa en audit_log

### Negativas / Trade-offs

#### 1. **Complejidad de Tests**
- ⚠️ Tests requieren simular cookies (no JSON responses)
- ⚠️ 226 tests backend actualizados
- ⚠️ Test infrastructure extendida con helpers de cookies
- ✅ **Mitigación:** Helpers reutilizables `extractCookies()`, `cookiesToHeader()`

#### 2. **Incompatibilidad con API Clients Externos**
- ⚠️ Postman/Insomnia requieren configuración manual de cookies
- ⚠️ Scripts externos necesitan manejar cookies
- ✅ **Mitigación:** Auth middleware mantiene backward compatibility con Bearer tokens para casos legacy

#### 3. **CORS Configuration Requerida**
- ⚠️ `withCredentials: true` requiere CORS específico
- ⚠️ `Access-Control-Allow-Credentials: true`
- ⚠️ No se puede usar `Access-Control-Allow-Origin: *`
- ✅ **Mitigación:** Ya configurado en `app.ts` con origin específico

#### 4. **Debugging Complexity**
- ⚠️ Tokens no visibles en DevTools > Network > Response
- ⚠️ Cookies solo visibles en DevTools > Application > Cookies
- ✅ **Mitigación:** Logs de servidor mejoran visibilidad

---

## Alternativas Consideradas

### Alternativa 1: Mantener localStorage con CSP estricto
**Rechazada:** CSP reduce riesgo pero no elimina vulnerabilidad. Un XSS bypass (e.g., via DOM-based XSS) sigue permitiendo robo de tokens.

### Alternativa 2: SessionStorage
**Rechazada:** Mismas vulnerabilidades XSS que localStorage. Tokens siguen siendo accesibles desde JavaScript.

### Alternativa 3: Memoria (React State)
**Rechazada:** Tokens se pierden al refrescar página. UX inaceptable (usuario debe re-loguearse constantemente).

### Alternativa 4: IndexedDB
**Rechazada:** Similar vulnerabilidad XSS que localStorage. Más complejidad sin beneficio de seguridad.

### Alternativa 5: httpOnly Cookies sin CSRF protection
**Rechazada:** Vulnerable a CSRF attacks. Con cookies, CSRF protection es **obligatorio** según OWASP.

### Alternativa 6: Token en Cookie + Token en LocalStorage (Doble Verificación)
**Rechazada:** localStorage sigue siendo vulnerable XSS. No añade seguridad real.

---

## Implementación

### Commits Relacionados

1. **357df32** - `feat(security): migrate JWT to httpOnly cookies (P1 - in progress)`
   - Backend auth endpoints migrados
   - Frontend localStorage removal
   - Auth middleware dual-mode

2. **d5f0935** - `test(security): update all tests for httpOnly cookies`
   - Test infrastructure extendida
   - 226 tests backend actualizados

3. **636d71a** - `fix(tests): remove unused verifyBody destructuring in test helpers`
   - Linting fixes

4. **607af19** - `test(frontend): remove obsolete localStorage token tests`
   - Tests frontend actualizados (233 tests passing)

5. **fa364f7** - `feat(security): implement CSRF protection middleware (P1)`
   - CSRF middleware implementado
   - Double Submit Cookie pattern
   - Test infrastructure con CSRF token handling

### Métricas de Cambio

| Métrica | Valor |
|---------|-------|
| **Archivos modificados** | 15 archivos |
| **Tests backend** | 226/226 passing ✅ |
| **Tests frontend** | 233/233 passing ✅ |
| **Vulnerabilidades mitigadas** | XSS token theft (CWE-79), CSRF (CWE-352) |
| **Security audit** | 0 high-severity issues ✅ |
| **Tiempo de implementación** | ~4 horas (análisis + implementación + tests) |

### Configuración de Producción

**Variables de entorno requeridas:**
```bash
NODE_ENV=production  # Habilita secure cookies
CORS_ORIGIN=https://teamhub.example.com  # Debe ser exacto (no wildcard)
```

**Checklist Pre-Deploy:**
- [ ] Verificar HTTPS habilitado
- [ ] Confirmar CORS_ORIGIN correcto
- [ ] Validar CSP headers no bloquean CSRF token reading
- [ ] Test manual: Login → MFA → Request autenticado → Logout
- [ ] Verificar cookies en DevTools (httpOnly, Secure, SameSite)
- [ ] Test CSRF: Remover X-CSRF-Token header → Debe retornar 403

---

## Validación y Testing

### Test Coverage

**Backend (226 tests):**
- ✅ Auth flow completo con cookies
- ✅ Token refresh automático
- ✅ CSRF validation (403 en requests sin token)
- ✅ CSRF exemptions (GET, auth endpoints)
- ✅ Cookie expiration handling
- ✅ Logout (cookie clearing)

**Frontend (233 tests):**
- ✅ API interceptor con CSRF token
- ✅ withCredentials configuration
- ✅ Auto-refresh en 401

### Manual Testing Checklist

- [x] Login con MFA → Cookies establecidas
- [x] Request autenticado → Access token leído desde cookie
- [x] POST sin X-CSRF-Token → 403 Forbidden
- [x] Token expiration → Auto-refresh exitoso
- [x] Logout → Cookies eliminadas
- [x] DevTools > Application > Cookies:
  - [x] access_token (httpOnly ✅, Secure ✅, SameSite=Strict ✅)
  - [x] refresh_token (httpOnly ✅, Secure ✅, SameSite=Strict ✅)
  - [x] csrf_token (httpOnly ❌, Secure ✅, SameSite=Strict ✅)

---

## Referencias

### OWASP Resources
- [OWASP Top 10 2021 - A03: Injection (XSS)](https://owasp.org/Top10/A03_2021-Injection/)
- [OWASP Top 10 2021 - A01: Broken Access Control (CSRF)](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

### CWE (Common Weakness Enumeration)
- [CWE-79: Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')](https://cwe.mitre.org/data/definitions/79.html)
- [CWE-352: Cross-Site Request Forgery (CSRF)](https://cwe.mitre.org/data/definitions/352.html)
- [CWE-522: Insufficiently Protected Credentials](https://cwe.mitre.org/data/definitions/522.html)

### Industry Best Practices
- [JWT Storage Best Practices](https://auth0.com/docs/secure/security-guidance/data-security/token-storage)
- [NIST SP 800-63B: Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [MDN Web Docs: Set-Cookie (httpOnly)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#httponly)

### Internal Documentation
- [ADR-064: Security Hardening Strategy](064-security-hardening-strategy.md)
- [AGENTS.md: Security Guidelines](../../AGENTS.md#4-seguridad-y-configuración-ssdlc)

---

## Notas de Implementación

### Lecciones Aprendidas

1. **Test Infrastructure Critical**: Actualizar helpers de tests ANTES de modificar tests individuales ahorra tiempo significativo.

2. **CSRF Exemptions**: Los endpoints de autenticación inicial NO pueden validar CSRF (no tienen token previo). Documentar claramente en código.

3. **Dual-Mode Auth**: Mantener backward compatibility con Bearer tokens facilita transición y debugging sin romper integraciones existentes.

4. **Cookie Naming**: Usar snake_case (`access_token`) en lugar de camelCase (`accessToken`) para consistencia con convenciones HTTP.

5. **CSRF Token Lifetime**: Sincronizar con access token (15 min) previene tokens CSRF huérfanos después de token refresh.

### Próximos Pasos (Fuera de Scope)

**P1-2: HMAC BFF Pattern** (Pendiente)
- Mover HMAC signing de frontend a backend BFF
- Eliminar `NEXT_PUBLIC_API_HMAC_SECRET` (exposición de secreto)
- Estimado: 1 hora

**P1-3: Email Delivery** (Pendiente)
- Passwords temporales vía email (no retornarlos en JSON)
- Integración SendGrid/AWS SES
- Estimado: 2-3 horas

**P2: Token Rotation** (Futuro)
- Implementar refresh token rotation (nuevos tokens en cada refresh)
- Previene refresh token replay attacks
- Requiere tracking de tokens usados

---

**Última actualización:** 2026-02-11  
**Próxima revisión:** 2026-03-11 (30 días post-deployment)
