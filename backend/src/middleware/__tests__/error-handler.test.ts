import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HTTPException } from 'hono/http-exception';
import { ZodError, z } from 'zod';

// ── Hoisted mocks ───────────────────────────────────────────────────
const mockLogRequestError = vi.hoisted(() => vi.fn());

vi.mock('../../services/logger.js', () => ({
  logRequestError: mockLogRequestError,
}));

// Import after mocks
import { errorHandler } from '../error-handler.js';

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

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── ZodError ──────────────────────────────────────────────────────
  it('returns 400 with validation details for ZodError', () => {
    const c = createMockContext();
    const schema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    });

    let zodError: ZodError;
    try {
      schema.parse({ email: 'invalid', age: 10 });
    } catch (err) {
      zodError = err as ZodError;
    }

    errorHandler(zodError!, c);

    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Datos de entrada invalidos',
        code: 'ERROR_VALIDACION',
        details: expect.arrayContaining([
          expect.objectContaining({ path: expect.any(String), message: expect.any(String) }),
        ]),
      }),
      400,
    );
  });

  it('formats ZodError details with path and message', () => {
    const c = createMockContext();
    const schema = z.object({
      name: z.string().min(1),
    });

    let zodError: ZodError;
    try {
      schema.parse({ name: '' });
    } catch (err) {
      zodError = err as ZodError;
    }

    errorHandler(zodError!, c);

    const callArgs = c.json.mock.calls[0][0];
    expect(callArgs.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'name' }),
      ]),
    );
  });

  // ── HTTPException ─────────────────────────────────────────────────
  it('returns correct status/code for HTTPException 400', () => {
    const c = createMockContext();
    const err = new HTTPException(400, { message: 'Bad request' });

    errorHandler(err, c);

    expect(c.json).toHaveBeenCalledWith(
      { error: 'Bad request', code: 'SOLICITUD_INVALIDA' },
      400,
    );
  });

  it('returns correct status/code for HTTPException 401', () => {
    const c = createMockContext();
    const err = new HTTPException(401, { message: 'No autorizado' });

    errorHandler(err, c);

    expect(c.json).toHaveBeenCalledWith(
      { error: 'No autorizado', code: 'NO_AUTORIZADO' },
      401,
    );
  });

  it('returns correct status/code for HTTPException 403', () => {
    const c = createMockContext();
    const err = new HTTPException(403, { message: 'Acceso denegado' });

    errorHandler(err, c);

    expect(c.json).toHaveBeenCalledWith(
      { error: 'Acceso denegado', code: 'ACCESO_DENEGADO' },
      403,
    );
  });

  it('returns correct status/code for HTTPException 404', () => {
    const c = createMockContext();
    const err = new HTTPException(404, { message: 'No encontrado' });

    errorHandler(err, c);

    expect(c.json).toHaveBeenCalledWith(
      { error: 'No encontrado', code: 'NO_ENCONTRADO' },
      404,
    );
  });

  it('returns correct status/code for HTTPException 409', () => {
    const c = createMockContext();
    const err = new HTTPException(409, { message: 'Conflicto' });

    errorHandler(err, c);

    expect(c.json).toHaveBeenCalledWith(
      { error: 'Conflicto', code: 'CONFLICTO' },
      409,
    );
  });

  it('returns correct status/code for HTTPException 429', () => {
    const c = createMockContext();
    const err = new HTTPException(429, { message: 'Too many requests' });

    errorHandler(err, c);

    expect(c.json).toHaveBeenCalledWith(
      { error: 'Too many requests', code: 'LIMITE_EXCEDIDO' },
      429,
    );
  });

  it('returns ERROR_HTTP for unrecognized HTTPException status', () => {
    const c = createMockContext();
    const err = new HTTPException(418 as any, { message: 'Teapot' });

    errorHandler(err, c);

    expect(c.json).toHaveBeenCalledWith(
      { error: 'Teapot', code: 'ERROR_HTTP' },
      418,
    );
  });

  // ── Unknown errors ────────────────────────────────────────────────
  it('returns 500 for unknown errors', () => {
    const c = createMockContext();
    const err = new Error('Something went wrong');

    errorHandler(err, c);

    expect(c.json).toHaveBeenCalledWith(
      { error: 'Error interno del servidor', code: 'ERROR_INTERNO' },
      500,
    );
  });

  // ── Logging ───────────────────────────────────────────────────────
  it('logs error with request context', () => {
    const c = createMockContext({ method: 'PUT', path: '/api/users/123' });
    const err = new Error('DB connection lost');

    errorHandler(err, c);

    expect(mockLogRequestError).toHaveBeenCalledWith(
      err,
      expect.objectContaining({
        path: '/api/users/123',
        method: 'PUT',
        status: 500,
        userId: undefined,
        userEmail: undefined,
      }),
    );
  });

  it('includes user info in log when user is in context', () => {
    const c = createMockContext();
    c.set('user', { id: 'user-123', email: 'test@example.com' });
    const err = new HTTPException(403, { message: 'Acceso denegado' });

    errorHandler(err, c);

    expect(mockLogRequestError).toHaveBeenCalledWith(
      err,
      expect.objectContaining({
        userId: 'user-123',
        userEmail: 'test@example.com',
        status: 403,
      }),
    );
  });

  it('handles case when user is not in context', () => {
    const c = createMockContext();
    const err = new HTTPException(401, { message: 'No autorizado' });

    errorHandler(err, c);

    expect(mockLogRequestError).toHaveBeenCalledWith(
      err,
      expect.objectContaining({
        userId: undefined,
        userEmail: undefined,
      }),
    );
  });

  it('logs ZodError with status 400', () => {
    const c = createMockContext();
    const schema = z.string();
    let zodError: ZodError;
    try {
      schema.parse(123);
    } catch (err) {
      zodError = err as ZodError;
    }

    errorHandler(zodError!, c);

    expect(mockLogRequestError).toHaveBeenCalledWith(
      zodError!,
      expect.objectContaining({ status: 400 }),
    );
  });
});
