# Contribuir

Gracias por tu interes en contribuir a TeamHub.

## Requisitos
- Node.js 20+ y npm 10+
- PostgreSQL 16 (local o Docker)
- Variables de entorno segun `README.md`

## Flujo de trabajo
1. Fork del repositorio.
2. Crear rama (`git checkout -b feature/mi-cambio`).
3. Instalar dependencias:
   ```bash
   npm install                  # Raíz (Husky)
   cd backend && npm install
   cd frontend && npm install
   ```
4. Setup de security gates:
   ```bash
   npm run prepare              # Instala hooks de Husky
   ./scripts/setup-gitleaks.sh  # Instala gitleaks para secrets detection
   ```
5. Ejecutar lint, type-check y tests antes de commit.
6. Abrir Pull Request describiendo el cambio.

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

### Husky Hooks (Quality Gates)
Los hooks de Husky son **obligatorios** y no deben omitirse con `--no-verify`.

#### Pre-commit
- ✅ Validación de nombre de rama (GitFlow)
- ✅ Secrets detection con gitleaks (API keys, passwords, tokens)

#### Commit-msg
- ✅ Validación de Conventional Commits

#### Pre-push
- ✅ Bloqueo de push directo a `main`/`develop`
- ✅ Validación de OpenAPI schema
- ✅ Linting (backend + frontend)
- ✅ Type checking (backend + frontend)
- ✅ Tests (backend + frontend)
- ✅ Security audit (npm audit --audit-level=high)

**⚠️ Si un hook falla:**
1. Leer el error completo
2. Corregir el problema en el código
3. Reintentar sin `--no-verify`

### Verificación de Hooks

```bash
# Test secrets detection
echo "aws_key = AKIAIOSFODNN7EXAMPLE" > test.txt
git add test.txt
git commit -m "test: verify gitleaks"
# Debe fallar ❌

# Test pre-push
git push origin feature/test
# Ejecuta linting, type-check, tests y audit
```

### Documentación
- Mantener `openapi.yaml` actualizado y validarlo con `scripts/validate-openapi.sh`
- Actualizar `docs/decisiones.md` al completar trabajo significativo
- Añadir JSDoc/TSDoc a funciones nuevas
