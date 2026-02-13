import { describe, it, expect, vi, beforeEach } from 'vitest';

const requestUse = vi.fn();
const responseUse = vi.fn();
const getMock = vi.fn();
const postMock = vi.fn();
const putMock = vi.fn();
const patchMock = vi.fn();
const deleteMock = vi.fn();
const apiCallMock = vi.fn();
const axiosPostMock = vi.fn();

vi.mock('axios', () => {
  const instance = Object.assign(apiCallMock, {
    interceptors: {
      request: { use: requestUse },
      response: { use: responseUse },
    },
    get: getMock,
    post: postMock,
    put: putMock,
    patch: patchMock,
    delete: deleteMock,
  });

  return {
    default: {
      create: vi.fn(() => instance),
      post: axiosPostMock,
    },
  };
});

const signMock = vi.fn(async () => 'sig-123');
vi.mock('../hmac', () => ({ generateRequestSignature: (...args: unknown[]) => signMock(...args) }));

describe('lib/api', () => {
  beforeEach(() => {
    requestUse.mockReset();
    responseUse.mockReset();
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
    patchMock.mockReset();
    deleteMock.mockReset();
    apiCallMock.mockReset();
    axiosPostMock.mockReset();
    signMock.mockReset();
    signMock.mockResolvedValue('sig-123');
  });

  it('wrappers get/post/put/patch/del devuelven data', async () => {
    vi.resetModules();
    const mod = await import('../api');

    getMock.mockResolvedValue({ data: { ok: 1 } });
    postMock.mockResolvedValue({ data: { ok: 2 } });
    putMock.mockResolvedValue({ data: { ok: 3 } });
    patchMock.mockResolvedValue({ data: { ok: 4 } });
    deleteMock.mockResolvedValue({ data: { ok: 5 } });

    await expect(mod.get('/x')).resolves.toEqual({ ok: 1 });
    await expect(mod.post('/x', {})).resolves.toEqual({ ok: 2 });
    await expect(mod.put('/x', {})).resolves.toEqual({ ok: 3 });
    await expect(mod.patch('/x', {})).resolves.toEqual({ ok: 4 });
    await expect(mod.del('/x')).resolves.toEqual({ ok: 5 });
    postMock.mockResolvedValue({ data: { ok: 6 } });
    await expect(mod.postWithToken('/x', { a: 1 }, 'tok')).resolves.toEqual({ ok: 6 });
  });

  it('registra interceptores de request/response', async () => {
    vi.resetModules();
    await import('../api');

    expect(requestUse).toHaveBeenCalled();
    expect(responseUse).toHaveBeenCalled();
  });

  it('request interceptor añade CSRF en mutaciones y firma HMAC', async () => {
    vi.resetModules();
    await import('../api');
    const onRequest = requestUse.mock.calls[0][0] as (cfg: Record<string, unknown>) => Promise<Record<string, unknown>>;

    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrf_token=abc123',
    });

    const cfg = await onRequest({
      method: 'post',
      url: '/users',
      data: { nombre: 'Ana' },
      headers: {},
    });

    expect(signMock).toHaveBeenCalledWith('POST', '/api/users', JSON.stringify({ nombre: 'Ana' }));
    expect((cfg.headers as Record<string, string>)['X-CSRF-Token']).toBe('abc123');
    expect((cfg.headers as Record<string, string>)['X-Request-Signature']).toBe('sig-123');
  });

  it('request interceptor firma GET sin CSRF y maneja body string/null', async () => {
    vi.resetModules();
    await import('../api');
    const onRequest = requestUse.mock.calls[0][0] as (cfg: Record<string, unknown>) => Promise<Record<string, unknown>>;

    await onRequest({ method: 'get', url: '/health', data: undefined, headers: {} });
    expect(signMock).toHaveBeenCalledWith('GET', '/api/health', '');

    await onRequest({ method: 'patch', url: '/raw', data: 'x=1', headers: {} });
    expect(signMock).toHaveBeenCalledWith('PATCH', '/api/raw', 'x=1');

    await onRequest({ method: 'delete', url: '/x', data: null, headers: {} });
    expect(signMock).toHaveBeenCalledWith('DELETE', '/api/x', '');
  });

  it('response interceptor hace refresh en 401 y reintenta request', async () => {
    vi.resetModules();
    const mod = await import('../api');
    const onResponseError = responseUse.mock.calls[0][1] as (err: Record<string, unknown>) => Promise<unknown>;

    axiosPostMock.mockResolvedValue({ data: { ok: true } });
    apiCallMock.mockResolvedValue({ data: { retried: true } });

    const originalRequest = { method: 'get', url: '/secure', headers: {} };
    const result = await onResponseError({
      response: { status: 401 },
      config: originalRequest,
    });

    expect(signMock).toHaveBeenCalledWith('POST', '/api/auth/refresh', '');
    expect(axiosPostMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/refresh',
      {},
      expect.objectContaining({ withCredentials: true })
    );
    expect(apiCallMock).toHaveBeenCalledWith(expect.objectContaining({ _retry: true }));
    expect(result).toEqual({ data: { retried: true } });
    expect(mod.default).toBeDefined();
  });

  it('response interceptor propaga error si refresh falla o no es 401', async () => {
    vi.resetModules();
    await import('../api');
    const onResponseError = responseUse.mock.calls[0][1] as (err: Record<string, unknown>) => Promise<unknown>;

    const non401 = { response: { status: 500 }, config: { headers: {} } };
    await expect(onResponseError(non401)).rejects.toBe(non401);

    axiosPostMock.mockRejectedValue(new Error('refresh failed'));
    const unauthorized = { response: { status: 401 }, config: { headers: {} } };
    await expect(onResponseError(unauthorized)).rejects.toBe(unauthorized);
  });
});
