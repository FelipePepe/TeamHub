import { z } from 'zod';

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const dateTimeSchema = z.string();

export const booleanFromString = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export const numberFromString = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return value;
  return Number(value);
}, z.number());

export const optionalNumberFromString = numberFromString.optional();
export const optionalBooleanFromString = booleanFromString.optional();
