import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';

// ── Hoisted mocks ───────────────────────────────────────────────────
const mockLogError = vi.hoisted(() => vi.fn());

vi.mock('../../services/error-logger.js', () => ({
  logError: mockLogError,
}));

// Import after mocks
import { registerErrorRoutes } from '../errors.routes.js';
import type { HonoEnv } from '../../types/hono.js';

// ── Helpers ─────────────────────────────────────────────────────────
const createApp = (user?: Record<string, unknown>) => {
  const app = new Hono<HonoEnv>();

  // Optional middleware to inject user context
  if (user) {
    app.use('*', async (c, next) => {
      c.set('user', user as any);
      await next();
    });
  }

  const errorRouter = new Hono<HonoEnv>();
  registerErrorRoutes(errorRouter);
  app.route('/errors', errorRouter);

  return app;
};

const validPayload = {
  origen: 'FRONTEND',
  nivel: 'ERROR',
  mensaje: 'Uncaught TypeError: cannot read property of undefined',
  stackTrace: 'TypeError: cannot read property\n  at foo.js:42',
  contexto: { component: 'Dashboard', action: 'load' },
};

// ── Tests ───────────────────────────────────────────────────────────
describe('errors.routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /errors/log', () => {
    it('returns 201 with error ID on valid payload', async () => {
      mockLogError.mockResolvedValue('error-id-123');
      const app = createApp();

      const res = await app.request('/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toEqual({
        id: 'error-id-123',
        message: 'Error registrado correctamente',
      });
      expect(mockLogError).toHaveBeenCalledOnce();
    });

    it('passes user info from context when present', async () => {
      mockLogError.mockResolvedValue('error-id-456');
      const user = { id: 'user-abc', email: 'user@example.com', rol: 'ADMIN' };
      const app = createApp(user);

      await app.request('/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });

      expect(mockLogError).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-abc',
          origen: 'FRONTEND',
          nivel: 'ERROR',
          mensaje: validPayload.mensaje,
          stackTrace: validPayload.stackTrace,
          contexto: validPayload.contexto,
        }),
      );
    });

    it('calls logError without userId when no user in context', async () => {
      mockLogError.mockResolvedValue('error-id-789');
      const app = createApp(); // no user

      await app.request('/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });

      expect(mockLogError).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: undefined,
        }),
      );
    });

    it('includes user-agent and x-forwarded-for headers in logError call', async () => {
      mockLogError.mockResolvedValue('error-id-ua');
      const app = createApp();

      await app.request('/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 Test Browser',
          'X-Forwarded-For': '192.168.1.100',
        },
        body: JSON.stringify(validPayload),
      });

      expect(mockLogError).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: 'Mozilla/5.0 Test Browser',
          ipAddress: '192.168.1.100',
        }),
      );
    });

    it('handles minimal valid payload (only required fields)', async () => {
      mockLogError.mockResolvedValue('error-id-min');
      const app = createApp();
      const minimalPayload = {
        origen: 'BACKEND',
        nivel: 'WARN',
        mensaje: 'Something went wrong',
      };

      const res = await app.request('/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minimalPayload),
      });

      expect(res.status).toBe(201);
      expect(mockLogError).toHaveBeenCalledWith(
        expect.objectContaining({
          origen: 'BACKEND',
          nivel: 'WARN',
          mensaje: 'Something went wrong',
        }),
      );
    });

    it('returns validation error for invalid payload', async () => {
      const app = createApp();
      const invalidPayload = {
        origen: 'INVALID_ORIGIN',
        nivel: 'ERROR',
        mensaje: 'test',
      };

      const res = await app.request('/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload),
      });

      // Zod validation failure should result in a non-201 status
      expect(res.status).not.toBe(201);
      expect(mockLogError).not.toHaveBeenCalled();
    });
  });
});
