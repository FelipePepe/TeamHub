import { Page } from '@playwright/test';

/**
 * ErrorDetector Avanzado - Detecta 5 tipos de errores
 * 1. JavaScript (console.error, exceptions)
 * 2. Network (4xx, 5xx)
 * 3. Visual (imágenes rotas, textos "undefined")
 * 4. Behavior (modals que no cierran, botones que no responden)
 * 5. Performance (páginas lentas, memory leaks)
 */

export type ErrorType = 'javascript' | 'network' | 'visual' | 'behavior' | 'performance';
export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface DetectedError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stackTrace?: string;
  screenshot?: string;
  context: {
    url: string;
    timestamp: string;
    userAction: string;
    expectedBehavior?: string;
    actualBehavior?: string;
  };
  codeLocation?: {
    file: string;
    line: number;
    column: number;
  };
  suggestedFix?: string;
}

export interface ErrorDetectorConfig {
  javascript: boolean;
  network: boolean;
  visual: boolean;
  behavior: boolean;
  performance: boolean;
  ignorePatterns?: RegExp[];
}

export class AdvancedErrorDetector {
  private page: Page;
  private config: ErrorDetectorConfig;
  private errors: DetectedError[] = [];
  private errorCounter = 0;
  private initialMemory?: number;
  private currentAction = 'unknown';

  constructor(page: Page, config: Partial<ErrorDetectorConfig> = {}) {
    this.page = page;
    this.config = {
      javascript: true,
      network: true,
      visual: true,
      behavior: true,
      performance: true,
      ignorePatterns: [
        /favicon\.ico/,
        /hotjar/,
        /google-analytics/,
        /does not conform to the required format/, // HTML5 validation warnings
      ],
      ...config,
    };
  }

  /**
   * Activa todos los listeners de errores
   */
  async setup(): Promise<void> {
    if (this.config.javascript) {
      this.setupJavaScriptDetection();
    }
    if (this.config.network) {
      this.setupNetworkDetection();
    }
    if (this.config.performance) {
      await this.setupPerformanceDetection();
    }
    
    console.log('    🔍 AdvancedErrorDetector activado');
  }

  /**
   * Define la acción actual del usuario (para contexto)
   */
  setCurrentAction(action: string): void {
    this.currentAction = action;
  }

