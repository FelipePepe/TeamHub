---
name: rule-security
description: Security and configuration standards (SSDLC) for this repo. Load this skill when working on authentication, environment variables, API validation, secrets management, MFA, CSRF, headers, or SQL/XSS injection prevention. Triggers on: security, auth, authentication, MFA, 2FA, password, secrets, .env, API key, JWT, token, CSRF, XSS, SQL injection, Zod, validation, headers, CSP, HTTPS, seguridad, autenticación, secretos, validación.
---

# Seguridad y Configuración (SSDLC)

## Validación Fail-Fast con Zod
- Usa **Zod** para validar variables de entorno **y** entradas de API en tiempo de ejecución.
- La aplicación **no debe arrancar** con configuración inválida — falla rápido en el boot.

```typescript
// ✅ Correcto: validación en el arranque
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});
const env = envSchema.parse(process.env); // lanza si inválido
```

## Gestión de Secretos
- **Prohibido** subir secretos al repositorio (claves API, passwords, tokens).
- Usa `.env` (ignorado por Git vía `.gitignore`) para valores reales.
- Usa `.env.example` como plantilla pública sin valores reales.
- gitleaks está activo en pre-commit: detectará secretos antes del push.

## Headers de Seguridad
Implementar en todas las respuestas HTTP:
- **CSP estricto** (Content Security Policy)
- `X-Frame-Options: DENY`
- Forzar **HTTPS** en producción

## Prevención de Inyecciones
- Usa siempre **Prepared Statements** o el escapado automático del ORM (Drizzle).
- **Nunca** concatenar input de usuario en queries SQL.
- Para XSS: confiar en el escapado de React/Next.js; no usar `dangerouslySetInnerHTML` con input externo.

## MFA — Regla Absoluta

**NUNCA deshabilitar MFA bajo ninguna circunstancia.**

| Situación | Acción correcta |
|-----------|-----------------|
| Usuario perdió acceso a MFA | Usar códigos de recuperación o regenerarlos desde la base de datos |
| Solicitud de deshabilitar MFA | Rechazar y documentar |
| "Solo temporalmente" | Rechazar — no existe "temporalmente" en seguridad |

MFA es una capa crítica de seguridad que NO se puede comprometer.
