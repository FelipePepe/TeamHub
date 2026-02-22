# Guía de Configuración de SonarQube para el Proyecto TFM

## 📋 Descripción
Este proyecto está configurado para análisis de código con SonarQube/SonarCloud, incluyendo integración con GitHub Copilot CLI y VS Code mediante MCP (Model Context Protocol).

## 🚀 Configuración Inicial

### 1. Crear Proyecto en SonarQube/SonarCloud

#### Opción A: SonarCloud (Recomendado para proyectos públicos)
1. Ir a https://sonarcloud.io
2. Iniciar sesión con GitHub
3. Crear nueva organización o usar existente
4. Añadir repositorio `tfm`
5. Generar token: https://sonarcloud.io/account/security

#### Opción B: SonarQube Server (Self-hosted)
1. Instalar SonarQube con Docker:
```bash
docker run -d --name sonarqube \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_logs:/opt/sonarqube/logs \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  sonarqube:latest
```
2. Acceder a http://localhost:9000 (admin/admin)
3. Crear proyecto manualmente
4. Generar token en My Account > Security

### 2. Configurar Variables de Entorno

Crear archivo `.env.sonar` en la raíz del proyecto (NO commitear):

```bash
# Para SonarCloud
SONAR_TOKEN=tu_token_aqui
SONAR_ORGANIZATION=tu_organizacion
SONAR_PROJECT_KEY=tfm-teamhub

# Para SonarQube Server
# SONAR_HOST_URL=http://localhost:9000
# SONAR_TOKEN=tu_token_aqui
# SONAR_PROJECT_KEY=tfm-teamhub
```

### 3. Ejecutar Análisis Local

```bash
# Cargar variables de entorno
source .env.sonar

# Opción 1: Con npm script
npm run sonar -- \
  -Dsonar.token=$SONAR_TOKEN \
  -Dsonar.organization=$SONAR_ORGANIZATION

# Opción 2: Con SonarCloud
npm run sonar -- \
  -Dsonar.token=$SONAR_TOKEN \
  -Dsonar.organization=$SONAR_ORGANIZATION \
  -Dsonar.host.url=https://sonarcloud.io

# Opción 3: Con SonarQube Server
npm run sonar -- \
  -Dsonar.token=$SONAR_TOKEN \
  -Dsonar.host.url=http://localhost:9000
```

### 4. Generar Reportes de Cobertura

El análisis incluye cobertura de tests. Asegúrate de generar los reportes primero:

```bash
# Backend
cd backend && npm test -- --coverage
cd ..

# Frontend  
cd frontend && npm test -- --coverage
cd ..

# Luego ejecutar análisis de SonarQube
npm run sonar -- -Dsonar.token=$SONAR_TOKEN -Dsonar.organization=$SONAR_ORGANIZATION
```

## 🔌 Integración con MCP (Model Context Protocol)

### Configuración para GitHub Copilot CLI

El archivo `~/.config/github-copilot/mcp.json` ya está configurado. Solo necesitas:

1. Editar el archivo y reemplazar los placeholders:
```bash
nano ~/.config/github-copilot/mcp.json
```

2. Reemplazar:
   - `<YOUR_SONARQUBE_TOKEN>` → Tu token de SonarQube
   - `<YOUR_ORGANIZATION>` → Tu organización de SonarCloud

3. Reiniciar Copilot CLI

### Configuración para VS Code

El archivo `.vscode/settings.json` ya está creado. Solo necesitas:

1. Editar el archivo:
```bash
nano .vscode/settings.json
```

2. Reemplazar los mismos placeholders que en el paso anterior

3. Recargar VS Code (Ctrl+Shift+P → "Developer: Reload Window")

### Comandos MCP Disponibles

Una vez configurado, puedes usar comandos como:

```bash
# Desde GitHub Copilot CLI
gh copilot ask "muéstrame los issues críticos de SonarQube en el proyecto tfm"
gh copilot ask "cuál es el estado del quality gate de tfm"
gh copilot ask "muestra los hotspots de seguridad del proyecto"
```

## 📊 Archivos de Configuración

- `sonar-project.properties` - Configuración principal del proyecto
- `docs/sonarqube-mcp-setup.md` - Documentación detallada del MCP
- `.vscode/settings.json` - Configuración de VS Code para MCP
- `~/.config/github-copilot/mcp.json` - Configuración global de Copilot CLI

## 🔍 Verificación de la Configuración

### Probar conexión MCP:

```bash
npx -y sonarqube-mcp-server@latest
```

Debería iniciar el servidor sin errores.

### Probar análisis local:

```bash
npm run sonar:watch
```

## 📝 Notas Importantes

1. **NO commitear tokens**: Los tokens de SonarQube son secretos. Usar siempre variables de entorno.
2. **Cobertura primero**: Ejecutar tests con coverage antes del análisis para obtener métricas completas.
3. **MCP deprecado**: Si `sonarqube-mcp-server` da problemas, verificar la documentación oficial en https://github.com/SonarSource/sonarqube-mcp-server
4. **Quality Gates**: Configurar quality gates en SonarCloud/SonarQube según los estándares del proyecto.

## 🔗 Enlaces Útiles

- [SonarCloud Dashboard](https://sonarcloud.io)
- [SonarQube Documentation](https://docs.sonarqube.org/)
- [SonarQube MCP Server GitHub](https://github.com/SonarSource/sonarqube-mcp-server)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)

## ⚠️ Troubleshooting

### Error: "Shallow clone detected"
```bash
git fetch --unshallow
```

### Error: "Project not found"
Verificar `sonar.projectKey` en `sonar-project.properties` coincide con el key en SonarCloud/SonarQube.

### Error: "Token authentication failed"
Regenerar token en SonarCloud/SonarQube y actualizar la variable de entorno.

### MCP no responde
1. Verificar que el token tiene permisos de "Browse" y "Execute Analysis"
2. Reiniciar VS Code o Copilot CLI
3. Verificar logs: `~/.config/github-copilot/logs/`
