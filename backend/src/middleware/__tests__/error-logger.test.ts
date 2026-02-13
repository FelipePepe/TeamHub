import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HTTPException } from 'hono/http-exception';
import { ZodError, z } from 'zod';

// ── Hoisted mocks ───────────────────────────────────────────────────
const mockExtractErrorInfo = vi.hoisted(() =>
  vi.fn().mockReturnValue({ mensaje: 'test error', stackTrace: 'stack...' }),
);
const mockLogError = vi.hoisted(() => vi.fn().mockResolvedValue('error-id-123'));
const mockCaptureException = vi.hoisted(() => vi.fn());

vi.mock('../../services/error-logger.js', () => ({
  extractErrorInfo: mockExtractErrorInfo,
  logError: mockLogError,
}));

vi.mock('../../services/sentry.js', () => ({
  captureException: mockCaptureException,
}));

// Import after mocks
import { errorLoggerMiddleware } from '../error-logger.js';

// ── Helpers ─────────────────────────────────────────────────────────
const createMockContext = (overrides: Record<string, unknown> = {}) => {
  const headers = new Map<string, string>();
  const resHeaders = new Map<string, string>();
  const variables = new Map<string, unknown>();

  return {
    req: {
      method: 'POST',
      path: '/api/test',
      url: 'http://localhost/api/test',
      header: (name: string) => headers.get(name.toLowerCase()),
      raw: { clone: () => ({ text: async () => '' }) },
      param: () => ({}),
      ...overrides,
    },
    res: { status: 200 },
    set: (key: string, value: unknown) => variables.set(key, value),
    get: (key: string) => variables.get(key),
    header: (name: string, value: string) => resHeaders.set(name, value),
    json: vi.fn((body: unknown, status?: number) =>
      new Response(JSON.stringify(body), { status: status || 200 }),
    ),
    _headers: headers,
    _resHeaders: resHeaders,
    _variables: variables,
  } as any;
};

describe('errorLoggerMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('calls next() and does not log when no error occurs', async () => {
    const c = createMockContext();
    const next = vi.fn();

    await errorLoggerMiddleware(c, next);

    expect(next).toHaveBeenCalledOnce();
    expect(mockLogError).not.toHaveBeenCalled();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('logs HTTPException with WARN level for 4xx errors', async () => {
    const c = createMockContext();
    const error = new HTTPException(404, { message: 'Not found' });
    const next = vi.fn().mockRejectedValue(error);

    await expect(errorLoggerMiddleware(c, next)).rejects.toThrow(error);

    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        nivel: 'WARN',
        origen: 'BACKEND',
      }),
    );
  });

  it('logs HTTPException with ERROR level for 5xx errors', async () => {
    const c = createMockContext();
    const error = new HTTPException(500, { message: 'Internal server error' });
    const next = vi.fn().mockRejectedValue(error);

    await expect(errorLoggerMiddleware(c, next)).rejects.toThrow(error);

    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        nivel: 'ERROR',
        origen: 'BACKEND',
      }),
    );
  });

  it('logs HTTPException 400 with WARN level', async () => {
    const c = createMockContext();
    const error = new HTTPException(400, { message: 'Bad request' });
    const next = vi.fn().mockRejectedValue(error);

    await expect(errorLoggerMiddleware(c, next)).rejects.toThrow(error);

    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({ nivel: 'WARN' }),
    );
  });

  it('logs ZodError with WARN level', async () => {
    const c = createMockContext();
    const schema = z.object({ email: z.string().email() });
    let zodError: ZodError;
    try {
      schema.parse({ email: 'bad' });
    } catch (err) {
      zodError = err as ZodError;
    }

    const next = vi.fn().mockRejectedValue(zodError!);

    await expect(errorLoggerMiddleware(c, next)).rejects.toThrow(zodError!);

    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({ nivel: 'WARN' }),
    );
  });

  it('logs unknown errors with FATAL level', async () => {
    const c = createMockContext();
    const error = new Error('Unexpected failure');
    const next = vi.fn().mockRejectedValue(error);

    await expect(errorLoggerMiddleware(c, next)).rejects.toThrow(error);

    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({ nivel: 'FATAL' }),
    );
  });

  it('extracts user info from context when user is present', async () => {
    const c = createMockContext();
    c.set('user', { id: 'user-456', email: 'user@example.com' });
    const error = new Error('Something failed');
    const next = vi.fn().mockRejectedValue(error);

    await expect(errorLoggerMiddleware(c, next)).rejects.toThrow(error);

    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-456',
      }),
    );
  });

  it('handles missing user in context (userId is undefined)', async () => {
    const c = createMockContext();
    const error = new Error('Unauthorized error');
    const next = vi.fn().mockRejectedValue(error);

    await expect(errorLoggerMiddleware(c, next)).rejects.toThrow(error);

    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: undefined,
      }),
    );
  });

  it('re-throws the error after logging', async () => {
    const c = createMockContext();
    const error = new HTTPException(403, { message: 'Forbidden' });
    const next = vi.fn().mockRejectedValue(error);

    await expect(errorLoggerMiddleware(c, next)).rejects.toThrow(error);
  });

  it('captures exception with Sentry', async () => {
    const c = createMockContext();
    const error = new Error('Sentry test error');
    const next = vi.fn().mockRejectedValue(error);

    await expect(errorLoggerMiddleware(c, next)).rejects.toThrow(error);

    expect(mockCaptureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        endpoint: expect.any(String),
        method: expect.any(String),
      }),
    );
  });

  it('includes request details in log context', async () => {
    const headers = new Map<string, string>();
    headers.set('user-agent', 'TestAgent/1.0');
    headers.set('x-forwarded-for', '10.0.0.5');
    const c = createMockContext({
      method: 'DELETE',
      url: 'http://localhost/api/users/123',
      header: (name: string) => headers.get(name.toLowerCase()),
    });
    const error = new Error('Delete failed');
    const next = vi.fn().mockRejectedValue(error);

    await expect(errorLoggerMiddleware(c, next)).rejects.toThrow(error);

    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        userAgent: 'TestAgent/1.0',
        ipAddress: '10.0.0.5',
      }),
    );
  });

  it('calls extractErrorInfo with the error', async () => {
    const c = createMockContext();
    const error = new Error('Extract test');
    const next = vi.fn().mockRejectedValue(error);

    await expect(errorLoggerMiddleware(c, next)).rejects.toThrow(error);

    expect(mockExtractErrorInfo).toHaveBeenCalledWith(error);
  });

  it('includes extracted mensaje and stackTrace in log', async () => {
    const c = createMockContext();
    mockExtractErrorInfo.mockReturnValue({
      mensaje: 'Custom error message',
      stackTrace: 'Error at line 42',
    });
    const error = new Error('Some error');
    const next = vi.fn().mockRejectedValue(error);

    await expect(errorLoggerMiddleware(c, next)).rejects.toThrow(error);

    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        mensaje: 'Custom error message',
        stackTrace: 'Error at line 42',
      }),
    );
  });

  it('continues even if logError fails (non-blocking)', async () => {
    const c = createMockContext();
    mockLogError.mockRejectedValue(new Error('DB connection lost'));
    const error = new Error('Original error');
    const next = vi.fn().mockRejectedValue(error);

    // The middleware should still re-throw the original error
    await expect(errorLoggerMiddleware(c, next)).rejects.toThrow(error);
  });
});
