import { describe, it, expect } from 'vitest';
import {
  uuidSchema,
  emailSchema,
  dateSchema,
  dateTimeSchema,
  booleanFromString,
  numberFromString,
  optionalNumberFromString,
  optionalBooleanFromString,
} from '../common.js';
import { passwordSchema, loginSchema } from '../auth.js';
import {
  createTareaSchema,
  updateTareaSchema,
  updateEstadoSchema,
  reasignarTareaSchema,
} from '../tareas.validators.js';

/**
 * Tests unitarios para validadores
 * Cobertura objetivo: 80%+
 */
describe('validators', () => {
  // ============================================================================
  // Common Validators
  // ============================================================================
  describe('uuidSchema', () => {
    it('acepta UUID v4 válido', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = uuidSchema.safeParse(validUuid);
      expect(result.success).toBe(true);
    });

    it('acepta otro UUID v4 válido', () => {
      const validUuid = 'a7c7b1c0-9e8d-4f3a-b2e1-0d1e2f3a4b5c';
      const result = uuidSchema.safeParse(validUuid);
      expect(result.success).toBe(true);
    });

    it('rechaza string vacío', () => {
      const result = uuidSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('rechaza UUID con formato incorrecto', () => {
      const invalidUuids = [
        'not-a-uuid',
        '550e8400-e29b-41d4-a716', // incompleto
        '550e8400e29b41d4a716446655440000', // sin guiones
        '550e8400-e29b-41d4-a716-44665544000g', // caracter inválido
      ];

      invalidUuids.forEach((uuid) => {
        const result = uuidSchema.safeParse(uuid);
        expect(result.success).toBe(false);
      });
    });

    it('rechaza null y undefined', () => {
      expect(uuidSchema.safeParse(null).success).toBe(false);
      expect(uuidSchema.safeParse(undefined).success).toBe(false);
    });
  });

  describe('emailSchema', () => {
    it('acepta email válido simple', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
    });

    it('acepta email con subdominio', () => {
      const result = emailSchema.safeParse('user@mail.example.com');
      expect(result.success).toBe(true);
    });

    it('acepta email con caracteres especiales en local part', () => {
      const result = emailSchema.safeParse('user.name+tag@example.com');
      expect(result.success).toBe(true);
    });

    it('rechaza email sin @', () => {
      const result = emailSchema.safeParse('invalidemail.com');
      expect(result.success).toBe(false);
    });

    it('rechaza email sin dominio', () => {
      const result = emailSchema.safeParse('user@');
      expect(result.success).toBe(false);
    });

    it('rechaza email sin local part', () => {
      const result = emailSchema.safeParse('@example.com');
      expect(result.success).toBe(false);
    });

    it('rechaza string vacío', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('dateSchema', () => {
    it('acepta fecha válida YYYY-MM-DD', () => {
      const validDates = ['2024-01-01', '2024-12-31', '2000-06-15'];
      validDates.forEach((date) => {
        const result = dateSchema.safeParse(date);
        expect(result.success).toBe(true);
      });
    });

    it('rechaza fecha con formato incorrecto', () => {
      const invalidDates = [
        '01-01-2024', // DD-MM-YYYY
        '2024/01/01', // con /
        '2024-1-1', // sin padding
        '24-01-01', // año corto
        'not-a-date',
      ];
      invalidDates.forEach((date) => {
        const result = dateSchema.safeParse(date);
        expect(result.success).toBe(false);
      });
    });

    it('rechaza fecha vacía', () => {
      const result = dateSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('dateTimeSchema', () => {
    it('acepta cualquier string (validación permisiva)', () => {
      const dates = [
        '2024-01-01T00:00:00Z',
        '2024-01-01T12:30:45.123Z',
        'any-string', // dateTimeSchema es z.string() sin restricciones
      ];
      dates.forEach((date) => {
        const result = dateTimeSchema.safeParse(date);
        expect(result.success).toBe(true);
      });
    });

    it('rechaza no-strings', () => {
      expect(dateTimeSchema.safeParse(null).success).toBe(false);
      expect(dateTimeSchema.safeParse(123).success).toBe(false);
      expect(dateTimeSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('booleanFromString', () => {
    it('acepta booleanos nativos', () => {
      expect(booleanFromString.parse(true)).toBe(true);
      expect(booleanFromString.parse(false)).toBe(false);
    });

    it('convierte string "true" a true', () => {
      expect(booleanFromString.parse('true')).toBe(true);
    });

    it('convierte string "false" a false', () => {
      expect(booleanFromString.parse('false')).toBe(false);
    });

    it('rechaza otros strings', () => {
      const result = booleanFromString.safeParse('yes');
      expect(result.success).toBe(false);
    });

    it('rechaza números', () => {
      const result = booleanFromString.safeParse(1);
      expect(result.success).toBe(false);
    });
  });

  describe('numberFromString', () => {
    it('acepta números nativos', () => {
      expect(numberFromString.parse(42)).toBe(42);
      expect(numberFromString.parse(3.14)).toBe(3.14);
      expect(numberFromString.parse(-10)).toBe(-10);
    });

    it('convierte strings numéricos a números', () => {
      expect(numberFromString.parse('42')).toBe(42);
      expect(numberFromString.parse('3.14')).toBe(3.14);
      expect(numberFromString.parse('-10')).toBe(-10);
    });

    it('convierte string vacío a 0 (comportamiento de coerce)', () => {
      expect(numberFromString.parse('')).toBe(0);
    });
  });

  describe('optionalNumberFromString', () => {
    it('acepta números nativos', () => {
      expect(optionalNumberFromString.parse(42)).toBe(42);
    });

    it('convierte strings numéricos', () => {
      expect(optionalNumberFromString.parse('42')).toBe(42);
    });

    it('retorna undefined para undefined', () => {
      expect(optionalNumberFromString.parse(undefined)).toBeUndefined();
    });

    it('retorna undefined para string vacío', () => {
      expect(optionalNumberFromString.parse('')).toBeUndefined();
    });

    it('retorna undefined para string no numérico', () => {
      expect(optionalNumberFromString.parse('not-a-number')).toBeUndefined();
    });
  });

  describe('optionalBooleanFromString', () => {
    it('acepta booleanos nativos', () => {
      expect(optionalBooleanFromString.parse(true)).toBe(true);
      expect(optionalBooleanFromString.parse(false)).toBe(false);
    });

    it('convierte "true" a true', () => {
      expect(optionalBooleanFromString.parse('true')).toBe(true);
    });

    it('convierte "false" a false', () => {
      expect(optionalBooleanFromString.parse('false')).toBe(false);
    });

    it('retorna undefined para undefined', () => {
      expect(optionalBooleanFromString.parse(undefined)).toBeUndefined();
    });
  });

  // ============================================================================
  // Auth Validators
  // ============================================================================
  describe('passwordSchema', () => {
    it('acepta password válido con todos los requisitos', () => {
      const validPasswords = [
        'ValidPassword1!',
        'MySecure@Pass123',
        'C0mplex!Pass#word',
      ];
      validPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    it('rechaza password menor a 12 caracteres', () => {
      const result = passwordSchema.safeParse('Short1!');
      expect(result.success).toBe(false);
    });

    it('rechaza password mayor a 128 caracteres', () => {
      const longPassword = 'A'.repeat(100) + 'a1!' + 'A'.repeat(30);
      const result = passwordSchema.safeParse(longPassword);
      expect(result.success).toBe(false);
    });

    it('rechaza password sin minúscula', () => {
      const result = passwordSchema.safeParse('ALLUPPERCASE123!');
      expect(result.success).toBe(false);
    });

    it('rechaza password sin mayúscula', () => {
      const result = passwordSchema.safeParse('alllowercase123!');
      expect(result.success).toBe(false);
    });

    it('rechaza password sin número', () => {
      const result = passwordSchema.safeParse('NoNumbersHere!!');
      expect(result.success).toBe(false);
    });

    it('rechaza password sin caracter especial', () => {
      const result = passwordSchema.safeParse('NoSpecialChars123');
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('acepta login válido', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    it('rechaza email inválido', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password',
      });
      expect(result.success).toBe(false);
    });

    it('rechaza password vacío', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });

    it('rechaza objeto vacío', () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rechaza sin email', () => {
      const result = loginSchema.safeParse({ password: 'password' });
      expect(result.success).toBe(false);
    });

    it('rechaza sin password', () => {
      const result = loginSchema.safeParse({ email: 'user@example.com' });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Tareas Validators
  // ============================================================================
  describe('createTareaSchema', () => {
    it('acepta tarea con solo título', () => {
      const result = createTareaSchema.safeParse({
        titulo: 'Mi Tarea',
      });
      expect(result.success).toBe(true);
    });

    it('acepta tarea con todos los campos', () => {
      const result = createTareaSchema.safeParse({
        titulo: 'Tarea Completa',
        descripcion: 'Descripción detallada',
        estado: 'IN_PROGRESS',
        prioridad: 'HIGH',
        usuarioAsignadoId: '550e8400-e29b-41d4-a716-446655440000',
        fechaInicio: '2024-01-01',
        fechaFin: '2024-12-31',
        horasEstimadas: 40,
        horasReales: 35,
        orden: 1,
        dependeDe: '550e8400-e29b-41d4-a716-446655440001',
      });
      expect(result.success).toBe(true);
    });

    it('rechaza tarea sin título', () => {
      const result = createTareaSchema.safeParse({
        descripcion: 'Sin título',
      });
      expect(result.success).toBe(false);
    });

    it('rechaza título vacío', () => {
      const result = createTareaSchema.safeParse({
        titulo: '',
      });
      expect(result.success).toBe(false);
    });

    it('rechaza estado inválido', () => {
      const result = createTareaSchema.safeParse({
        titulo: 'Tarea',
        estado: 'INVALID_STATE',
      });
      expect(result.success).toBe(false);
    });

    it('acepta todos los estados válidos', () => {
      const estados = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'];
      estados.forEach((estado) => {
        const result = createTareaSchema.safeParse({
          titulo: 'Tarea',
          estado,
        });
        expect(result.success).toBe(true);
      });
    });

    it('rechaza prioridad inválida', () => {
      const result = createTareaSchema.safeParse({
        titulo: 'Tarea',
        prioridad: 'INVALID_PRIORITY',
      });
      expect(result.success).toBe(false);
    });

    it('acepta todas las prioridades válidas', () => {
      const prioridades = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      prioridades.forEach((prioridad) => {
        const result = createTareaSchema.safeParse({
          titulo: 'Tarea',
          prioridad,
        });
        expect(result.success).toBe(true);
      });
    });

    it('rechaza UUID inválido en usuarioAsignadoId', () => {
      const result = createTareaSchema.safeParse({
        titulo: 'Tarea',
        usuarioAsignadoId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('rechaza fecha inválida en fechaInicio', () => {
      const result = createTareaSchema.safeParse({
        titulo: 'Tarea',
        fechaInicio: '01-01-2024',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateTareaSchema', () => {
    it('acepta objeto vacío (todo opcional)', () => {
      const result = updateTareaSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('acepta actualización parcial', () => {
      const result = updateTareaSchema.safeParse({
        titulo: 'Nuevo título',
      });
      expect(result.success).toBe(true);
    });

    it('acepta null para campos nullables', () => {
      const result = updateTareaSchema.safeParse({
        usuarioAsignadoId: null,
        fechaInicio: null,
        fechaFin: null,
        horasEstimadas: null,
        horasReales: null,
        dependeDe: null,
      });
      expect(result.success).toBe(true);
    });

    it('rechaza título vacío si se proporciona', () => {
      const result = updateTareaSchema.safeParse({
        titulo: '',
      });
      expect(result.success).toBe(false);
    });

    it('rechaza estado inválido', () => {
      const result = updateTareaSchema.safeParse({
        estado: 'INVALID',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateEstadoSchema', () => {
    it('acepta todos los estados válidos', () => {
      const estados = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'];
      estados.forEach((estado) => {
        const result = updateEstadoSchema.safeParse({ estado });
        expect(result.success).toBe(true);
      });
    });

    it('rechaza objeto sin estado', () => {
      const result = updateEstadoSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rechaza estado inválido', () => {
      const result = updateEstadoSchema.safeParse({
        estado: 'INVALID',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('reasignarTareaSchema', () => {
    it('acepta UUID válido', () => {
      const result = reasignarTareaSchema.safeParse({
        usuarioAsignadoId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('acepta null para desasignar', () => {
      const result = reasignarTareaSchema.safeParse({
        usuarioAsignadoId: null,
      });
      expect(result.success).toBe(true);
    });

    it('rechaza UUID inválido', () => {
      const result = reasignarTareaSchema.safeParse({
        usuarioAsignadoId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('rechaza objeto sin usuarioAsignadoId', () => {
      const result = reasignarTareaSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
