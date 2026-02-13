import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRequestSignature } from '../hmac';

describe('lib/hmac', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', {
      subtle: {
        digest: vi.fn(async () => new Uint8Array([1, 2, 3]).buffer),
        importKey: vi.fn(async () => ({})),
        sign: vi.fn(async () => new Uint8Array([4, 5, 6]).buffer),
      },
    });
  });

  it('genera firma en formato esperado', async () => {
    const signature = await generateRequestSignature('GET', '/api/test', 'body');
    expect(signature).toMatch(/^t=\d+,s=[0-9a-f]+$/);
  });
});
