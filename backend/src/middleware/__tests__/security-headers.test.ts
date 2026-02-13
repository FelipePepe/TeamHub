import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Hoisted mocks ───────────────────────────────────────────────────
const mockConfig = vi.hoisted(() => ({
  NODE_ENV: 'development' as string,
}));

vi.mock('../../config/env.js', () => ({
  config: mockConfig,
}));

// Import after mocks
import { securityHeaders } from '../security-headers.js';

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

describe('securityHeaders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.NODE_ENV = 'development';
  });

  it('sets X-Frame-Options to DENY', async () => {
    const c = createMockContext();
    const next = vi.fn();

    await securityHeaders(c, next);

    expect(c._resHeaders.get('X-Frame-Options')).toBe('DENY');
  });

  it('sets X-Content-Type-Options to nosniff', async () => {
    const c = createMockContext();
    const next = vi.fn();

    await securityHeaders(c, next);

    expect(c._resHeaders.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('sets Referrer-Policy to strict-origin-when-cross-origin', async () => {
    const c = createMockContext();
    const next = vi.fn();

    await securityHeaders(c, next);

    expect(c._resHeaders.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('sets API CSP for non-swagger paths', async () => {
    const c = createMockContext({ path: '/api/users' });
    const next = vi.fn();

    await securityHeaders(c, next);

    const csp = c._resHeaders.get('Content-Security-Policy');
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("form-action 'none'");
  });

  it('sets Swagger CSP for /docs path', async () => {
    const c = createMockContext({ path: '/docs' });
    const next = vi.fn();

    await securityHeaders(c, next);

    const csp = c._resHeaders.get('Content-Security-Policy');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("img-src 'self' data: https:");
  });

  it('sets Swagger CSP for /docs/ sub-paths', async () => {
    const c = createMockContext({ path: '/docs/swagger.json' });
    const next = vi.fn();

    await securityHeaders(c, next);

    const csp = c._resHeaders.get('Content-Security-Policy');
    expect(csp).toContain("default-src 'self'");
  });

  it('sets HSTS only in production', async () => {
    mockConfig.NODE_ENV = 'production';
    const c = createMockContext();
    const next = vi.fn();

    await securityHeaders(c, next);

    const hsts = c._resHeaders.get('Strict-Transport-Security');
    expect(hsts).toBe('max-age=63072000; includeSubDomains; preload');
  });

  it('does not set HSTS in development', async () => {
    mockConfig.NODE_ENV = 'development';
    const c = createMockContext();
    const next = vi.fn();

    await securityHeaders(c, next);

    expect(c._resHeaders.has('Strict-Transport-Security')).toBe(false);
  });

  it('does not set HSTS in test', async () => {
    mockConfig.NODE_ENV = 'test';
    const c = createMockContext();
    const next = vi.fn();

    await securityHeaders(c, next);

    expect(c._resHeaders.has('Strict-Transport-Security')).toBe(false);
  });

  it('sets Permissions-Policy disabling unnecessary features', async () => {
    const c = createMockContext();
    const next = vi.fn();

    await securityHeaders(c, next);

    const policy = c._resHeaders.get('Permissions-Policy');
    expect(policy).toContain('camera=()');
    expect(policy).toContain('microphone=()');
    expect(policy).toContain('geolocation=()');
    expect(policy).toContain('interest-cohort=()');
    expect(policy).toContain('payment=()');
    expect(policy).toContain('usb=()');
    expect(policy).toContain('magnetometer=()');
    expect(policy).toContain('gyroscope=()');
    expect(policy).toContain('accelerometer=()');
  });

  it('sets X-XSS-Protection to 1; mode=block', async () => {
    const c = createMockContext();
    const next = vi.fn();

    await securityHeaders(c, next);

    expect(c._resHeaders.get('X-XSS-Protection')).toBe('1; mode=block');
  });

  it('sets X-DNS-Prefetch-Control to off', async () => {
    const c = createMockContext();
    const next = vi.fn();

    await securityHeaders(c, next);

    expect(c._resHeaders.get('X-DNS-Prefetch-Control')).toBe('off');
  });

  it('sets X-Download-Options to noopen', async () => {
    const c = createMockContext();
    const next = vi.fn();

    await securityHeaders(c, next);

    expect(c._resHeaders.get('X-Download-Options')).toBe('noopen');
  });

  it('calls next() before setting headers', async () => {
    const c = createMockContext();
    const callOrder: string[] = [];
    const next = vi.fn(() => {
      callOrder.push('next');
    });

    // Override header to track order
    const origHeader = c.header.bind(c);
    c.header = (name: string, value: string) => {
      callOrder.push(`header:${name}`);
      origHeader(name, value);
    };

    await securityHeaders(c, next);

    expect(callOrder[0]).toBe('next');
    expect(callOrder.length).toBeGreaterThan(1);
  });
});
