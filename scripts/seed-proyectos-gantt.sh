#!/bin/bash
# Script para ejecutar el seed de proyectos
# Ajustar las variables de conexión según tu configuración

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-teamhub}"
DB_USER="${DB_USER:-postgres}"

echo "🌱 Sembrando datos de prueba para Diagrama Gantt..."
echo "📦 Conectando a: $DB_HOST:$DB_PORT/$DB_NAME"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/seed-proyectos-gantt.sql"

if [ $? -eq 0 ]; then
  echo "✅ Datos de prueba insertados correctamente"
  echo "🔄 Recarga la página de Timetracking para ver los gráficos"
else
  echo "❌ Error al insertar datos de prueba"
  exit 1
fi
