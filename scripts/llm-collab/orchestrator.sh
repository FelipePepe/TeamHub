#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para orquestar con Auto (Cursor AI)
orchestrate_with_auto() {
    local prompt="$1"
    local output_path="${2:-}"
    
    echo -e "${BLUE}🚀 Iniciando colaboración con Auto (Cursor AI) como orquestador${NC}"
    echo -e "${BLUE}📋 Prompt: ${prompt}${NC}"
    echo ""
    
    # Crear directorio de contexto
    mkdir -p "${CONTEXT_DIR}"
    
    # Generar instrucciones completas para Auto
    cat > "${AUTO_INSTRUCTIONS}" <<EOF
# Instrucciones para Auto - Colaboración Multi-LLM

## Tarea Principal
${prompt}

## Proceso de Colaboración

Eres el orquestador de un sistema colaborativo multi-LLM. Tu tarea es:

1. **Generar código inicial** según el prompt
2. **Revisar el código** según estándares del proyecto
3. **Mejorar el código** basándote en tu propia revisión
4. **Iterar** hasta que el código esté aprobado (máx 3 iteraciones)

## Estándares del Proyecto
Lee \`AGENTS.md\` y la documentación en \`docs/\` para entender los estándares.

## Reglas
- Clean Code (complejidad ciclomática < 5)
- Validación con Zod
- Tests cuando corresponda
- JSDoc/TSDoc para funciones complejas
- Seguir estructura del proyecto

## Archivos de Trabajo
- Código generado: \`${GENERATED_CODE}\`
- Feedback: \`${REVIEW_FEEDBACK}\`
- Output final: ${output_path:-${GENERATED_CODE}}

## Proceso
1. Genera el código inicial y guárdalo en \`${GENERATED_CODE}\`
2. Revisa tu propio código y genera feedback en \`${REVIEW_FEEDBACK}\`
3. Si no está aprobado, mejóralo basándote en el feedback
4. Repite hasta aprobación o máximo 3 iteraciones
5. Guarda el código final en: ${output_path:-${GENERATED_CODE}}

## Formato de Feedback
Cuando revises, usa este formato:
\`\`\`markdown
✅ APROBADO / ❌ RECHAZADO

## Problemas encontrados
- ...

## Sugerencias de mejora
- ...

## Puntuación: X/10
\`\`\`

EOF
    
    echo -e "${CYAN}📋 Instrucciones completas generadas en: ${AUTO_INSTRUCTIONS}${NC}"
    echo ""
    echo -e "${YELLOW}💡 Para usar Auto como orquestador:${NC}"
    echo -e "   1. Abre este archivo: ${AUTO_INSTRUCTIONS}"
    echo -e "   2. Pide a Auto que orqueste el proceso completo"
    echo -e "   3. Auto generará, revisará y mejorará el código iterativamente"
    echo ""
    echo -e "${GREEN}✅ Sistema listo para usar con Auto${NC}"
    return 0
}

# Función principal de orquestación
collaborate() {
    local prompt="$1"
    local output_path="${2:-}"
    local iteration=1
    
    # Si el modo es "auto", usar orquestación con Auto
    if [[ "${ORCHESTRATOR_MODE}" == "auto" ]]; then
        orchestrate_with_auto "${prompt}" "${output_path}"
        return $?
    fi
    
    echo -e "${BLUE}🚀 Iniciando colaboración multi-LLM${NC}"
    echo -e "${BLUE}📋 Prompt: ${prompt}${NC}"
    echo ""
    
    # Crear directorio de contexto
    mkdir -p "${CONTEXT_DIR}"
    
    # Iteración inicial: Generar código
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Iteración ${iteration}: Generación inicial${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if ! "${SCRIPT_DIR}/generator.sh" "${prompt}" "${GENERATED_CODE}"; then
        echo -e "${RED}❌ Error en la generación inicial${NC}" >&2
        return 1
    fi
    
    # Loop de revisión y mejora
    while [[ ${iteration} -le ${MAX_ITERATIONS} ]]; do
        echo ""
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}Iteración ${iteration}: Revisión${NC}"
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        # Revisar código
        if ! "${SCRIPT_DIR}/reviewer.sh" "${GENERATED_CODE}" "${REVIEW_FEEDBACK}"; then
            echo -e "${RED}❌ Error en la revisión${NC}" >&2
            return 1
        fi
        
        # Mostrar feedback
        echo ""
        echo -e "${CYAN}📄 Feedback del revisor:${NC}"
        cat "${REVIEW_FEEDBACK}"
        echo ""
        
        # Verificar aprobación
        if grep -qi "✅.*APROBADO\|APROBADO" "${REVIEW_FEEDBACK}" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Código aprobado por el revisor!${NC}"
            
            # Copiar a ubicación final si se especificó
            if [[ -n "${output_path}" ]]; then
                cp "${GENERATED_CODE}" "${output_path}"
                echo -e "${GREEN}📁 Código guardado en: ${output_path}${NC}"
            else
                echo -e "${GREEN}📁 Código disponible en: ${GENERATED_CODE}${NC}"
            fi
            
            return 0
        fi
        
        # Si no está aprobado y hay más iteraciones
        if [[ ${iteration} -lt ${MAX_ITERATIONS} ]]; then
            echo -e "${YELLOW}⚠️  Código rechazado. Mejorando...${NC}"
            echo ""
            echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${YELLOW}Iteración $((iteration + 1)): Mejora${NC}"
            echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            
            # Mejorar código basado en feedback
            local improved_code="${CONTEXT_DIR}/improved_code_${iteration}.txt"
            if ! "${SCRIPT_DIR}/generator.sh" improve "${REVIEW_FEEDBACK}" "${GENERATED_CODE}" "${improved_code}"; then
                echo -e "${RED}❌ Error al mejorar código${NC}" >&2
                return 1
            fi
            mv "${improved_code}" "${GENERATED_CODE}"
        fi
        
        iteration=$((iteration + 1))
    done
    
    # Si llegamos aquí, se agotaron las iteraciones
    echo -e "${RED}❌ Se alcanzó el máximo de iteraciones (${MAX_ITERATIONS})${NC}" >&2
    echo -e "${YELLOW}📄 Código final disponible en: ${GENERATED_CODE}${NC}"
    echo -e "${YELLOW}📄 Feedback disponible en: ${REVIEW_FEEDBACK}${NC}"
    return 1
}

# Si se ejecuta directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -lt 1 ]]; then
        echo "Uso: $0 <prompt> [output_file]" >&2
        echo "" >&2
        echo "Ejemplo:" >&2
        echo "  $0 'Implementa página de listado de departamentos' frontend/src/app/admin/departamentos/page.tsx" >&2
        exit 1
    fi
    collaborate "$1" "${2:-}"
fi
