# Checklist de Documentacion Pendiente

Lista de tareas pendientes en documentacion funcional y tecnica (frontend y backend).

## Frontend - Funcional (`docs/frontend/funcional.md`)
- [x] Completar detalle por vista.
  - [x] Login / Registro.
  - [x] Dashboard por rol.
  - [x] Departamentos.
  - [x] Empleados.
  - [x] Onboarding (plantillas, procesos, mis tareas).
    - [x] Plantillas.
    - [x] Procesos.
    - [x] Mis tareas.
  - [x] Proyectos y asignaciones.
    - [x] Proyectos.
    - [x] Asignaciones.
  - [x] Timetracking.
  - [x] Perfil.
- [x] Anadir wireflows y casos de error.
  - [x] Casos de error: Login/Registro.
  - [x] Casos de error: Dashboard por rol.
  - [x] Casos de error: Departamentos.
  - [x] Casos de error: Empleados.
  - [x] Casos de error: Onboarding.
  - [x] Casos de error: Proyectos y asignaciones.
  - [x] Casos de error: Timetracking.
  - [x] Casos de error: Perfil.
  - [x] Wireflows generales.

## Frontend - Tecnico (`docs/frontend/tecnico.md`)
- [x] Definir estructura final de rutas.
- [x] Definir estructura de providers.
- [x] Definir convenciones de testing.

## Backend - Funcional (`docs/backend/funcional.md`)
- [x] Detallar endpoints por recurso.
- [x] Anadir codigos de error y ejemplos.

## Backend - Tecnico (`docs/backend/tecnico.md`)
- [x] Definir estructura de logging.
- [x] Definir estrategia de tests.
- [x] Definir politicas de rate limit global.

## Arquitectura y decisiones
- [x] Consolidar ADRs en `docs/decisiones.md`.
- [x] Crear plantilla ADR en `docs/adr/adr-template.md`.
- [x] Crear SAD en `docs/architecture/sad.md`.
- [x] Crear diagrama de arquitectura en `docs/architecture/architecture-diagram.mmd`.

## Infraestructura
- [x] Documentar variables de entorno en `docs/architecture/env-vars.md`.
- [x] Crear ejemplos por entorno (.env.development/.env.production/.env.test).
- [x] Documentar estructura de base de datos en `docs/architecture/database-schema.md`.
- [x] Documentar despliegue y CI/CD en `docs/architecture/deploy.md`.
- [x] Definir pipeline en `.github/workflows/ci.yml`.
- [x] Añadir husky con hook pre-push en `.husky/pre-push`.

## Calidad y testing
- [x] Documentar estrategia de testing en `docs/quality/testing.md`.
- [x] Incluir casos negativos y umbrales de cobertura en `docs/quality/testing.md`.

## Slides
- [x] Crear guion de slides en `docs/slides/outline.md`.
- [x] Crear notas de presentacion en `docs/slides/notes.md`.
