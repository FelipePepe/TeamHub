# Matriz de trazabilidad E2E

Relacion caso de uso (`use-cases.catalog.ts`) con archivo spec Playwright objetivo para implementacion por bloques.

- Total casos: 31
- Implementados: 17
- Pendientes: 14

## Bloques recomendados

- **Bloque A (P0):** implementado.
- **Bloque B (P1 auth/departamentos/usuarios):** implementado.
- **Bloque C (P1 dominio):** plantillas, procesos, proyectos y timetracking avanzado.
- **Bloque D (hardening):** sesion/refresh cross-cutting y perfil MFA.

## Matriz caso -> spec

| Caso | Prioridad | Modulo | Tipo | Estado | Bloque | Spec actual | Spec objetivo |
|---|---|---|---|---|---|---|---|
| E2E-AUTH-001 | P0 | auth | smoke | Implementado | - | frontend/e2e/login.spec.ts | frontend/e2e/login.spec.ts |
| E2E-AUTH-002 | P0 | auth | negative | Implementado | - | frontend/e2e/login.spec.ts | frontend/e2e/login.spec.ts |
| E2E-AUTH-003 | P0 | auth | smoke | Implementado | - | frontend/e2e/block-a-smoke.spec.ts | frontend/e2e/block-a-smoke.spec.ts |
| E2E-DEP-001 | P0 | departamentos | smoke | Implementado | - | frontend/e2e/departamentos-crud.spec.ts | frontend/e2e/departamentos-crud.spec.ts |
| E2E-DEP-002 | P0 | departamentos | regression | Implementado | - | frontend/e2e/departamentos-crud.spec.ts | frontend/e2e/departamentos-crud.spec.ts |
| E2E-DEP-006 | P0 | departamentos | security | Implementado | - | frontend/e2e/block-a-smoke.spec.ts | frontend/e2e/block-a-smoke.spec.ts |
| E2E-NAV-001 | P0 | navigation | smoke | Implementado | - | frontend/e2e/navigation.spec.ts | frontend/e2e/navigation.spec.ts |
| E2E-NAV-002 | P0 | navigation | security | Implementado | - | frontend/e2e/block-a-smoke.spec.ts | frontend/e2e/block-a-smoke.spec.ts |
| E2E-PRJ-001 | P0 | proyectos | regression | Implementado | - | frontend/e2e/block-a-smoke.spec.ts | frontend/e2e/block-a-smoke.spec.ts |
| E2E-TTR-001 | P0 | timetracking | smoke | Implementado | - | frontend/e2e/block-a-smoke.spec.ts | frontend/e2e/timetracking.flows.spec.ts |
| E2E-AUTH-004 | P1 | auth | security | Implementado | - | frontend/e2e/auth.flows.spec.ts | frontend/e2e/auth.flows.spec.ts |
| E2E-DEP-003 | P1 | departamentos | regression | Implementado | - | frontend/e2e/departamentos.management.spec.ts | frontend/e2e/departamentos.management.spec.ts |
| E2E-DEP-004 | P1 | departamentos | negative | Implementado | - | frontend/e2e/departamentos.management.spec.ts | frontend/e2e/departamentos.management.spec.ts |
| E2E-DEP-005 | P1 | departamentos | regression | Implementado | - | frontend/e2e/departamentos.management.spec.ts | frontend/e2e/departamentos.management.spec.ts |
| E2E-PLA-001 | P1 | plantillas | regression | Pendiente | C | - | frontend/e2e/plantillas.flows.spec.ts |
| E2E-PLA-002 | P1 | plantillas | regression | Pendiente | C | - | frontend/e2e/plantillas.flows.spec.ts |
| E2E-PRJ-002 | P1 | proyectos | regression | Pendiente | C | - | frontend/e2e/proyectos.flows.spec.ts |
| E2E-PRJ-003 | P1 | proyectos | security | Pendiente | C | - | frontend/e2e/proyectos.flows.spec.ts |
| E2E-PRO-001 | P1 | procesos | regression | Pendiente | C | - | frontend/e2e/procesos.flows.spec.ts |
| E2E-PRO-002 | P1 | procesos | regression | Pendiente | C | - | frontend/e2e/procesos.flows.spec.ts |
| E2E-PRO-003 | P1 | procesos | negative | Pendiente | C | - | frontend/e2e/procesos.flows.spec.ts |
| E2E-SEC-001 | P1 | cross-cutting | security | Pendiente | D | - | frontend/e2e/session-resilience.spec.ts |
| E2E-SEC-002 | P1 | cross-cutting | security | Pendiente | D | - | frontend/e2e/session-resilience.spec.ts |
| E2E-SEC-003 | P1 | cross-cutting | regression | Implementado | - | frontend/e2e/theme-appearance.spec.ts | frontend/e2e/theme-appearance.spec.ts |
| E2E-TTR-002 | P1 | timetracking | negative | Pendiente | C | - | frontend/e2e/timetracking.flows.spec.ts |
| E2E-TTR-003 | P1 | timetracking | negative | Pendiente | C | - | frontend/e2e/timetracking.flows.spec.ts |
| E2E-TTR-004 | P1 | timetracking | regression | Pendiente | C | - | frontend/e2e/timetracking.flows.spec.ts |
| E2E-USR-001 | P1 | usuarios | regression | Implementado | - | frontend/e2e/usuarios.flows.spec.ts | frontend/e2e/usuarios.flows.spec.ts |
| E2E-USR-002 | P1 | usuarios | negative | Implementado | - | frontend/e2e/usuarios.flows.spec.ts | frontend/e2e/usuarios.flows.spec.ts |
| E2E-PERF-001 | P2 | perfil | regression | Pendiente | D | - | frontend/e2e/perfil.flows.spec.ts |
| E2E-PERF-002 | P2 | perfil | security | Pendiente | D | - | frontend/e2e/perfil.flows.spec.ts |

## Notas

- Los casos con `Spec actual` se consideran cubiertos y deben mantenerse en regresion.
- Para evitar specs gigantes, separar por modulo y mantener `*.spec.ts` por flujo principal.
- Mantener esta matriz sincronizada al agregar o cerrar casos del catalogo.
