/**
 * Módulo compartido para generación de códigos TOTP en tests E2E.
 * Consolida funciones duplicadas en múltiples archivos de tests.
 *
 * @module e2e/helpers/totp-shared
 */

import { createHmac } from 'node:crypto';

/**
 * Alfabeto Base32 estándar (RFC 4648).
 */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Parámetros TOTP según RFC 6238.
 */
const TOTP_CONFIG = {
  STEP_SECONDS: 30,
  DIGITS: 6,
} as const;

/**
 * Decodifica una cadena Base32 a Buffer.
 * Implementación según RFC 4648.
 *
 * @param input - Cadena en Base32 (ej: secreto MFA)
 * @returns Buffer con bytes decodificados
 * @throws Error si hay caracteres inválidos
 *
 * @example
 * ```typescript
 * const key = fromBase32('JBSWY3DPEHPK3PXP');
 * ```
 */
export function fromBase32(input: string): Buffer {
  const normalized = input.replace(/=+$/g, '').toUpperCase();
  let bits = '';

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }

  return Buffer.from(bytes);
}

/**
 * Genera un código TOTP de 6 dígitos válido para el timestamp dado.
 * Implementa algoritmo HMAC-based One-Time Password según RFC 6238.
 *
 * @param secret - Secreto MFA en Base32
 * @param timestampMs - Timestamp en milisegundos (por defecto Date.now())
 * @returns Código TOTP de 6 dígitos (con padding de ceros)
 *
 * @example
 * ```typescript
 * const code = generateTotpCode('JBSWY3DPEHPK3PXP');
 * console.log(code); // "123456"
 * ```
 */
export function generateTotpCode(secret: string, timestampMs = Date.now()): string {
  const counter = Math.floor(timestampMs / (TOTP_CONFIG.STEP_SECONDS * 1000));
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const key = fromBase32(secret);
  const hmac = createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** TOTP_CONFIG.DIGITS;

  return code.toString().padStart(TOTP_CONFIG.DIGITS, '0');
}
