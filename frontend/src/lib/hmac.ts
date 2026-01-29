const API_HMAC_SECRET = process.env.NEXT_PUBLIC_API_HMAC_SECRET || '';

/**
 * Genera una firma HMAC-SHA256 para autenticar requests al backend.
 * Formato: t=<timestamp>,s=<signature>
 */
export async function generateRequestSignature(
  method: string,
  path: string
): Promise<string> {
  const timestamp = Date.now();
  const message = `${timestamp}${method}${path}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(API_HMAC_SECRET);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return `t=${timestamp},s=${signature}`;
}
