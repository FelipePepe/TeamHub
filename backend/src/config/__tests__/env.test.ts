import { describe, it, expect } from 'vitest';
import { config } from '../env.js';

describe('config', () => {
  it('exports required properties', () => {
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

  it('corsOrigins is an array parsed from CORS_ORIGINS', () => {
    expect(Array.isArray(config.corsOrigins)).toBe(true);
    expect(config.corsOrigins.length).toBeGreaterThan(0);
  });

  it('PORT is a number', () => {
    expect(typeof config.PORT).toBe('number');
  });

  it('NODE_ENV is a valid environment', () => {
    expect(['development', 'production', 'test']).toContain(config.NODE_ENV);
  });

  it('corsOrigins entries are non-empty strings', () => {
    for (const origin of config.corsOrigins) {
      expect(typeof origin).toBe('string');
      expect(origin.length).toBeGreaterThan(0);
    }
  });

  it('JWT secrets are strings with minimum length', () => {
    expect(typeof config.JWT_ACCESS_SECRET).toBe('string');
    expect(config.JWT_ACCESS_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(typeof config.JWT_REFRESH_SECRET).toBe('string');
    expect(config.JWT_REFRESH_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it('MFA_ENCRYPTION_KEY is a string with minimum length', () => {
    expect(typeof config.MFA_ENCRYPTION_KEY).toBe('string');
    expect(config.MFA_ENCRYPTION_KEY.length).toBeGreaterThanOrEqual(32);
  });

  it('API_HMAC_SECRET is a string with minimum length', () => {
    expect(typeof config.API_HMAC_SECRET).toBe('string');
    expect(config.API_HMAC_SECRET.length).toBeGreaterThanOrEqual(32);
  });
});
