// src/app/api/ai/file-proxy/route.ts
//
// This route fetches file content from Appwrite on the SERVER side.
// We can't fetch Appwrite storage URLs directly from the browser because
// Appwrite requires the session cookie to be sent, and cross-origin fetch
// from the client drops the cookie — causing a 401 or empty response.
//
// Flow:
//   Browser → POST /api/ai/file-proxy { bucketFileId, mimeType }
//           → Server fetches from Appwrite using the API key
//           → Returns base64 (images) or text (text files / PDFs)

import { NextRequest } from 'next/server';
import { pathToFileURL } from 'url';
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

// Max size we'll process — 5MB is plenty for docs/images
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_CHARS = 12000;
const PDF_WORKER_URL = pathToFileURL(
  `${process.cwd()}/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs`,
).href;

function extractionErrorResponse(mimeType: string, reason: string, error?: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  console.error('[file-proxy] extraction failed:', reason, message);

  return Response.json({
    type: 'none',
    mimeType,
    reason,
    ...(process.env.NODE_ENV === 'development' && message ? { detail: message } : {}),
  });
}

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

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    if (!ENDPOINT || !PROJECT_ID || !BUCKET_ID || !API_KEY) {
      return Response.json({ error: 'Server not configured' }, { status: 500 });
    }

    // Build Appwrite view URL
    const fileUrl = `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${bucketFileId}/view?project=${PROJECT_ID}`;

    // Fetch from Appwrite server-side using the API key
    const res = await fetch(fileUrl, {
      headers: {
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key':     API_KEY,
      },
    });

    if (!res.ok) {
      return Response.json({ error: `Appwrite returned ${res.status}` }, { status: 502 });
    }

    // Check content size before reading
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BYTES) {
  // Don't error — just return metadata-only so AI can still help
      return Response.json(
        { type: 'none', mimeType, reason: 'File too large for content analysis' },
        { headers: rateLimitHeaders(limiter) },
      );
    }

    const isImage = mimeType.startsWith('image/');
    const isPDF   = mimeType === 'application/pdf';
    const isText  = mimeType.startsWith('text/') || mimeType === 'application/json';

    if (isImage) {
      // Return as base64 for vision model
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return Response.json({ type: 'image', data: base64, mimeType }, { headers: rateLimitHeaders(limiter) });
    }

    if (isPDF) {
      // Extract text from PDF using pdf-parse
      // If pdf-parse isn't installed, we fall back to telling AI it's a PDF
      try {
        const { PDFParse } = await import('pdf-parse');
        PDFParse.setWorker(PDF_WORKER_URL);
        const buffer = Buffer.from(await res.arrayBuffer());

        if (buffer.subarray(0, 5).toString('utf8') !== '%PDF-') {
          return extractionErrorResponse(
            mimeType,
            'Downloaded file is not a valid PDF',
            new Error(`content-type=${res.headers.get('content-type') || 'unknown'}, first-bytes=${buffer.subarray(0, 32).toString('utf8')}`),
          );
        }

        const parser = new PDFParse({ data: buffer });

        try {
          const parsed = await parser.getText();
          const text = parsed.text.trim().slice(0, MAX_TEXT_CHARS);

          if (!text) {
            return Response.json(
              {
                type: 'none',
                mimeType,
                pages: parsed.total,
                reason: 'No selectable text found in this PDF. It may be scanned or image-based.',
              },
              { headers: rateLimitHeaders(limiter) },
            );
          }

          return Response.json({ type: 'text', data: text, mimeType, pages: parsed.total }, { headers: rateLimitHeaders(limiter) });
        } finally {
          await parser.destroy();
        }
      } catch (error) {
        // pdf-parse not installed — return metadata hint
        return extractionErrorResponse(mimeType, 'PDF text extraction failed', error);
      }
    }

    if (isText) {
      const text = await res.text();
      return Response.json({ type: 'text', data: text.slice(0, MAX_TEXT_CHARS), mimeType }, { headers: rateLimitHeaders(limiter) });
    }

    // Unsupported type — return nothing so AI falls back to metadata
    return Response.json({ type: 'none', mimeType }, { headers: rateLimitHeaders(limiter) });

  } catch (error: any) {
    console.error('[file-proxy]', error?.message);
    return Response.json({ error: error?.message || 'Proxy failed' }, { status: 500 });
  }
}
