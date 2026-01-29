import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Configurar cleanup automático después de cada test
afterEach(() => {
  cleanup();
});

const storage = new Map<string, string>();

const localStorageMock: Storage = {
  get length() {
    return storage.size;
  },
  clear() {
    storage.clear();
  },
  getItem(key: string) {
    return storage.has(key) ? storage.get(key) ?? null : null;
  },
  key(index: number) {
    return Array.from(storage.keys())[index] ?? null;
  },
  removeItem(key: string) {
    storage.delete(key);
  },
  setItem(key: string, value: string) {
    storage.set(key, String(value));
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});
