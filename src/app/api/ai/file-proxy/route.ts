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

const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_HOST_URL!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const BUCKET_ID  = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!;
const API_KEY    = process.env.APPWRITE_API_KEY!;

// Max size we'll process — 10MB is plenty for docs/images
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const { bucketFileId, mimeType } = await request.json();

    if (!bucketFileId || !mimeType) {
      return Response.json({ error: 'bucketFileId and mimeType required' }, { status: 400 });
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
    if (contentLength && parseInt(contentLength) > MAX_BYTES) {
      return Response.json({ error: 'File too large to analyze (max 10MB)' }, { status: 413 });
    }

    const isImage = mimeType.startsWith('image/');
    const isPDF   = mimeType === 'application/pdf';
    const isText  = mimeType.startsWith('text/') || mimeType === 'application/json';

    if (isImage) {
      // Return as base64 for vision model
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return Response.json({ type: 'image', data: base64, mimeType });
    }

    if (isPDF) {
      // Extract text from PDF using pdf-parse
      // If pdf-parse isn't installed, we fall back to telling AI it's a PDF
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const buffer   = Buffer.from(await res.arrayBuffer());
        const parsed   = await pdfParse(buffer);
        const text     = parsed.text.slice(0, 12000); // cap at 12k chars
        return Response.json({ type: 'text', data: text, mimeType, pages: parsed.numpages });
      } catch {
        // pdf-parse not installed — return metadata hint
        return Response.json({
          type: 'text',
          data: `[This is a PDF document named "${bucketFileId}". pdf-parse library is not installed so text extraction is unavailable. You can only answer based on file metadata.]`,
          mimeType,
        });
      }
    }

    if (isText) {
      const text = await res.text();
      return Response.json({ type: 'text', data: text.slice(0, 12000), mimeType });
    }

    // Unsupported type — return nothing so AI falls back to metadata
    return Response.json({ type: 'none', mimeType });

  } catch (error: any) {
    console.error('[file-proxy]', error?.message);
    return Response.json({ error: error?.message || 'Proxy failed' }, { status: 500 });
  }
}