import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Hoisted mocks ───────────────────────────────────────────────────
const mockSetCookie = vi.hoisted(() => vi.fn());
const mockDeleteCookie = vi.hoisted(() => vi.fn());
const mockRandomBytes = vi.hoisted(() =>
  vi.fn().mockReturnValue({
    toString: () => 'a'.repeat(64), // 32 bytes hex = 64 chars
  }),
);
const mockConfig = vi.hoisted(() => ({
  NODE_ENV: 'test' as string,
}));

vi.mock('hono/cookie', () => ({
  setCookie: mockSetCookie,
  deleteCookie: mockDeleteCookie,
}));

vi.mock('../../config/env.js', () => ({
  config: mockConfig,
}));

vi.mock('node:crypto', () => ({
  randomBytes: mockRandomBytes,
}));

// Import after mocks
import {
  setAuthCookies,
  clearAuthCookies,
  setCsrfToken,
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  COOKIE_CSRF_TOKEN,
} from '../cookies.js';

// ── Helpers ─────────────────────────────────────────────────────────
const createMockContext = () => {
  return {
    req: { method: 'GET', path: '/', url: 'http://localhost/' },
    res: { status: 200 },
  } as any;
};

describe('Cookie constants', () => {
  it('exports correct COOKIE_ACCESS_TOKEN', () => {
    expect(COOKIE_ACCESS_TOKEN).toBe('access_token');
  });

  it('exports correct COOKIE_REFRESH_TOKEN', () => {
    expect(COOKIE_REFRESH_TOKEN).toBe('refresh_token');
  });

  it('exports correct COOKIE_CSRF_TOKEN', () => {
    expect(COOKIE_CSRF_TOKEN).toBe('csrf_token');
  });
});

describe('setAuthCookies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.NODE_ENV = 'test';
  });

  it('sets access_token cookie with correct options', () => {
    const c = createMockContext();
    setAuthCookies(c, 'access-jwt', 'refresh-jwt');

    // First call should be for access_token
    expect(mockSetCookie).toHaveBeenCalledWith(
      c,
      'access_token',
      'access-jwt',
      expect.objectContaining({
        httpOnly: true,
        secure: false, // Not production
        sameSite: 'Strict',
        path: '/',
        maxAge: 15 * 60, // 15 minutes in seconds
      }),
    );
  });

  it('sets refresh_token cookie with correct options', () => {
    const c = createMockContext();
    setAuthCookies(c, 'access-jwt', 'refresh-jwt');

    // Second call should be for refresh_token
    expect(mockSetCookie).toHaveBeenCalledWith(
      c,
      'refresh_token',
      'refresh-jwt',
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'Strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      }),
    );
  });

  it('calls setCsrfToken (third setCookie call for csrf_token)', () => {
    const c = createMockContext();
    setAuthCookies(c, 'access-jwt', 'refresh-jwt');

    // 3 setCookie calls: access_token, refresh_token, csrf_token
    expect(mockSetCookie).toHaveBeenCalledTimes(3);
    expect(mockSetCookie).toHaveBeenCalledWith(
      c,
      'csrf_token',
      expect.any(String),
      expect.objectContaining({
        httpOnly: false, // CSRF token must be accessible by JS
      }),
    );
  });

  it('uses secure cookies in production', () => {
    mockConfig.NODE_ENV = 'production';
    const c = createMockContext();

    setAuthCookies(c, 'access-jwt', 'refresh-jwt');

    // All setCookie calls should have secure: true
    for (const call of mockSetCookie.mock.calls) {
      expect(call[3]).toMatchObject({ secure: true });
    }
  });

  it('does not use secure cookies outside production', () => {
    mockConfig.NODE_ENV = 'development';
    const c = createMockContext();

    setAuthCookies(c, 'access-jwt', 'refresh-jwt');

    // access_token and refresh_token should have secure: false
    expect(mockSetCookie.mock.calls[0][3]).toMatchObject({ secure: false });
    expect(mockSetCookie.mock.calls[1][3]).toMatchObject({ secure: false });
  });
});

describe('clearAuthCookies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes all three cookies', () => {
    const c = createMockContext();

    clearAuthCookies(c);

    expect(mockDeleteCookie).toHaveBeenCalledTimes(3);
    expect(mockDeleteCookie).toHaveBeenCalledWith(c, 'access_token', { path: '/' });
    expect(mockDeleteCookie).toHaveBeenCalledWith(c, 'refresh_token', { path: '/' });
    expect(mockDeleteCookie).toHaveBeenCalledWith(c, 'csrf_token', { path: '/' });
  });
});

describe('setCsrfToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.NODE_ENV = 'test';
  });

  it('generates random token using randomBytes(32)', () => {
    const c = createMockContext();

    setCsrfToken(c);

    expect(mockRandomBytes).toHaveBeenCalledWith(32);
  });

  it('sets csrf_token cookie with httpOnly: false', () => {
    const c = createMockContext();

    setCsrfToken(c);

    expect(mockSetCookie).toHaveBeenCalledWith(
      c,
      'csrf_token',
      expect.any(String),
      expect.objectContaining({
        httpOnly: false,
        sameSite: 'Strict',
        path: '/',
        maxAge: 15 * 60,
      }),
    );
  });

  it('returns the generated CSRF token', () => {
    const c = createMockContext();

    const result = setCsrfToken(c);

    expect(result).toBe('a'.repeat(64));
  });

  it('uses secure: true in production', () => {
    mockConfig.NODE_ENV = 'production';
    const c = createMockContext();

    setCsrfToken(c);

    expect(mockSetCookie).toHaveBeenCalledWith(
      c,
      'csrf_token',
      expect.any(String),
      expect.objectContaining({ secure: true }),
    );
  });

  it('uses secure: false outside production', () => {
    mockConfig.NODE_ENV = 'development';
    const c = createMockContext();

    setCsrfToken(c);

    expect(mockSetCookie).toHaveBeenCalledWith(
      c,
      'csrf_token',
      expect.any(String),
      expect.objectContaining({ secure: false }),
    );
  });
});
