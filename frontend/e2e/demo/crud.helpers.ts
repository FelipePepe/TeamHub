import { Page } from '@playwright/test';
import { read, think } from './demo.helpers';

/**
 * CRUD Helpers - Sistema de validación de operaciones CRUD
 * Proporciona utilidades reutilizables para probar Create, Read, Update, Delete
 */

// ============================================
// TIPOS Y INTERFACES
// ============================================

export type OperationType = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'NAVIGATE' | 'INTERACT';

export interface ErrorDetail {
  type: 'console' | 'network' | 'visual' | 'validation';
  message: string;
  stack?: string;
  timestamp: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface WarningDetail {
  type: 'performance' | 'accessibility' | 'missing-element' | 'unexpected-state';
  message: string;
  timestamp: string;
}

export interface OperationResult {
  operation: OperationType;
  entity: string;
  success: boolean;
  duration: number;
  screenshotBefore: string;
  screenshotAfter: string;
  errors: ErrorDetail[];
  warnings: WarningDetail[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
  timestamp: string;
}

// ============================================
// OPERATION LOGGER
// ============================================

export class OperationLogger {
  private operations: OperationResult[] = [];
  private startTime: number = Date.now();
  private screenshotCounter = 0;

  /**
   * Registra una operación completada
   */
  addOperation(result: OperationResult) {
    this.operations.push(result);
    
    const status = result.success ? '✅' : '❌';
    const duration = result.duration.toFixed(0);
    console.log(`\n${status} ${result.operation} ${result.entity} (${duration}ms)`);
    
    if (result.errors.length > 0) {
      console.log('  Errores:');
      result.errors.forEach(e => console.log(`    ❌ [${e.type}] ${e.message}`));
    }
    
    if (result.warnings.length > 0) {
      console.log('  Warnings:');
      result.warnings.forEach(w => console.log(`    ⚠️  [${w.type}] ${w.message}`));
    }
  }

  /**
   * Obtiene resumen de operaciones
   */
  getSummary() {
    const total = this.operations.length;
    const successful = this.operations.filter(o => o.success).length;
    const failed = this.operations.filter(o => !o.success).length;
    const totalErrors = this.operations.reduce((sum, o) => sum + o.errors.length, 0);
    const totalWarnings = this.operations.reduce((sum, o) => sum + o.warnings.length, 0);
    const totalDuration = Date.now() - this.startTime;
    
    return { total, successful, failed, totalErrors, totalWarnings, totalDuration };
  }

  /**
   * Obtiene todas las operaciones
   */
  getOperations(): OperationResult[] {
    return this.operations;
  }

  /**
   * Genera número de secuencia para screenshots
   */
  getNextScreenshotNumber(): string {
    return String(++this.screenshotCounter).padStart(3, '0');
  }

  /**
   * Imprime reporte final en consola
   */
  printReport() {
    const summary = this.getSummary();
    
    console.log('\n' + '='.repeat(70));
    console.log('                    REPORTE DE OPERACIONES');
    console.log('='.repeat(70));
    console.log(`Total operaciones:    ${summary.total}`);
    console.log(`  ✅ Exitosas:        ${summary.successful}`);
    console.log(`  ❌ Fallidas:        ${summary.failed}`);
    console.log(`  ⚠️  Warnings:        ${summary.totalWarnings}`);
    console.log(`  🐛 Errores:         ${summary.totalErrors}`);
    console.log(`  ⏱️  Duración total:  ${(summary.totalDuration / 1000).toFixed(1)}s`);
    console.log('='.repeat(70));

    if (summary.failed > 0) {
      console.log('\nOPERACIONES FALLIDAS:');
      this.operations
        .filter(o => !o.success)
        .forEach(o => {
          console.log(`\n  📍 ${o.operation} ${o.entity} (${o.timestamp})`);
          o.errors.forEach(e => console.log(`     ❌ ${e.message}`));
        });
    }
  }

