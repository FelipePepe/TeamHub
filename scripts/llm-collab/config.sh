#!/usr/bin/env bash
# Configuración del sistema colaborativo multi-LLM

# Directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CONTEXT_DIR="${REPO_ROOT}/.llm-context"

# LLMs configurados
# Opciones: "copilot" (GitHub Copilot CLI), "claude", "codex", "auto" (Cursor AI)
GENERATOR_CLI="copilot"              # GitHub Copilot CLI (comando: copilot)
REVIEWER_CLI="claude"                # Claude CLI
ORCHESTRATOR_MODE="auto"             # "auto" (Cursor AI) o "script" (CLIs externos)

# Límites
MAX_ITERATIONS=3
REVIEW_TIMEOUT=300  # 5 minutos

# Archivos temporales
GENERATED_CODE="${CONTEXT_DIR}/generated_code.txt"
REVIEW_FEEDBACK="${CONTEXT_DIR}/review_feedback.md"
FINAL_CODE="${CONTEXT_DIR}/final_code.txt"
AUTO_INSTRUCTIONS="${CONTEXT_DIR}/auto_instructions.md"
