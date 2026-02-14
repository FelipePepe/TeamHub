import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractErrorInfo,
  getUserFriendlyMessage,
  logFrontendError,
  setupGlobalErrorHandling,
} from '../error-logger';

describe('error-logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('extractErrorInfo soporta Error, string y unknown', () => {
    expect(extractErrorInfo(new Error('boom')).mensaje).toBe('boom');
    expect(extractErrorInfo('texto')).toEqual({ mensaje: 'texto' });
    expect(extractErrorInfo({})).toEqual({ mensaje: 'Unknown error' });
  });

  it('getUserFriendlyMessage mapea errores comunes', () => {
    expect(getUserFriendlyMessage(new Error('NetworkError'))).toMatch(/conexión/i);
    expect(getUserFriendlyMessage(new Error('timeout exceeded'))).toMatch(/tardó demasiado/i);
    expect(getUserFriendlyMessage(new Error('401 unauthorized'))).toMatch(/sesión ha expirado/i);
    expect(getUserFriendlyMessage(new Error('403 forbidden'))).toMatch(/no tienes permisos/i);
    expect(getUserFriendlyMessage(new Error('404 not found'))).toMatch(/no existe/i);
    expect(getUserFriendlyMessage(new Error('500 internal'))).toMatch(/servidor/i);
    expect(getUserFriendlyMessage(new Error('otro error'))).toMatch(/ha ocurrido un error/i);
  });

  it('logFrontendError envía payload al backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await logFrontendError({
      mensaje: 'fallo',
      stackTrace: 'stack',
      nivel: 'WARN',
      contexto: { route: '/dashboard' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/errors/log',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('logFrontendError reporta fallo de respuesta y excepción de red', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockRejectedValueOnce(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    await logFrontendError({ mensaje: 'fallo 1' });
    await logFrontendError({ mensaje: 'fallo 2' });

    expect(errorSpy).toHaveBeenCalled();
  });

  it('setupGlobalErrorHandling registra listeners y captura eventos', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const handlers: Record<string, EventListener> = {};
    const addSpy = vi
      .spyOn(window, 'addEventListener')
      .mockImplementation((event: string, listener: EventListenerOrEventListenerObject) => {
        handlers[event] = listener as EventListener;
      });

    setupGlobalErrorHandling();

    expect(addSpy).toHaveBeenCalledWith('error', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

    handlers.error(
      new ErrorEvent('error', {
        error: new Error('boom global'),
        filename: 'test.tsx',
        lineno: 10,
        colno: 3,
      })
    );

    const rejectionEvent = new Event('unhandledrejection');
    Object.defineProperty(rejectionEvent, 'reason', { value: new Error('promise fail') });
    handlers.unhandledrejection(rejectionEvent);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

