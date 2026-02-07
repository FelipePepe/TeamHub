import { Page } from '@playwright/test';
import {
  OperationLogger,
  OperationResult,
  captureScreenshot,
  waitForSuccessToast,
  captureToastScreenshot,
  openCreateModal,
  fillFormField,
  submitFormAndWait,
  verifyInList,
  verifyNotInList,
  searchInList,
  waitForNetworkIdle,
  waitForModalClose,
} from '../crud.helpers';
import type { ErrorDetail, WarningDetail } from '../crud.helpers';
import { navigateTo, read, think, moveAndClick } from '../demo.helpers';
import { ErrorMonitor } from '../monitoring/error-detection';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * CRUD Helpers para Departamentos
 * Operaciones reutilizables: Create, Read, Update, Delete
 */

const ENTITY_NAME = 'departamentos';

// ============================================
// TIPOS
// ============================================

export interface DepartamentoData {
  nombre: string;
  codigo: string;
  descripcion?: string;
  color?: string;
}

// ============================================
// NAVEGACIÓN
// ============================================

/**
 * Navega a la página de departamentos y captura screenshot
 */
export async function navigateToDepartamentos(
  page: Page,
  logger: OperationLogger
): Promise<OperationResult> {
  const startTime = Date.now();
  const errors: any[] = [];
  
  console.log('\n📍 Navegando a Departamentos...');
  
  try {
    await navigateTo(page, 'Departamentos');
    await waitForNetworkIdle(page);
    
    const screenshot = await captureScreenshot(page, ENTITY_NAME, 'listado-inicial', logger);
    
    return {
      operation: 'NAVIGATE',
      entity: ENTITY_NAME,
      success: true,
      duration: Date.now() - startTime,
      screenshotBefore: '',
      screenshotAfter: screenshot,
      errors,
      warnings: [],
      metadata: { url: page.url() },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    errors.push({
      type: 'navigation',
      message: `Error navegando a Departamentos: ${error}`,
      timestamp: new Date().toISOString(),
    });
    
    return {
      operation: 'NAVIGATE',
      entity: ENTITY_NAME,
      success: false,
      duration: Date.now() - startTime,
      screenshotBefore: '',
      screenshotAfter: '',
      errors,
      warnings: [],
      metadata: { error: String(error) },
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// CREATE
// ============================================

/**
 * Crea un departamento y verifica que aparezca en el listado
 */
export async function createDepartmentAndVerify(
  page: Page,
  data: DepartamentoData,
  logger: OperationLogger,
  errorMonitor: ErrorMonitor
): Promise<OperationResult> {
  const startTime = Date.now();
  const errors: any[] = [];
  const warnings: any[] = [];
  
  console.log(`\n➕ Creando departamento: ${data.nombre}...`);
  
  let screenshotBefore = '';
  let screenshotAfter = '';
  
  try {
    // 1. Capturar estado inicial
    screenshotBefore = await captureScreenshot(page, ENTITY_NAME, 'antes-crear', logger);
    
    // 2. Abrir modal de crear
    const modalOpened = await openCreateModal(page, 'Crear Departamento');
    if (!modalOpened) {
      throw new Error('No se pudo abrir el modal de crear departamento');
    }
    
    await captureScreenshot(page, ENTITY_NAME, 'modal-crear', logger);
    
    // 3. Llenar formulario
    await fillFormField(page, '#nombre', data.nombre);
    await fillFormField(page, '#codigo', data.codigo);
    
    if (data.descripcion) {
      await fillFormField(page, '#descripcion', data.descripcion);
    }
    
    if (data.color) {
      await fillFormField(page, '#color', data.color);
    }
    
    await captureScreenshot(page, ENTITY_NAME, 'form-lleno', logger);
    
    // 4. Submit
    const submitted = await submitFormAndWait(page);
    if (!submitted) {
      throw new Error('Error al enviar el formulario');
    }
    
    // 5. Verificar toast de éxito
    const toastSuccess = await waitForSuccessToast(page, 'creado');
    if (!toastSuccess) {
      warnings.push({
        type: 'missing-element',
        message: 'Toast de éxito no detectado',
        timestamp: new Date().toISOString(),
      });
    }
    
    await captureToastScreenshot(page, ENTITY_NAME, logger);
    
    // 6. Esperar a que cierre el modal
    await waitForModalClose(page);
    await waitForNetworkIdle(page);
    
    // 7. Verificar en listado
    const inList = await verifyInList(page, data.nombre);
    if (!inList) {
      throw new Error(`Departamento "${data.nombre}" no encontrado en el listado`);
    }
    
    screenshotAfter = await captureScreenshot(page, ENTITY_NAME, 'despues-crear', logger);
    
    // 8. Verificar errores
    await errorMonitor.detectVisualErrors(page);
    const monitorErrors = errorMonitor.toErrorDetails();
    errors.push(...monitorErrors);
    
    return {
      operation: 'CREATE',
      entity: ENTITY_NAME,
      success: errors.filter(e => e.type === 'console' || e.type === 'network').length === 0,
      duration: Date.now() - startTime,
      screenshotBefore,
      screenshotAfter,
      errors,
      warnings,
      metadata: { inputData: data, found: inList },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    errors.push({
      type: 'validation',
      message: `Error creando departamento: ${error}`,
      timestamp: new Date().toISOString(),
    });
    
    if (!screenshotAfter) {
      screenshotAfter = await captureScreenshot(page, ENTITY_NAME, 'error-crear', logger);
    }
    
    return {
      operation: 'CREATE',
      entity: ENTITY_NAME,
      success: false,
      duration: Date.now() - startTime,
      screenshotBefore,
      screenshotAfter,
      errors,
      warnings,
      metadata: { inputData: data, error: String(error) },
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// READ / SEARCH
// ============================================

/**
 * Busca un departamento en el listado
 */
export async function searchDepartment(
  page: Page,
  nombre: string,
  logger: OperationLogger
): Promise<OperationResult> {
  const startTime = Date.now();
  const errors: any[] = [];
  
  console.log(`\n🔍 Buscando departamento: ${nombre}...`);
  
  try {
    const screenshotBefore = await captureScreenshot(page, ENTITY_NAME, 'antes-buscar', logger);
    
    await searchInList(page, nombre);
    await waitForNetworkIdle(page);
    
    const found = await verifyInList(page, nombre);
    
    const screenshotAfter = await captureScreenshot(page, ENTITY_NAME, 'despues-buscar', logger);
    
    return {
      operation: 'READ',
      entity: ENTITY_NAME,
      success: found,
      duration: Date.now() - startTime,
      screenshotBefore,
      screenshotAfter,
      errors,
      warnings: found ? [] : [{ type: 'missing-element', message: `Departamento "${nombre}" no encontrado`, timestamp: new Date().toISOString() }],
      metadata: { searchTerm: nombre, found },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    errors.push({
      type: 'validation',
      message: `Error buscando departamento: ${error}`,
      timestamp: new Date().toISOString(),
    });
    
    return {
      operation: 'READ',
      entity: ENTITY_NAME,
      success: false,
      duration: Date.now() - startTime,
      screenshotBefore: '',
      screenshotAfter: '',
      errors,
      warnings: [],
      metadata: { searchTerm: nombre, error: String(error) },
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// UPDATE
// ============================================

/**
 * Edita un departamento y verifica los cambios
 */
export async function editDepartmentAndVerify(
  page: Page,
  currentName: string,
  newData: Partial<DepartamentoData>,
  logger: OperationLogger,
  errorMonitor: ErrorMonitor
): Promise<OperationResult> {
  const startTime = Date.now();
  const errors: any[] = [];
  const warnings: any[] = [];
  
  console.log(`\n✏️  Editando departamento: ${currentName}...`);
  
  let screenshotBefore = '';
  let screenshotAfter = '';
  
  try {
    // 1. Buscar el departamento
    await searchInList(page, currentName);
    await waitForNetworkIdle(page);
    
    screenshotBefore = await captureScreenshot(page, ENTITY_NAME, 'antes-editar', logger);
    
    // 2. Click en botón Editar (buscar en la fila del departamento)
    const row = page.locator(`tr:has-text("${currentName}")`).first();
    const editButton = row.locator('button:has-text("Editar"), button[aria-label*="Editar"]').first();
    await editButton.waitFor({ state: 'visible', timeout: 5000 });
    await moveAndClick(page, editButton);
    
    // Esperar modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await read(page);
    await captureScreenshot(page, ENTITY_NAME, 'modal-editar', logger);
    
    // 3. Modificar campos
    if (newData.nombre) {
      await fillFormField(page, '#nombre', newData.nombre);
    }
    if (newData.codigo) {
      await fillFormField(page, '#codigo', newData.codigo);
    }
    if (newData.descripcion) {
      await fillFormField(page, '#descripcion', newData.descripcion);
    }
    if (newData.color) {
      await fillFormField(page, '#color', newData.color);
    }
    
    await captureScreenshot(page, ENTITY_NAME, 'form-editado', logger);
    
    // 4. Guardar
    const submitted = await submitFormAndWait(page);
    if (!submitted) {
      throw new Error('Error al guardar los cambios');
    }
    
    // 5. Verificar toast
    const toastSuccess = await waitForSuccessToast(page, 'actualizado');
    if (!toastSuccess) {
      warnings.push({
        type: 'missing-element',
        message: 'Toast de éxito no detectado',
        timestamp: new Date().toISOString(),
      });
    }
    
    await captureToastScreenshot(page, ENTITY_NAME, logger);
    
    // 6. Esperar cierre de modal
    await waitForModalClose(page);
    await waitForNetworkIdle(page);
    
    // 7. Verificar cambios en listado
    const newName = newData.nombre || currentName;
    const inList = await verifyInList(page, newName);
    if (!inList) {
      throw new Error(`Departamento "${newName}" no encontrado después de editar`);
    }
    
    screenshotAfter = await captureScreenshot(page, ENTITY_NAME, 'despues-editar', logger);
    
    // 8. Verificar errores
    await errorMonitor.detectVisualErrors(page);
    const monitorErrors = errorMonitor.toErrorDetails();
    errors.push(...monitorErrors);
    
    return {
      operation: 'UPDATE',
      entity: ENTITY_NAME,
      success: errors.filter(e => e.type === 'console' || e.type === 'network').length === 0,
      duration: Date.now() - startTime,
      screenshotBefore,
      screenshotAfter,
      errors,
      warnings,
      metadata: { currentName, newData, found: inList },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    errors.push({
      type: 'validation',
      message: `Error editando departamento: ${error}`,
      timestamp: new Date().toISOString(),
    });
    
    if (!screenshotAfter) {
      screenshotAfter = await captureScreenshot(page, ENTITY_NAME, 'error-editar', logger);
    }
    
    return {
      operation: 'UPDATE',
      entity: ENTITY_NAME,
      success: false,
      duration: Date.now() - startTime,
      screenshotBefore,
      screenshotAfter,
      errors,
      warnings,
      metadata: { currentName, newData, error: String(error) },
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// DELETE
// ============================================

/**
 * Elimina un departamento y verifica que desaparezca
 */
export async function deleteDepartmentAndVerify(
  page: Page,
  nombre: string,
  logger: OperationLogger,
  errorMonitor: ErrorMonitor
): Promise<OperationResult> {
  const startTime = Date.now();
  const errors: any[] = [];
  const warnings: any[] = [];
  
  console.log(`\n🗑️  Eliminando departamento: ${nombre}...`);
  
  let screenshotBefore = '';
  let screenshotAfter = '';
  
  try {
    // 1. Buscar el departamento
    await searchInList(page, nombre);
    await waitForNetworkIdle(page);
    
    screenshotBefore = await captureScreenshot(page, ENTITY_NAME, 'antes-eliminar', logger);
    
    // 2. Click en botón Eliminar
    const row = page.locator(`tr:has-text("${nombre}")`).first();
    const deleteButton = row.locator('button:has-text("Eliminar"), button[aria-label*="Eliminar"]').first();
    await deleteButton.waitFor({ state: 'visible', timeout: 5000 });
    await moveAndClick(page, deleteButton);
    
    await think(page);
    await captureScreenshot(page, ENTITY_NAME, 'confirmacion-eliminar', logger);
    
    // 3. Confirmar eliminación (puede haber un diálogo de confirmación)
    const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Eliminar"), [role="dialog"] button[class*="destructive"]').first();
    const confirmVisible = await confirmButton.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (confirmVisible) {
      await confirmButton.click();
      await think(page);
    }
    
    // 4. Verificar toast
    const toastSuccess = await waitForSuccessToast(page, 'eliminado');
    if (!toastSuccess) {
      warnings.push({
        type: 'missing-element',
        message: 'Toast de éxito no detectado',
        timestamp: new Date().toISOString(),
      });
    }
    
    await captureToastScreenshot(page, ENTITY_NAME, logger);
    
    // 5. Esperar actualización
    await waitForNetworkIdle(page);
    
    // 6. Verificar que ya no está en el listado
    const notInList = await verifyNotInList(page, nombre);
    if (!notInList) {
      throw new Error(`Departamento "${nombre}" todavía visible después de eliminar`);
    }
    
    screenshotAfter = await captureScreenshot(page, ENTITY_NAME, 'despues-eliminar', logger);
    
    // 7. Verificar errores
    await errorMonitor.detectVisualErrors(page);
    const monitorErrors = errorMonitor.toErrorDetails();
    errors.push(...monitorErrors);
    
    return {
      operation: 'DELETE',
      entity: ENTITY_NAME,
      success: errors.filter(e => e.type === 'console' || e.type === 'network').length === 0,
      duration: Date.now() - startTime,
      screenshotBefore,
      screenshotAfter,
      errors,
      warnings,
      metadata: { nombre, removed: notInList },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    errors.push({
      type: 'validation',
      message: `Error eliminando departamento: ${error}`,
      timestamp: new Date().toISOString(),
    });
    
    if (!screenshotAfter) {
      screenshotAfter = await captureScreenshot(page, ENTITY_NAME, 'error-eliminar', logger);
    }
    
    return {
      operation: 'DELETE',
      entity: ENTITY_NAME,
      success: false,
      duration: Date.now() - startTime,
      screenshotBefore,
      screenshotAfter,
      errors,
      warnings,
      metadata: { nombre, error: String(error) },
      timestamp: new Date().toISOString(),
    };
  }
}
