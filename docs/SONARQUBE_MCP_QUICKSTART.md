# Guía Rápida: Configuración del MCP de SonarQube para Codex CLI

## Problema Resuelto

El error `MCP startup failed: handshaking with MCP server failed` ocurría porque Codex CLI no expandía las variables de entorno en el formato `${VAR}` del archivo `.mcp.json`.

## Solución

El MCP de Docker requiere que las variables estén **exportadas en el shell** antes de iniciar Codex CLI.

## Configuración en 3 Pasos

### 1. Exportar Variables de Entorno

```bash
# Opción A: Exportar automáticamente (recomendado)
source .env.sonar

# Opción B: Exportar manualmente
export SONARQUBE_TOKEN="squ_tu_token_aqui"
export SONARQUBE_URL="http://localhost:9000"
```

### 2. Iniciar Codex CLI

```bash
codex
```

### 3. Verificar que el MCP Cargó

Si todo está correcto, verás:

```
✓ MCP client for `sonarqube` started
```

Si ves un warning, verifica que:
- ✅ SonarQube está corriendo: `curl http://localhost:9000/api/system/status`
- ✅ Docker está corriendo: `docker ps`
- ✅ Variables exportadas: `echo $SONARQUBE_TOKEN`

## Configuración de Archivos

### .mcp.json (Configuración del MCP)

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
        "-e",
        "SONARQUBE_TOKEN",
        "-e",
        "SONARQUBE_URL",
        "mcp/sonarqube"
      ]
    }
  }
}
```

**Clave:** Las flags `-e SONARQUBE_TOKEN` y `-e SONARQUBE_URL` pasan las variables del shell al contenedor.

### .env.sonar (Variables de Entorno)

```bash
# Variables para análisis SonarQube
SONAR_TOKEN=squ_tu_token_aqui
SONAR_HOST_URL=http://localhost:9000
SONAR_PROJECT_KEY=TeamHub

# Variables para MCP (Codex CLI)
export SONARQUBE_TOKEN=squ_tu_token_aqui
export SONARQUBE_URL=http://localhost:9000
```

**Nota:** Las líneas con `export` se activan automáticamente al hacer `source .env.sonar`.

## Uso Diario

### Flujo de Trabajo Completo

```bash
# 1. Asegurarse que SonarQube está corriendo
./scripts/start-sonarqube.sh

# 2. Exportar variables
source .env.sonar

# 3. Iniciar Codex
codex

# Ahora puedes usar comandos como:
# "List all issues from SonarQube"
# "Show code smells in backend"
# "Get security hotspots"
```

### Script de Setup Automatizado

```bash
# Verifica todo y muestra el estado
./scripts/setup-sonarqube-mcp.sh
```

Este script:
- ✅ Verifica que `.env.sonar` existe
- ✅ Verifica que Docker está corriendo
- ✅ Verifica que SonarQube está UP
- ✅ Muestra instrucciones claras

## Troubleshooting

### Error: "connection closed: initialize response"

**Causa:** Variables de entorno no exportadas.

**Solución:**
```bash
# Verifica que están exportadas
echo $SONARQUBE_TOKEN
echo $SONARQUBE_URL

# Si están vacías, exporta
source .env.sonar
```

### Error: "Docker daemon not running"

```bash
sudo systemctl start docker
# o
sudo service docker start
```

### Error: "SonarQube not responding"

```bash
# Verificar estado
curl http://localhost:9000/api/system/status

# Si no responde, iniciar SonarQube
./scripts/start-sonarqube.sh
```

### Verificar Configuración Manualmente

```bash
# Test del contenedor MCP
source .env.sonar
docker run -i --rm --network host \
  -e SONARQUBE_TOKEN \
  -e SONARQUBE_URL \
  mcp/sonarqube
# Debería mostrar: "INFO SonarQube MCP Server - Starting backend service"
```

## Diferencias con GitHub Copilot CLI

| Característica | Codex CLI | GitHub Copilot CLI |
|---------------|-----------|-------------------|
| Expansión de variables | ❌ No expande `${VAR}` | ✅ Expande `${VAR}` |
| Requiere `export` | ✅ Sí | ⚠️ Depende |
| Configuración | `-e VAR` en args | `env: { VAR: "${VAR}" }` |

## Comandos Útiles del MCP

Una vez cargado el MCP en Codex, puedes usar:

```
# Análisis de Issues
"List all bugs with critical severity"
"Show me security vulnerabilities in src/auth"
"Get code smells ordered by severity"

# Métricas de Calidad
"What's the code coverage percentage?"
"Show technical debt ratio"
"List duplicated code blocks"

# Gestión
"Mark issue KEY-123 as won't fix"
"Add comment to security hotspot KEY-456"
```

## Integración con Workflow

### Alias Útil (Opcional)

Añade a tu `~/.bashrc` o `~/.zshrc`:

```bash
alias codex-sonar='cd ~/Sources/CursoAI/tfm && source .env.sonar && codex'
```

Luego simplemente:
```bash
codex-sonar
```

### Pre-commit Hook

Puedes añadir un check en `.husky/pre-commit`:

```bash
# Verificar que MCP está configurado
if [ -f .env.sonar ]; then
  source .env.sonar
  if [ -z "$SONARQUBE_TOKEN" ]; then
    echo "⚠️  Warning: SONARQUBE_TOKEN not set"
  fi
fi
```

## Seguridad

### ⚠️ CRÍTICO: NO Commitear Secretos

```bash
# Verificar .gitignore
grep -E "^\.mcp\.json$|^\.env\.sonar$" .gitignore

# Verificar que no están en staging
git status | grep -E "\.mcp\.json|\.env\.sonar"

# Si aparecen, removerlos
git reset .mcp.json .env.sonar
```

### Rotación de Token

```bash
# 1. Generar nuevo token en SonarQube UI (localhost:9000)
# 2. Actualizar .env.sonar
nano .env.sonar

# 3. Reexportar
source .env.sonar

# 4. Reiniciar Codex
# (exit y volver a entrar)
```

## Notas Técnicas

### Por qué `-e VAR` en lugar de `env: { VAR: "valor" }`

Docker CLI requiere que las variables se pasen con `-e` cuando se heredan del entorno del shell. El formato de `env` en JSON es interpretado por algunos clientes MCP pero no por el driver de Docker estándar de Codex CLI.

### Persistencia de Variables

Las variables exportadas con `export` en `.env.sonar` persisten **solo en la sesión actual** del shell. Si abres una nueva terminal, debes volver a hacer `source .env.sonar`.

## Referencias

- [MCP Specification - Environment Variables](https://github.com/modelcontextprotocol/specification/blob/main/docs/servers.md)
- [Docker CLI Reference - Environment Variables](https://docs.docker.com/engine/reference/commandline/run/#env)
- [SonarQube Web API Documentation](https://docs.sonarqube.org/latest/extend/web-api/)
