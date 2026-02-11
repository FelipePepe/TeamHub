# SonarQube Quick Start

## 🚀 Setup Rápido (5 minutos)

### 1. Crear Proyecto en SonarCloud
```bash
# 1. Ir a https://sonarcloud.io
# 2. Login con GitHub
# 3. Añadir repositorio 'tfm'
# 4. Copiar el token que te genera
```

### 2. Configurar MCP para VS Code
```bash
# Editar archivo de configuración
nano .vscode/settings.json

# Reemplazar:
# <YOUR_SONARQUBE_TOKEN> → Tu token de SonarCloud
# <YOUR_ORGANIZATION> → Tu organización en SonarCloud
```

### 3. Configurar MCP para Copilot CLI
```bash
# Editar configuración global
nano ~/.config/github-copilot/mcp.json

# Reemplazar los mismos valores que en paso 2
```

### 4. Ejecutar Primer Análisis
```bash
# Generar cobertura de tests
cd backend && npm test -- --coverage && cd ..
cd frontend && npm test -- --coverage && cd ..

# Ejecutar análisis (reemplaza TU_TOKEN y TU_ORG)
npm run sonar -- \
  -Dsonar.token=TU_TOKEN \
  -Dsonar.organization=TU_ORG
```

### 5. Verificar Resultados
```bash
# Ver en dashboard de SonarCloud
# https://sonarcloud.io/project/overview?id=tfm-teamhub

# O usar desde Copilot CLI
gh copilot ask "muestra el resumen de calidad del proyecto tfm en sonarqube"
```

## 📝 Comandos Útiles

```bash
# Análisis con logs detallados
npm run sonar:watch -- -Dsonar.token=TU_TOKEN -Dsonar.organization=TU_ORG

# Ver configuración actual
cat sonar-project.properties

# Verificar que MCP funciona
npx -y sonarqube-mcp-server@latest

# Limpiar caché de SonarQube
rm -rf .scannerwork .sonar
```

## ⚠️ Problemas Comunes

### "Project not found"
→ Verificar que `tfm-teamhub` existe en SonarCloud

### "Shallow clone detected"
→ Ejecutar: `git fetch --unshallow`

### "Token authentication failed"
→ Regenerar token en SonarCloud/account/security

### MCP no responde en VS Code
→ Recargar ventana: Ctrl+Shift+P → "Developer: Reload Window"

## 📖 Documentación Completa

Ver `docs/SONARQUBE_SETUP.md` para guía detallada con capturas y troubleshooting avanzado.
