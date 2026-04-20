// src/app/api/ai/file-proxy/route.ts
import { NextRequest } from 'next/server';
import {
  AI_FILE_PROXY_LIMIT,
  AI_RATE_LIMIT_WINDOW_MS,
  getClientIp,
  rateLimit,
  rateLimitHeaders,
  rateLimitResponse,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_HOST_URL!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const BUCKET_ID  = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!;
const API_KEY    = process.env.APPWRITE_API_KEY!;

const MAX_BYTES      = 5 * 1024 * 1024;
const MAX_TEXT_CHARS = 12000;

export async function POST(request: NextRequest) {
  try {
    const { bucketFileId, mimeType, userId } = await request.json();

    if (!bucketFileId || !mimeType) {
      return Response.json({ error: 'bucketFileId and mimeType required' }, { status: 400 });
    }

    const limiter = rateLimit(`ai:file-proxy:${userId || getClientIp(request)}`, {
      limit: AI_FILE_PROXY_LIMIT,
      windowMs: AI_RATE_LIMIT_WINDOW_MS,
    });
    if (!limiter.allowed) return rateLimitResponse(limiter);

    if (!ENDPOINT || !PROJECT_ID || !BUCKET_ID || !API_KEY) {
      return Response.json({ error: 'Server not configured' }, { status: 500 });
    }

    // Fetch file from Appwrite server-side — API key bypasses CORS/cookie issues
    const fileUrl = `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${bucketFileId}/view?project=${PROJECT_ID}`;
    const res = await fetch(fileUrl, {
      headers: {
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': API_KEY,
      },
    });

    if (!res.ok) {
      console.error('[file-proxy] Appwrite fetch failed:', res.status);
      return Response.json(
        { type: 'none', mimeType, reason: `Could not fetch file from storage (${res.status})` },
        { headers: rateLimitHeaders(limiter) }
      );
    }

    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BYTES) {
      return Response.json(
        { type: 'none', mimeType, reason: 'File too large for AI analysis (max 5MB)' },
        { headers: rateLimitHeaders(limiter) }
      );
    }

    const isImage = mimeType.startsWith('image/');
    const isPDF   = mimeType === 'application/pdf';
    const isText  = mimeType.startsWith('text/') || mimeType === 'application/json';

    // ── Images → base64 for Gemini vision ────────────────────────────────────
    if (isImage) {
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > MAX_BYTES) {
        return Response.json(
          { type: 'none', mimeType, reason: 'Image too large (max 5MB)' },
          { headers: rateLimitHeaders(limiter) }
        );
      }
      const base64 = Buffer.from(buffer).toString('base64');
      return Response.json({ type: 'image', data: base64, mimeType }, { headers: rateLimitHeaders(limiter) });
    }

    // ── PDFs → text via pdf-parse v2 ──────────────────────────────────────────
    // pdf-parse v2 API: named export { PDFParse }, constructor takes { data: Buffer }
    if (isPDF) {
      try {
        const { PDFParse } = await import('pdf-parse');
        const buffer = Buffer.from(await res.arrayBuffer());

        // Validate PDF header bytes
        if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
          return Response.json(
            { type: 'none', mimeType, reason: 'File does not appear to be a valid PDF' },
            { headers: rateLimitHeaders(limiter) }
          );
        }

        const parser = new PDFParse({ data: buffer });
        let parsed;
        try {
          parsed = await parser.getText();
        } finally {
          // Always destroy the parser to free memory
          await parser.destroy();
        }

        const text = (parsed.text ?? '').trim();

        if (!text) {
          return Response.json(
            {
              type: 'none',
              mimeType,
              pages: parsed.total ?? 0,
              reason: 'No selectable text in this PDF — it may be scanned or image-based.',
            },
            { headers: rateLimitHeaders(limiter) }
          );
        }

        return Response.json(
          { type: 'text', data: text.slice(0, MAX_TEXT_CHARS), mimeType, pages: parsed.total ?? 0 },
          { headers: rateLimitHeaders(limiter) }
        );
      } catch (err: any) {
        console.error('[file-proxy] PDF parse error:', err?.message ?? err);
        return Response.json(
          { type: 'none', mimeType, reason: 'PDF parsing failed — file may be corrupted or encrypted.' },
          { headers: rateLimitHeaders(limiter) }
        );
      }
    }

    // ── Plain text / JSON / CSV ───────────────────────────────────────────────
    if (isText) {
      const text = await res.text();
      return Response.json(
        { type: 'text', data: text.slice(0, MAX_TEXT_CHARS), mimeType },
        { headers: rateLimitHeaders(limiter) }
      );
    }

    // Unsupported — AI answers from metadata only
    return Response.json({ type: 'none', mimeType }, { headers: rateLimitHeaders(limiter) });

  } catch (error: any) {
    console.error('[file-proxy] Unhandled error:', error?.message);
    return Response.json({ error: error?.message || 'Proxy failed' }, { status: 500 });
  }
}