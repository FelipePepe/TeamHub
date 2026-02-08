# ADR-091: Mitigación de Dependencias Abandonadas en jsonwebtoken

**Fecha:** 2026-02-08  
**Estado:** Aceptado  
**Contexto:** Auditoría de Seguridad (M19)

## Contexto

La librería `jsonwebtoken@9.0.2` depende de paquetes individuales de lodash (`lodash.includes`, `lodash.isboolean`, etc.) que están abandonados sin mantenimiento activo. Esto incrementa la superficie de ataque y puede presentar vulnerabilidades no parchadas.

**Opciones evaluadas:**

1. **Migrar a `jose`**: Librería moderna sin dependencias lodash, con soporte nativo de Web Crypto API y Edge Runtime. Requiere refactorización significativa de la lógica de JWT.

2. **Mantener `jsonwebtoken` con monitoreo activo**: Continuar usando jsonwebtoken pero con vigilancia continua de CVEs y plan de migración documentado.

## Decisión

**MANTENER `jsonwebtoken` con monitoreo activo** por las siguientes razones:

1. **Madurez y estabilidad**: jsonwebtoken es la librería JWT más madura del ecosistema Node.js con 10+ años de desarrollo.
2. **Coste de migración**: Refactorizar toda la lógica de autenticación (backend + tests) requiere esfuerzo significativo.
3. **Riesgo controlado**: Las sub-dependencias lodash están en modo "mantenimiento mínimo" pero no tienen CVEs críticos activos.
4. **Plan de contingencia**: Si se detecta un CVE crítico, la migración a `jose` está documentada como opción.

## Consecuencias

### Positivas
- **Estabilidad**: No se introduce riesgo de regresión por cambio de librería.
- **Priorización**: Recursos se enfocan en hallazgos de mayor impacto (CRITICAL/HIGH).
- **Documentación**: Decisión explícita y rastreada para futuras revisiones.

### Negativas
- **Deuda técnica**: Se mantiene dependencia de lodash abandonado.
- **Vigilancia requerida**: Necesidad de monitorear CVEs activamente.

### Acciones de Mitigación

1. **Renovate Bot**: Configurar actualización automática de jsonwebtoken.
2. **Snyk/Dependabot**: Alertas automáticas de vulnerabilidades en lodash.
3. **ADR de migración**: Si se detecta CVE crítico (CVSS ≥ 8.0), activar migración a `jose`.

## Referencias

- [jose - Modern JWT library](https://github.com/panva/jose)
- [jsonwebtoken security advisories](https://github.com/auth0/node-jsonwebtoken/security)
- M19: jsonwebtoken con sub-dependencias lodash abandonadas (Auditoría de Seguridad)
