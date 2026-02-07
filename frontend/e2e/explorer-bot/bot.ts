import { Page, Locator } from '@playwright/test';
import { AdvancedErrorDetector, BehaviorCheck } from './detector';

/**
 * ExplorerBot - Bot que explora la aplicación como un usuario real
 * Navega, interactúa, valida comportamientos y detecta errores
 */

export interface BotConfig {
  baseURL: string;
  timeout: number;
  screenshotOnError: boolean;
  verbose: boolean;
}

export interface ExpectOptions {
  timeout?: number;
  container?: string;
}

export class ExplorerBot {
  private page: Page;
  private detector: AdvancedErrorDetector;
  private config: BotConfig;
  private actionCounter = 0;

  constructor(page: Page, detector: AdvancedErrorDetector, config: Partial<BotConfig> = {}) {
    this.page = page;
    this.detector = detector;
    this.config = {
      baseURL: 'http://localhost:3000',
      timeout: 10000,
      screenshotOnError: true,
      verbose: true,
      ...config,
    };
  }

  /**
   * NAVEGACIÓN
   */
  async navigate(path: string): Promise<void> {
    this.logAction(`Navegando a ${path}`);
    this.detector.setCurrentAction(`navigate to ${path}`);
    
    const url = path.startsWith('http') ? path : `${this.config.baseURL}${path}`;
    await this.page.goto(url, { waitUntil: 'networkidle', timeout: this.config.timeout });
    await this.wait(500);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: this.config.timeout });
    await this.wait(300);
  }

  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * INTERACCIÓN CON ELEMENTOS
   */
  async clickButton(text: string): Promise<void> {
    this.logAction(`Click button: ${text}`);
    this.detector.setCurrentAction(`click button "${text}"`);
    
    const button = this.page.locator(`button:has-text("${text}")`).first();
    await button.waitFor({ state: 'visible', timeout: this.config.timeout });
    await button.click();
    await this.wait(500);
  }

  async clickRowAction(rowText: string, action: string): Promise<void> {
    this.logAction(`Click action "${action}" en fila "${rowText}"`);
    this.detector.setCurrentAction(`click "${action}" for row "${rowText}"`);
    
    const row = this.page.locator(`tr:has-text("${rowText}")`).first();
    await row.waitFor({ state: 'visible', timeout: this.config.timeout });
    
    const actionButton = row.locator(`button:has-text("${action}"), button[aria-label*="${action}"]`).first();
    await actionButton.click();
    await this.wait(500);
  }

  async clickTab(tabName: string): Promise<void> {
    this.logAction(`Click tab: ${tabName}`);
    this.detector.setCurrentAction(`click tab "${tabName}"`);
    
    const tab = this.page.locator(`[role="tab"]:has-text("${tabName}")`).first();
    await tab.click();
    await this.wait(500);
  }

  async clickRow(text: string): Promise<void> {
    this.logAction(`Click row: ${text}`);
    this.detector.setCurrentAction(`click row "${text}"`);
    
    const row = this.page.locator(`tr:has-text("${text}"), [role="row"]:has-text("${text}")`).first();
    await row.click();
    await this.wait(500);
  }

  async findRandomClickable(): Promise<Locator> {
    const clickables = await this.page.$$('button:not([disabled]), a[href], [role="button"]');
    const randomIndex = Math.floor(Math.random() * clickables.length);
    return this.page.locator(`button:not([disabled]), a[href], [role="button"]`).nth(randomIndex);
  }

  async click(locator: Locator): Promise<void> {
    const text = await locator.textContent().catch(() => 'unknown');
    this.logAction(`Click: ${text}`);
    this.detector.setCurrentAction(`click element "${text}"`);
    
    await locator.click();
    await this.wait(500);
  }

  /**
   * FORMULARIOS
   */
  async fillForm(data: Record<string, string>): Promise<void> {
    this.logAction(`Llenando formulario con ${Object.keys(data).length} campos`);
    this.detector.setCurrentAction('fill form');
    
    for (const [field, value] of Object.entries(data)) {
      await this.fillField(field, value);
    }
  }

  async fillField(fieldName: string, value: string): Promise<void> {
    this.logAction(`  ${fieldName} = "${value}"`);
    
    // Intentar por ID primero
    let field = this.page.locator(`#${fieldName}`);
    let exists = await field.count() > 0;
    
    // Si no existe, intentar por name
    if (!exists) {
      field = this.page.locator(`[name="${fieldName}"]`);
      exists = await field.count() > 0;
    }
    
    // Si no existe, intentar por placeholder
    if (!exists) {
      field = this.page.locator(`[placeholder*="${fieldName}"]`);
      exists = await field.count() > 0;
    }
    
    if (!exists) {
      throw new Error(`Campo "${fieldName}" no encontrado`);
    }
    
    await field.fill(value);
    await this.wait(200);
  }

  async submitForm(): Promise<void> {
    this.logAction('Submit form');
    this.detector.setCurrentAction('submit form');

    const dialog = this.page
      .locator('[role="dialog"]')
      .filter({
        has: this.page.locator(
          'form, button[type="submit"], button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Actualizar")'
        ),
      })
      .last();
    const dialogVisible = await dialog.isVisible().catch(() => false);

    let submitButton: Locator;
    if (dialogVisible) {
      const dialogForm = dialog.locator('form').first();
      submitButton = dialogForm.locator('button[type="submit"]').first();

      if ((await submitButton.count()) === 0) {
        submitButton = dialog.locator(
          'button[type="submit"], button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Actualizar")'
        ).first();
      }
    } else {
      submitButton = this.page.locator(
        'form button[type="submit"], button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Actualizar")'
      ).first();
    }

    await submitButton.waitFor({ state: 'visible', timeout: this.config.timeout });
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click();
    await this.wait(1000);
  }

  async selectOption(fieldName: string, value: string): Promise<void> {
    this.logAction(`Select ${fieldName} = "${value}"`);
    this.detector.setCurrentAction(`select option "${value}" in "${fieldName}"`);
    
    const select = this.page.locator(`select#${fieldName}, select[name="${fieldName}"]`).first();
    await select.selectOption(value);
    await this.wait(300);
  }

  /**
   * VALIDACIONES (EXPECTATIONS)
   */
  async expectModal(state: 'abierto' | 'cerrado', options: ExpectOptions = {}): Promise<void> {
    const timeout = options.timeout || this.config.timeout;
    
    if (state === 'abierto') {
      this.logAction('Esperando modal abierto');
      const modal = this.page.locator('[role="dialog"]').first();
      await modal.waitFor({ state: 'visible', timeout });
    } else {
      this.logAction('Esperando modal cerrado');
      const modal = this.page.locator('[role="dialog"]').first();
      await modal.waitFor({ state: 'hidden', timeout });
    }
  }

  async expectDialog(type: 'confirmación' | 'alerta', options: ExpectOptions = {}): Promise<void> {
    this.logAction(`Esperando diálogo de ${type}`);
    // Esperar diálogo nativo del navegador
    this.page.once('dialog', async (dialog) => {
      await this.wait(500);
    });
  }

  async confirm(): Promise<void> {
    this.logAction('Confirmar acción');
    this.detector.setCurrentAction('confirm dialog');
    
    // Buscar botón de confirmar en modal
    const confirmButton = this.page.locator('button:has-text("Confirmar"), button:has-text("Eliminar"), button:has-text("Aceptar"), [role="dialog"] button[class*="destructive"]').first();
    const visible = await confirmButton.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (visible) {
      await confirmButton.click();
      await this.wait(500);
    }
  }

  async expectToast(type: 'éxito' | 'error', options: ExpectOptions = {}): Promise<void> {
    const timeout = options.timeout || 5000;
    this.logAction(`Esperando toast de ${type}`);
    
    const toast = this.page.locator('[data-sonner-toast], .sonner-toast').first();
    await toast.waitFor({ state: 'visible', timeout });
    
    const text = await toast.textContent();
    this.logAction(`  Toast: "${text}"`);
  }

  async expectInList(text: string, options: ExpectOptions = {}): Promise<void> {
    const timeout = options.timeout || this.config.timeout;
    const container = options.container || 'main';
    
    this.logAction(`Esperando "${text}" en listado`);
    
    const containerLocator = this.page.locator(container).first();
    const element = containerLocator.locator(`:text("${text}")`).first();
    await element.waitFor({ state: 'visible', timeout });
  }

  async expectNotInList(text: string, options: ExpectOptions = {}): Promise<void> {
    const timeout = options.timeout || 3000;
    const container = options.container || 'main';
    
    this.logAction(`Esperando que "${text}" NO esté en listado`);
    
    const containerLocator = this.page.locator(container).first();
    const element = containerLocator.locator(`:text("${text}")`).first();
    await element.waitFor({ state: 'hidden', timeout }).catch(() => {
      // Si timeout, el elemento todavía está visible → error
      throw new Error(`Elemento "${text}" todavía visible en listado`);
    });
  }

  async expectBadge(text: string, options: ExpectOptions = {}): Promise<void> {
    this.logAction(`Esperando badge: ${text}`);
    const badge = this.page.locator('[class*="badge"], [class*="Badge"]').filter({ hasText: text }).first();
    await badge.waitFor({ state: 'visible', timeout: options.timeout || this.config.timeout });
  }

  /**
   * GENERADORES DE DATOS
   */
  generateRandomName(prefix: string): string {
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix} ${timestamp}`;
  }

  generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  generateRandomText(words: number): string {
    const loremWords = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
      'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
      'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
    ];
    
    const result: string[] = [];
    for (let i = 0; i < words; i++) {
      result.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
    }
    return result.join(' ');
  }

  /**
   * DETECCIÓN DE ERRORES
   */
  async detectAllErrors(): Promise<void> {
    await this.detector.detectVisualErrors();
    await this.detector.detectPerformanceIssues();
  }

  async checkBehavior(checks: BehaviorCheck[]): Promise<void> {
    await this.detector.detectBehaviorErrors(checks);
  }

  /**
   * ESTADO Y NAVEGACIÓN
   */
  async isLost(): Promise<boolean> {
    // Verificar si estamos en una página de error o perdidos
    const errorIndicators = [
      '404',
      'Page Not Found',
      'Error',
      'Something went wrong',
    ];
    
    for (const indicator of errorIndicators) {
      const hasIndicator = await this.page.locator(`:text("${indicator}")`).count() > 0;
      if (hasIndicator) return true;
    }
    
    return false;
  }

  async navigateToSafeState(safePath = '/dashboard'): Promise<void> {
    this.logAction(`Navegando a estado seguro: ${safePath}`);
    await this.navigate(safePath);
    await this.waitForPageLoad();
  }

  /**
   * SCREENSHOTS Y REPORTES
   */
  async captureScreenshot(name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${name}-${timestamp}.png`;
    const path = `explorer-bot/reports/screenshots/${filename}`;

    try {
      await this.page.screenshot({ path, fullPage: true });
      this.logAction(`Screenshot: ${path}`);
    } catch (error) {
      this.logAction(`Screenshot falló: ${error}`);
    }
    return path;
  }

  /**
   * HELPERS
   */
  private logAction(message: string): void {
    if (this.config.verbose) {
      console.log(`    🤖 ${message}`);
    }
  }

  getActionCount(): number {
    return ++this.actionCounter;
  }
}
