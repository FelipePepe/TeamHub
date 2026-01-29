# API Documentation

## 📚 Estructura

La especificación OpenAPI 3.0.3 está modularizada:

```
openapi.yaml (raíz)
└── docs/api/openapi/
    ├── paths/          # Endpoints por módulo
    │   ├── auth.yaml          # Auth & MFA (7 endpoints)
    │   ├── usuarios.yaml      # Users CRUD (7 endpoints)
    │   ├── departamentos.yaml # Departments (5 endpoints)
    │   ├── plantillas.yaml    # Templates (10 endpoints)
    │   ├── procesos.yaml      # Processes (13 endpoints)
    │   ├── proyectos.yaml     # Projects (14 endpoints)
    │   └── timetracking.yaml  # Time tracking (13 endpoints)
    └── components/     # Schemas y seguridad
        ├── schemas/    # Modelos de datos
        └── index.yaml  # Referencias consolidadas
```

## 🚀 Swagger UI

**Visualizar la API documentada:**

- **Producción:** https://teamhub-backend-production.up.railway.app/docs
- **Local:** http://localhost:3001/docs
- **OpenAPI spec:** http://localhost:3001/openapi.yaml

## 📊 Endpoints Implementados

| Módulo | Endpoints | Estado |
|--------|-----------|--------|
| Auth & MFA | 7 | ✅ |
| Usuarios | 7 | ✅ |
| Departamentos | 5 | ✅ |
| Plantillas Onboarding | 10 | ✅ |
| Procesos Onboarding | 13 | ✅ |
| Proyectos | 8 | ✅ |
| Asignaciones | 6 | ✅ |
| Timetracking | 13 | ✅ |
| Dashboard | Computado | ✅ |
| **Total** | **149** | **100%** |

## 🔒 Seguridad

### Authentication

```http
Authorization: Bearer <jwt_access_token>
```

**Tokens:**
- **Access Token:** 15 minutos (para requests)
- **Refresh Token:** 30 días (para renovar access token)

### RBAC (Roles)

| Rol | Acceso |
|-----|--------|
| **ADMIN** | Full access a todos los recursos |
| **RRHH** | Full access a usuarios, departamentos, onboarding |
| **MANAGER** | Gestión de equipo, proyectos, aprobación horas |
| **EMPLEADO** | Lectura limitada, gestión personal |

### Rate Limiting

- **Global:** 100 requests / 60s por usuario/IP
- **Login:** 5 intentos / 60s por IP

## 🧪 Validación

### Validar OpenAPI Spec

```bash
# Desde raíz del repo
scripts/validate-openapi.sh
```

### Test con curl

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'

# Get plantillas (requiere token)
curl http://localhost:3001/api/plantillas \
  -H "Authorization: Bearer <token>"
```

## 📝 Actualizar Documentación

### Añadir nuevo endpoint

1. Editar `docs/api/openapi/paths/{modulo}.yaml`
2. Añadir schemas en `docs/api/openapi/components/schemas/{modulo}.yaml`
3. Referenciar en `openapi.yaml` (paths section)
4. Verificar en Swagger UI

### Ejemplo

```yaml
# docs/api/openapi/paths/usuarios.yaml
/usuarios:
  get:
    tags: [Usuarios]
    summary: List users
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Users list
        content:
          application/json:
            schema:
              $ref: '../components/index.yaml#/schemas/UserListResponse'
```

## 📚 Recursos

- [OpenAPI 3.0.3 Spec](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/) - Online editor
- [Backend README](../../backend/README.md)
- [ADR-064: Security Strategy](../adr/064-security-hardening-strategy.md)

---

**Última actualización:** 2026-01-29  
**Versión API:** 1.0.0  
**Estado:** ✅ Completo (149 endpoints documentados)
