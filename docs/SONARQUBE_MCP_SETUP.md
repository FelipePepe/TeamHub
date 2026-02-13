# Configuración del MCP de SonarQube para Copilot CLI

Este documento explica cómo configurar y utilizar el servidor MCP (Model Context Protocol) de SonarQube con GitHub Copilot CLI.

## ¿Qué es MCP?

El Model Context Protocol (MCP) permite que los agentes de IA (como Copilot CLI) interactúen con herramientas externas como SonarQube de forma segura y estandarizada.

## Requisitos Previos

1. Docker instalado y corriendo
2. SonarQube configurado y corriendo (`./scripts/start-sonarqube.sh`)
3. Token de SonarQube configurado en `.env.sonar`
4. Imagen Docker `mcp/sonarqube` disponible

## Estructura de Archivos

```
.
├── .mcp.json              # Configuración del MCP (con variables reales, NO commitear)
├── .mcp.json.example      # Plantilla de configuración del MCP (para versionar)
├── .env.sonar             # Variables de SonarQube (NO commitear)
├── .env.sonar.example     # Plantilla de variables (para versionar)
└── scripts/
    └── setup-sonarqube-mcp.sh  # Script de configuración automática
```

## Configuración

### 1. Configurar Variables de Entorno

```bash
# Si no existe .env.sonar, créalo desde el ejemplo
cp .env.sonar.example .env.sonar

# Edita .env.sonar con tus credenciales reales
nano .env.sonar
```

Tu `.env.sonar` debe contener:
```bash
SONAR_TOKEN=squ_tu_token_aqui
SONAR_HOST_URL=http://localhost:9000
SONAR_PROJECT_KEY=TeamHub
```

### 2. Configurar .mcp.json

El archivo `.mcp.json` ya está configurado para leer las variables de entorno. **Asegúrate de que está en .gitignore**:

```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--network",
        "host",
        "mcp/sonarqube"
      ],
      "env": {
        "SONARQUBE_TOKEN": "${SONAR_TOKEN}",
        "SONARQUBE_URL": "${SONAR_HOST_URL}"
      }
    }
  }
}
```

### 3. Usar el Script de Configuración

```bash
# Exportar las variables al entorno actual
source scripts/setup-sonarqube-mcp.sh
```

Este script:
- ✅ Verifica que `.env.sonar` existe
- ✅ Carga las variables de entorno
- ✅ Verifica que Docker está corriendo
- ✅ Verifica que la imagen `mcp/sonarqube` existe

## Uso con Copilot CLI

### Opción A: Con Variables de Entorno (Recomendado)

```bash
# 1. Cargar variables
source scripts/setup-sonarqube-mcp.sh

# 2. Iniciar Copilot CLI
gh copilot

# Ahora puedes usar comandos como:
# "List all issues from SonarQube"
# "Show code smells in the backend"
# "Get security hotspots for TeamHub project"
```

### Opción B: Configuración Manual

```bash
# Exportar variables manualmente
export SONAR_TOKEN=$(grep SONAR_TOKEN .env.sonar | cut -d= -f2)
export SONAR_HOST_URL=$(grep SONAR_HOST_URL .env.sonar | cut -d= -f2)

# Iniciar Copilot CLI
gh copilot
```

## Comandos Disponibles

Una vez configurado el MCP de SonarQube, puedes usar comandos en lenguaje natural en Copilot CLI:

### Consultas de Issues
```
"List all critical issues from SonarQube"
"Show me code smells in the backend folder"
"What security vulnerabilities does the project have?"
"Get all bugs with high severity"
```

### Análisis de Calidad
```
"What's the technical debt for TeamHub?"
"Show me the code coverage report"
"List duplicated code blocks"
"Get the maintainability rating"
```

### Gestión de Issues
```
"Mark issue KEY-123 as false positive"
"Add comment to issue KEY-456"
"Resolve security hotspot KEY-789"
```

## Troubleshooting

### Error: "Docker no está corriendo"
```bash
sudo systemctl start docker
# o
sudo service docker start
```

### Error: "Imagen mcp/sonarqube no encontrada"
```bash
# Verificar si existe
docker images | grep mcp/sonarqube

# Si no existe, necesitas construirla o descargarla
# (consulta la documentación del MCP de SonarQube)
```

### Error: "Authentication failed"
```bash
# Verifica el token en .env.sonar
cat .env.sonar | grep SONAR_TOKEN

# Prueba el token manualmente
curl -u squ_tu_token_aqui: http://localhost:9000/api/system/status
```

### Error: "Variables de entorno no se cargan"
```bash
# Asegúrate de usar 'source' no 'bash'
source scripts/setup-sonarqube-mcp.sh

# Verifica que las variables están exportadas
echo $SONAR_TOKEN
echo $SONAR_HOST_URL
```

## Seguridad

### ⚠️ CRÍTICO: Gestión de Secretos

1. **NUNCA** commitear `.mcp.json` con tokens hardcodeados
2. **SIEMPRE** usar variables de entorno (`${VAR}`)
3. **VERIFICAR** que `.mcp.json` está en `.gitignore`
4. **USAR** `.mcp.json.example` para versionar la configuración

### Verificación de Seguridad

```bash
# Verificar que .mcp.json está ignorado
git check-ignore .mcp.json

# Verificar que no hay tokens en el historial
git log --all --full-history -- .mcp.json

# Limpiar historial si se commitió por error
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .mcp.json" \
  --prune-empty --tag-name-filter cat -- --all
```

## Integración con CI/CD

Para usar el MCP de SonarQube en CI/CD (GitHub Actions, GitLab CI, etc.):

```yaml
# .github/workflows/sonar-analysis.yml
name: SonarQube Analysis with MCP

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup SonarQube MCP
        run: |
          echo "SONAR_TOKEN=${{ secrets.SONAR_TOKEN }}" >> .env.sonar
          echo "SONAR_HOST_URL=${{ secrets.SONAR_HOST_URL }}" >> .env.sonar
          source scripts/setup-sonarqube-mcp.sh
      
      - name: Run Analysis
        run: |
          # Tus comandos de análisis aquí
```

## Referencias

- [Model Context Protocol Specification](https://github.com/anthropics/mcp)
- [SonarQube API Documentation](https://docs.sonarqube.org/latest/extend/web-api/)
- [GitHub Copilot CLI Documentation](https://docs.github.com/en/copilot/github-copilot-in-the-cli)

## Mantenimiento

### Actualizar Token

Si el token expira o necesitas renovarlo:

```bash
# 1. Generar nuevo token en SonarQube UI
# 2. Actualizar .env.sonar
nano .env.sonar

# 3. Recargar variables
source scripts/setup-sonarqube-mcp.sh

# 4. Reiniciar Copilot CLI si está corriendo
```

### Logs y Debugging

```bash
# Ver logs del contenedor MCP
docker logs $(docker ps | grep mcp/sonarqube | awk '{print $1}')

# Modo verbose
export SONAR_VERBOSE=true
source scripts/setup-sonarqube-mcp.sh
```

## Contribuir

Si encuentras un problema o tienes una mejora:
1. Abre un issue en el repositorio
2. Sigue las convenciones de Conventional Commits
3. Actualiza esta documentación si es necesario