  /**
   * Exporta resultados a JSON
   */
  exportToJSON(): string {
    return JSON.stringify({
      summary: this.getSummary(),
      operations: this.operations,
      generatedAt: new Date().toISOString(),
    }, null, 2);
  }
}

// ============================================
// SCREENSHOT HELPERS
// ============================================

/**
 * Captura screenshot con nombre organizado
 */
export async function captureScreenshot(
  page: Page,
  entity: string,
  action: string,
  logger: OperationLogger
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const sequence = logger.getNextScreenshotNumber();
  const filename = `${sequence}-${entity}-${action}-${timestamp}.png`;
  const path = `demo-output/screenshots/${entity}/${filename}`;
  
  await page.screenshot({
    path,
    fullPage: true,
  });
  
  console.log(`    📸 Screenshot: ${path}`);
  return path;
}

/**
 * Captura screenshot de un elemento específico
 */
export async function captureElementScreenshot(
  page: Page,
  selector: string,
  name: string,
  entity: string,
  logger: OperationLogger
): Promise<string> {
  const element = page.locator(selector).first();
  await element.waitFor({ state: 'visible', timeout: 5000 });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const sequence = logger.getNextScreenshotNumber();
  const filename = `${sequence}-${entity}-${name}-${timestamp}.png`;
  const path = `demo-output/screenshots/${entity}/${filename}`;
  
  await element.screenshot({ path });
  
  console.log(`    📸 Element screenshot: ${path}`);
  return path;
}

// ============================================
// TOAST HELPERS
// ============================================

/**
 * Espera y valida mensaje toast de éxito
 */
export async function waitForSuccessToast(
  page: Page,
  expectedText?: string,
  timeout = 5000
): Promise<boolean> {
  try {
    // Sonner usa [data-sonner-toast] o .sonner-toast
    const toast = page.locator('[data-sonner-toast], .sonner-toast').first();
    await toast.waitFor({ state: 'visible', timeout });
    
    if (expectedText) {
      const text = await toast.textContent();
      if (!text?.includes(expectedText)) {
        console.log(`    ⚠️  Toast esperado: "${expectedText}", obtenido: "${text}"`);
        return false;
      }
    }
    
    await think(page);
    console.log('    ✅ Toast de éxito detectado');
    return true;
  } catch {
    console.log('    ❌ Toast no detectado');
    return false;
  }
}

/**
 * Espera y valida mensaje toast de error
 */
export async function waitForErrorToast(
  page: Page,
  expectedText?: string,
  timeout = 5000
): Promise<boolean> {
  try {
    const toast = page.locator('[data-sonner-toast][data-type="error"], .sonner-toast.error').first();
    await toast.waitFor({ state: 'visible', timeout });
    
    if (expectedText) {
      const text = await toast.textContent();
      if (!text?.includes(expectedText)) {
        console.log(`    ⚠️  Toast error esperado: "${expectedText}", obtenido: "${text}"`);
        return false;
      }
    }
    
    await think(page);
    console.log('    ⚠️  Toast de error detectado');
    return true;
  } catch {
    console.log('    ❌ Toast de error no detectado');
    return false;
  }
}

/**
 * Captura screenshot del toast actual
 */
export async function captureToastScreenshot(
  page: Page,
  entity: string,
  logger: OperationLogger
): Promise<string | null> {
  try {
    const toast = page.locator('[data-sonner-toast], .sonner-toast').first();
    await toast.waitFor({ state: 'visible', timeout: 2000 });
    return await captureElementScreenshot(page, '[data-sonner-toast], .sonner-toast', 'toast', entity, logger);
  } catch {
    return null;
  }
}

// ============================================
// FORM HELPERS
// ============================================

/**
 * Abre modal de crear entidad
 */
export async function openCreateModal(
  page: Page,
  buttonText: string
): Promise<boolean> {
  try {
    const button = page.locator(`button:has-text("${buttonText}")`).first();
    await button.waitFor({ state: 'visible', timeout: 5000 });
    await button.click();
    await think(page);
    
    // Esperar a que aparezca el dialog
    const dialog = page.locator('[role="dialog"]').first();
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    await read(page);
    
    console.log(`    ✅ Modal abierto: ${buttonText}`);
    return true;
  } catch (error) {
    console.log(`    ❌ Error abriendo modal: ${error}`);
    return false;
  }
}

/**
 * Llena un campo de formulario
 */
export async function fillFormField(
  page: Page,
  selector: string,
  value: string
): Promise<boolean> {
  try {
    const field = page.locator(selector).first();
    await field.waitFor({ state: 'visible', timeout: 5000 });
    await field.click();
    await field.fill(value);
    await think(page);
    
    console.log(`    ✏️  Campo ${selector} = "${value}"`);
    return true;
  } catch (error) {
    console.log(`    ❌ Error llenando campo ${selector}: ${error}`);
    return false;
  }
}

/**
 * Submit formulario y espera respuesta
 */
export async function submitFormAndWait(
  page: Page,
  submitSelector = '[role="dialog"] button[type="submit"]'
): Promise<boolean> {
  try {
    const submitButton = page.locator(submitSelector).first();
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // Esperar respuesta de API
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/') && response.status() < 500,
      { timeout: 10000 }
    );
    
    await submitButton.click();
    
    const response = await responsePromise;
    const status = response.status();
    
    await think(page);
    
    console.log(`    📤 Submit → HTTP ${status}`);
    return status >= 200 && status < 300;
  } catch (error) {
    console.log(`    ❌ Error en submit: ${error}`);
    return false;
  }
}

/**
 * Verifica errores de validación en formulario
 */
export async function verifyFormError(
  page: Page,
  fieldName: string,
  expectedError?: string
): Promise<boolean> {
  try {
    // Buscar mensaje de error cerca del campo
    const errorMessage = page.locator(`[id="${fieldName}-error"], .error-message, .text-destructive`).first();
    await errorMessage.waitFor({ state: 'visible', timeout: 3000 });
    
    if (expectedError) {
      const text = await errorMessage.textContent();
      if (!text?.includes(expectedError)) {
        console.log(`    ⚠️  Error esperado: "${expectedError}", obtenido: "${text}"`);
        return false;
      }
    }
    
    console.log(`    ✅ Error de validación detectado en ${fieldName}`);
    return true;
  } catch {
    console.log(`    ❌ Error de validación no encontrado en ${fieldName}`);
    return false;
  }
}

// ============================================
// VERIFICATION HELPERS
// ============================================

/**
 * Verifica que un elemento existe en el listado
 */
export async function verifyInList(
  page: Page,
  searchText: string,
  containerSelector = 'main'
): Promise<boolean> {
  try {
    const container = page.locator(containerSelector).first();
    const element = container.locator(`:text("${searchText}")`).first();
    await element.waitFor({ state: 'visible', timeout: 5000 });
    
    console.log(`    ✅ Elemento encontrado en listado: "${searchText}"`);
    return true;
  } catch {
    console.log(`    ❌ Elemento NO encontrado en listado: "${searchText}"`);
    return false;
  }
}

/**
 * Verifica que un elemento NO existe en el listado
 */
export async function verifyNotInList(
  page: Page,
  searchText: string,
  containerSelector = 'main'
): Promise<boolean> {
  try {
    const container = page.locator(containerSelector).first();
    const element = container.locator(`:text("${searchText}")`).first();
    await element.waitFor({ state: 'hidden', timeout: 3000 });
    
    console.log(`    ✅ Elemento NO está en listado: "${searchText}"`);
    return true;
  } catch {
    console.log(`    ❌ Elemento todavía visible en listado: "${searchText}"`);
    return false;
  }
}

/**
 * Busca elemento usando campo de búsqueda
 */
export async function searchInList(
  page: Page,
  searchTerm: string,
  inputSelector = 'input[placeholder*="Buscar"], input[type="search"]'
): Promise<boolean> {
  try {
    const searchInput = page.locator(inputSelector).first();
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    await searchInput.fill(searchTerm);
    await page.waitForLoadState('networkidle');
    await read(page);
    
    console.log(`    🔍 Búsqueda: "${searchTerm}"`);
    return true;
  } catch (error) {
    console.log(`    ❌ Error en búsqueda: ${error}`);
    return false;
  }
}

// ============================================
// WAIT HELPERS
// ============================================

/**
 * Espera a que la red esté idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 10000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  await think(page);
}

/**
 * Espera a que desaparezca un loader/spinner
 */
export async function waitForLoader(page: Page, timeout = 10000): Promise<void> {
  try {
    // Esperar a que aparezca el loader
    const loader = page.locator('[class*="loading"], [class*="spinner"], [data-loading="true"]').first();
    await loader.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
    
    // Esperar a que desaparezca
    await loader.waitFor({ state: 'hidden', timeout }).catch(() => {});
  } catch {
    // Si no hay loader, continuar
  }
}

/**
 * Espera a que el modal se cierre
 */
export async function waitForModalClose(page: Page, timeout = 5000): Promise<boolean> {
  try {
    const dialog = page.locator('[role="dialog"]').first();
    await dialog.waitFor({ state: 'hidden', timeout });
    await think(page);
    
    console.log('    ✅ Modal cerrado');
    return true;
  } catch {
    console.log('    ⚠️  Modal no se cerró');
    return false;
  }
}
