# SonarQube Action Checklist - TeamHub

**Fecha:** 11 de febrero de 2026  
**Estado Dashboard:** ✅ Passed (pero con áreas críticas de mejora)  
**Líneas de Código:** 22k (TypeScript, CSS)

---

## 🚨 PRIORIDAD CRÍTICA (Security & Reliability)

### 1. Security Hotspots - 0% Reviewed (E) → 100% (A)
**Status:** ❌ CRÍTICO - No hay ningún hotspot revisado

**Checklist:**
- [ ] Listar todos los Security Hotspots del proyecto
- [ ] Clasificar por tipo (Authentication, Crypto, File Handling, etc.)
- [ ] Revisar cada hotspot según OWASP Top 10
- [ ] Marcar como Safe o Fix según análisis
- [ ] Documentar decisiones en ADR si aplica
- [ ] **GitFlow:** Crear `feature/security-hotspots-review` desde `develop`

**Áreas típicas a revisar:**
- Autenticación MFA (login-form.tsx ya está securizado)
- Manejo de tokens y sesiones
- Validación de inputs (ya usa Zod ✅)
- File uploads
- Operaciones de base de datos
- Headers de seguridad HTTP

---

### 2. Reliability - 36 Bugs (C) → 0 Bugs (A)
**Status:** ⚠️ ALTA PRIORIDAD - Riesgo de fallos en producción

**Checklist:**
- [ ] Exportar lista completa de 36 bugs desde SonarQube
- [ ] Clasificar por severidad (Blocker, Critical, Major, Minor)
- [ ] Priorizar bugs en lógica CORE (100% coverage)
- [ ] Crear issues en GitHub para tracking
- [ ] **GitFlow:** Crear branches `bugfix/sonar-<issue-id>` desde `develop`
- [ ] Aplicar Boy Scout Rule: mejorar código circundante
- [ ] Ejecutar tests antes de cada commit (OBLIGATORIO)
- [ ] NO usar `--no-verify` bajo ninguna circunstancia

**Tipos de bugs comunes:**
- Null pointer dereferences
- Resource leaks
- Type errors
- Logic errors
- Async/await mal manejado
- Error handling inadecuado

---

## ⚠️ PRIORIDAD ALTA (Quality & Testing)

### 3. Test Coverage - 17.4% → 80%+ (IMPORTANT), 100% (CORE)
**Status:** ⚠️ MUY BAJO - No cumple estrategia 100/80/0

**Checklist:**
- [ ] Identificar lógica CORE (cálculos de dinero, auth crítico)
- [ ] Identificar funcionalidades IMPORTANT (UI visible al usuario)
- [ ] Crear plan de cobertura progresivo
- [ ] **GitFlow:** Crear `test/increase-coverage` desde `develop`
- [ ] Escribir tests para componentes críticos:
  - [ ] LoginForm con todos los flujos MFA
  - [ ] AuthContext y useAuth hook
  - [ ] Validadores de contraseña
  - [ ] Manejo de errores de API
  - [ ] Servicios backend críticos
- [ ] Configurar Quality Gate: coverage > 80% para PR
- [ ] Integrar Vitest en CI/CD pipeline
- [ ] Ejecutar `npm test` antes de cada push

**Meta por fase:**
- Fase 1: 40% coverage (funcionalidades críticas)
- Fase 2: 60% coverage (componentes principales)
- Fase 3: 80%+ coverage (IMPORTANT completo)

---

### 4. Maintainability - 191 Code Smells (A)
**Status:** ✅ CALIFICACIÓN A - Mejoras incrementales

**Checklist:**
- [ ] Filtrar code smells por severidad (Major, Minor)
- [ ] Aplicar refactoring continuo (Boy Scout Rule)
- [ ] Priorizar smells en código frecuentemente modificado
- [ ] **GitFlow:** Integrar en branches de features/bugfixes
- [ ] Refactoring patterns prioritarios:
  - [ ] Eliminar Magic Numbers → constantes en `business-rules.ts`
  - [ ] Reducir complejidad ciclomática < 5
  - [ ] Extraer funciones puras de lógica de negocio
  - [ ] Aplicar Strategy pattern en switches complejos
  - [ ] Mejorar nombres de variables (evitar abreviaturas)
- [ ] Mantener JSDoc/TSDoc actualizado
- [ ] Ejecutar linter antes de commit: `npm run lint`

