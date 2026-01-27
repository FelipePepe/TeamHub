#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/config.sh"

# Función para generar código con Auto (Cursor AI)
generate_with_auto() {
    local prompt="$1"
    local output_file="${2:-${GENERATED_CODE}}"
    
    echo "🤖 Generando código con Auto (Cursor AI)..."
    echo "📝 Prompt: ${prompt}"
    
    # Crear directorio de contexto si no existe
    mkdir -p "${CONTEXT_DIR}"
    
    # Generar instrucciones para Auto
    cat > "${AUTO_INSTRUCTIONS}" <<EOF
# Instrucciones para Auto - Generación de Código

## Tarea
Genera el siguiente código según las especificaciones:

**Prompt:** ${prompt}

## Requisitos
- Seguir los estándares del proyecto (ver AGENTS.md)
- Clean Code (complejidad ciclomática < 5)
- Validación con Zod cuando corresponda
- JSDoc/TSDoc para funciones complejas
- Tests cuando sea apropiado

## Output
Escribe el código completo en: \`${output_file}\`

## Contexto del Proyecto
- Backend: Hono + TypeScript + Drizzle ORM
- Frontend: Next.js 15 + React 19 + TanStack Query
- Estructura: Ver README.md y documentación en docs/

EOF
    
    echo "📋 Instrucciones generadas en: ${AUTO_INSTRUCTIONS}"
    echo ""
    echo "💡 Para usar Auto:"
    echo "   1. Abre este archivo: ${AUTO_INSTRUCTIONS}"
    echo "   2. Pide a Auto que genere el código según las instrucciones"
    echo "   3. Auto guardará el resultado en: ${output_file}"
    echo ""
    echo "⏳ Esperando que Auto genere el código..."
    echo "   (Presiona Enter cuando Auto haya completado la generación)"
    
    read -r
    
    # Verificar que el archivo fue generado
    if [[ -f "${output_file}" ]] && [[ -s "${output_file}" ]]; then
        echo "✅ Código generado en: ${output_file}"
        return 0
    else
        echo "⚠️  Archivo no encontrado o vacío. ¿Auto completó la generación?" >&2
        return 1
    fi
}

# Función para generar código con GitHub Copilot CLI
generate_code() {
    local prompt="$1"
    local output_file="${2:-${GENERATED_CODE}}"
    
    # Si el generador es "auto", usar función específica
    if [[ "${GENERATOR_CLI}" == "auto" ]]; then
        generate_with_auto "${prompt}" "${output_file}"
        return $?
    fi
    
    echo "🤖 Generando código con ${GENERATOR_CLI}..."
    echo "📝 Prompt: ${prompt}"
    
    # Crear directorio de contexto si no existe
    mkdir -p "${CONTEXT_DIR}"
    
    # Llamar al CLI correspondiente
    # Nota: Ajustar según la sintaxis real del CLI
    if command -v "${GENERATOR_CLI}" >/dev/null 2>&1; then
        "${GENERATOR_CLI}" generate --prompt "${prompt}" > "${output_file}" 2>&1 || {
            echo "❌ Error al generar código" >&2
            return 1
        }
    else
        echo "❌ ${GENERATOR_CLI} no está instalado o no está en PATH" >&2
        if [[ "${GENERATOR_CLI}" == "copilot" ]]; then
            echo "💡 Instala GitHub Copilot CLI: npm install -g @githubnext/github-copilot-cli" >&2
            echo "   El comando se llama 'copilot', no 'github-copilot-cli'" >&2
        fi
        return 1
    fi
    
    echo "✅ Código generado en: ${output_file}"
    return 0
}

# Función para mejorar código basado en feedback
improve_code() {
    local feedback_file="$1"
    local current_code="$2"
    local output_file="$3"
    
    if [[ ! -f "${feedback_file}" ]] || [[ ! -f "${current_code}" ]]; then
        echo "❌ Archivos requeridos no encontrados" >&2
        return 1
    fi
    
    echo "🔄 Mejorando código basado en feedback..."
    
    local prompt="Mejora el siguiente código según este feedback:
    
FEEDBACK:
$(cat "${feedback_file}")

CÓDIGO ACTUAL:
$(cat "${current_code}")

Genera el código mejorado siguiendo todas las sugerencias del feedback:"
    
    generate_code "${prompt}" "${output_file}"
}

# Si se ejecuta directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -lt 1 ]]; then
        echo "Uso: $0 <prompt> [output_file]" >&2
        echo "   o: $0 improve <feedback_file> <current_code> <output_file>" >&2
        exit 1
    fi
    
    if [[ "$1" == "improve" ]]; then
        if [[ $# -lt 4 ]]; then
            echo "Uso: $0 improve <feedback_file> <current_code> <output_file>" >&2
            exit 1
        fi
        improve_code "$2" "$3" "$4"
    else
        generate_code "$1" "${2:-}"
    fi
fi
