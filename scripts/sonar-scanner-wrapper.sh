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
