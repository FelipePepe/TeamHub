# Fix: Error 401 en npm run sonar:develop

## Problema

```bash
npm run sonar:develop
# [ERROR] Bootstrapper: An error occurred: AxiosError: Request failed with status code 401
```

## Causa

El comando `sonar-scanner` no estaba usando las credenciales de `.env.sonar` porque:
1. Las variables de entorno no se exportan automáticamente al ejecutar scripts npm
2. `sonar-scanner` espera las credenciales en argumentos o en variables de entorno

## Solución Implementada

Se creó un **wrapper script** (`scripts/sonar-scanner-wrapper.sh`) que:
1. Carga automáticamente las variables de `.env.sonar`
2. Pasa las credenciales a `sonar-scanner` mediante flags `-Dsonar.login` y `-Dsonar.host.url`
3. Usa el `sonar-scanner` de `node_modules/.bin`

## Archivos Modificados

### 1. Nuevo script: `scripts/sonar-scanner-wrapper.sh`

```bash
#!/bin/bash
# Wrapper para sonar-scanner que carga las credenciales automáticamente

set -e

# Determinar el directorio raíz del proyecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Cargar variables de entorno si existen
if [ -f "$PROJECT_ROOT/.env.sonar" ]; then
    source "$PROJECT_ROOT/.env.sonar"
else
    echo "❌ Error: No se encuentra .env.sonar en $PROJECT_ROOT"
    echo "   Crea el archivo .env.sonar con SONAR_TOKEN y SONAR_HOST_URL"
    exit 1
fi

# Verificar que las variables críticas están definidas
if [ -z "$SONAR_TOKEN" ]; then
    echo "❌ Error: SONAR_TOKEN no está definido en .env.sonar"
    exit 1
fi

if [ -z "$SONAR_HOST_URL" ]; then
    echo "❌ Error: SONAR_HOST_URL no está definido en .env.sonar"
    exit 1
fi

# Usar el sonar-scanner de node_modules
SONAR_SCANNER="$PROJECT_ROOT/node_modules/.bin/sonar-scanner"

if [ ! -f "$SONAR_SCANNER" ]; then
    echo "❌ Error: sonar-scanner no encontrado en $SONAR_SCANNER"
    echo "   Instala las dependencias con: npm install"
    exit 1
fi

# Ejecutar sonar-scanner con credenciales
exec "$SONAR_SCANNER" \
    -Dsonar.login="$SONAR_TOKEN" \
    -Dsonar.host.url="$SONAR_HOST_URL" \
    "$@"
```

### 2. Modificado: `package.json`

**Antes:**
```json
"sonar:scan:backend": "cd backend && sonar-scanner",
"sonar:scan:frontend": "cd frontend && sonar-scanner",
"sonar:develop": "npm run test:coverage && cd backend && sonar-scanner -Dsonar.projectKey=TeamHub-backend-develop ...",
```

**Después:**
```json
"sonar:scan:backend": "cd backend && bash ../scripts/sonar-scanner-wrapper.sh",
"sonar:scan:frontend": "cd frontend && bash ../scripts/sonar-scanner-wrapper.sh",
"sonar:develop": "npm run test:coverage && cd backend && bash ../scripts/sonar-scanner-wrapper.sh -Dsonar.projectKey=TeamHub-backend-develop ...",
```

## Uso

Ahora **NO es necesario** hacer `source .env.sonar` antes de ejecutar los scripts npm:

```bash
# Funciona directamente
npm run sonar
npm run sonar:develop
npm run sonar:scan:backend
npm run sonar:scan:frontend
```

El wrapper carga automáticamente las credenciales desde `.env.sonar`.

## Verificación

### Test del Wrapper

```bash
cd backend
bash ../scripts/sonar-scanner-wrapper.sh -Dsonar.projectKey=TeamHub-backend-test
```

Debería mostrar:
```
[INFO] ANALYSIS SUCCESSFUL, you can find the results at: http://localhost:9000/dashboard?id=TeamHub-backend-test
```

### Test de Scripts NPM

```bash
# Solo backend (más rápido)
npm run sonar:scan:backend

# Backend de develop
cd backend && bash ../scripts/sonar-scanner-wrapper.sh -Dsonar.projectKey=TeamHub-backend-develop -Dsonar.projectName='TeamHub Backend (develop)'

# Completo
npm run sonar
```

## Troubleshooting

### Error: ".env.sonar no encontrado"

**Causa:** El archivo `.env.sonar` no existe.

**Solución:**
```bash
cp .env.sonar.example .env.sonar
# Editar y añadir tu token
nano .env.sonar
```

### Error: "SONAR_TOKEN no está definido"

**Causa:** El archivo `.env.sonar` no tiene la variable `SONAR_TOKEN`.

**Solución:**
```bash
# Verificar contenido
cat .env.sonar | grep SONAR_TOKEN

# Si falta, añadir:
echo "SONAR_TOKEN=squ_tu_token_aqui" >> .env.sonar
```

### Error: "sonar-scanner no encontrado"

**Causa:** Las dependencias npm no están instaladas.

**Solución:**
```bash
npm install
```

### Error: "Request failed with status code 401" (persiste)

**Causa:** El token es inválido o expiró.

**Verificar:**
```bash
source .env.sonar
curl -u "$SONAR_TOKEN": http://localhost:9000/api/authentication/validate
```

Debe retornar: `{"valid":true}`

**Solución:**
1. Ir a http://localhost:9000
2. Login como admin
3. My Account → Security → Generate Token
4. Copiar el nuevo token a `.env.sonar`

### Error: "Connection refused"

**Causa:** SonarQube no está corriendo.

**Solución:**
```bash
./scripts/start-sonarqube.sh
# Esperar ~30 segundos
curl http://localhost:9000/api/system/status
```

## Ventajas de Esta Solución

1. ✅ **No requiere `source .env.sonar`** antes de cada comando
2. ✅ **Reutilizable** en todos los scripts npm
3. ✅ **Validación automática** de variables requeridas
4. ✅ **Mensajes de error claros** si falta configuración
5. ✅ **Compatible** con CI/CD (se pueden pasar variables de entorno)
6. ✅ **Seguro**: No expone credenciales en los comandos

## Integración con CI/CD

Para GitHub Actions u otros CI/CD:

```yaml
# .github/workflows/sonar.yml
- name: SonarQube Analysis
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
  run: |
    # Las variables ya están en el ambiente
    npm run sonar:develop
```

El wrapper detectará que las variables ya están en el ambiente y las usará directamente.

## Notas Técnicas

### Por qué no usar directamente `sonar.login` en sonar-project.properties

Los tokens no deben estar hardcodeados en archivos versionados. El wrapper permite:
- Mantener `.env.sonar` fuera de Git
- Usar diferentes tokens por ambiente (dev, staging, prod)
- Rotar tokens sin modificar código

### Compatibilidad con sonar-scanner global

Si tienes `sonar-scanner` instalado globalmente, el wrapper sigue funcionando porque:
1. Siempre usa el de `node_modules/.bin` (aislamiento)
2. Las credenciales se pasan explícitamente via flags
3. No depende de variables globales del sistema

## Referencias

- [SonarScanner for npm](https://www.npmjs.com/package/sonarqube-scanner)
- [SonarQube Authentication](https://docs.sonarsource.com/sonarqube/latest/user-guide/user-account/generating-and-using-tokens/)
