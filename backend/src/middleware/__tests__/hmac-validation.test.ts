import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHmac, createHash } from 'node:crypto';
import { HTTPException } from 'hono/http-exception';

// ── Hoisted mocks ───────────────────────────────────────────────────
const mockConfig = vi.hoisted(() => ({
  NODE_ENV: 'development' as string,
  API_HMAC_SECRET: 'test-hmac-secret-that-is-at-least-32-chars-long',
}));

vi.mock('../../config/env.js', () => ({
  config: mockConfig,
}));

// Import after mocks
import { hmacValidation } from '../hmac-validation.js';

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

/**
 * Generates a valid HMAC signature for testing.
 */
const generateValidSignature = (
  method: string,
  path: string,
  body: string,
  timestamp: number,
  secret: string,
): string => {
  const bodyHash = createHash('sha256').update(body).digest('hex');
  const message = `${timestamp}${method}${path}${bodyHash}`;
  const sig = createHmac('sha256', secret).update(message).digest('hex');
  return `t=${timestamp},s=${sig}`;
};

describe('hmacValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.NODE_ENV = 'development';
    mockConfig.API_HMAC_SECRET = 'test-hmac-secret-that-is-at-least-32-chars-long';
  });

  it('skips validation in test environment', async () => {
    mockConfig.NODE_ENV = 'test';
    const c = createMockContext();
    const next = vi.fn();

    await hmacValidation(c, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('throws 401 when X-Request-Signature header is missing', async () => {
    const c = createMockContext();
    const next = vi.fn();

    await expect(hmacValidation(c, next)).rejects.toThrow(HTTPException);
    try {
      await hmacValidation(c, next);
    } catch (err) {
      expect((err as HTTPException).status).toBe(401);
      expect((err as HTTPException).message).toBe('Missing request signature');
    }
  });

  it('throws 401 when signature format is invalid (missing t=)', async () => {
    const headers = new Map<string, string>();
    headers.set('x-request-signature', 's=abc123');
    const c = createMockContext({
      header: (name: string) => headers.get(name.toLowerCase()),
    });
    const next = vi.fn();

    await expect(hmacValidation(c, next)).rejects.toThrow(HTTPException);
    try {
      await hmacValidation(c, next);
    } catch (err) {
      expect((err as HTTPException).status).toBe(401);
      expect((err as HTTPException).message).toBe('Invalid signature format');
    }
  });

  it('throws 401 when signature format is invalid (missing s=)', async () => {
    const headers = new Map<string, string>();
    headers.set('x-request-signature', `t=${Date.now()}`);
    const c = createMockContext({
      header: (name: string) => headers.get(name.toLowerCase()),
    });
    const next = vi.fn();

    await expect(hmacValidation(c, next)).rejects.toThrow(HTTPException);
    try {
      await hmacValidation(c, next);
    } catch (err) {
      expect((err as HTTPException).status).toBe(401);
      expect((err as HTTPException).message).toBe('Invalid signature format');
    }
  });

  it('throws 401 when signature is expired (>5 minutes old)', async () => {
    const oldTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago
    const sig = generateValidSignature('GET', '/api/test', '', oldTimestamp, mockConfig.API_HMAC_SECRET);
    const headers = new Map<string, string>();
    headers.set('x-request-signature', sig);
    const c = createMockContext({
      header: (name: string) => headers.get(name.toLowerCase()),
    });
    const next = vi.fn();

    await expect(hmacValidation(c, next)).rejects.toThrow(HTTPException);
    try {
      await hmacValidation(c, next);
    } catch (err) {
      expect((err as HTTPException).status).toBe(401);
      expect((err as HTTPException).message).toBe('Request signature expired');
    }
  });

  it('throws 401 when signature is too far in the future (>1 min)', async () => {
    const futureTimestamp = Date.now() + 2 * 60 * 1000; // 2 minutes in future
    const sig = generateValidSignature('GET', '/api/test', '', futureTimestamp, mockConfig.API_HMAC_SECRET);
    const headers = new Map<string, string>();
    headers.set('x-request-signature', sig);
    const c = createMockContext({
      header: (name: string) => headers.get(name.toLowerCase()),
    });
    const next = vi.fn();

    await expect(hmacValidation(c, next)).rejects.toThrow(HTTPException);
    try {
      await hmacValidation(c, next);
    } catch (err) {
      expect((err as HTTPException).status).toBe(401);
      expect((err as HTTPException).message).toBe('Request signature expired');
    }
  });

  it('throws 401 when signature does not match', async () => {
    const timestamp = Date.now();
    const invalidSig = `t=${timestamp},s=${'f'.repeat(64)}`;
    const headers = new Map<string, string>();
    headers.set('x-request-signature', invalidSig);
    const c = createMockContext({
      header: (name: string) => headers.get(name.toLowerCase()),
    });
    const next = vi.fn();

    await expect(hmacValidation(c, next)).rejects.toThrow(HTTPException);
    try {
      await hmacValidation(c, next);
    } catch (err) {
      expect((err as HTTPException).status).toBe(401);
      expect((err as HTTPException).message).toBe('Invalid request signature');
    }
  });

  it('calls next() when signature is valid (GET with empty body)', async () => {
    const timestamp = Date.now();
    const method = 'GET';
    const path = '/api/test';
    const body = '';
    const sig = generateValidSignature(method, path, body, timestamp, mockConfig.API_HMAC_SECRET);

    const headers = new Map<string, string>();
    headers.set('x-request-signature', sig);
    const c = createMockContext({
      method,
      url: `http://localhost${path}`,
      header: (name: string) => headers.get(name.toLowerCase()),
      raw: { clone: () => ({ text: async () => body }) },
    });
    const next = vi.fn();

    await hmacValidation(c, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('validates body hash is included in signature (POST with body)', async () => {
    const timestamp = Date.now();
    const method = 'POST';
    const path = '/api/users';
    const body = JSON.stringify({ name: 'Test', email: 'test@example.com' });
    const sig = generateValidSignature(method, path, body, timestamp, mockConfig.API_HMAC_SECRET);

    const headers = new Map<string, string>();
    headers.set('x-request-signature', sig);
    const c = createMockContext({
      method,
      url: `http://localhost${path}`,
      header: (name: string) => headers.get(name.toLowerCase()),
      raw: { clone: () => ({ text: async () => body }) },
    });
    const next = vi.fn();

    await hmacValidation(c, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects signature computed with different body', async () => {
    const timestamp = Date.now();
    const method = 'POST';
    const path = '/api/users';
    const originalBody = JSON.stringify({ name: 'Original' });
    const tamperedBody = JSON.stringify({ name: 'Tampered' });

    // Sign with original body
    const sig = generateValidSignature(method, path, originalBody, timestamp, mockConfig.API_HMAC_SECRET);

    const headers = new Map<string, string>();
    headers.set('x-request-signature', sig);
    // But serve tampered body
    const c = createMockContext({
      method,
      url: `http://localhost${path}`,
      header: (name: string) => headers.get(name.toLowerCase()),
      raw: { clone: () => ({ text: async () => tamperedBody }) },
    });
    const next = vi.fn();

    await expect(hmacValidation(c, next)).rejects.toThrow(HTTPException);
    try {
      await hmacValidation(c, next);
    } catch (err) {
      expect((err as HTTPException).status).toBe(401);
      expect((err as HTTPException).message).toBe('Invalid request signature');
    }
  });

  it('accepts signature within 5 minute window (4 min 59 sec old)', async () => {
    // Use a timestamp slightly under 5 minutes to avoid flaky timing issues
    const timestamp = Date.now() - (5 * 60 * 1000 - 1000); // 4 min 59 sec ago
    const method = 'GET';
    const path = '/api/test';
    const body = '';
    const sig = generateValidSignature(method, path, body, timestamp, mockConfig.API_HMAC_SECRET);

    const headers = new Map<string, string>();
    headers.set('x-request-signature', sig);
    const c = createMockContext({
      method,
      url: `http://localhost${path}`,
      header: (name: string) => headers.get(name.toLowerCase()),
      raw: { clone: () => ({ text: async () => body }) },
    });
    const next = vi.fn();

    await hmacValidation(c, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
