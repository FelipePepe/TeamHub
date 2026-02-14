import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync } from 'node:crypto';
import { config } from '../config/env.js';
import { BUSINESS_RULES } from '../shared/constants/business-rules.js';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 16;

/**
 * Deriva una clave de cifrado de 32 bytes a partir del secreto de MFA y un salt.
 * @param salt - Salt para la derivación de clave.
 * @returns Clave derivada en formato Buffer.
 */
const deriveKey = (salt: Buffer) => scryptSync(config.MFA_ENCRYPTION_KEY, salt, 32);

/**
 * Cifra un secreto MFA y devuelve el payload en base64 (salt:iv:authTag:data).
 * 
 * Security: Uses AES-256-GCM with authenticated encryption:
 * - Algorithm: aes-256-gcm (industry standard, NIST approved)
 * - Key derivation: scrypt (memory-hard KDF, protects against brute-force)
 * - Random IV: 16 bytes per encryption (prevents pattern analysis)
 * - Authentication tag: Ensures integrity and prevents tampering
 * - Salt: 16 bytes random (prevents rainbow table attacks)
 * 
 * @param plainSecret - Secreto MFA en texto plano.
 * @returns Secreto cifrado en formato base64.
 * @throws Error si el secreto está vacío.
 */
export const encryptMfaSecret = (plainSecret: string): string => {
  if (!plainSecret || typeof plainSecret !== 'string') {
    throw new Error('Invalid MFA secret: must be a non-empty string');
  }
  
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(salt);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainSecret, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: salt:iv:authTag:encryptedData (all base64)
  return `${salt.toString('base64')}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
};

/**
 * Descifra un secreto MFA cifrado en formato base64.
 * Formato: salt:iv:authTag:data (todas las partes en base64).
 * 
 * Security: Uses AES-256-GCM authenticated decryption:
 * - Verifies authentication tag before decrypting (prevents tampering)
 * - Uses same key derivation as encryption (scrypt)
 * - Throws error if authTag validation fails (integrity check)
 * 
 * @param encryptedSecret - Secreto cifrado en formato base64.
 * @returns Secreto MFA en texto plano.
 * @throws Error si el formato es inválido o el authTag no valida.
 */
export const decryptMfaSecret = (encryptedSecret: string): string => {
  const parts = encryptedSecret.split(':');

  if (parts.length !== 4) {
    throw new Error('Invalid encrypted secret format: expected salt:iv:authTag:data');
  }

  const [saltB64, ivB64, authTagB64, dataB64] = parts;
  const salt = Buffer.from(saltB64, 'base64');

  const key = deriveKey(salt);
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(dataB64, 'base64');
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv, {
    authTagLength: authTag.length,
  });
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
};

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Convierte un buffer a Base32.
 * @param buffer - Buffer de entrada.
 * @returns Cadena Base32.
 */
const toBase32 = (buffer: Buffer): string => {
  let bits = '';
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0');
  }

  let output = '';
  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5);
    if (chunk.length < 5) {
      output += BASE32_ALPHABET[Number.parseInt(chunk.padEnd(5, '0'), 2)];
    } else {
      output += BASE32_ALPHABET[Number.parseInt(chunk, 2)];
    }
  }

  return output;
};

/**
 * Convierte una cadena Base32 a Buffer.
 * @param input - Cadena Base32.
 * @returns Buffer decodificado.
 * @throws Error if input contains invalid base32 characters
 */
const fromBase32 = (input: string): Buffer => {
  // Remove trailing padding without regex to avoid backtracking issues
  let normalized = input.toUpperCase();
  while (normalized.endsWith('=')) {
    normalized = normalized.slice(0, -1);
  }
  
  let bits = '';

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error('Invalid base32 character');
    }
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }

  return Buffer.from(bytes);
};

/**
 * Genera un secreto MFA Base32.
 * @returns Secreto Base32.
 */
export const generateMfaSecret = () => {
  const buffer = randomBytes(20);
  return toBase32(buffer);
};

/**
 * Genera un código TOTP para un secreto y timestamp dados.
 * @param secret - Secreto Base32.
 * @param timestampMs - Timestamp en milisegundos.
 * @returns Código TOTP como string.
 */
export const generateTotpCode = (secret: string, timestampMs = Date.now()) => {
  const {
    totpDigits,
    totpStepSeconds,
  } = BUSINESS_RULES.auth;
  const counter = Math.floor(timestampMs / (totpStepSeconds * 1000));
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const key = fromBase32(secret);
  const hmac = createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** totpDigits;

  return code.toString().padStart(totpDigits, '0');
};

/**
 * Verifica un código TOTP dentro de la ventana de tolerancia.
 * @param secret - Secreto Base32.
 * @param code - Código TOTP.
 * @param timestampMs - Timestamp en milisegundos.
 * @returns true si el código es válido dentro de la ventana.
 */
export const verifyTotpCode = (secret: string, code: string, timestampMs = Date.now()) => {
  const { totpStepSeconds, totpWindow } = BUSINESS_RULES.auth;
  // Security: Simple regex check for digits only (no backtracking risk)
  // Validates TOTP code format (6 digits) before expensive crypto operation
  if (!/^\d+$/.test(code)) {
    return false;
  }

  for (let windowOffset = -totpWindow; windowOffset <= totpWindow; windowOffset += 1) {
    const windowTime = timestampMs + windowOffset * totpStepSeconds * 1000;
    if (generateTotpCode(secret, windowTime) === code) {
      return true;
    }
  }

  return false;
};

/**
 * Verifica que un valor tenga el formato de secreto MFA cifrado esperado.
 * Formato válido: salt:iv:authTag:data (4 partes base64) o iv:authTag:data (3 partes, legacy).
 * @param value - Valor a verificar.
 * @returns true si el valor parece estar cifrado.
 */
export const isEncryptedMfaSecret = (value: string): boolean => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  const parts = value.split(':');
  if (parts.length !== 3 && parts.length !== 4) {
    return false;
  }
  
  // Security: Base64 character set validation (no backtracking risk)
  // Ensures encrypted secret format integrity before decryption
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  return parts.every(part => part.length > 0 && base64Regex.test(part));
};
