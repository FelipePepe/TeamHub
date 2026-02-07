# 🤖 Explorer Bot - Testing Exploratorio Automatizado

## 📋 ¿Qué es?

**Explorer Bot** es un sistema de testing exploratorio que actúa como un **usuario real** utilizando la aplicación TeamHub. Navega, interactúa con elementos, completa flujos y **detecta errores automáticamente**.

### Características Principales

✅ **5 Tipos de Detección de Errores**:
1. **JavaScript**: console.error, excepciones no capturadas
2. **Network**: Respuestas HTTP 4xx/5xx, request failures
3. **Visual**: Imágenes rotas, textos "undefined/null"
4. **Behavior**: Modals que no cierran, botones que no responden
5. **Performance**: Páginas lentas (>5s), memory leaks

✅ **Flujos de Usuario Automatizados**:
- CRUD completo de Departamentos
- Validación de edge cases (código duplicado, campos vacíos)
- Exploración caótica (clicks aleatorios)

✅ **Reportes Detallados**:
- Resumen de errores por tipo y severidad
- Screenshots de cada error encontrado
- JSON con todos los detalles exportable

---

## 🚀 Uso Rápido

```bash
# Explorar todos los flows (con ventana visible)
npm run explore

# Sin ventana (headless)
npm run explore:headless

# Solo chaos mode
npm run explore:chaos

# Test específico
npx playwright test explorer -g "Departamentos" --headed
```

---

## 📂 Estructura

```
e2e/explorer-bot/
├── bot.ts                  # ExplorerBot (cerebro del sistema)
├── detector.ts             # AdvancedErrorDetector (detecta 5 tipos de errores)
├── explorer.spec.ts        # Test runner principal
├── flows/
│   ├── departamentos.flow.ts   # Flow CRUD departamentos
│   └── chaos.flow.ts           # Flow exploración caótica
└── reports/
    └── screenshots/        # Screenshots de errores
```

---

## 🧪 Tests Disponibles

### 1. Gestión de Departamentos
```bash
npx playwright test explorer -g "Departamentos" --headed
```

**Qué hace**:
- Navega a /admin/departamentos
- Crea un departamento nuevo
- Valida que aparezca en el listado
- Edita el departamento
- Valida que los cambios se reflejen
- Elimina el departamento
- Valida que desaparezca

**Validaciones**:
- Toast de éxito después de cada operación
- Elemento aparece/desaparece del listado
- Modal abre y cierra correctamente

---

### 2. Edge Cases de Departamentos
```bash
npx playwright test explorer -g "Edge Cases" --headed
```

**Qué hace**:
- Intenta crear departamento con código duplicado
- Intenta enviar formulario con campos vacíos
- Valida que se muestren errores de validación

**Validaciones**:
- Toast de error para código duplicado
- Mensajes de validación en formulario
- Botón submit deshabilitado hasta llenar campos requeridos

---

### 3. Chaos Mode (Exploración Caótica)
```bash
npm run explore:chaos
```

**Qué hace**:
- Hace 30 clicks aleatorios en elementos clicables
- Navega a páginas aleatorias
- Hace scroll aleatorio
- Detecta si se pierde y vuelve a estado seguro

**Objetivo**:
Encontrar bugs inesperados que no se descubren con tests tradicionales.

---

### 4. Suite Completa
```bash
npx playwright test explorer -g "Suite Completa" --headed
```

Ejecuta todos los flows en secuencia y genera reporte unificado.

---

## 🔍 Tipos de Errores Detectados

### 1. JavaScript Errors

```javascript
// Detecta automáticamente:
console.error('Something went wrong');
throw new Error('Cannot read property "name" of undefined');
```

**Severidad**: Critical si contiene "Cannot read property", "undefined is not a function"

---

### 2. Network Errors

```javascript
// Detecta respuestas:
HTTP 401 → "Verificar autenticación"
HTTP 403 → "Verificar permisos"
HTTP 404 → "Endpoint no existe"
HTTP 422 → "Error de validación"
HTTP 5xx → "Error del servidor"
```

---

### 3. Visual Errors

```javascript
// Detecta:
<img src="broken.png" />  // Imagen rota
<div>undefined</div>      // Texto "undefined"
<span>null</span>         // Texto "null"
<div>[object Object]</div> // Object sin serializar
```

---

### 4. Behavior Errors

```javascript
// Detecta:
await bot.clickButton('Cerrar');
// Si modal no cierra → Error de comportamiento

await bot.submitForm();
// Si botón sigue deshabilitado → Error de validación
```

---

### 5. Performance Issues

```javascript
// Detecta:
loadTime > 5000ms → "Página lenta"
memoryIncrease > 100% → "Posible memory leak"
```

---

## 📊 Reporte Generado

```
======================================================================
               REPORTE DE EXPLORACIÓN
======================================================================
Flows ejecutados: 3
Errores totales encontrados: 8
  - JavaScript:  2
  - Network:     3
  - Visual:      1
  - Behavior:    2
  - Performance: 0

Por severidad:
  - Críticos: 1
  - Altos:    3
  - Medios:   4
  - Bajos:    0
======================================================================

💥 ERRORES CRÍTICOS:

1. [javascript] Cannot read property 'nombre' of undefined
   URL: http://localhost:3000/admin/departamentos
   Acción: click button "Editar"
   💡 Fix sugerido: Añadir optional chaining (?.)

🔴 ERRORES ALTOS:

1. [network] POST /api/departamentos → 422 Unprocessable Entity
   URL: http://localhost:3000/admin/departamentos
   Acción: submit form
```

