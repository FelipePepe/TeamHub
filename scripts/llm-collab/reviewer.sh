#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/config.sh"

# Función para revisar código con Auto (Cursor AI)
review_with_auto() {
    local code_file="$1"
    local feedback_file="${2:-${REVIEW_FEEDBACK}}"
    
    if [[ ! -f "${code_file}" ]]; then
        echo "❌ Archivo de código no encontrado: ${code_file}" >&2
        return 1
    fi
    
    echo "🔍 Revisando código con Auto (Cursor AI)..."
    
    # Crear directorio de contexto si no existe
    mkdir -p "${CONTEXT_DIR}"
    
    # Leer AGENTS.md para contexto
    local agents_md="${REPO_ROOT}/AGENTS.md"
    local agents_context=""
    if [[ -f "${agents_md}" ]]; then
        agents_context=$(head -100 "${agents_md}")
    fi
    
    # Generar instrucciones para Auto
    cat > "${AUTO_INSTRUCTIONS}" <<EOF
# Instrucciones para Auto - Revisión de Código

## Tarea
Revisa el siguiente código según los estándares del proyecto TeamHub y genera feedback estructurado.

## Estándares del Proyecto
${agents_context}

## Reglas Específicas
- Clean Code (complejidad ciclomática < 5)
- Seguir AGENTS.md y documentación del proyecto
- Validación con Zod
- Tests cuando corresponda
- JSDoc/TSDoc para funciones complejas
- Eliminar magic numbers, primitive obsession, dead code

## Código a Revisar
\`\`\`
$(cat "${code_file}")
\`\`\`

## Output Requerido
Escribe el feedback en formato markdown en: \`${feedback_file}\`

**Formato del feedback:**
1. ✅ APROBADO / ❌ RECHAZADO
2. Problemas encontrados (si los hay)
3. Sugerencias de mejora específicas
4. Puntuación de calidad (1-10)

EOF
    
    echo "📋 Instrucciones generadas en: ${AUTO_INSTRUCTIONS}"
    echo ""
    echo "💡 Para usar Auto:"
    echo "   1. Abre este archivo: ${AUTO_INSTRUCTIONS}"
    echo "   2. Pide a Auto que revise el código según las instrucciones"
    echo "   3. Auto guardará el feedback en: ${feedback_file}"
    echo ""
    echo "⏳ Esperando que Auto complete la revisión..."
    echo "   (Presiona Enter cuando Auto haya completado la revisión)"
    
    read -r
    
    # Verificar que el archivo fue generado
    if [[ -f "${feedback_file}" ]] && [[ -s "${feedback_file}" ]]; then
        echo "✅ Revisión completada en: ${feedback_file}"
        return 0
    else
        echo "⚠️  Archivo no encontrado o vacío. ¿Auto completó la revisión?" >&2
        return 1
    fi
}

# Función para revisar código con Claude CLI
review_code() {
    local code_file="$1"
    local feedback_file="${2:-${REVIEW_FEEDBACK}}"
    
    if [[ ! -f "${code_file}" ]]; then
        echo "❌ Archivo de código no encontrado: ${code_file}" >&2
        return 1
    fi
    
    # Si el revisor es "auto", usar función específica
    if [[ "${REVIEWER_CLI}" == "auto" ]]; then
        review_with_auto "${code_file}" "${feedback_file}"
        return $?
    fi
    
    echo "🔍 Revisando código con ${REVIEWER_CLI}..."
    
    # Crear directorio de contexto si no existe
    mkdir -p "${CONTEXT_DIR}"
    
    # Leer AGENTS.md para contexto
    local agents_md="${REPO_ROOT}/AGENTS.md"
    local agents_context=""
    if [[ -f "${agents_md}" ]]; then
        agents_context=$(head -100 "${agents_md}")
    fi
    
    # Preparar prompt de revisión
    local review_prompt="Revisa el siguiente código según los estándares del proyecto TeamHub:

ESTÁNDARES DEL PROYECTO:
${agents_context}

REGLAS ESPECÍFICAS:
- Clean Code (complejidad ciclomática < 5)
- Seguir AGENTS.md y documentación del proyecto
- Validación con Zod
- Tests cuando corresponda
- JSDoc/TSDoc para funciones complejas
- Eliminar magic numbers, primitive obsession, dead code

CÓDIGO A REVISAR:
$(cat "${code_file}")

Responde en formato markdown con:
1. ✅ APROBADO / ❌ RECHAZADO
2. Problemas encontrados (si los hay)
3. Sugerencias de mejora específicas
4. Puntuación de calidad (1-10)"

    # Llamar al CLI correspondiente
    # Nota: Ajustar según la sintaxis real del CLI
    if command -v "${REVIEWER_CLI}" >/dev/null 2>&1; then
        echo "${review_prompt}" | "${REVIEWER_CLI}" > "${feedback_file}" 2>&1 || {
            echo "❌ Error al revisar código" >&2
            return 1
        }
    else
        echo "❌ ${REVIEWER_CLI} no está instalado o no está en PATH" >&2
        if [[ "${REVIEWER_CLI}" == "claude" ]]; then
            echo "💡 Instala Claude CLI según la documentación oficial" >&2
        fi
        return 1
    fi
    
    echo "✅ Revisión completada en: ${feedback_file}"
    return 0
}

# Función para verificar si el código fue aprobado
is_approved() {
    local feedback_file="$1"
    
    if [[ ! -f "${feedback_file}" ]]; then
        return 1
    fi
    
    # Buscar "APROBADO" en el feedback
    if grep -qi "✅.*APROBADO\|APROBADO" "${feedback_file}" >/dev/null 2>&1; then
        return 0
    fi
    
    return 1
}

# Si se ejecuta directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -lt 1 ]]; then
        echo "Uso: $0 <code_file> [feedback_file]" >&2
        exit 1
    fi
    review_code "$1" "${2:-}"
fi
