# API Documentation

API contracts live in `openapi.yaml` at the repository root.
The root file references modular specs under `docs/api/openapi/`:
- `docs/api/openapi/paths/` for endpoints
- `docs/api/openapi/components/` for schemas and security

Swagger (Swagger UI) debe usarse para visualizar y validar la documentacion de la API.
Generated docs can be added here later.

## Swagger UI

Con el backend en ejecucion, la UI esta disponible en:

- `http://localhost:3001/docs`
- `http://localhost:3001/openapi.yaml` (spec servido por la API)

## Validacion

Ejecuta la validacion del contrato OpenAPI con:

```bash
scripts/validate-openapi.sh
```
