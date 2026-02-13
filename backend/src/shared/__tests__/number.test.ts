import { describe, it, expect } from 'vitest';
import { toNumber, toNumberOrUndefined } from '../utils/number.js';

describe('number utils', () => {
  describe('toNumber', () => {
    it('should return fallback for null', () => {
      expect(toNumber(null)).toBe(0);
      expect(toNumber(null, 10)).toBe(10);
    });

    it('should return fallback for undefined', () => {
      expect(toNumber(undefined)).toBe(0);
      expect(toNumber(undefined, 42)).toBe(42);
    });

    it('should return numbers directly', () => {
      expect(toNumber(5)).toBe(5);
      expect(toNumber(0)).toBe(0);
      expect(toNumber(-3)).toBe(-3);
      expect(toNumber(3.14)).toBe(3.14);
    });

    it('should parse valid numeric strings', () => {
      expect(toNumber('42')).toBe(42);
      expect(toNumber('3.14')).toBe(3.14);
      expect(toNumber('-10')).toBe(-10);
      expect(toNumber('0')).toBe(0);
    });

    it('should return fallback for invalid strings', () => {
      expect(toNumber('abc')).toBe(0);
      expect(toNumber('abc', 99)).toBe(99);
      expect(toNumber('')).toBe(0);
      expect(toNumber('12abc')).toBe(0); // Number('12abc') is NaN
    });

    it('should return fallback for NaN', () => {
      expect(toNumber(NaN)).toBe(0);
      expect(toNumber(NaN, 5)).toBe(5);
    });

    it('should return fallback for Infinity', () => {
      expect(toNumber(Infinity)).toBe(0);
      expect(toNumber(Infinity, 100)).toBe(100);
      expect(toNumber(-Infinity)).toBe(0);
    });

    it('should default fallback to 0', () => {
      expect(toNumber(null)).toBe(0);
      expect(toNumber('invalid')).toBe(0);
    });

    it('should handle boolean values', () => {
      // Number(true) = 1, Number(false) = 0 - both are finite
      expect(toNumber(true)).toBe(1);
      expect(toNumber(false)).toBe(0);
    });
  });

  describe('toNumberOrUndefined', () => {
    it('should return undefined for null', () => {
      expect(toNumberOrUndefined(null)).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      expect(toNumberOrUndefined(undefined)).toBeUndefined();
    });

    it('should return numbers directly', () => {
      expect(toNumberOrUndefined(5)).toBe(5);
      expect(toNumberOrUndefined(0)).toBe(0);
      expect(toNumberOrUndefined(-3)).toBe(-3);
      expect(toNumberOrUndefined(3.14)).toBe(3.14);
    });

    it('should parse valid numeric strings', () => {
      expect(toNumberOrUndefined('42')).toBe(42);
      expect(toNumberOrUndefined('3.14')).toBe(3.14);
      expect(toNumberOrUndefined('-10')).toBe(-10);
      expect(toNumberOrUndefined('0')).toBe(0);
    });

    it('should return undefined for invalid strings', () => {
      expect(toNumberOrUndefined('abc')).toBeUndefined();
      expect(toNumberOrUndefined('12abc')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(toNumberOrUndefined('')).toBeUndefined();
    });

    it('should return undefined for whitespace-only string', () => {
      expect(toNumberOrUndefined('   ')).toBeUndefined();
      expect(toNumberOrUndefined('\t')).toBeUndefined();
    });

    it('should return undefined for other types', () => {
      expect(toNumberOrUndefined(true)).toBeUndefined();
      expect(toNumberOrUndefined(false)).toBeUndefined();
      expect(toNumberOrUndefined({})).toBeUndefined();
      expect(toNumberOrUndefined([])).toBeUndefined();
    });
  });
});
