#!/bin/bash

# Script para configurar el MCP de SonarQube con Copilot/Codex CLI
# Este script exporta las variables de entorno necesarias

set -e

echo "🔧 Configurando SonarQube MCP para Codex CLI"
echo "=============================================="
echo ""

# Verificar que existe .env.sonar
if [ ! -f .env.sonar ]; then
    echo "❌ Error: No se encuentra .env.sonar"
    echo "   Por favor, copia .env.sonar.example a .env.sonar y configúralo"
    exit 1
fi

# Verificar que existe .mcp.json
if [ ! -f .mcp.json ]; then
    if [ -f .mcp.json.example ]; then
        echo "📋 Copiando .mcp.json.example a .mcp.json..."
        cp .mcp.json.example .mcp.json
    else
        echo "❌ Error: No se encuentra .mcp.json ni .mcp.json.example"
        exit 1
    fi
fi

# Cargar y exportar variables de .env.sonar
source .env.sonar

echo "✅ Variables exportadas:"
echo "   SONARQUBE_URL: $SONARQUBE_URL"
echo "   SONARQUBE_TOKEN: ${SONARQUBE_TOKEN:0:10}..." # Solo mostrar primeros 10 caracteres
echo ""

# Verificar que Docker está corriendo
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo"
    exit 1
fi

# Verificar que la imagen existe
if ! docker images | grep -q "mcp/sonarqube"; then
    echo "⚠️  Advertencia: La imagen mcp/sonarqube no está construida"
fi

# Verificar que SonarQube está corriendo
if ! curl -s http://localhost:9000/api/system/status >/dev/null 2>&1; then
    echo "⚠️  Advertencia: SonarQube no está respondiendo en http://localhost:9000"
    echo "   Inicia SonarQube con: ./scripts/start-sonarqube.sh"
fi

echo "✅ Configuración completa"
echo ""
echo "Para usar el MCP de SonarQube en Codex CLI:"
echo "1. Asegúrate de que SonarQube está corriendo"
echo "2. Ejecuta: source .env.sonar"
echo "3. Inicia Codex: codex"
echo ""
echo "El MCP estará disponible como 'sonarqube' en tu sesión"
