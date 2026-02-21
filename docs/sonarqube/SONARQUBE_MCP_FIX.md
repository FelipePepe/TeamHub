# ✅ Solución al Error de MCP de SonarQube en Codex CLI

## El Problema

```
⚠ MCP client for `sonarqube` failed to start: MCP startup failed: 
handshaking with MCP server failed: connection closed: initialize response
```

## Causa Raíz

El MCP de SonarQube **funciona correctamente** y responde al handshake, pero:
1. Intenta descargar analizadores en segundo plano desde SonarQube
2. SonarQube Community Edition **no tiene** el endpoint `/api/plugins/download`
3. El MCP reporta un error de background initialization que Codex interpreta como fallo fatal

## Solución Implementada

Se ha creado un **wrapper script** que:
- Gestiona las variables de entorno automáticamente
- Usa un volumen Docker persistente para cache
- Suprime los errores de background no críticos

## Configuración Final

### 1. Estructura de Archivos

```
tfm/
├── .mcp.json                           # Configuración del MCP
├── .env.sonar                          # Variables de entorno (con export)
└── scripts/
    └── mcp-sonarqube-wrapper.sh        # Wrapper que ejecuta el MCP
```

### 2. Contenido de .mcp.json

```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "/home/sandman/Sources/CursoAI/tfm/scripts/mcp-sonarqube-wrapper.sh"
    }
  }
}
```

**IMPORTANTE:** Usa la ruta **absoluta** al wrapper.

### 3. Contenido de .env.sonar

```bash
# Variables para npm run sonar
SONAR_TOKEN=squ_tu_token_aqui
SONAR_HOST_URL=http://localhost:9000
SONAR_PROJECT_KEY=TeamHub

# Variables para MCP (Codex CLI)
export SONARQUBE_TOKEN=squ_tu_token_aqui
export SONARQUBE_URL=http://localhost:9000
```

Las líneas con `export` son **críticas** para que el MCP funcione.

### 4. El Wrapper Script

```bash
#!/bin/bash
# scripts/mcp-sonarqube-wrapper.sh

# Cargar variables si no están exportadas
if [ -z "$SONARQUBE_TOKEN" ] || [ -z "$SONARQUBE_URL" ]; then
    if [ -f "$(dirname "$0")/../.env.sonar" ]; then
        source "$(dirname "$0")/../.env.sonar"
    fi
fi

# Ejecutar el contenedor MCP
exec docker run -i --rm \
    --network host \
    -v sonarqube-mcp-storage:/root/.sonarlint \
    -e SONARQUBE_TOKEN \
    -e SONARQUBE_URL \
    mcp/sonarqube "$@" 2> >(grep -v "Background initialization failed" >&2)
```

## Uso

### Opción A: Con Variables Pre-exportadas (Recomendado)

```bash
# Terminal 1: Exportar variables
source .env.sonar

# Terminal 1: Iniciar Codex
codex
```

### Opción B: Wrapper Auto-carga

```bash
# El wrapper cargará .env.sonar automáticamente
codex
```

## Verificación

### 1. Verificar Variables

```bash
source .env.sonar
echo "Token: ${SONARQUBE_TOKEN:0:10}..."
echo "URL: $SONARQUBE_URL"
```

Debe mostrar:
```
Token: squ_2f699f...
URL: http://localhost:9000
```

### 2. Probar el Wrapper Manualmente

```bash
source .env.sonar
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' | ./scripts/mcp-sonarqube-wrapper.sh
```

Debe devolver un JSON con `"result":{...}` sin errores.

### 3. Verificar en Codex

Al iniciar `codex`, deberías ver:

```
✓ MCP client for `sonarqube` started
```

**NO** deberías ver:
```
⚠ MCP client for `sonarqube` failed to start
```

## Troubleshooting

### Error: "command not found: /home/sandman/..."

**Causa:** Ruta incorrecta o sin permisos de ejecución.

**Solución:**
```bash
chmod +x /home/sandman/Sources/CursoAI/tfm/scripts/mcp-sonarqube-wrapper.sh
ls -la /home/sandman/Sources/CursoAI/tfm/scripts/mcp-sonarqube-wrapper.sh
```

### Error: "SONARQUBE_TOKEN environment variable must be set"

**Causa:** Variables no exportadas.

**Solución:**
```bash
source .env.sonar
# Verificar
echo $SONARQUBE_TOKEN
```

### Error: "Docker is not running"

**Solución:**
```bash
sudo systemctl start docker
# o
sudo service docker start
```

### Error: "Connection refused to localhost:9000"

**Causa:** SonarQube no está corriendo.

**Solución:**
```bash
./scripts/start-sonarqube.sh
# Esperar 30 segundos
curl http://localhost:9000/api/system/status
```

### El MCP Inicia pero No Responde

**Verificar logs:**
```bash
# Ver logs del contenedor MCP
docker ps | grep mcp/sonarqube
docker logs <container_id>
```

**Verificar token:**
```bash
curl -u $SONARQUBE_TOKEN: http://localhost:9000/api/system/status
```

## Diferencias con la Configuración Anterior

| Aspecto | Configuración Anterior | Configuración Nueva |
|---------|----------------------|---------------------|
| Comando | `docker` con args | Wrapper script |
| Variables | Pasadas por JSON | Cargadas automáticamente |
| Errores | Visibles y bloquean | Suprimidos si no críticos |
| Cache | Sin persistencia | Volumen Docker persistente |

## Limitaciones Conocidas

1. **Analizadores no disponibles**: El MCP no puede descargar analizadores adicionales desde SonarQube Community. Solo usa los análisis ya realizados por SonarQube.

2. **Sin análisis en tiempo real**: El MCP no puede analizar código localmente, solo consulta resultados de análisis previos en SonarQube.

3. **Requiere SonarQube corriendo**: El MCP necesita que SonarQube esté UP antes de iniciar Codex.

## Qué Funciona

- ✅ Listar issues, bugs, vulnerabilidades, code smells
- ✅ Obtener métricas del proyecto (coverage, deuda técnica, etc.)
- ✅ Filtrar issues por severidad, tipo, estado
- ✅ Consultar quality gates
- ✅ Ver detalles de issues específicos
- ✅ Consultar historial de análisis

## Qué NO Funciona

- ❌ Análisis de código en tiempo real (requiere SonarLint)
- ❌ Descarga de analizadores adicionales (requiere SonarQube Enterprise)
- ❌ Sugerencias de fix automático (requiere SonarLint)

## Comandos de Ejemplo en Codex

Una vez configurado correctamente:

```
"List all critical bugs from SonarQube"
"Show me security vulnerabilities in the backend"
"What's the code coverage percentage?"
"Get all code smells with high severity"
"Show technical debt ratio"
"List all open issues"
```

## Próximos Pasos

Si quieres análisis en tiempo real (sin ejecutar SonarQube Scanner cada vez):

1. **Opción A**: Usar SonarLint CLI (más rápido, pero sin historial)
2. **Opción B**: Configurar watch mode con `sonar-scanner` en background
3. **Opción C**: Integrar con IDE usando SonarLint plugin

## Referencias

- [SonarQube MCP Server](https://github.com/SonarSource/sonarqube-mcp-server)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [SonarQube Web API](https://docs.sonarqube.org/latest/extend/web-api/)
