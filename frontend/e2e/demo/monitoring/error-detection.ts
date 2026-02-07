import { Page } from '@playwright/test';
import type { ErrorDetail } from '../crud.helpers';

/**
 * Sistema de detección y monitoreo de errores
 * Captura errores de consola, red, y visuales durante la ejecución de demos
 */

// ============================================
// TIPOS
// ============================================

export interface NetworkError {
  url: string;
  method: string;
  status: number;
  statusText: string;
  timestamp: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response?: any;
}

export interface ConsoleError {
  type: 'error' | 'warning' | 'log';
  message: string;
  location?: string;
  timestamp: string;
}

export interface VisualError {
  selector: string;
  description: string;
  screenshot?: string;
  timestamp: string;
}

export interface ErrorMonitoringState {
  consoleErrors: ConsoleError[];
  networkErrors: NetworkError[];
  visualErrors: VisualError[];
}

// ============================================
// ERROR MONITORING
// ============================================

export class ErrorMonitor {
  private state: ErrorMonitoringState = {
    consoleErrors: [],
    networkErrors: [],
    visualErrors: [],
  };

  /**
   * Configura listeners de errores en la página
   */
  async setup(page: Page): Promise<void> {
    // Escuchar errores de consola
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      
      // Filtrar warnings de validación HTML5 (no son críticos)
      const isHTML5Validation = text.includes('does not conform to the required format');
      
      if ((type === 'error' || type === 'warning') && !isHTML5Validation) {
        this.state.consoleErrors.push({
          type: type as 'error' | 'warning',
          message: text,
          location: msg.location()?.url,
          timestamp: new Date().toISOString(),
        });
        
        if (type === 'error') {
          console.log(`    🐛 Console Error: ${text}`);
        }
      }
    });

    // Escuchar errores de JavaScript no capturados
    page.on('pageerror', (error) => {
      this.state.consoleErrors.push({
        type: 'error',
        message: error.message,
        location: error.stack,
        timestamp: new Date().toISOString(),
      });
      console.log(`    🐛 Page Error: ${error.message}`);
    });

    // Escuchar respuestas de red con errores
    page.on('response', async (response) => {
      const status = response.status();
      const url = response.url();
      
      // Ignorar recursos estáticos y requests a otros dominios
      if (
        status >= 400 &&
        (url.includes('/api/') || url.includes('localhost'))
      ) {
        const error: NetworkError = {
          url,
          method: response.request().method(),
          status,
          statusText: response.statusText(),
          timestamp: new Date().toISOString(),
        };
        
        // Intentar capturar request/response body
        try {
          const request = response.request();
          error.request = {
            headers: request.headers(),
            postData: request.postData(),
          };
          
          error.response = await response.json().catch(() => response.text()).catch(() => null);
        } catch {
          // Ignorar si no se puede parsear
        }
        
        this.state.networkErrors.push(error);
        console.log(`    🔴 Network Error: ${error.method} ${url} → ${status}`);
      }
    });

    // Escuchar request failures
    page.on('requestfailed', (request) => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('localhost')) {
        this.state.networkErrors.push({
          url,
          method: request.method(),
          status: 0,
          statusText: 'Request Failed',
          timestamp: new Date().toISOString(),
        });
        console.log(`    🔴 Request Failed: ${request.method()} ${url}`);
      }
    });

    console.log('    🔍 Error monitoring activado');
  }

  /**
   * Detecta errores visuales en la página
   */
  async detectVisualErrors(page: Page): Promise<VisualError[]> {
    const errors: VisualError[] = [];
    
    // Buscar elementos con clases de error
    const errorSelectors = [
      '.error:visible',
      '.alert-error:visible',
      '.text-destructive:visible',
      '[class*="error"]:visible',
      '[role="alert"][class*="error"]:visible',
    ];
    
    for (const selector of errorSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          const isVisible = await element.isVisible().catch(() => false);
          if (isVisible) {
            const text = await element.textContent().catch(() => '');
            errors.push({
              selector,
              description: text || 'Elemento de error visible',
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch {
        // Continuar con el siguiente selector
      }
    }
    
    if (errors.length > 0) {
      console.log(`    ⚠️  ${errors.length} error(es) visual(es) detectado(s)`);
      this.state.visualErrors.push(...errors);
    }
    
    return errors;
  }

  /**
   * Verifica errores acumulados
   */
  hasErrors(): boolean {
    return (
      this.state.consoleErrors.length > 0 ||
      this.state.networkErrors.length > 0 ||
      this.state.visualErrors.length > 0
    );
  }

  /**
   * Obtiene todos los errores
   */
  getErrors(): ErrorMonitoringState {
    return { ...this.state };
  }

  /**
   * Convierte errores a formato ErrorDetail
   */
  toErrorDetails(): ErrorDetail[] {
    const details: ErrorDetail[] = [];
    
    // Errores de consola
    this.state.consoleErrors.forEach(err => {
      details.push({
        type: 'console',
        message: err.message,
        stack: err.location,
        timestamp: err.timestamp,
      });
    });
    
    // Errores de red
    this.state.networkErrors.forEach(err => {
      details.push({
        type: 'network',
        message: `${err.method} ${err.url} → ${err.status} ${err.statusText}`,
        timestamp: err.timestamp,
      });
    });
    
    // Errores visuales
    this.state.visualErrors.forEach(err => {
      details.push({
        type: 'visual',
        message: `${err.selector}: ${err.description}`,
        timestamp: err.timestamp,
      });
    });
    
    return details;
  }

  /**
   * Limpia errores acumulados
   */
  clear(): void {
    this.state = {
      consoleErrors: [],
      networkErrors: [],
      visualErrors: [],
    };
    console.log('    🧹 Errores limpiados');
  }

  /**
   * Genera reporte de errores
   */
  generateReport(): string {
    const report = {
      summary: {
        consoleErrors: this.state.consoleErrors.length,
        networkErrors: this.state.networkErrors.length,
        visualErrors: this.state.visualErrors.length,
        total: this.state.consoleErrors.length + this.state.networkErrors.length + this.state.visualErrors.length,
      },
      details: this.state,
      generatedAt: new Date().toISOString(),
    };
    
    return JSON.stringify(report, null, 2);
  }

  /**
   * Guarda reporte de errores en archivo
   */
  async saveReport(filename = 'error-report.json'): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = `demo-output/screenshots/errors/${filename}`;
      
      // Asegurar que el directorio existe
      await fs.mkdir('demo-output/screenshots/errors', { recursive: true });
      
      await fs.writeFile(path, this.generateReport(), 'utf-8');
      console.log(`    💾 Reporte de errores guardado: ${path}`);
    } catch (error) {
      console.log(`    ⚠️  No se pudo guardar reporte: ${error}`);
    }
  }

  /**
   * Imprime resumen en consola
   */
  printSummary(): void {
    const summary = {
      consoleErrors: this.state.consoleErrors.length,
      networkErrors: this.state.networkErrors.length,
      visualErrors: this.state.visualErrors.length,
    };
    
    console.log('\n' + '─'.repeat(60));
    console.log('🔍 RESUMEN DE ERRORES DETECTADOS');
    console.log('─'.repeat(60));
    console.log(`Console Errors:  ${summary.consoleErrors}`);
    console.log(`Network Errors:  ${summary.networkErrors}`);
    console.log(`Visual Errors:   ${summary.visualErrors}`);
    console.log(`Total:           ${summary.consoleErrors + summary.networkErrors + summary.visualErrors}`);
    console.log('─'.repeat(60));
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Captura screenshot de un error
 */
export async function captureErrorScreenshot(
  page: Page,
  errorType: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `error-${errorType}-${timestamp}.png`;
  const path = `demo-output/screenshots/errors/${filename}`;
  
  await page.screenshot({
    path,
    fullPage: true,
  });
  
  console.log(`    📸 Error screenshot: ${path}`);
  return path;
}

/**
 * Verifica que no haya errores en la página
 */
export async function verifyNoErrors(page: Page, monitor: ErrorMonitor): Promise<boolean> {
  await monitor.detectVisualErrors(page);
  
  if (monitor.hasErrors()) {
    const errors = monitor.getErrors();
    console.log('    ❌ Errores detectados en la página');
    
    if (errors.consoleErrors.length > 0) {
      console.log(`       - ${errors.consoleErrors.length} errores de consola`);
    }
    if (errors.networkErrors.length > 0) {
      console.log(`       - ${errors.networkErrors.length} errores de red`);
    }
    if (errors.visualErrors.length > 0) {
      console.log(`       - ${errors.visualErrors.length} errores visuales`);
    }
    
    return false;
  }
  
  console.log('    ✅ No se detectaron errores');
  return true;
}
