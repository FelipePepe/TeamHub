#!/usr/bin/env bash
set -euo pipefail

# Script to install gitleaks binary for the project
GITLEAKS_VERSION="8.22.1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="$SCRIPT_DIR/bin"
GITLEAKS_BIN="$BIN_DIR/gitleaks"

mkdir -p "$BIN_DIR"

if [ -x "$GITLEAKS_BIN" ]; then
  echo "✅ gitleaks already installed at $GITLEAKS_BIN"
  exit 0
fi

echo "📦 Installing gitleaks v${GITLEAKS_VERSION}..."
curl -sSfL "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
  | tar -xz -C /tmp
mv /tmp/gitleaks "$GITLEAKS_BIN"
chmod +x "$GITLEAKS_BIN"

echo "✅ gitleaks installed successfully"
"$GITLEAKS_BIN" version
