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

# Nota: Todos los CLIs están instalados:
# - copilot: /usr/bin/copilot (GitHub Copilot CLI v0.0.395)
# - claude: /home/sandman/.local/bin/claude (Claude CLI v2.1.19)
# - codex: /usr/bin/codex (Codex CLI v0.91.0)

# Límites
MAX_ITERATIONS=3
REVIEW_TIMEOUT=300  # 5 minutos

# Archivos temporales
GENERATED_CODE="${CONTEXT_DIR}/generated_code.txt"
REVIEW_FEEDBACK="${CONTEXT_DIR}/review_feedback.md"
FINAL_CODE="${CONTEXT_DIR}/final_code.txt"
AUTO_INSTRUCTIONS="${CONTEXT_DIR}/auto_instructions.md"
