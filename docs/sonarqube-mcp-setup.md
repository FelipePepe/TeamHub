# SonarQube MCP Server Configuration

## Configuración para GitHub Copilot CLI

Añadir al archivo `~/.config/github-copilot/mcp.json`:

```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "npx",
      "args": ["-y", "sonarqube-mcp-server@latest"],
      "env": {
        "SONARQUBE_URL": "https://sonarcloud.io",
        "SONARQUBE_TOKEN": "<YOUR_SONARQUBE_TOKEN>",
        "SONARQUBE_ORGANIZATION": "<YOUR_ORGANIZATION>"
      }
    }
  }
}
```

## Configuración para VS Code (Copilot Agent)

Añadir al archivo `.vscode/settings.json` en el workspace:

```json
{
  "github.copilot.mcp.servers": {
    "sonarqube": {
      "command": "npx",
      "args": ["-y", "sonarqube-mcp-server@latest"],
      "env": {
        "SONARQUBE_URL": "https://sonarcloud.io",
        "SONARQUBE_TOKEN": "<YOUR_SONARQUBE_TOKEN>",
        "SONARQUBE_ORGANIZATION": "<YOUR_ORGANIZATION>"
      }
    }
  }
}
```

## Uso con SonarQube Server (self-hosted)

Si usas SonarQube Server en lugar de SonarCloud:

```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "npx",
      "args": ["-y", "sonarqube-mcp-server@latest"],
      "env": {
        "SONARQUBE_URL": "http://localhost:9000",
        "SONARQUBE_TOKEN": "<YOUR_SONARQUBE_TOKEN>"
      }
    }
  }
}
```

## Generar Token de SonarQube

### SonarCloud:
1. Ir a https://sonarcloud.io/account/security
2. Generar un nuevo token con scope: **Analyze projects**

### SonarQube Server:
1. Ir a Tu_Server/account/security
2. Generar un nuevo token con permisos de análisis

## Variables de Entorno

Alternativamente, puedes configurar variables de entorno en tu sistema:

```bash
export SONARQUBE_URL="https://sonarcloud.io"
export SONARQUBE_TOKEN="tu_token_aqui"
export SONARQUBE_ORGANIZATION="tu_organizacion"
```

## Comandos disponibles vía MCP

Una vez configurado, podrás usar comandos como:
- Listar issues de un proyecto
- Revisar quality gates
- Obtener métricas de cobertura
- Ver hotspots de seguridad
- Analizar branches y pull requests

## Testing de la configuración

Para verificar que el MCP está funcionando:

```bash
npx -y sonarqube-mcp-server@latest
```

Debería iniciar el servidor y esperar conexiones MCP.
