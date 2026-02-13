/**
 * Test utilities and mock helpers
 * Provides type-safe mocks for Hono Context and other common test scenarios
 */

import type { Context } from 'hono';

/**
 * Mock Hono Context for testing middleware and routes
 * This is a partial mock that satisfies TypeScript's type checking
 * while avoiding the use of 'any' type
 */
export type MockContext = Partial<Context> & {
  req?: Partial<Context['req']>;
  res?: Partial<Context['res']>;
  _headers?: Record<string, string>;
  _resHeaders?: Record<string, string>;
  _variables?: Record<string, unknown>;
};

/**
 * Creates a mock Hono Context with sensible defaults
 * @param overrides - Partial context to override defaults
 * @returns A typed mock context
 */
export const createMockContext = (overrides?: Partial<MockContext>): MockContext => {
  return {
    req: {
      method: 'GET',
      path: '/',
      url: 'http://localhost/',
      ...overrides?.req,
    },
    res: {
      status: 200,
      ...overrides?.res,
    },
    _headers: overrides?._headers || {},
    _resHeaders: overrides?._resHeaders || {},
    _variables: overrides?._variables || {},
    ...overrides,
  };
};

/**
 * Creates a mock Hono Context with JSON response capabilities
 * Used for testing middleware that returns JSON responses
 */
export const createMockJsonContext = (
  body?: Record<string, unknown>,
  status?: number,
  headers?: Record<string, string>,
  resHeaders?: Record<string, string>,
  variables?: Record<string, unknown>
): MockContext => {
  return {
    req: { method: 'GET', path: '/', url: 'http://localhost/' },
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        status: init?.status || 200,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      }),
    text: (text: string, init?: ResponseInit) =>
      new Response(text, { status: init?.status || 200, ...init }),
    res: new Response(JSON.stringify(body), { status: status || 200 }),
    _headers: headers || {},
    _resHeaders: resHeaders || {},
    _variables: variables || {},
  };
};
