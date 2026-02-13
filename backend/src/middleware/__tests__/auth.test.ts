import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HTTPException } from 'hono/http-exception';

// ── Hoisted mocks ───────────────────────────────────────────────────
const mockGetCookie = vi.hoisted(() => vi.fn());
const mockVerifyAccessToken = vi.hoisted(() => vi.fn());
const mockFindActiveUserById = vi.hoisted(() => vi.fn());

vi.mock('hono/cookie', () => ({
  getCookie: mockGetCookie,
}));

vi.mock('../../services/auth-service.js', () => ({
  verifyAccessToken: mockVerifyAccessToken,
}));

vi.mock('../../services/users-repository.js', () => ({
  findActiveUserById: mockFindActiveUserById,
}));

// Import after mocks
import { authMiddleware, requireRoles } from '../auth.js';

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

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  nombre: 'Test',
  apellidos: 'User',
  rol: 'ADMIN',
  departamentoId: null,
  managerId: null,
  activo: true,
};

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets token from cookie successfully and sets user in context', async () => {
    const c = createMockContext();
    const next = vi.fn();

    mockGetCookie.mockReturnValue('valid-jwt-token');
    mockVerifyAccessToken.mockReturnValue({ sub: 'user-123', role: 'ADMIN' });
    mockFindActiveUserById.mockResolvedValue(mockUser);

    await authMiddleware(c, next);

    expect(mockGetCookie).toHaveBeenCalledWith(c, 'access_token');
    expect(mockVerifyAccessToken).toHaveBeenCalledWith('valid-jwt-token');
    expect(mockFindActiveUserById).toHaveBeenCalledWith('user-123');
    expect(c._variables.get('user')).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it('falls back to Authorization header when no cookie', async () => {
    const headers = new Map<string, string>();
    headers.set('authorization', 'Bearer header-token');
    const c = createMockContext({
      header: (name: string) => headers.get(name.toLowerCase()),
    });
    const next = vi.fn();

    mockGetCookie.mockReturnValue(undefined);
    mockVerifyAccessToken.mockReturnValue({ sub: 'user-123', role: 'ADMIN' });
    mockFindActiveUserById.mockResolvedValue(mockUser);

    await authMiddleware(c, next);

    expect(mockVerifyAccessToken).toHaveBeenCalledWith('header-token');
    expect(next).toHaveBeenCalled();
  });

  it('throws 401 when no token at all', async () => {
    const c = createMockContext();
    const next = vi.fn();

    mockGetCookie.mockReturnValue(undefined);

    await expect(authMiddleware(c, next)).rejects.toThrow(HTTPException);
    await expect(authMiddleware(c, next)).rejects.toMatchObject({
      status: 401,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('throws 401 when Authorization header is present but not Bearer format', async () => {
    const headers = new Map<string, string>();
    headers.set('authorization', 'Basic user:pass');
    const c = createMockContext({
      header: (name: string) => headers.get(name.toLowerCase()),
    });
    const next = vi.fn();

    mockGetCookie.mockReturnValue(undefined);

    await expect(authMiddleware(c, next)).rejects.toThrow(HTTPException);
    await expect(authMiddleware(c, next)).rejects.toMatchObject({
      status: 401,
    });
  });

  it('throws 401 when verifyAccessToken throws', async () => {
    const c = createMockContext();
    const next = vi.fn();

    mockGetCookie.mockReturnValue('expired-token');
    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('Token expired');
    });

    await expect(authMiddleware(c, next)).rejects.toThrow(HTTPException);
    await expect(authMiddleware(c, next)).rejects.toMatchObject({
      status: 401,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('throws 401 when user not found (findActiveUserById returns null)', async () => {
    const c = createMockContext();
    const next = vi.fn();

    mockGetCookie.mockReturnValue('valid-token');
    mockVerifyAccessToken.mockReturnValue({ sub: 'user-deleted', role: 'ADMIN' });
    mockFindActiveUserById.mockResolvedValue(null);

    await expect(authMiddleware(c, next)).rejects.toThrow(HTTPException);
    await expect(authMiddleware(c, next)).rejects.toMatchObject({
      status: 401,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('re-throws HTTPException from findActiveUserById as-is', async () => {
    const c = createMockContext();
    const next = vi.fn();

    mockGetCookie.mockReturnValue('valid-token');
    mockVerifyAccessToken.mockReturnValue({ sub: 'user-123', role: 'ADMIN' });
    mockFindActiveUserById.mockRejectedValue(
      new HTTPException(401, { message: 'No autorizado' }),
    );

    await expect(authMiddleware(c, next)).rejects.toThrow(HTTPException);
    await expect(authMiddleware(c, next)).rejects.toMatchObject({
      status: 401,
      message: 'No autorizado',
    });
  });

  it('calls next() on success', async () => {
    const c = createMockContext();
    const next = vi.fn();

    mockGetCookie.mockReturnValue('valid-token');
    mockVerifyAccessToken.mockReturnValue({ sub: 'user-123', role: 'EMPLEADO' });
    mockFindActiveUserById.mockResolvedValue({ ...mockUser, rol: 'EMPLEADO' });

    await authMiddleware(c, next);

    expect(next).toHaveBeenCalledOnce();
  });
});

describe('requireRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls next() when user has matching role', async () => {
    const c = createMockContext();
    c.set('user', { ...mockUser, rol: 'ADMIN' });
    const next = vi.fn();

    const middleware = requireRoles('ADMIN', 'RRHH');
    await middleware(c, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('calls next() when user has one of multiple allowed roles', async () => {
    const c = createMockContext();
    c.set('user', { ...mockUser, rol: 'RRHH' });
    const next = vi.fn();

    const middleware = requireRoles('ADMIN', 'RRHH');
    await middleware(c, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('throws 403 when user has wrong role', async () => {
    const c = createMockContext();
    c.set('user', { ...mockUser, rol: 'EMPLEADO' });
    const next = vi.fn();

    const middleware = requireRoles('ADMIN', 'RRHH');

    await expect(middleware(c, next)).rejects.toThrow(HTTPException);
    await expect(middleware(c, next)).rejects.toMatchObject({
      status: 403,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('throws 403 when no user in context', async () => {
    const c = createMockContext();
    const next = vi.fn();

    const middleware = requireRoles('ADMIN');

    await expect(middleware(c, next)).rejects.toThrow(HTTPException);
    await expect(middleware(c, next)).rejects.toMatchObject({
      status: 403,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('works with a single role', async () => {
    const c = createMockContext();
    c.set('user', { ...mockUser, rol: 'MANAGER' });
    const next = vi.fn();

    const middleware = requireRoles('MANAGER');
    await middleware(c, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
