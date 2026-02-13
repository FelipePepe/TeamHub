import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Import directly since rate-limit.ts doesn't import config at module level
import { createRateLimiter, getRateLimitIp } from '../rate-limit.js';

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

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within limit', async () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 5,
      keyGenerator: () => '127.0.0.1',
    });

    const c = createMockContext();
    const next = vi.fn();

    await limiter(c, next);

    expect(next).toHaveBeenCalledOnce();
    expect(c.json).not.toHaveBeenCalled();
  });

  it('returns 429 when limit exceeded', async () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 2,
      keyGenerator: () => '127.0.0.1',
    });

    const next = vi.fn();

    // First 2 requests should pass
    await limiter(createMockContext(), next);
    await limiter(createMockContext(), next);
    expect(next).toHaveBeenCalledTimes(2);

    // Third request should be rate limited
    const c3 = createMockContext();
    await limiter(c3, next);

    expect(c3.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        retryAfter: expect.any(Number),
      }),
      429,
    );
    // next should NOT be called for the rate-limited request
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('sets Retry-After header on 429 response', async () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 1,
      keyGenerator: () => '127.0.0.1',
    });

    const next = vi.fn();
    await limiter(createMockContext(), next);

    const c = createMockContext();
    await limiter(c, next);

    expect(c._resHeaders.get('Retry-After')).toBeDefined();
    expect(parseInt(c._resHeaders.get('Retry-After')!, 10)).toBeGreaterThan(0);
  });

  it('sets X-RateLimit-* headers on successful response', async () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 10,
      keyGenerator: () => '127.0.0.1',
    });

    const c = createMockContext();
    const next = vi.fn();
    await limiter(c, next);

    expect(c._resHeaders.get('X-RateLimit-Limit')).toBe('10');
    expect(c._resHeaders.get('X-RateLimit-Remaining')).toBe('9');
    expect(c._resHeaders.get('X-RateLimit-Reset')).toBeDefined();
  });

  it('sets X-RateLimit-* headers on 429 response', async () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 1,
      keyGenerator: () => '127.0.0.1',
    });

    const next = vi.fn();
    await limiter(createMockContext(), next);

    const c = createMockContext();
    await limiter(c, next);

    expect(c._resHeaders.get('X-RateLimit-Limit')).toBe('1');
    expect(c._resHeaders.get('X-RateLimit-Remaining')).toBe('0');
    expect(c._resHeaders.get('X-RateLimit-Reset')).toBeDefined();
  });

  it('resets count after window expires', async () => {
    const limiter = createRateLimiter({
      windowMs: 1_000, // 1 second window
      max: 1,
      keyGenerator: () => '127.0.0.1',
    });

    const next = vi.fn();

    // First request - should pass
    await limiter(createMockContext(), next);
    expect(next).toHaveBeenCalledTimes(1);

    // Second request immediately - should be rate limited
    const c2 = createMockContext();
    await limiter(c2, next);
    expect(c2.json).toHaveBeenCalled();

    // Advance time past window
    vi.advanceTimersByTime(1_100);

    // Third request after window - should pass
    const c3 = createMockContext();
    const next3 = vi.fn();
    await limiter(c3, next3);
    expect(next3).toHaveBeenCalledOnce();
  });

  it('skips rate limiting when keyGenerator returns undefined', async () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 1,
      keyGenerator: () => undefined,
    });

    const c = createMockContext();
    const next = vi.fn();

    await limiter(c, next);

    expect(next).toHaveBeenCalledOnce();
    expect(c.json).not.toHaveBeenCalled();
  });

  it('decrements count for successful responses with skipSuccessfulRequests', async () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 2,
      keyGenerator: () => '127.0.0.1',
      skipSuccessfulRequests: true,
    });

    const next = vi.fn();

    // Make 3 successful requests. With skipSuccessfulRequests, each success decrements
    // the counter, so requests should keep going through.
    const c1 = createMockContext();
    c1.res = { status: 200 };
    await limiter(c1, next);

    const c2 = createMockContext();
    c2.res = { status: 200 };
    await limiter(c2, next);

    const c3 = createMockContext();
    c3.res = { status: 200 };
    await limiter(c3, next);

    // All should have passed because successful responses decrement the counter
    expect(next).toHaveBeenCalledTimes(3);
  });

  it('does not decrement for failed responses with skipSuccessfulRequests', async () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 2,
      keyGenerator: () => '127.0.0.1',
      skipSuccessfulRequests: true,
    });

    const next = vi.fn();

    // Make requests with 400+ status (failed)
    const c1 = createMockContext();
    c1.res = { status: 400 };
    await limiter(c1, next);

    const c2 = createMockContext();
    c2.res = { status: 401 };
    await limiter(c2, next);

    // Third request should be rate limited because failed responses didn't decrement
    const c3 = createMockContext();
    c3.res = { status: 200 };
    await limiter(c3, next);

    expect(c3.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'RATE_LIMITED' }),
      429,
    );
  });

  it('returns 503 when maxEntries is exceeded', async () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 100,
      keyGenerator: (c) => (c.req as any)._ip,
      maxEntries: 2,
    });

    const next = vi.fn();

    // Fill up entries with different keys
    const c1 = createMockContext();
    (c1.req as any)._ip = 'ip-1';
    await limiter({ ...c1, req: { ...c1.req } } as any, next);

    const c2 = createMockContext();
    (c2.req as any)._ip = 'ip-2';
    await limiter(c2, next);

    // Third unique key should get 503
    const c3 = createMockContext();
    (c3.req as any)._ip = 'ip-3';
    await limiter(c3, next);

    expect(c3.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Service temporarily unavailable',
        code: 'RATE_LIMIT_STORAGE_FULL',
      }),
      503,
    );
  });

  it('uses custom error message', async () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 1,
      keyGenerator: () => '127.0.0.1',
      message: 'Slow down!',
    });

    const next = vi.fn();
    await limiter(createMockContext(), next);

    const c = createMockContext();
    await limiter(c, next);

    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Slow down!' }),
      429,
    );
  });

  it('tracks separate counters for different keys', async () => {
    let currentKey = 'ip-a';
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 1,
      keyGenerator: () => currentKey,
    });

    const next = vi.fn();

    // First request from ip-a
    await limiter(createMockContext(), next);
    expect(next).toHaveBeenCalledTimes(1);

    // First request from ip-b (different key)
    currentKey = 'ip-b';
    await limiter(createMockContext(), next);
    expect(next).toHaveBeenCalledTimes(2);

    // Second request from ip-a should be rate limited
    currentKey = 'ip-a';
    const c = createMockContext();
    await limiter(c, next);
    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'RATE_LIMITED' }),
      429,
    );
  });
});

describe('getRateLimitIp', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const headers = new Map<string, string>();
    headers.set('x-forwarded-for', '203.0.113.1, 70.41.3.18, 150.172.238.178');
    const c = createMockContext({
      header: (name: string) => headers.get(name.toLowerCase()),
    });

    const ip = getRateLimitIp(c);

    expect(ip).toBe('203.0.113.1');
  });

  it('extracts single IP from x-forwarded-for', () => {
    const headers = new Map<string, string>();
    headers.set('x-forwarded-for', '10.0.0.1');
    const c = createMockContext({
      header: (name: string) => headers.get(name.toLowerCase()),
    });

    const ip = getRateLimitIp(c);

    expect(ip).toBe('10.0.0.1');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const headers = new Map<string, string>();
    headers.set('x-real-ip', '192.168.1.100');
    const c = createMockContext({
      header: (name: string) => headers.get(name.toLowerCase()),
    });

    const ip = getRateLimitIp(c);

    expect(ip).toBe('192.168.1.100');
  });

  it('returns "unknown" when no IP headers are present', () => {
    const c = createMockContext();

    const ip = getRateLimitIp(c);

    expect(ip).toBe('unknown');
  });
});
