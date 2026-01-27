# Sistema Colaborativo Multi-LLM

Sistema de orquestación que permite que múltiples LLMs trabajen colaborativamente: uno genera código y otro lo revisa para mejorar la calidad final.

## Configuración

### LLMs Configurados

- **Generador**: GitHub Copilot CLI (`github-copilot-cli`)
- **Revisor**: Claude CLI (`claude`)
- **Orquestador**: Auto (Cursor AI) o Script (CLIs externos)

### Modos de Operación

#### Modo Script (CLIs externos)
Usa CLIs externos para generar y revisar código automáticamente.

#### Modo Auto (Cursor AI)
Auto (Cursor AI) actúa como orquestador, generador o revisor según la configuración.

### Requisitos

1. Instalar GitHub Copilot CLI:
   ```bash
   npm install -g @githubnext/github-copilot-cli
   ```

2. Instalar Claude CLI según la documentación oficial

3. Configurar autenticación para ambos CLIs

## Uso

### Modo Auto (Recomendado)

Auto puede actuar como orquestador completo:

1. Edita `scripts/llm-collab/config.sh` y configura:
   ```bash
   ORCHESTRATOR_MODE="auto"
   ```

2. Ejecuta el orquestador:
   ```bash
   ./scripts/llm-collab/orchestrator.sh "Implementa página de listado de departamentos"
   ```

3. Se generará un archivo de instrucciones en `.llm-context/auto_instructions.md`

4. Abre ese archivo y pide a Auto que ejecute el proceso completo

### Modo Script (CLIs externos)

### Uso básico

```bash
./scripts/llm-collab/orchestrator.sh "Implementa página de listado de departamentos"
```

### Especificar archivo de salida

```bash
./scripts/llm-collab/orchestrator.sh \
  "Implementa página de listado de departamentos" \
  frontend/src/app/admin/departamentos/page.tsx
```

### Uso individual de componentes

#### Generar código
```bash
./scripts/llm-collab/generator.sh "Crea un hook useDepartamentos con TanStack Query"
```

#### Revisar código
```bash
./scripts/llm-collab/reviewer.sh archivo.ts
```

## Flujo de Trabajo

1. **Generación**: GitHub Copilot CLI genera código inicial
2. **Revisión**: Claude CLI revisa el código según estándares del proyecto
3. **Mejora**: Si es rechazado, GitHub Copilot mejora basándose en el feedback
4. **Iteración**: Hasta 3 iteraciones o hasta aprobación
5. **Aprobación**: Cuando Claude aprueba, el código está listo

## Archivos Generados

- `.llm-context/generated_code.txt` - Código generado
- `.llm-context/review_feedback.md` - Feedback del revisor
- `.llm-context/final_code.txt` - Código final (si se especifica output)

## Configuración

Edita `scripts/llm-collab/config.sh` para:
- Cambiar los CLIs utilizados (`GENERATOR_CLI`, `REVIEWER_CLI`)
- Usar Auto: configurar `GENERATOR_CLI="auto"` o `REVIEWER_CLI="auto"`
- Modo orquestador: `ORCHESTRATOR_MODE="auto"` para usar Auto como orquestador completo
- Ajustar el número máximo de iteraciones
- Modificar timeouts

### Ejemplos de Configuración

**Auto como orquestador completo:**
```bash
ORCHESTRATOR_MODE="auto"
```

**Auto como generador, Claude como revisor:**
```bash
GENERATOR_CLI="auto"
REVIEWER_CLI="claude"
ORCHESTRATOR_MODE="script"
```

**GitHub Copilot como generador, Auto como revisor:**
```bash
GENERATOR_CLI="github-copilot-cli"
REVIEWER_CLI="auto"
ORCHESTRATOR_MODE="script"
```

## Notas

- El directorio `.llm-context/` está en `.gitignore`
- Los archivos temporales se limpian automáticamente
- El sistema lee `AGENTS.md` para contexto de estándares
