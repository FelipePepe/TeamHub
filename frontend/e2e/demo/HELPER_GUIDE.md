# Helpers CRUD - Guía de Uso

## 📚 Resumen de Helpers Disponibles

### `crud.helpers.ts` - Operaciones Base

**OperationLogger**: Trackea todas las operaciones con métricas
```typescript
const logger = new OperationLogger();
logger.addOperation(result);
logger.printReport();  // Muestra resumen en consola
logger.exportToJSON(); // Exporta a JSON
```

**Screenshots**:
```typescript
await captureScreenshot(page, 'departamentos', 'antes-crear', logger);
await captureElementScreenshot(page, '.modal', 'modal-crear', 'departamentos', logger);
await captureToastScreenshot(page, 'departamentos', logger);
```

**Forms**:
```typescript
await openCreateModal(page, 'Crear Departamento');
await fillFormField(page, '#nombre', 'IT Department');
await submitFormAndWait(page);
```

**Toast Validation**:
```typescript
await waitForSuccessToast(page, 'creado exitosamente');
await waitForErrorToast(page, 'ya existe');
```

**Verification**:
```typescript
await verifyInList(page, 'IT Department');
await verifyNotInList(page, 'Deleted Dept');
await searchInList(page, 'IT');
```

### `monitoring/error-detection.ts` - Detección de Errores

**ErrorMonitor**: Captura errores automáticamente
```typescript
const errorMonitor = new ErrorMonitor();
await errorMonitor.setup(page);  // Activa listeners

// Durante el test, captura automáticamente:
// - console.error, console.warning
// - page errors (uncaught exceptions)
// - network errors (4xx, 5xx)
// - request failures

await errorMonitor.detectVisualErrors(page);  // Detecta elementos .error, .alert-error
errorMonitor.printSummary();
await errorMonitor.saveReport('errors.json');
```

### `entities/departamentos.crud.ts` - CRUD Específico

**Navegación**:
```typescript
await navigateToDepartamentos(page, logger);
```

**Create**:
```typescript
const data = {
  nombre: 'Desarrollo',
  codigo: 'DEV',
  descripcion: 'Departamento de desarrollo',
  color: '#3B82F6'
};
await createDepartmentAndVerify(page, data, logger, errorMonitor);
```

**Read**:
```typescript
await searchDepartment(page, 'Desarrollo', logger);
```

**Update**:
```typescript
await editDepartmentAndVerify(
  page,
  'Desarrollo',           // nombre actual
  { nombre: 'Dev Team' }, // datos nuevos
  logger,
  errorMonitor
);
```

**Delete**:
```typescript
await deleteDepartmentAndVerify(page, 'Dev Team', logger, errorMonitor);
```

## 🔄 Flujo Típico de Test

```typescript
test('CRUD completo', async ({ page }, testInfo) => {
  // 1. Setup
  const logger = new OperationLogger();
  const errorMonitor = new ErrorMonitor();
  
  // 2. Autenticación
  const tokens = await getAdminTokens();
  await applySession(page, tokens, '/dashboard');
  await errorMonitor.setup(page);
  
  // 3. Navegación
  const navResult = await navigateToDepartamentos(page, logger);
  logger.addOperation(navResult);
  
  // 4. CREATE
  const createResult = await createDepartmentAndVerify(
    page,
    { nombre: 'IT', codigo: 'IT001' },
    logger,
    errorMonitor
  );
  logger.addOperation(createResult);
  expect(createResult.success).toBe(true);
  
  // 5. UPDATE
  const updateResult = await editDepartmentAndVerify(
    page,
    'IT',
    { nombre: 'IT Updated' },
    logger,
    errorMonitor
  );
  logger.addOperation(updateResult);
  
  // 6. DELETE
  const deleteResult = await deleteDepartmentAndVerify(
    page,
    'IT Updated',
    logger,
    errorMonitor
  );
  logger.addOperation(deleteResult);
  
  // 7. Reportes
  logger.printReport();
  errorMonitor.printSummary();
  
  await testInfo.attach('operations.json', {
    body: logger.exportToJSON(),
    contentType: 'application/json',
  });
  
  await testInfo.attach('errors.json', {
    body: errorMonitor.generateReport(),
    contentType: 'application/json',
  });
});
```

## 📊 OperationResult

Cada operación retorna:
```typescript
interface OperationResult {
  operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'NAVIGATE' | 'INTERACT';
  entity: string;           // 'departamentos', 'empleados', etc.
  success: boolean;
  duration: number;         // ms
  screenshotBefore: string; // path
  screenshotAfter: string;  // path
  errors: ErrorDetail[];
  warnings: WarningDetail[];
  metadata: Record<string, any>; // datos input/output
  timestamp: string;
}
```

## 🎨 Extender para Nuevas Entidades

Para añadir CRUD de `empleados`:

1. Crear `e2e/demo/entities/empleados.crud.ts`:
```typescript
export interface EmpleadoData {
  nombre: string;
  email: string;
  departamentoId: string;
  // ...
}

export async function createEmpleadoAndVerify(
  page: Page,
  data: EmpleadoData,
  logger: OperationLogger,
  errorMonitor: ErrorMonitor
): Promise<OperationResult> {
  // Similar a createDepartmentAndVerify
  // 1. Capturar antes
  // 2. Abrir modal
  // 3. Llenar form
  // 4. Submit
  // 5. Verificar toast
  // 6. Verificar en listado
  // 7. Capturar después
  // 8. Retornar OperationResult
}

// exportar: edit, delete, search...
```

2. Crear test `e2e/demo/empleados-crud.spec.ts`:
```typescript
import { createEmpleadoAndVerify } from './entities/empleados.crud';

test('CRUD empleados', async ({ page }) => {
  // Similar a crud-complete.spec.ts
});
```

## 🚀 Mejores Prácticas

1. **Siempre usar OperationLogger**: Trackea todas las operaciones para métricas
2. **Activar ErrorMonitor**: Detecta errores que no veas manualmente
3. **Capturar screenshots antes/después**: Evidencia visual completa
4. **Verificar toast messages**: Confirman que la operación llegó al backend
5. **Verificar en listado**: Confirman persistencia de datos
6. **Adjuntar reportes**: JSON para análisis posterior

## ⚠️ Troubleshooting

**Modal no abre**: Verificar selector del botón en `openCreateModal`
```typescript
// Ajustar en departamentos.crud.ts si el texto cambia
await openCreateModal(page, 'Crear Departamento'); // texto exacto del botón
```

**Toast no detectado**: Verificar selector en `waitForSuccessToast`
```typescript
// Por defecto busca: [data-sonner-toast], .sonner-toast
// Si tu toast usa otra clase, ajustar en crud.helpers.ts
```

**Campo no llena**: Verificar selector en `fillFormField`
```typescript
await fillFormField(page, '#nombre', 'valor');  // asegurar que ID es correcto
```

**Elemento no encontrado en listado**: Esperar a network idle
```typescript
await waitForNetworkIdle(page);
await verifyInList(page, 'texto-esperado');
```
