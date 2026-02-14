import { describe, it, expect } from 'vitest';
import { config } from '../env.js';

/**
 * Tests for environment configuration validation
 * These tests verify that environment variables are:
 * 1. Loaded correctly
 * 2. Validated according to Zod schema
 * 3. Transformed to correct types
 * 4. Have production safeguards
 */
describe('config - Environment Configuration', () => {
  describe('Required Properties', () => {
    it('exports all required security properties', () => {
      expect(config).toHaveProperty('NODE_ENV');
      expect(config).toHaveProperty('PORT');
      expect(config).toHaveProperty('DATABASE_URL');
      expect(config).toHaveProperty('JWT_ACCESS_SECRET');
      expect(config).toHaveProperty('JWT_REFRESH_SECRET');
      expect(config).toHaveProperty('CORS_ORIGINS');
      expect(config).toHaveProperty('corsOrigins');
      expect(config).toHaveProperty('API_HMAC_SECRET');
      expect(config).toHaveProperty('MFA_ENCRYPTION_KEY');
    });

    it('exports rate limiting configuration', () => {
      expect(config).toHaveProperty('RATE_LIMIT_WINDOW_MS');
      expect(config).toHaveProperty('RATE_LIMIT_MAX');
      expect(config).toHaveProperty('LOGIN_RATE_LIMIT_WINDOW_MS');
      expect(config).toHaveProperty('LOGIN_RATE_LIMIT_MAX');
    });

    it('exports MFA configuration', () => {
      expect(config).toHaveProperty('MFA_ISSUER');
      expect(config).toHaveProperty('MFA_ENCRYPTION_KEY');
    });

    it('exports JWT configuration', () => {
      expect(config).toHaveProperty('JWT_ACCESS_EXPIRES_IN');
      expect(config).toHaveProperty('JWT_REFRESH_EXPIRES_IN');
    });
  });

  describe('Type Validation', () => {
    it('PORT is a positive integer', () => {
      expect(typeof config.PORT).toBe('number');
      expect(config.PORT).toBeGreaterThan(0);
      expect(Number.isInteger(config.PORT)).toBe(true);
    });

    it('NODE_ENV is a valid environment', () => {
      expect(['development', 'production', 'test']).toContain(config.NODE_ENV);
    });

    it('corsOrigins is a non-empty array of strings', () => {
      expect(Array.isArray(config.corsOrigins)).toBe(true);
      expect(config.corsOrigins.length).toBeGreaterThan(0);
      for (const origin of config.corsOrigins) {
        expect(typeof origin).toBe('string');
        expect(origin.length).toBeGreaterThan(0);
      }
    });

    it('rate limiting values are positive numbers', () => {
      expect(typeof config.RATE_LIMIT_WINDOW_MS).toBe('number');
      expect(config.RATE_LIMIT_WINDOW_MS).toBeGreaterThan(0);
      expect(typeof config.RATE_LIMIT_MAX).toBe('number');
      expect(config.RATE_LIMIT_MAX).toBeGreaterThan(0);
      expect(typeof config.LOGIN_RATE_LIMIT_WINDOW_MS).toBe('number');
      expect(config.LOGIN_RATE_LIMIT_WINDOW_MS).toBeGreaterThan(0);
      expect(typeof config.LOGIN_RATE_LIMIT_MAX).toBe('number');
      expect(config.LOGIN_RATE_LIMIT_MAX).toBeGreaterThan(0);
    });

    it('BCRYPT_SALT_ROUNDS is a positive integer', () => {
      expect(typeof config.BCRYPT_SALT_ROUNDS).toBe('number');
      expect(config.BCRYPT_SALT_ROUNDS).toBeGreaterThan(0);
      expect(Number.isInteger(config.BCRYPT_SALT_ROUNDS)).toBe(true);
    });
  });

  describe('Security Constraints', () => {
    it('JWT secrets meet minimum length (32 chars)', () => {
      expect(typeof config.JWT_ACCESS_SECRET).toBe('string');
      expect(config.JWT_ACCESS_SECRET.length).toBeGreaterThanOrEqual(32);
      expect(typeof config.JWT_REFRESH_SECRET).toBe('string');
      expect(config.JWT_REFRESH_SECRET.length).toBeGreaterThanOrEqual(32);
    });

    it('MFA_ENCRYPTION_KEY meets minimum length (32 chars)', () => {
      expect(typeof config.MFA_ENCRYPTION_KEY).toBe('string');
      expect(config.MFA_ENCRYPTION_KEY.length).toBeGreaterThanOrEqual(32);
    });

    it('API_HMAC_SECRET meets minimum length (32 chars)', () => {
      expect(typeof config.API_HMAC_SECRET).toBe('string');
      expect(config.API_HMAC_SECRET.length).toBeGreaterThanOrEqual(32);
    });

    it('CORS_ORIGINS does not contain wildcards', () => {
      expect(config.CORS_ORIGINS).not.toContain('*');
      for (const origin of config.corsOrigins) {
        expect(origin).not.toBe('*');
      }
    });

    it('APP_BASE_URL is a valid URL', () => {
      expect(typeof config.APP_BASE_URL).toBe('string');
      expect(() => new URL(config.APP_BASE_URL)).not.toThrow();
    });
  });

  describe('Default Values', () => {
    it('has default values for optional configs', () => {
      // Verificar que se aplican defaults si no están en .env
      expect(config.MFA_ISSUER).toBeDefined();
      expect(config.JWT_ACCESS_EXPIRES_IN).toMatch(/^\d+[smhd]$/);
      expect(config.JWT_REFRESH_EXPIRES_IN).toMatch(/^\d+[smhd]$/);
      expect(config.LOG_LEVEL).toMatch(/^(debug|info|warn|error)$/);
    });

    it('LOG_LEVEL is a valid level', () => {
      expect(['debug', 'info', 'warn', 'error']).toContain(config.LOG_LEVEL);
    });
  });

  describe('Production Safety', () => {
    it('does not use default placeholders if NODE_ENV is production', () => {
      if (config.NODE_ENV === 'production') {
        expect(config.JWT_ACCESS_SECRET).not.toContain('change-me');
        expect(config.JWT_REFRESH_SECRET).not.toContain('change-me');
        expect(config.MFA_ENCRYPTION_KEY).not.toContain('change-me');
        expect(config.API_HMAC_SECRET).not.toContain('change-me');
      }
    });

    it('does not allow DISABLE_HMAC in production', () => {
      if (config.NODE_ENV === 'production') {
        expect(config.DISABLE_HMAC).toBe(false);
      }
    });
  });

  describe('CORS Configuration Parsing', () => {
    it('parses comma-separated CORS_ORIGINS correctly', () => {
      // CORS_ORIGINS debe ser una cadena separada por comas
      // corsOrigins debe ser el array parseado
      expect(typeof config.CORS_ORIGINS).toBe('string');
      expect(Array.isArray(config.corsOrigins)).toBe(true);
      
      // Verificar que no hay entradas vacías
      for (const origin of config.corsOrigins) {
        expect(origin.trim()).toBe(origin); // Sin espacios extra
        expect(origin.length).toBeGreaterThan(0); // No vacío
      }
    });

    it('handles single CORS origin correctly', () => {
      // Si solo hay un origen, igual debe ser un array
      expect(Array.isArray(config.corsOrigins)).toBe(true);
    });
  });

  describe('Database Configuration', () => {
    it('DATABASE_URL is a non-empty string', () => {
      expect(typeof config.DATABASE_URL).toBe('string');
      expect(config.DATABASE_URL.length).toBeGreaterThan(0);
    });

    it('has SSL configuration properties', () => {
      expect(config).toHaveProperty('PG_SSL_REJECT_UNAUTHORIZED');
      expect(typeof config.PG_SSL_REJECT_UNAUTHORIZED).toBe('boolean');
    });
  });

  describe('JWT Expiration Format', () => {
    it('JWT_ACCESS_EXPIRES_IN has valid duration format', () => {
      // Debe coincidir con regex: ^\d+[smhd]$
      expect(config.JWT_ACCESS_EXPIRES_IN).toMatch(/^\d+[smhd]$/);
    });

    it('JWT_REFRESH_EXPIRES_IN has valid duration format', () => {
      expect(config.JWT_REFRESH_EXPIRES_IN).toMatch(/^\d+[smhd]$/);
    });
  });

  describe('Optional Features', () => {
    it('SENTRY_DSN is optional but valid if present', () => {
      if (config.SENTRY_DSN) {
        expect(typeof config.SENTRY_DSN).toBe('string');
        expect(() => new URL(config.SENTRY_DSN)).not.toThrow();
      }
    });

    it('SENTRY_ENVIRONMENT has a default value', () => {
      expect(config).toHaveProperty('SENTRY_ENVIRONMENT');
      expect(typeof config.SENTRY_ENVIRONMENT).toBe('string');
    });

    it('BOOTSTRAP_TOKEN is optional', () => {
      if (config.BOOTSTRAP_TOKEN) {
        expect(typeof config.BOOTSTRAP_TOKEN).toBe('string');
        expect(config.BOOTSTRAP_TOKEN.length).toBeGreaterThanOrEqual(32);
      }
    });
  });

  describe('Platform Detection', () => {
    it('handles Vercel platform flag if present', () => {
      // VERCEL es opcional, si está presente debe ser string
      if ('VERCEL' in config) {
        expect(typeof config.VERCEL).toBe('string');
      } else {
        expect(config).not.toHaveProperty('VERCEL');
      }
    });

    it('handles Render platform flag if present', () => {
      // RENDER es opcional, si está presente debe ser string
      if ('RENDER' in config) {
        expect(typeof config.RENDER).toBe('string');
      } else {
        expect(config).not.toHaveProperty('RENDER');
      }
    });
  });
});
