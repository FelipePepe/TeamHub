import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HTTPException } from 'hono/http-exception';

// ── Hoisted mocks ───────────────────────────────────────────────────
const mockGetCookie = vi.hoisted(() => vi.fn());

vi.mock('hono/cookie', () => ({
  getCookie: mockGetCookie,
}));

// Import after mocks
import { csrfMiddleware } from '../csrf.js';

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

describe('csrfMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Safe methods (GET, HEAD, OPTIONS) ─────────────────────────────
  it('allows GET requests without CSRF validation', async () => {
    const c = createMockContext({ method: 'GET' });
    const next = vi.fn();

    await csrfMiddleware(c, next);

    expect(next).toHaveBeenCalledOnce();
    expect(mockGetCookie).not.toHaveBeenCalled();
  });

  it('allows HEAD requests without CSRF validation', async () => {
    const c = createMockContext({ method: 'HEAD' });
    const next = vi.fn();

    await csrfMiddleware(c, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('allows OPTIONS requests without CSRF validation', async () => {
    const c = createMockContext({ method: 'OPTIONS' });
    const next = vi.fn();

    await csrfMiddleware(c, next);

    expect(next).toHaveBeenCalledOnce();
  });

  // ── Excluded paths ────────────────────────────────────────────────
  it('allows /api/auth/login without CSRF validation', async () => {
    const c = createMockContext({ method: 'POST', path: '/api/auth/login' });
    const next = vi.fn();

    await csrfMiddleware(c, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('allows /api/auth/refresh without CSRF validation', async () => {
    const c = createMockContext({ method: 'POST', path: '/api/auth/refresh' });
    const next = vi.fn();

    await csrfMiddleware(c, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('allows /api/auth/mfa/setup without CSRF validation', async () => {
    const c = createMockContext({ method: 'POST', path: '/api/auth/mfa/setup' });
    const next = vi.fn();

    await csrfMiddleware(c, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('allows /api/auth/mfa/verify without CSRF validation', async () => {
    const c = createMockContext({ method: 'POST', path: '/api/auth/mfa/verify' });
    const next = vi.fn();

    await csrfMiddleware(c, next);

    expect(next).toHaveBeenCalledOnce();
  });

  // ── CSRF token validation ─────────────────────────────────────────
  it('throws 403 when CSRF cookie is missing', async () => {
    const headers = new Map<string, string>();
    headers.set('x-csrf-token', 'some-token');
    const c = createMockContext({
      method: 'POST',
      path: '/api/users',
      header: (name: string) => headers.get(name.toLowerCase()),
    });
    const next = vi.fn();

    mockGetCookie.mockReturnValue(undefined);

    await expect(csrfMiddleware(c, next)).rejects.toThrow(HTTPException);
    try {
      await csrfMiddleware(c, next);
    } catch (err) {
      expect((err as HTTPException).status).toBe(403);
      expect((err as HTTPException).message).toContain('CSRF token no encontrado en cookies');
    }
    expect(next).not.toHaveBeenCalled();
  });

  it('throws 403 when CSRF header is missing', async () => {
    const c = createMockContext({
      method: 'POST',
      path: '/api/users',
    });
    const next = vi.fn();

    mockGetCookie.mockReturnValue('csrf-cookie-token');

    await expect(csrfMiddleware(c, next)).rejects.toThrow(HTTPException);
    try {
      await csrfMiddleware(c, next);
    } catch (err) {
      expect((err as HTTPException).status).toBe(403);
      expect((err as HTTPException).message).toContain('X-CSRF-Token');
    }
  });

  it('throws 403 when tokens do not match', async () => {
    const headers = new Map<string, string>();
    headers.set('x-csrf-token', 'header-token');
    const c = createMockContext({
      method: 'POST',
      path: '/api/users',
      header: (name: string) => headers.get(name.toLowerCase()),
    });
    const next = vi.fn();

    mockGetCookie.mockReturnValue('different-cookie-token');

    await expect(csrfMiddleware(c, next)).rejects.toThrow(HTTPException);
    try {
      await csrfMiddleware(c, next);
    } catch (err) {
      expect((err as HTTPException).status).toBe(403);
      expect((err as HTTPException).message).toContain('CSRF token inv');
    }
  });

  it('calls next() when tokens match', async () => {
    const matchingToken = 'matching-csrf-token-value';
    const headers = new Map<string, string>();
    headers.set('x-csrf-token', matchingToken);
    const c = createMockContext({
      method: 'POST',
      path: '/api/users',
      header: (name: string) => headers.get(name.toLowerCase()),
    });
    const next = vi.fn();

    mockGetCookie.mockReturnValue(matchingToken);

    await csrfMiddleware(c, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('handles PUT method with valid CSRF tokens', async () => {
    const token = 'valid-token';
    const headers = new Map<string, string>();
    headers.set('x-csrf-token', token);
    const c = createMockContext({
      method: 'PUT',
      path: '/api/users/123',
      header: (name: string) => headers.get(name.toLowerCase()),
    });
    const next = vi.fn();

    mockGetCookie.mockReturnValue(token);

    await csrfMiddleware(c, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('handles DELETE method with valid CSRF tokens', async () => {
    const token = 'valid-token';
    const headers = new Map<string, string>();
    headers.set('x-csrf-token', token);
    const c = createMockContext({
      method: 'DELETE',
      path: '/api/users/123',
      header: (name: string) => headers.get(name.toLowerCase()),
    });
    const next = vi.fn();

    mockGetCookie.mockReturnValue(token);

    await csrfMiddleware(c, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('handles case-insensitive method matching', async () => {
    const c = createMockContext({ method: 'get' });
    const next = vi.fn();

    await csrfMiddleware(c, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
