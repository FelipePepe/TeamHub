#!/bin/bash
# Script para levantar SonarQube con PostgreSQL local
# Uso: ./scripts/start-sonarqube.sh

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
CONTAINER_NAME="sonarqube"
IMAGE="sonarqube:community"
PORT="9000"
DB_URL="jdbc:postgresql://host.docker.internal:5432/sonarqube"
DB_USER="sonarqube"
DB_PASS="sonarqube"

echo "🚀 Iniciando SonarQube con PostgreSQL..."

# Verificar si PostgreSQL está corriendo
echo "📊 Verificando PostgreSQL..."
if ! pg_isready -h localhost -p 5432 -U postgres >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  PostgreSQL no está corriendo en localhost:5432${NC}"
    echo "   Asegúrate de iniciar PostgreSQL primero"
    read -p "¿Continuar de todas formas? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar si el contenedor ya existe
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "📦 Contenedor '${CONTAINER_NAME}' ya existe"
    
    # Verificar si está corriendo
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${GREEN}✅ SonarQube ya está corriendo${NC}"
        echo "   Accede en: http://localhost:${PORT}"
        echo "   Credenciales: admin/admin"
        exit 0
    else
        echo "🔄 Reiniciando contenedor existente..."
        docker start ${CONTAINER_NAME}
        echo -e "${GREEN}✅ SonarQube iniciado${NC}"
        echo "   Accede en: http://localhost:${PORT}"
        echo "   Credenciales: admin/admin"
        exit 0
    fi
fi

# Crear contenedor nuevo
echo "🆕 Creando nuevo contenedor de SonarQube..."
docker run -d \
  --name ${CONTAINER_NAME} \
  --add-host=host.docker.internal:host-gateway \
  -p ${PORT}:9000 \
  -e SONAR_JDBC_URL="${DB_URL}" \
  -e SONAR_JDBC_USERNAME="${DB_USER}" \
  -e SONAR_JDBC_PASSWORD="${DB_PASS}" \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  -v sonarqube_logs:/opt/sonarqube/logs \
  ${IMAGE}

echo -e "${GREEN}✅ SonarQube creado e iniciado correctamente${NC}"
echo ""
echo "📋 Información:"
echo "   URL: http://localhost:${PORT}"
echo "   Credenciales iniciales: admin/admin"
echo "   Base de datos: PostgreSQL (${DB_URL})"
echo ""
echo "⏳ SonarQube tardará ~1-2 minutos en iniciar completamente"
echo "   Ver logs: docker logs -f ${CONTAINER_NAME}"
echo ""
echo "🛑 Para detener: docker stop ${CONTAINER_NAME}"
echo "🗑️  Para eliminar: docker rm ${CONTAINER_NAME}"
