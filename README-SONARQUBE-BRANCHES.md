# Análisis Multi-Rama con SonarQube Community Edition

## 📋 Configuración

SonarQube Community Edition no soporta análisis de múltiples ramas en un mismo proyecto. La solución es crear proyectos separados para cada rama:

- **TeamHub** → rama `main`
- **TeamHub-develop** → rama `develop`

## 🚀 Uso

### Opción 1: Scripts npm (Recomendado)

```bash
# Analizar rama main
npm run sonar:main

# Analizar rama develop
npm run sonar:develop

# Script automático (cambia de rama y analiza)
npm run sonar:branch main
npm run sonar:branch develop
```

### Opción 2: Script bash directo

```bash
# Analizar la rama actual
./scripts/sonar-analyze-branch.sh

# Analizar una rama específica (cambia automáticamente)
./scripts/sonar-analyze-branch.sh main
./scripts/sonar-analyze-branch.sh develop
```

### Opción 3: Manual

```bash
# Para main
git checkout main
git pull origin main
export SONAR_TOKEN=<YOUR_SONARQUBE_TOKEN>
export SONAR_HOST_URL=http://localhost:9000
sonar-scanner -Dsonar.projectKey=TeamHub -Dsonar.projectName=TeamHub

# Para develop
git checkout develop
git pull origin develop
export SONAR_TOKEN=<YOUR_SONARQUBE_TOKEN>
export SONAR_HOST_URL=http://localhost:9000
sonar-scanner -Dsonar.projectKey=TeamHub-develop -Dsonar.projectName="TeamHub (develop)"
```

## 🌐 Ver Resultados

- **Main:** http://localhost:9000/dashboard?id=TeamHub
- **Develop:** http://localhost:9000/dashboard?id=TeamHub-develop

## 📊 Automatización con CI/CD

Para GitHub Actions, puedes añadir:

```yaml
- name: Analyze with SonarQube
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: http://localhost:9000
  run: |
    if [ "${{ github.ref }}" == "refs/heads/main" ]; then
      npm run sonar:main
    elif [ "${{ github.ref }}" == "refs/heads/develop" ]; then
      npm run sonar:develop
    fi
```

## ⚠️ Notas Importantes

1. **Community Edition Limitation:** Solo se puede analizar una rama a la vez por proyecto
2. **No Pull Request Analysis:** Community Edition no analiza PRs automáticamente
3. **Upgrade para Multi-Branch:** Para análisis verdadero de múltiples ramas, necesitas Developer Edition o superior

## 🔄 Workflow Recomendado

```bash
# Desarrollo diario
git checkout develop
npm run sonar:develop

# Antes de release
git checkout main
npm run sonar:main

# Comparación manual
# Abre ambos dashboards y compara las métricas
```

## 📝 Configuración de Tokens

El token está en `.env.sonar` (no versionado):

```bash
SONAR_TOKEN=<YOUR_SONARQUBE_TOKEN>
SONAR_HOST_URL=http://localhost:9000
SONAR_PROJECT_KEY=TeamHub  # o TeamHub-develop
```
