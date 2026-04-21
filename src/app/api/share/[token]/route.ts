import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/share-token';

// ── Next.js 15+ requires params to be awaited ───────────────────────────────────
type RouteContext = { params: Promise<{ token: string }> };

// ── GET /api/share/[token] ──────────────────────────────────────────────────────
// Validates HMAC-signed token and returns file metadata
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  // verifyToken checks HMAC signature AND expiry
  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: 'This share link is invalid or has expired.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success:  true,
    data: {
      fileName:     payload.fileName,
      mimeType:     payload.mimeType,
      bucketFileId: payload.bucketFileId,
      fileId:       payload.fileId,
      userId:       payload.userId,
      expiresAt:    payload.expiresAt,
    },
  });
}