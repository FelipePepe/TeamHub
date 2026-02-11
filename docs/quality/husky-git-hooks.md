# Husky - Git Hooks en TeamHub

## Que es Husky

Husky intercepta **git hooks** (eventos de git) y ejecuta scripts antes o despues de que ocurran. Git tiene estos hooks de forma nativa en `.git/hooks/`, pero Husky los mueve a `.husky/` para que se versionen con el repo y todo el equipo los comparta.

## Instalacion y activacion

En el `package.json` raiz del proyecto:

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

Cuando alguien hace `npm install`, el script `prepare` se ejecuta automaticamente y Husky configura `.git/hooks/` para que apunte a `.husky/`. Asi ningun miembro del equipo puede saltarselo por accidente.

## Estructura del proyecto

```
.husky/
  _/              # Internos de Husky (no tocar)
  .gitignore      # Ignora _/
  pre-commit      # Validacion de rama + deteccion de secrets
  commit-msg      # Validacion de Conventional Commits
  pre-push        # Lint + type-check + tests + audit de seguridad
  post-merge      # Analisis SonarQube automatico en develop
```

## Hooks disponibles en Git

### Hooks de COMMIT

| Hook | Cuando se ejecuta | Uso en TeamHub |
|---|---|---|
| **`pre-commit`** | Antes de crear el commit | Validar nombre de rama (GitFlow) + detectar secrets con gitleaks |
| **`commit-msg`** | Despues de escribir el mensaje | Validar formato Conventional Commits (`feat(auth): ...`) |
| `post-commit` | Despues del commit | No utilizado. Sirve para notificaciones |
| `prepare-commit-msg` | Antes de abrir el editor de mensaje | No utilizado. Sirve para auto-rellenar el mensaje |

### Hooks de PUSH

| Hook | Cuando se ejecuta | Uso en TeamHub |
|---|---|---|
| **`pre-push`** | Antes de enviar al remote | Bloquear push directo a main/develop + lint + type-check + tests + audit de seguridad |

### Hooks de MERGE / PULL

| Hook | Cuando se ejecuta | Uso en TeamHub |
|---|---|---|
| **`post-merge`** | Despues de `git pull` o merge local | Analisis SonarQube automatico en develop |
| `pre-merge-commit` | Antes de crear merge commit | No utilizado |

### Otros hooks utiles

| Hook | Cuando se ejecuta | Uso tipico |
|---|---|---|
| `post-checkout` | Despues de `git checkout` | Auto-instalar dependencias si `package.json` cambio |
| `pre-rebase` | Antes de rebase | Prevenir rebase en ramas compartidas |
| `post-rewrite` | Despues de `git rebase` o `git commit --amend` | Re-ejecutar validaciones |

## Flujos de TeamHub

### Flujo de commit

```
git commit -m "feat(auth): add MFA"
          |
          v
    +-- pre-commit -------------------------+
    | 1. Rama valida? (feature/*, etc.)     |
    | 2. Secrets en staged files?           |
    +---------------------------------------+
          | OK
          v
    +-- commit-msg -------------------------+
    | Formato Conventional Commits?         |
    | feat|fix|docs|...(scope): desc        |
    +---------------------------------------+
          | OK
          v
      Commit creado
```

### Flujo de push

```
git push origin feature/my-feature
          |
          v
    +-- pre-push ---------------------------+
    | 1. Push a main/develop? -> BLOQUEAR   |
    | 2. validate-openapi.sh                |
    | 3. Backend: lint + type-check + test  |
    | 4. Frontend: lint + type-check + test |
    | 5. npm audit (CVEs)                   |
    +---------------------------------------+
          | OK
          v
      Push ejecutado
```

### Flujo de pull en develop (SonarQube)

```
git checkout develop && git pull
          |
          v
    +-- post-merge -------------------------+
    | Estoy en develop? Si no -> salir      |
    | SonarQube accesible? Si no -> skip    |
    | Backend tests --coverage              |
    | Frontend tests --coverage             |
    | sonar-scanner -> TeamHub-develop      |
    +---------------------------------------+
```

## Anatomia de un hook

Cada hook es un **script shell** en `.husky/`. La estructura basica:

```bash
#!/bin/sh
set -e  # Salir al primer error (importante en hooks pre-*)

ROOT_DIR="$(git rev-parse --show-toplevel)"
current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)

# Validacion: exit 1 para BLOQUEAR, exit 0 para permitir
if ! echo "$current_branch" | grep -qE "$valid_patterns"; then
  echo "ERROR: Invalid branch name"
  exit 1    # <- bloquea la operacion
fi

exit 0      # <- permite la operacion
```

**Regla clave:**
- `exit 0` = OK, la operacion continua
- `exit 1` = bloquear la operacion (solo efectivo en hooks `pre-*`)
- En hooks `post-*` (como `post-merge`), `exit 1` no bloquea nada porque la operacion ya paso

## Crear un hook nuevo

