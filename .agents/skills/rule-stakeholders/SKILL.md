---
name: rule-stakeholders
description: Communication guidelines for non-technical stakeholders in this project. Load this skill when summarizing changes for non-technical profiles, writing release notes for business audiences, or translating technical improvements into business value. Triggers on: stakeholder, presenta, summary, resumen, explain to, non-technical, business impact, ROI, release notes para negocio, explicar cambios, comunicar al cliente.
---

# Comunicación con Stakeholders

Al resumir cambios para perfiles no técnicos:

## Prohibido el Jargon Técnico

| ❌ No usar | ✅ Usar en su lugar |
|-----------|-------------------|
| "re-renders", "hooks" | "velocidad de respuesta", "fluidez" |
| "refactoring", "tech debt" | "mantenibilidad", "reducción de errores futuros" |
| "CI/CD pipeline" | "proceso automático de validación antes de publicar" |
| "coverage 90%" | "el 90% del código tiene tests automáticos" |
| "SQL migration" | "actualización de la base de datos" |
| "N:M relationship" | "proyectos pueden pertenecer a varios departamentos y viceversa" |

## Enfoque en ROI

Traduce mejoras técnicas en beneficios de negocio concretos:

- "Reducción del tiempo de carga en un 20%" en lugar de "optimizamos el bundle"
- "Los errores en producción se detectan automáticamente" en lugar de "integramos Sentry"
- "El equipo puede añadir empleados a proyectos más rápido" en lugar de "filtramos por departamento"

## Estructura para Resúmenes de Release

1. **Qué mejora para el usuario final** (1-2 frases en lenguaje natural)
2. **Qué se corrigió** (bugs, en lenguaje de impacto, no técnico)
3. **Qué queda pendiente** (si aplica)