---

## 🛠️ API del ExplorerBot

### Navegación

```typescript
await bot.navigate('/admin/departamentos');
await bot.waitForPageLoad();
```

### Interacción con Elementos

```typescript
await bot.clickButton('Crear Departamento');
await bot.clickRowAction('Dept IT', 'Editar');
await bot.clickTab('Configuración');
await bot.clickRow('John Doe');
```

### Formularios

```typescript
await bot.fillForm({
  nombre: 'IT Department',
  codigo: 'IT01',
  descripcion: 'Departamento de TI',
});

await bot.fillField('email', 'test@example.com');
await bot.submitForm();
await bot.selectOption('rol', 'MANAGER');
```

### Validaciones (Expectations)

```typescript
// Modals
await bot.expectModal('abierto');
await bot.expectModal('cerrado');

// Toast messages
await bot.expectToast('éxito');
await bot.expectToast('error');

// Listados
await bot.expectInList('IT Department');
await bot.expectNotInList('Deleted Item');

// Badges
await bot.expectBadge('ACTIVO');
```

### Generadores de Datos

```typescript
const name = bot.generateRandomName('Departamento');
// "Departamento 754268"

const code = bot.generateRandomCode(4);
// "AB3X"

const text = bot.generateRandomText(10);
// "lorem ipsum dolor sit amet..."
```

### Detección de Errores

```typescript
// Detectar todos los errores acumulados
await bot.detectAllErrors();

// Checks de comportamiento personalizados
await bot.checkBehavior([
  {
    name: 'Button should be enabled after filling form',
    expected: 'Button enabled',
    severity: 'high',
    validate: async (page) => {
      const isEnabled = await page.locator('button[type="submit"]').isEnabled();
      return {
        passed: isEnabled,
        message: isEnabled ? 'OK' : 'Button still disabled',
        actual: isEnabled ? 'Enabled' : 'Disabled',
      };
    },
  },
]);
```

---

## 🎯 Crear Nuevos Flows

### 1. Crear archivo en `flows/`

```typescript
// e2e/explorer-bot/flows/empleados.flow.ts
import { ExplorerBot } from '../bot';
import type { FlowResult } from './departamentos.flow';

export async function exploreEmpleados(bot: ExplorerBot): Promise<FlowResult> {
  const startTime = Date.now();
  let actionsPerformed = 0;
  
  try {
    // Navegar
    await bot.navigate('/admin/empleados');
    await bot.waitForPageLoad();
    actionsPerformed++;
    
    // Crear empleado
    await bot.clickButton('Crear empleado');
    await bot.expectModal('abierto');
    
    await bot.fillForm({
      nombre: bot.generateRandomName('Empleado'),
      email: `test${Date.now()}@example.com`,
    });
    
    await bot.submitForm();
    await bot.expectToast('éxito');
    actionsPerformed++;
    
    // Detectar errores
    await bot.detectAllErrors();
    
    return {
      name: 'Empleados',
      success: true,
      duration: Date.now() - startTime,
      actionsPerformed,
      errorsFound: 0,
    };
    
  } catch (error) {
    console.log(`❌ Flow Empleados falló: ${error}`);
    return {
      name: 'Empleados',
      success: false,
      duration: Date.now() - startTime,
      actionsPerformed,
      errorsFound: 0,
    };
  }
}
```

### 2. Añadir al test runner

```typescript
// e2e/explorer-bot/explorer.spec.ts
import { exploreEmpleados } from './flows/empleados.flow';

test('Explorar: Gestión de Empleados', async () => {
  const result = await exploreEmpleados(bot);
  flowResults.push(result);
  
  if (!result.success) {
    throw new Error('Flow de Empleados falló');
  }
});
```

---

## 🔄 Integración con CI/CD (Futuro)

Crear `.github/workflows/explorer.yml`:

```yaml
name: Explorer Bot

on:
  schedule:
    - cron: '0 */4 * * *' # Cada 4 horas
  workflow_dispatch:

jobs:
  explore:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
        working-directory: frontend
      - name: Start backend
        run: npm run dev &
        working-directory: backend
      - name: Run Explorer Bot
        run: npm run explore:headless
        working-directory: frontend
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: explorer-report
          path: frontend/explorer-bot/reports/
```

---

## 📈 Métricas y KPIs

El Explorer Bot te permite medir:

- **Cobertura de flujos**: ¿Cuántos flujos se exploran?
- **Tasa de errores**: Errores por cada 100 acciones
- **Tiempo de exploración**: Duración de cada flow
- **Severidad de errores**: % de errores críticos vs bajos
- **Estabilidad**: ¿Los tests pasan consistentemente?

---

## 🐛 Troubleshooting

**El bot no encuentra un elemento:**
```typescript
// Ajustar timeout
await bot.clickButton('Crear', { timeout: 15000 });
```

**Modal no detectado:**
```typescript
// Verificar selector
await bot.page.locator('[role="dialog"]').waitFor();
```

**Demasiados errores de HTML5 validation:**
```typescript
// Ya están filtrados automáticamente
// Ver detector.ts línea 70
```

---

## 📚 Recursos

- [Playwright Docs](https://playwright.dev/)
- [Exploración Caótica](https://en.wikipedia.org/wiki/Chaos_engineering)
- [Testing Exploratorio](https://en.wikipedia.org/wiki/Exploratory_testing)

---

**Creado como parte del TFM - Sistema de Testing Avanzado para TeamHub**
