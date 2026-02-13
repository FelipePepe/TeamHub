import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Hoisted mocks ───────────────────────────────────────────────────
const mockLogDebug = vi.hoisted(() => vi.fn());

vi.mock('../../services/logger.js', () => ({
  logDebug: mockLogDebug,
}));

// Import after mocks
import { requestLogger } from '../request-logger.js';

// ── Helpers ─────────────────────────────────────────────────────────
const createMockContext = (overrides: Record<string, unknown> = {}) => {
  const headers = new Map<string, string>();
  const resHeaders = new Map<string, string>();
  const variables = new Map<string, unknown>();

  return {
    req: {
      method: 'GET',
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

describe('requestLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs request with method, path, status, and durationMs', async () => {
    const c = createMockContext({ method: 'POST', path: '/api/users' });
    c.res = { status: 201 };
    const next = vi.fn();

    await requestLogger(c, next);

    expect(next).toHaveBeenCalledOnce();
    expect(mockLogDebug).toHaveBeenCalledWith(
      'Request completed',
      expect.objectContaining({
        method: 'POST',
        path: '/api/users',
        status: 201,
        durationMs: expect.any(Number),
      }),
    );
  });

  it('logs even if next() throws (finally block)', async () => {
    const c = createMockContext({ method: 'DELETE', path: '/api/items/5' });
    const error = new Error('Handler exploded');
    const next = vi.fn().mockRejectedValue(error);

    await expect(requestLogger(c, next)).rejects.toThrow('Handler exploded');

    expect(mockLogDebug).toHaveBeenCalledWith(
      'Request completed',
      expect.objectContaining({
        method: 'DELETE',
        path: '/api/items/5',
        durationMs: expect.any(Number),
      }),
    );
  });

  it('uses status 500 as fallback when res is undefined', async () => {
    const c = createMockContext();
    c.res = undefined;
    const next = vi.fn();

    await requestLogger(c, next);

    expect(mockLogDebug).toHaveBeenCalledWith(
      'Request completed',
      expect.objectContaining({
        status: 500,
      }),
    );
  });

  it('includes non-negative durationMs', async () => {
    const c = createMockContext();
    const next = vi.fn();

    await requestLogger(c, next);

    const logCall = mockLogDebug.mock.calls[0];
    expect(logCall[1].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('captures the correct response status', async () => {
    const c = createMockContext();
    c.res = { status: 404 };
    const next = vi.fn();

    await requestLogger(c, next);

    expect(mockLogDebug).toHaveBeenCalledWith(
      'Request completed',
      expect.objectContaining({ status: 404 }),
    );
  });
});
