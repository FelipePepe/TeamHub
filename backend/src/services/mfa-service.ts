import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync } from 'crypto';
import { config } from '../config/env';
import { BUSINESS_RULES } from '../shared/constants/business-rules';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const deriveKey = () => scryptSync(config.MFA_ENCRYPTION_KEY, 'mfa-salt', 32);

export const encryptMfaSecret = (plainSecret: string): string => {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainSecret, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: iv:authTag:encryptedData (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
};

export const decryptMfaSecret = (encryptedSecret: string): string => {
  const parts = encryptedSecret.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret format');
  }
  const [ivB64, authTagB64, dataB64] = parts;
  const key = deriveKey();
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(dataB64, 'base64');
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
};

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

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

const fromBase32 = (input: string): Buffer => {
  const normalized = input.replace(/=+$/g, '').toUpperCase();
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

export const generateMfaSecret = () => {
  const buffer = randomBytes(20);
  return toBase32(buffer);
};

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

export const verifyTotpCode = (secret: string, code: string, timestampMs = Date.now()) => {
  const { totpStepSeconds, totpWindow } = BUSINESS_RULES.auth;
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
