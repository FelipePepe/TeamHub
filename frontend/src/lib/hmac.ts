const API_HMAC_SECRET = process.env.NEXT_PUBLIC_API_HMAC_SECRET || '';

/**
 * Genera un hash SHA-256 del contenido proporcionado.
 */
async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Genera una firma HMAC-SHA256 para autenticar requests al backend.
 * Incluye hash del body en la firma para integridad.
 * Formato: t=<timestamp>,s=<signature>
 */
export async function generateRequestSignature(
  method: string,
  path: string,
  body?: string
): Promise<string> {
  const timestamp = Date.now();
  const bodyHash = await sha256Hex(body || '');
  const message = `${timestamp}${method}${path}${bodyHash}`;

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