**Regla de oro:** No crear deuda técnica nueva. Si tocas código, déjalo mejor.

---

## ✅ PRIORIDAD MEDIA (Optimización)

### 5. Code Duplications - 4.9%
**Status:** ✅ ACEPTABLE - Mantener bajo control

**Checklist:**
- [ ] Monitorear que no supere 5%
- [ ] Refactorizar duplicación al encontrarla
- [ ] Crear utilidades compartidas cuando aplique
- [ ] Documentar decisiones de abstracción vs. duplicación

---

## 🔒 Security by Design & Security by Default

### Checklist de Verificación (AGENTS.md)

**Configuración (✅ Completado):**
- [x] Variables de entorno en `.env` (no en repo)
- [x] Token SonarQube securizado con `${env:SONARQUBE_TOKEN}`
- [x] `.env.example` creado con placeholders
- [x] `.gitignore` excluye `.env` y secretos

**Validación Fail-Fast:**
- [ ] Verificar uso de Zod en todos los endpoints backend
- [ ] Validar variables de entorno en startup (backend)
- [ ] App no debe arrancar con configuración inválida

**Headers de Seguridad:**
- [ ] Implementar CSP estricto en Next.js
- [ ] Añadir `X-Frame-Options: DENY`
- [ ] Forzar HTTPS en producción
- [ ] Configurar HSTS headers

**MFA (CRÍTICO):**
- [ ] Verificar que MFA NUNCA se puede deshabilitar
- [ ] Códigos de recuperación implementados
- [ ] Backup codes guardados de forma segura
- [ ] Documentar proceso de recuperación en docs

**Prepared Statements:**
- [ ] Revisar todas las queries SQL usan Drizzle ORM (✅ esperado)
- [ ] No hay concatenación de strings en SQL
- [ ] Validación de inputs antes de queries

---

## 📋 GitFlow Workflow (OBLIGATORIO)

### Estrategia de Branches

```
develop (base actual)
├── feature/security-hotspots-review
├── bugfix/sonar-reliability-issues
├── test/increase-coverage
└── refactor/code-smells-cleanup
```

### Checklist por Branch

**ANTES de empezar:**
- [ ] `git checkout develop && git pull origin develop`
- [ ] `git checkout -b <tipo>/<nombre-descriptivo>`

**ANTES de commit:**
- [ ] `npm run lint` (frontend y backend)
- [ ] `npm test` (frontend y backend)
- [ ] **SI FALLAN TESTS → NO COMMIT**
- [ ] Revisar cambios con `git diff`

**Para subir cambios:**
- [ ] `git add <archivos-específicos>` (NO `git add .`)
- [ ] `git commit -m "tipo(scope): descripción"` (SIN --no-verify)
- [ ] `git push -u origin <rama>` (SIN --no-verify)
- [ ] `gh pr create --base develop`

**NUNCA:**
- ❌ Push directo a main/develop
- ❌ Commit sin ejecutar tests
- ❌ Push si tests fallan
- ❌ `--no-verify` (hooks de Husky son obligatorios)
- ❌ Merge sin PR aprobado

---

## 🎯 Plan de Ejecución (Roadmap)

### Sprint 1: Security & Reliability (CRÍTICO)
**Duración:** 1-2 semanas

1. **Día 1-2:** Security Hotspots Review
   - Listar y clasificar
   - Revisar y documentar
   - Crear `feature/security-hotspots-review`

2. **Día 3-5:** Bugs Críticos (Blocker/Critical)
   - Identificar y priorizar
   - Fix + tests para cada bug
   - Crear `bugfix/sonar-critical-bugs`

3. **Día 6-10:** Bugs Restantes (Major/Minor)
   - Batch fix por área funcional
   - Refactoring incremental
   - Merge PRs progresivamente

### Sprint 2: Testing & Coverage (ALTA PRIORIDAD)
**Duración:** 2-3 semanas

1. **Semana 1:** CORE Coverage (100%)
   - Tests para lógica crítica de negocio
   - Tests de autenticación y MFA
   - Tests de validación de datos

2. **Semana 2-3:** IMPORTANT Coverage (80%)
   - Tests de componentes UI
   - Tests de integración
   - Tests E2E críticos

### Sprint 3: Maintainability (CONTINUO)
**Duración:** Ongoing