```bash
# Opcion 1: crear archivo directamente
touch .husky/post-checkout && chmod +x .husky/post-checkout

# Opcion 2: con npx (versiones antiguas de Husky)
npx husky add .husky/post-checkout "echo hello"
```

El archivo debe ser ejecutable (`chmod +x`).

## Ejemplo: auto-instalar dependencias al cambiar de rama

Un hook `post-checkout` que detecta si `package-lock.json` cambio entre ramas:

```bash
#!/bin/sh
# .husky/post-checkout

# $1=ref anterior, $2=ref nuevo, $3=1 si cambio de rama (0 si solo fichero)
if [ "$3" != "1" ]; then
  exit 0
fi

# Si package-lock.json cambio entre ramas, reinstalar
if git diff --name-only "$1" "$2" | grep -q "package-lock.json"; then
  echo "package-lock.json changed, running npm install..."
  npm install
fi
```

## Saltarse hooks (cuando es necesario)

```bash
# Saltar pre-commit + commit-msg
git commit --no-verify -m "wip: trabajo en progreso"

# Saltar pre-push
git push --no-verify

# Saltar todos los hooks (variable de entorno)
HUSKY=0 git pull

# Desactivar Husky temporalmente para toda la sesion
export HUSKY=0
```

> **Nota:** Usar `--no-verify` o `HUSKY=0` solo en casos justificados. Saltarse los hooks anula las protecciones del equipo.

## Buenas practicas

### 1. pre-commit debe ser rapido (< 5 segundos)

Solo validaciones ligeras: lint de archivos staged, deteccion de secrets, validacion de nombre de rama. Si tarda mucho, los developers lo saltaran con `--no-verify`.

### 2. pre-push puede tardar mas

Los tests completos, type-check y auditorias de seguridad van aqui. El developer ya espera una pausa antes del push.

### 3. post-* nunca debe bloquear

Los hooks post son informativos y para automatizaciones. Siempre incluir fallbacks:

```bash
# Ejemplo: si SonarQube no esta disponible, avisar y continuar
if ! curl -s --max-time 3 "http://localhost:9000/api/system/status" > /dev/null 2>&1; then
  echo "Skipping SonarQube: server not reachable"
  exit 0  # <- no bloquear
fi
```

### 4. set -e al principio de hooks pre-*

Para que cualquier comando que falle pare el script inmediatamente:

```bash
#!/bin/sh
set -e  # Un fallo en cualquier comando = hook falla = operacion bloqueada
```

### 5. Mensajes claros de error

Siempre explicar que fallo y como solucionarlo:

```bash
echo "ERROR: Commit message does not follow Conventional Commits format"
echo ""
echo "Expected format: tipo(scope): descripcion"
echo "Example: feat(auth): add MFA backup codes support"
```

## Hooks de TeamHub - Detalle

### pre-commit

**Archivo:** `.husky/pre-commit`

**Que hace:**
1. **Validacion de rama GitFlow** - Solo permite ramas con formato `main`, `develop`, `feature/*`, `bugfix/*`, `hotfix/*`, `release/x.x.x`
2. **Deteccion de secrets** - Usa `gitleaks` para escanear archivos staged buscando API keys, passwords, tokens hardcodeados

### commit-msg

**Archivo:** `.husky/commit-msg`

**Que hace:**
- Valida que el mensaje de commit siga el formato **Conventional Commits**
- Permite commits de merge (`Merge ...`) y revert (`Revert ...`) sin validacion
- Tipos validos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### pre-push

**Archivo:** `.husky/pre-push`

**Que hace:**
1. **Proteccion de ramas** - Bloquea push directo a `main` y `develop`
2. **Validacion OpenAPI** - Ejecuta `scripts/validate-openapi.sh`
3. **Backend** - `npm run lint` + `npm run type-check` + `npm run test`
4. **Frontend** - `npm run lint` + `npm run type-check` + `npm run test`
5. **Auditoria de seguridad** - `npm audit --audit-level=high` en backend y frontend

### post-merge

**Archivo:** `.husky/post-merge`

**Que hace:**
1. Solo se activa en la rama `develop`
2. Verifica que `.env.sonar` existe y tiene `SONAR_TOKEN`
3. Comprueba que SonarQube esta corriendo en `localhost:9000`
4. Genera reportes de cobertura con `vitest run --coverage` (backend + frontend)
5. Envia analisis a SonarQube como proyecto `TeamHub-develop`

## Referencia rapida

| Quiero... | Hook | Bloquea? |
|---|---|---|
| Validar formato de commit | `commit-msg` | Si |
| Ejecutar linter antes de commit | `pre-commit` | Si |
| Correr tests antes de push | `pre-push` | Si |
| Analizar codigo tras merge/pull | `post-merge` | No |
| Instalar deps al cambiar de rama | `post-checkout` | No |
| Prevenir rebase en ramas protegidas | `pre-rebase` | Si |
