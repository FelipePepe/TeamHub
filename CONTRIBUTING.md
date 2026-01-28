# Contribuir

Gracias por tu interes en contribuir a TeamHub.

## Requisitos
- Node.js 20+ y npm 10+
- PostgreSQL 16 (local o Docker)
- Variables de entorno segun `README.md`

## Flujo de trabajo
1. Fork del repositorio.
2. Crear rama (`git checkout -b feature/mi-cambio`).
3. Instalar dependencias en `backend/` y `frontend/`.
4. Ejecutar lint, type-check y tests.
5. Abrir Pull Request describiendo el cambio.

## Convenciones de commits
Seguimos [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` Nueva funcionalidad
- `fix:` Correccion de bug
- `docs:` Documentacion
- `style:` Formateo, sin cambios de codigo
- `refactor:` Refactorizacion
- `test:` Tests
- `chore:` Mantenimiento

## Calidad y gates
- No omitir el hook `pre-push` de Husky.
- Mantener `openapi.yaml` actualizado y validarlo con `scripts/validate-openapi.sh`.