  /**
   * 1. DETECCIÓN DE ERRORES JAVASCRIPT
   */
  private setupJavaScriptDetection(): void {
    // Console errors
    this.page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error' && !this.shouldIgnore(text)) {
        this.addError({
          type: 'javascript',
          severity: this.classifyJSErrorSeverity(text),
          message: text,
          stackTrace: msg.location()?.url,
          context: {
            url: this.page.url(),
            timestamp: new Date().toISOString(),
            userAction: this.currentAction,
          },
          codeLocation: this.extractCodeLocation(msg.location()),
        });
      }
    });

    // Page errors (uncaught exceptions)
    this.page.on('pageerror', (error) => {
      if (!this.shouldIgnore(error.message)) {
        this.addError({
          type: 'javascript',
          severity: 'critical',
          message: error.message,
          stackTrace: error.stack,
          context: {
            url: this.page.url(),
            timestamp: new Date().toISOString(),
            userAction: this.currentAction,
          },
        });
      }
    });
  }

  /**
   * 2. DETECCIÓN DE ERRORES DE RED
   */
  private setupNetworkDetection(): void {
    // Response errors
    this.page.on('response', async (response) => {
      const status = response.status();
      const url = response.url();
      
      if (status >= 400 && !this.shouldIgnore(url)) {
        const severity: ErrorSeverity = status >= 500 ? 'critical' : 'high';
        let body = '';
        
        try {
          body = await response.text();
        } catch {
          // Ignorar si no se puede leer
        }
        
        this.addError({
          type: 'network',
          severity,
          message: `${response.request().method()} ${url} → ${status} ${response.statusText()}`,
          context: {
            url: this.page.url(),
            timestamp: new Date().toISOString(),
            userAction: this.currentAction,
            expectedBehavior: 'Respuesta exitosa (2xx)',
            actualBehavior: `HTTP ${status}`,
          },
          suggestedFix: this.suggestNetworkFix(status, body),
        });
      }
    });

    // Request failures
    this.page.on('requestfailed', (request) => {
      const url = request.url();
      if (!this.shouldIgnore(url)) {
        this.addError({
          type: 'network',
          severity: 'high',
          message: `Request failed: ${request.method()} ${url}`,
          context: {
            url: this.page.url(),
            timestamp: new Date().toISOString(),
            userAction: this.currentAction,
          },
        });
      }
    });
  }

  /**
   * 3. DETECCIÓN DE ERRORES VISUALES
   */
  async detectVisualErrors(): Promise<DetectedError[]> {
    if (!this.config.visual) return [];
    
    const visualErrors: DetectedError[] = [];
    
    // Imágenes rotas
    const brokenImages = await this.page.$$eval('img', (imgs) =>
      imgs
        .map((img, index) => ({
          index,
          src: img.src,
          broken: !img.complete || img.naturalHeight === 0,
        }))
        .filter((img) => img.broken)
    );
    
    for (const img of brokenImages) {
      visualErrors.push({
        id: this.generateId(),
        type: 'visual',
        severity: 'medium',
        message: `Imagen rota: ${img.src}`,
        context: {
          url: this.page.url(),
          timestamp: new Date().toISOString(),
          userAction: this.currentAction,
          expectedBehavior: 'Imagen cargada correctamente',
          actualBehavior: 'Imagen no se cargó',
        },
      });
    }
    
    // Textos de error comunes
    const errorTexts = await this.page.$$eval('body *', (elements) =>
      Array.from(elements)
        .filter((el) => {
          const text = el.textContent || '';
          return (
            /\bundefined\b/i.test(text) ||
            /\bnull\b/i.test(text) ||
            /\bNaN\b/i.test(text) ||
            /\[object Object\]/i.test(text)
          );
        })
        .map((el) => ({
          text: el.textContent,
          tagName: el.tagName,
        }))
    );
    
    for (const elem of errorTexts.slice(0, 5)) { // Limitar a 5
      visualErrors.push({
        id: this.generateId(),
        type: 'visual',
        severity: 'medium',
        message: `Texto de error en página: "${elem.text?.slice(0, 50)}..."`,
        context: {
          url: this.page.url(),
          timestamp: new Date().toISOString(),
          userAction: this.currentAction,
          expectedBehavior: 'Texto legible',
          actualBehavior: `Muestra: ${elem.text}`,
        },
      });
    }
    
    // Elementos con clase .error visibles
    const visibleErrors = await this.page.$$eval(
      '.error, .alert-error, [class*="error"]:visible',
      (elements) => elements.map((el) => el.textContent).filter(Boolean)
    );
    
    for (const errorText of visibleErrors) {
      visualErrors.push({
        id: this.generateId(),
        type: 'visual',
        severity: 'medium',
        message: `Elemento de error visible: ${errorText}`,
        context: {
          url: this.page.url(),
          timestamp: new Date().toISOString(),
          userAction: this.currentAction,
        },
      });
    }
    
    this.errors.push(...visualErrors);
    return visualErrors;
  }

  /**
   * 4. DETECCIÓN DE ERRORES DE COMPORTAMIENTO
   */
  async detectBehaviorErrors(checks: BehaviorCheck[]): Promise<DetectedError[]> {
    if (!this.config.behavior) return [];
    
    const behaviorErrors: DetectedError[] = [];
    
    for (const check of checks) {
      const result = await check.validate(this.page);
      if (!result.passed) {
        behaviorErrors.push({
          id: this.generateId(),
          type: 'behavior',
          severity: check.severity || 'medium',
          message: result.message,
          context: {
            url: this.page.url(),
            timestamp: new Date().toISOString(),
            userAction: this.currentAction,
            expectedBehavior: check.expected,
            actualBehavior: result.actual,
          },
          suggestedFix: check.suggestedFix,
        });
      }
    }
    
    this.errors.push(...behaviorErrors);
    return behaviorErrors;
  }

  /**
   * 5. DETECCIÓN DE PROBLEMAS DE PERFORMANCE
   */
  private async setupPerformanceDetection(): Promise<void> {
    try {
      this.initialMemory = await this.page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
    } catch {
      // performance.memory no disponible en todos los navegadores
    }
  }

  async detectPerformanceIssues(): Promise<DetectedError[]> {
    if (!this.config.performance) return [];
    
    const perfErrors: DetectedError[] = [];
    
    // Tiempo de carga de página
    try {
      const metrics = await this.page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          loadTime: nav?.loadEventEnd || 0,
          domContentLoaded: nav?.domContentLoadedEventEnd || 0,
          responseTime: nav?.responseEnd - nav?.requestStart || 0,
        };
      });
      
      if (metrics.loadTime > 5000) {
        perfErrors.push({
          id: this.generateId(),
          type: 'performance',
          severity: 'medium',
          message: `Página lenta: ${(metrics.loadTime / 1000).toFixed(1)}s (>5s)`,
          context: {
            url: this.page.url(),
            timestamp: new Date().toISOString(),
            userAction: this.currentAction,
            expectedBehavior: 'Carga en <5s',
            actualBehavior: `Carga en ${(metrics.loadTime / 1000).toFixed(1)}s`,
          },
        });
      }
    } catch {
      // Ignorar si falla
    }
    
    // Memory leak detection
    if (this.initialMemory) {
      try {
        const currentMemory = await this.page.evaluate(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (performance as any).memory?.usedJSHeapSize || 0;
        });
        
        const increase = ((currentMemory - this.initialMemory) / this.initialMemory) * 100;
        
        if (increase > 100) { // Más del 100% de incremento
          perfErrors.push({
            id: this.generateId(),
            type: 'performance',
            severity: 'high',
            message: `Posible memory leak: +${increase.toFixed(0)}% de memoria`,
            context: {
              url: this.page.url(),
              timestamp: new Date().toISOString(),
              userAction: this.currentAction,
              expectedBehavior: 'Uso de memoria estable',
              actualBehavior: `Incremento de ${increase.toFixed(0)}%`,
            },
          });
        }
      } catch {
        // Ignorar si falla
      }
    }
    
    this.errors.push(...perfErrors);
    return perfErrors;
  }

  /**
   * HELPERS
   */
  private shouldIgnore(text: string): boolean {
    return this.config.ignorePatterns?.some((pattern) => pattern.test(text)) || false;
  }

  private classifyJSErrorSeverity(message: string): ErrorSeverity {
    const critical = [
      'Cannot read property',
      'undefined is not a function',
      'Maximum call stack',
      'out of memory',
    ];
    
    const high = [
      'TypeError',
      'ReferenceError',
      'SyntaxError',
    ];
    
    if (critical.some((pattern) => message.includes(pattern))) {
      return 'critical';
    }
    if (high.some((pattern) => message.includes(pattern))) {
      return 'high';
    }
    return 'medium';
  }

  private extractCodeLocation(location: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any): DetectedError['codeLocation'] | undefined {
    if (location?.url) {
      return {
        file: location.url,
        line: location.lineNumber || 0,
        column: location.columnNumber || 0,
      };
    }
    return undefined;
  }

  private suggestNetworkFix(status: number, body: string): string | undefined {
    if (status === 401) {
      return 'Verificar autenticación: token expirado o inválido';
    }
    if (status === 403) {
      return 'Verificar permisos del usuario';
    }
    if (status === 404) {
      return 'Verificar que el endpoint exista y la URL sea correcta';
    }
    if (status === 422) {
      return 'Verificar validación de datos: ' + body.slice(0, 100);
    }
    if (status >= 500) {
      return 'Error del servidor: revisar logs del backend';
    }
    return undefined;
  }

  private generateId(): string {
    return `err-${++this.errorCounter}-${Date.now()}`;
  }

  private addError(error: Omit<DetectedError, 'id'>): void {
    const fullError: DetectedError = {
      id: this.generateId(),
      ...error,
    };
    
    this.errors.push(fullError);
    
    const emoji = error.severity === 'critical' ? '💥' : error.severity === 'high' ? '🔴' : '⚠️';
    console.log(`    ${emoji} [${error.type}] ${error.message.slice(0, 80)}`);
  }

  /**
   * Obtener todos los errores
   */
  getErrors(): DetectedError[] {
    return [...this.errors];
  }

  /**
   * Obtener errores por tipo
   */
  getErrorsByType(type: ErrorType): DetectedError[] {
    return this.errors.filter((e) => e.type === type);
  }

  /**
   * Obtener errores por severidad
   */
  getErrorsBySeverity(severity: ErrorSeverity): DetectedError[] {
    return this.errors.filter((e) => e.severity === severity);
  }

  /**
   * Limpiar errores
   */
  clear(): void {
    this.errors = [];
    this.errorCounter = 0;
  }

  /**
   * Generar resumen
   */
  getSummary() {
    return {
      total: this.errors.length,
      byType: {
        javascript: this.getErrorsByType('javascript').length,
        network: this.getErrorsByType('network').length,
        visual: this.getErrorsByType('visual').length,
        behavior: this.getErrorsByType('behavior').length,
        performance: this.getErrorsByType('performance').length,
      },
      bySeverity: {
        critical: this.getErrorsBySeverity('critical').length,
        high: this.getErrorsBySeverity('high').length,
        medium: this.getErrorsBySeverity('medium').length,
        low: this.getErrorsBySeverity('low').length,
      },
    };
  }
}

/**
 * Tipo para checks de comportamiento personalizados
 */
export interface BehaviorCheck {
  name: string;
  expected: string;
  severity?: ErrorSeverity;
  suggestedFix?: string;
  validate: (page: Page) => Promise<{ passed: boolean; message: string; actual: string }>;
}
