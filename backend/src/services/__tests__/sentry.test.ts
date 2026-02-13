import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSentryInit, mockCaptureException, mockCaptureMessage, mockSetUser, mockSetContext, mockHttpIntegration } = vi.hoisted(() => ({
  mockSentryInit: vi.fn(),
  mockCaptureException: vi.fn(),
  mockCaptureMessage: vi.fn(),
  mockSetUser: vi.fn(),
  mockSetContext: vi.fn(),
  mockHttpIntegration: vi.fn().mockReturnValue('http-integration'),
}));

vi.mock('@sentry/node', () => ({
  init: mockSentryInit,
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
  setUser: mockSetUser,
  setContext: mockSetContext,
  httpIntegration: mockHttpIntegration,
}));

// We need to re-import the module for each test to reset the sentryInitialized state.
// Since the module has mutable state (sentryInitialized), we use resetModules.
describe('sentry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('initSentry', () => {
    it('should initialize Sentry with correct config', async () => {
      const { initSentry } = await import('../sentry.js');

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      initSentry({
        dsn: 'https://test@sentry.io/123',
        environment: 'test',
        tracesSampleRate: 0.5,
      });

      expect(mockSentryInit).toHaveBeenCalledWith({
        dsn: 'https://test@sentry.io/123',
        environment: 'test',
        tracesSampleRate: 0.5,
        integrations: ['http-integration'],
      });
      expect(consoleSpy).toHaveBeenCalledWith('[Sentry] Initialized for test');

      consoleSpy.mockRestore();
    });

    it('should warn on double initialization', async () => {
      const { initSentry } = await import('../sentry.js');

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const config = {
        dsn: 'https://test@sentry.io/123',
        environment: 'test',
        tracesSampleRate: 0.5,
      };

      initSentry(config);
      initSentry(config); // Second call should warn

      expect(consoleWarnSpy).toHaveBeenCalledWith('Sentry already initialized');
      expect(mockSentryInit).toHaveBeenCalledTimes(1);

      consoleWarnSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('captureException', () => {
    it('should capture exception when initialized', async () => {
      const { initSentry, captureException } = await import('../sentry.js');

      vi.spyOn(console, 'log').mockImplementation(() => {});
      initSentry({ dsn: 'https://test@sentry.io/123', environment: 'test', tracesSampleRate: 1.0 });

      const error = new Error('Test error');
      mockCaptureException.mockReturnValue('event-id-123');

      const result = captureException(error);

      expect(mockCaptureException).toHaveBeenCalledWith(error);
      expect(result).toBe('event-id-123');
    });

    it('should return undefined when not initialized', async () => {
      const { captureException } = await import('../sentry.js');

      const error = new Error('Test error');
      const result = captureException(error);

      expect(result).toBeUndefined();
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('should set context when provided', async () => {
      const { initSentry, captureException } = await import('../sentry.js');

      vi.spyOn(console, 'log').mockImplementation(() => {});
      initSentry({ dsn: 'https://test@sentry.io/123', environment: 'test', tracesSampleRate: 1.0 });

      const error = new Error('With context');
      const contexto = { route: '/api/users', method: 'GET' };
      mockCaptureException.mockReturnValue('event-id-456');

      captureException(error, contexto);

      expect(mockSetContext).toHaveBeenCalledWith('additional', contexto);
      expect(mockCaptureException).toHaveBeenCalledWith(error);
    });

    it('should not set context when not provided', async () => {
      const { initSentry, captureException } = await import('../sentry.js');

      vi.spyOn(console, 'log').mockImplementation(() => {});
      initSentry({ dsn: 'https://test@sentry.io/123', environment: 'test', tracesSampleRate: 1.0 });

      captureException(new Error('No context'));

      expect(mockSetContext).not.toHaveBeenCalled();
    });
  });

  describe('captureMessage', () => {
    it('should capture message when initialized', async () => {
      const { initSentry, captureMessage } = await import('../sentry.js');

      vi.spyOn(console, 'log').mockImplementation(() => {});
      initSentry({ dsn: 'https://test@sentry.io/123', environment: 'test', tracesSampleRate: 1.0 });

      mockCaptureMessage.mockReturnValue('msg-id-789');

      const result = captureMessage('Test message', 'warning');

      expect(mockCaptureMessage).toHaveBeenCalledWith('Test message', 'warning');
      expect(result).toBe('msg-id-789');
    });

    it('should return undefined when not initialized', async () => {
      const { captureMessage } = await import('../sentry.js');

      const result = captureMessage('Test message', 'info');

      expect(result).toBeUndefined();
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });
  });

  describe('setUserContext', () => {
    it('should set user when initialized', async () => {
      const { initSentry, setUserContext } = await import('../sentry.js');

      vi.spyOn(console, 'log').mockImplementation(() => {});
      initSentry({ dsn: 'https://test@sentry.io/123', environment: 'test', tracesSampleRate: 1.0 });

      const user = { id: 'u1', email: 'test@example.com', username: 'testuser' };
      setUserContext(user);

      expect(mockSetUser).toHaveBeenCalledWith({
        id: 'u1',
        email: 'test@example.com',
        username: 'testuser',
      });
    });

    it('should do nothing when not initialized', async () => {
      const { setUserContext } = await import('../sentry.js');

      setUserContext({ id: 'u1' });

      expect(mockSetUser).not.toHaveBeenCalled();
    });

    it('should handle user with only id', async () => {
      const { initSentry, setUserContext } = await import('../sentry.js');

      vi.spyOn(console, 'log').mockImplementation(() => {});
      initSentry({ dsn: 'https://test@sentry.io/123', environment: 'test', tracesSampleRate: 1.0 });

      setUserContext({ id: 'u1' });

      expect(mockSetUser).toHaveBeenCalledWith({
        id: 'u1',
        email: undefined,
        username: undefined,
      });
    });
  });
});
