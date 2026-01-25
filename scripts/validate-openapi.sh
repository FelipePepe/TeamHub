#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SPEC_PATH="${1:-${REPO_ROOT}/openapi.yaml}"

if [[ ! -f "$SPEC_PATH" ]]; then
  echo "OpenAPI spec not found: $SPEC_PATH" >&2
  exit 1
fi

if command -v timeout >/dev/null 2>&1; then
  if ! timeout 60s npx -y @apidevtools/swagger-cli@4.0.4 validate "$SPEC_PATH"; then
    status=$?
    if [[ $status -eq 124 ]]; then
      echo "OpenAPI validation timed out after 60s." >&2
    fi
    exit $status
  fi
else
  npx -y @apidevtools/swagger-cli@4.0.4 validate "$SPEC_PATH"
fi
