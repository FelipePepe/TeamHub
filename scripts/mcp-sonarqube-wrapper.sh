#!/bin/bash
# Wrapper del MCP de SonarQube con fallback sin Docker.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.sonar"

# Carga variables locales y las exporta para subprocesos (docker/binario MCP).
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

if [ -z "${SONARQUBE_TOKEN:-}" ] || [ -z "${SONARQUBE_URL:-}" ]; then
    echo "ERROR: SONARQUBE_TOKEN/SONARQUBE_URL no definidos (.env.sonar)." >&2
    exit 1
fi

if docker info >/dev/null 2>&1; then
    exec docker run -i --rm \
        --network host \
        -v sonarqube-mcp-storage:/root/.sonarlint \
        -e SONARQUBE_TOKEN \
        -e SONARQUBE_URL \
        mcp/sonarqube "$@" 2> >(grep -v "Background initialization failed" >&2)
fi

if command -v sonarqube-mcp-server >/dev/null 2>&1; then
    exec sonarqube-mcp-server "$@"
fi

exec npx -y sonarqube-mcp-server@latest "$@"
