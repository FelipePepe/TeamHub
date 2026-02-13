#!/bin/bash
# Script para analizar diferentes ramas en SonarQube Community Edition
# Uso: ./scripts/sonar-analyze-branch.sh [main|develop]

set -e

BRANCH=${1:-$(git branch --show-current)}
CURRENT_BRANCH=$(git branch --show-current)

# Cargar variables de entorno
if [ -f .env.sonar ]; then
    export $(cat .env.sonar | grep -v '^#' | xargs)
else
    echo "❌ Error: No se encontró .env.sonar"
    exit 1
fi

echo "📊 Analizando rama: $BRANCH"
echo "🌿 Rama actual: $CURRENT_BRANCH"

case $BRANCH in
    main)
        echo "🔍 Proyecto: TeamHub (main)"
        if [ "$CURRENT_BRANCH" != "main" ]; then
            echo "⚠️  Cambiando a rama main..."
            git checkout main
            git pull origin main
        fi
        npm run sonar:main
        ;;
    develop)
        echo "🔍 Proyecto: TeamHub-develop"
        if [ "$CURRENT_BRANCH" != "develop" ]; then
            echo "⚠️  Cambiando a rama develop..."
            git checkout develop
            git pull origin develop
        fi
        npm run sonar:develop
        ;;
    *)
        echo "❌ Rama no soportada: $BRANCH"
        echo "💡 Ramas disponibles: main, develop"
        exit 1
        ;;
esac

echo "✅ Análisis completado"
echo "🌐 Ver resultados:"
if [ "$BRANCH" = "main" ]; then
    echo "   http://localhost:9000/dashboard?id=TeamHub"
else
    echo "   http://localhost:9000/dashboard?id=TeamHub-develop"
fi

# Volver a la rama original si es necesario
if [ "$CURRENT_BRANCH" != "$BRANCH" ] && [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "develop" ]; then
    echo "🔄 Volviendo a rama: $CURRENT_BRANCH"
    git checkout "$CURRENT_BRANCH"
fi