1. Aplicar Boy Scout Rule en cada PR
2. Refactoring incremental de code smells
3. Documentación JSDoc/TSDoc actualizada
4. Mantener duplicación < 5%

---

## 📊 Quality Gates (CI/CD)

### Pre-commit (Husky)
```bash
npm run lint
npm run type-check
```

### Pre-push (Husky)
```bash
npm test -- --coverage
# Mínimo 80% en archivos modificados
```

### Pull Request (GitHub Actions)
```bash
npm run lint
npm test -- --coverage --run
npm run build
sonarqube scan
```

**Criterios de Aprobación:**
- ✅ Linting sin errores
- ✅ Tests pasando (100%)
- ✅ Coverage > 80% en código IMPORTANT
- ✅ Coverage 100% en código CORE
- ✅ Build exitoso
- ✅ SonarQube Quality Gate: Passed
- ✅ Revisión de código aprobada (1+ reviewer)

---

## 📝 Documentación Obligatoria

### Por cada fix significativo:

**AGENTS.md checklist:**
- [ ] Actualizar `docs/decisiones.md` con ADR numerado
- [ ] Añadir contexto de la decisión
- [ ] Documentar consecuencias
- [ ] Actualizar progreso de fases (%)
- [ ] Marcar tareas completadas con `[x]`

**JSDoc/TSDoc:**
- [ ] Toda función tiene comentario con propósito
- [ ] `@param` para todos los parámetros
- [ ] `@returns` para valores de retorno
- [ ] `@throws` para errores si aplica
- [ ] `@example` cuando aporte claridad

**Storybook (UI):**
- [ ] Actualizar stories si componente cambia
- [ ] Añadir variantes nuevas si aplica

---

## 🎓 Métricas de Éxito

### Objetivo Final (Quality Gate Ideal)

| Métrica | Actual | Meta | Status |
|---------|--------|------|--------|
| **Security** | A (0) | A (0) | ✅ Mantener |
| **Reliability** | C (36 bugs) | A (0 bugs) | ❌ Crítico |
| **Maintainability** | A (191) | A (<150) | ✅ Mejorar |
| **Hotspots Reviewed** | E (0%) | A (100%) | ❌ Crítico |
| **Coverage** | 17.4% | 80%+ | ❌ Crítico |
| **Duplications** | 4.9% | <5% | ✅ Mantener |

### Definición de Done

- [ ] Security: 0 vulnerabilidades, 100% hotspots reviewed
- [ ] Reliability: 0 bugs, calificación A
- [ ] Coverage: >80% IMPORTANT, 100% CORE
- [ ] Maintainability: <150 code smells, calificación A
- [ ] Duplications: <5%
- [ ] Documentación: 100% actualizada
- [ ] CI/CD: Quality Gates pasando en todos los PRs

---

## 🚀 Comandos Útiles

### Análisis Local
```bash
# Linting
cd frontend && npm run lint
cd backend && npm run lint

# Tests con coverage
cd frontend && npm test -- --coverage
cd backend && npm test -- --coverage

# Build
cd frontend && npm run build
cd backend && npm run build

# SonarQube scan local (requiere server activo)
npm run sonar
```

### Git Workflow
```bash
# Crear feature branch
git checkout develop
git pull origin develop
git checkout -b feature/security-hotspots-review

# Commit con Conventional Commits
git add src/components/forms/login-form.tsx
git commit -m "fix(auth): resolve security hotspot in password validation"

# Push y crear PR
git push -u origin feature/security-hotspots-review
gh pr create --base develop --title "fix(auth): Security hotspots review" --body "Resolves SonarQube security hotspots in authentication flow"

# Merge PR (después de aprobación)
gh pr merge <number> --squash
# ⚠️ NO usar --delete-branch (preservar ramas para trazabilidad)
```

---

## 📞 Referencias

- **AGENTS.md:** Manual de operaciones para este proyecto
- **SonarQube:** http://localhost:9000/dashboard?id=TeamHub
- **Docs:** `docs/decisiones.md` - Registro de decisiones (ADRs)
- **OpenAPI:** `openapi.yaml` - Contrato de API

---

**Última actualización:** 11 de febrero de 2026  
**Responsable:** GitHub Copilot Agent  
**Estado:** 🟡 En Progreso (Critical fixes pending)
