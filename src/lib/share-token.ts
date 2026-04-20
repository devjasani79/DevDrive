// Shared token utilities (client & server safe)
import { createHmac } from 'crypto';

export interface ShareToken {
  fileId: string;
  bucketFileId: string;
  fileName: string;
  mimeType: string;
  expiresAt: number;
  userId: string;
}

const SHARE_SECRET = process.env.SHARE_SECRET || 'dev-secret-change-in-production';

export function signToken(payload: ShareToken): string {
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString('base64url');
  const sig = createHmac('sha256', SHARE_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyToken(token: string): ShareToken | null {
  try {
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const expectedSig = createHmac('sha256', SHARE_SECRET).update(encoded).digest('base64url');
    // Constant-time comparison to prevent timing attacks
    if (sig.length !== expectedSig.length) return null;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    if (diff !== 0) return null;
    const payload: ShareToken = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}
