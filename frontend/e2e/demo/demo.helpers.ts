import { Page } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Helpers para demos visuales realistas de TeamHub.
 * Simula el comportamiento de un usuario real.
 */

// Cargar variables de entorno
function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

// Cargar .env.e2e
const frontendRoot = path.resolve(__dirname, '../..');
loadEnvFile(path.join(frontendRoot, '.env.e2e'));

// ============ PAUSAS NATURALES ============

/** Pausa corta (como pensar) */
export async function think(page: Page) {
  await page.waitForTimeout(600);
}

/** Pausa normal (leer algo) */
export async function read(page: Page) {
  await page.waitForTimeout(1200);
}

/** Pausa larga (observar la pantalla) */
export async function observe(page: Page) {
  await page.waitForTimeout(2000);
}

/** Esperar a que cargue la página */
export async function waitForLoad(page: Page) {
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch {
    await page.waitForLoadState('domcontentloaded');
  }
  await read(page);
}

// ============ MOVIMIENTO DE CURSOR ============

/** Mover cursor suavemente a un elemento */
export async function moveTo(page: Page, selector: string) {
  const element = page.locator(selector).first();
  await element.waitFor({ state: 'visible', timeout: 10000 });
  const box = await element.boundingBox();
  if (box) {
    // Mover en pasos para que se vea el movimiento
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 });
  }
  await think(page);
}

/** Mover cursor y hacer click */
export async function moveAndClick(page: Page, selector: string | import('@playwright/test').Locator) {
  if (typeof selector === 'string') {
    await moveTo(page, selector);
    await page.click(selector);
  } else {
    // Es un Locator
    await selector.click();
  }
  await think(page);
}

/** Mover cursor y hacer hover (sin click) */
export async function moveAndHover(page: Page, selector: string) {
  await moveTo(page, selector);
  await read(page);
}

// ============ ESCRITURA NATURAL ============

/** Escribir texto como un humano (caracter por caracter) */
export async function typeNaturally(page: Page, selector: string, text: string) {
  await moveTo(page, selector);
  await page.click(selector);
  await think(page);

  // Limpiar campo primero
  await page.locator(selector).fill('');

  // Escribir caracter por caracter con velocidad variable
  for (const char of text) {
    await page.locator(selector).pressSequentially(char, {
      delay: 40 + Math.random() * 60 // 40-100ms por caracter
    });
  }
  await think(page);
}

/** Escribir texto rápido (para demos más cortas) */
export async function typeFast(page: Page, selector: string, text: string) {
  await moveTo(page, selector);
  await page.click(selector);
  await page.locator(selector).fill(text);
  await think(page);
}

// ============ SCROLL NATURAL ============

/** Scroll suave hacia un elemento */
export async function scrollTo(page: Page, selector: string) {
  const element = page.locator(selector).first();
  await element.scrollIntoViewIfNeeded();
  await read(page);
}

/** Scroll suave hacia abajo */
export async function scrollDown(page: Page, pixels = 300) {
  await page.mouse.wheel(0, pixels);
  await read(page);
}

// ============ NAVEGACIÓN ============

/** Click en item del sidebar */
export async function navigateTo(page: Page, menuText: string) {
  const menuItem = page.locator(`nav a:has-text("${menuText}")`).first();
  await menuItem.waitFor({ state: 'visible', timeout: 10000 });
  await moveAndClick(page, `nav a:has-text("${menuText}")`);
  await waitForLoad(page);
}

// ============ TOTP ============

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function fromBase32(input: string): Buffer {
  const normalized = input.replace(/=+$/g, '').toUpperCase();
  let bits = '';
  for (const char of normalized) {
    const index = BASE32.indexOf(char);
    if (index === -1) throw new Error('Invalid base32 character');
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }
  return Buffer.from(bytes);
}

/** Generar código TOTP */
export function generateTotpCode(secret: string, timestampMs = Date.now()): string {
  const counter = Math.floor(timestampMs / 30000);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const key = fromBase32(secret);
  const hmac = createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return code.toString().padStart(6, '0');
}

// ============ DATOS DE DEMO ============

// Credenciales se leen después de cargar .env.e2e
export function getDemoCredentials() {
  return {
    email: process.env.E2E_USER || '',
    password: process.env.E2E_PASSWORD || '',
    mfaSecret: process.env.E2E_MFA_SECRET || '',
  };
}
