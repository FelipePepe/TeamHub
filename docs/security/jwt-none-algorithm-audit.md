# Auditoría de Seguridad: JWT "None Algorithm" Attack

**Fecha:** 2026-02-03  
**Auditor:** Security Review  
**Librería:** jsonwebtoken@9.0.3  
**Severidad Potencial:** CRÍTICA (CVE-2015-9235)

---

## Vulnerabilidad Descrita

**Attack Vector:**
1. Interceptar un JWT válido del usuario
2. Modificar el header: `{"alg": "HS256"}` → `{"alg": "none"}`
3. Modificar el payload: `{"role": "EMPLEADO"}` → `{"role": "ADMIN"}`
4. Eliminar la firma (signature)
5. Enviar el token malicioso al servidor

**Impacto:** Privilege escalation - Usuario normal obtiene privilegios de ADMIN sin autenticación.

---

## Resultado de Tests

### Test 1: Token con alg:none
```
Token: eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjMiLCJyb2xlIjoiQURNSU4ifQ.
Resultado: ✅ PROTEGIDO
Error: "jwt signature is required"
```

### Test 2: Token con alg:None (mayúsculas)
```
Resultado: ✅ PROTEGIDO
Error: "jwt signature is required"
```

### Test 3: Token con alg:NONE (todo mayúsculas)
```
Resultado: ✅ PROTEGIDO
Error: "jwt signature is required"
```

### Test 4: Token sin firma (sin punto final)
```
Resultado: ✅ PROTEGIDO
Error: "jwt malformed"
```

### Test 5: Verificación con secret vacío
```
Resultado: ✅ PROTEGIDO
Error: "please specify 'none' in 'algorithms' to verify unsigned tokens"
```

---

## Análisis de Código

### Código Actual
```typescript
// backend/src/services/auth-service.ts:94-104
export const verifyAccessToken = (token: string) => {
  const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as {
    sub: string;
    role: string;
    type?: string;
  };
  if (payload.type) {
    throw new Error('Invalid access token');
  }
  return payload;
};
```

**Observaciones:**
- ❌ No especifica explícitamente `algorithms: ['HS256']`
- ✅ Pero jsonwebtoken@9.0.3 rechaza `alg:none` por defecto
- ✅ Requiere firma obligatoria desde v5.0.0+ (año 2016)

---

## Conclusión

### ✅ NO VULNERABLE

El sistema **NO es vulnerable** al ataque "none algorithm" por las siguientes razones:

1. **Librería Parcheada:** jsonwebtoken@9.0.3 incluye protección nativa desde v5.0.0
2. **Firma Obligatoria:** La librería rechaza tokens sin firma con error explícito
3. **Sin Deprecation:** No hay vulnerabilidades reportadas en npm audit
4. **Defense in Depth:** MFA obligatorio añade capa adicional de protección

### Protecciones Actuales
- ✅ jsonwebtoken requiere firma por defecto
- ✅ MFA obligatorio (incluso con JWT válido robado)
- ✅ Tokens de corta duración (15 minutos)
- ✅ HTTPS obligatorio (previene MITM)
- ✅ Rate limiting en endpoints de autenticación

---

## Recomendación de Mejora (Best Practice)

### Código Mejorado (Defense in Depth)
```typescript
export const verifyAccessToken = (token: string) => {
  const payload = jwt.verify(token, config.JWT_ACCESS_SECRET, {
    algorithms: ['HS256'] // ✅ Explicit whitelist
  }) as {
    sub: string;
    role: string;
    type?: string;
  };
  if (payload.type) {
    throw new Error('Invalid access token');
  }
  return payload;
};
```

**Beneficio:** Whitelist explícita de algoritmos aceptados (defense in depth).

**Urgencia:** ⚠️ BAJA - La protección actual es efectiva, pero la mejora añade una capa adicional de seguridad.

---

## Referencias

- [CVE-2015-9235](https://nvd.nist.gov/vuln/detail/CVE-2015-9235) - Parcheado en jsonwebtoken v5.0.0+
- [Auth0 JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook) - Sección "None Algorithm Attack"
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- ADR-064: Security Hardening Strategy

---

**Firma Digital:**  
Tests ejecutados: 2026-02-03T22:58:00Z  
Versión jsonwebtoken: 9.0.3  
Status: ✅ PASS
