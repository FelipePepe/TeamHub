import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockInsert, mockValues, mockReturning } = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockValues = vi.fn();
  const mockInsert = vi.fn();

  return { mockInsert, mockValues, mockReturning };
});

vi.mock('../../db/index.js', () => ({
  db: {
    insert: mockInsert,
  },
}));

vi.mock('../../db/schema/error-logs.js', () => ({
  errorLogs: {
    id: 'id',
  },
}));

import { logError, extractErrorInfo, getUserFriendlyMessage } from '../error-logger.js';

describe('error-logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupInsertChain = (result: unknown[]) => {
    mockReturning.mockResolvedValue(result);
    mockValues.mockReturnValue({ returning: mockReturning });
    mockInsert.mockReturnValue({ values: mockValues });
  };

  describe('logError', () => {
    it('should return the error log ID on success', async () => {
      setupInsertChain([{ id: 'err-123' }]);

      const result = await logError({
        origen: 'BACKEND',
        nivel: 'ERROR',
        mensaje: 'Something went wrong',
      });

      expect(result).toBe('err-123');
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
    });

    it('should pass all parameters to the insert', async () => {
      setupInsertChain([{ id: 'err-456' }]);

      const params = {
        userId: 'u1',
        origen: 'FRONTEND' as const,
        nivel: 'FATAL' as const,
        mensaje: 'Critical error',
        stackTrace: 'Error: ...\n  at ...',
        contexto: { route: '/dashboard' },
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        sentryEventId: 'sentry-abc',
      };

      await logError(params);

      expect(mockValues).toHaveBeenCalledWith({
        userId: 'u1',
        origen: 'FRONTEND',
        nivel: 'FATAL',
        mensaje: 'Critical error',
        stackTrace: 'Error: ...\n  at ...',
        contexto: { route: '/dashboard' },
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        sentryEventId: 'sentry-abc',
      });
    });

    it('should return empty string and log to console on DB error', async () => {
      const dbError = new Error('Connection failed');
      mockReturning.mockRejectedValue(dbError);
      mockValues.mockReturnValue({ returning: mockReturning });
      mockInsert.mockReturnValue({ values: mockValues });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await logError({
        origen: 'BACKEND',
        nivel: 'ERROR',
        mensaje: 'Test error',
      });

      expect(result).toBe('');
      expect(consoleSpy).toHaveBeenCalledWith('Error logging to database:', dbError);

      consoleSpy.mockRestore();
    });
  });

  describe('extractErrorInfo', () => {
    it('should extract message and stack from Error instance', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.ts:1:1';

      const result = extractErrorInfo(error);

      expect(result.mensaje).toBe('Test error');
      expect(result.stackTrace).toBe('Error: Test error\n    at test.ts:1:1');
    });

    it('should return undefined stackTrace when Error has no stack', () => {
      const error = new Error('No stack');
      error.stack = undefined;

      const result = extractErrorInfo(error);

      expect(result.mensaje).toBe('No stack');
      expect(result.stackTrace).toBeUndefined();
    });

    it('should handle string error', () => {
      const result = extractErrorInfo('Something failed');

      expect(result.mensaje).toBe('Something failed');
      expect(result.stackTrace).toBeUndefined();
    });

    it('should handle unknown error type', () => {
      const result = extractErrorInfo(42);

      expect(result.mensaje).toBe('Unknown error');
      expect(result.stackTrace).toBeUndefined();
    });

    it('should handle null error', () => {
      const result = extractErrorInfo(null);

      expect(result.mensaje).toBe('Unknown error');
    });

    it('should handle undefined error', () => {
      const result = extractErrorInfo(undefined);

      expect(result.mensaje).toBe('Unknown error');
    });

    it('should handle object error', () => {
      const result = extractErrorInfo({ code: 500 });

      expect(result.mensaje).toBe('Unknown error');
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return duplicate key message', () => {
      const error = new Error('duplicate key value violates unique constraint');

      const result = getUserFriendlyMessage(error);

      expect(result).toBe('Este registro ya existe en el sistema.');
    });

    it('should return foreign key message', () => {
      const error = new Error('violates foreign key constraint');

      const result = getUserFriendlyMessage(error);

      expect(result).toBe('No se puede realizar esta acción porque hay datos relacionados.');
    });

    it('should return not found message', () => {
      const error = new Error('Resource not found');

      const result = getUserFriendlyMessage(error);

      expect(result).toBe('El recurso solicitado no existe.');
    });

    it('should return unauthorized message', () => {
      const error = new Error('unauthorized access');

      const result = getUserFriendlyMessage(error);

      expect(result).toBe('No tienes permisos para realizar esta acción.');
    });

    it('should return validation message', () => {
      const error = new Error('validation error: field is required');

      const result = getUserFriendlyMessage(error);

      expect(result).toBe('Por favor, verifica que todos los campos estén correctos.');
    });

    it('should return default message for unknown Error', () => {
      const error = new Error('some random internal error');

      const result = getUserFriendlyMessage(error);

      expect(result).toBe('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
    });

    it('should return default message for non-Error type', () => {
      const result = getUserFriendlyMessage('just a string');

      expect(result).toBe('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
    });

    it('should return default message for null', () => {
      const result = getUserFriendlyMessage(null);

      expect(result).toBe('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
    });

    it('should return default message for number', () => {
      const result = getUserFriendlyMessage(500);

      expect(result).toBe('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
    });
  });
});
