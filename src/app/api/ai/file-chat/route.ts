import Groq from 'groq-sdk';
import { extractText } from 'unpdf';
import { NextRequest } from 'next/server';
import { FileItem } from '@/types/files';
import {
  AI_FILE_CHAT_LIMIT,
  AI_RATE_LIMIT_WINDOW_MS,
  getClientIp,
  rateLimit,
  rateLimitHeaders,
  rateLimitResponse,
} from '@/lib/rate-limit';
import { checkDailyQuota, incrementDailyQuota } from '@/lib/daily-quota';


const GROQ_MODEL = 'llama-3.3-70b-versatile';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const APPWRITE_HOST    = process.env.NEXT_PUBLIC_APPWRITE_HOST_URL!;
const APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const APPWRITE_BUCKET  = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!;
const APPWRITE_KEY     = process.env.APPWRITE_API_KEY!;

type ExtractResult =
  | { provider: 'groq'; kind: 'text'; text: string }
  | { provider: 'groq'; kind: 'none'; fileName: string; mimeType: string; size: number };

async function extractFileContent(file: FileItem): Promise<ExtractResult> {
  if (!file.bucketFileId) {
    return { provider: 'groq', kind: 'none', fileName: file.name, mimeType: file.mimeType || '', size: file.size };
  }

  try {
    const url =
      `${APPWRITE_HOST}/storage/buckets/${APPWRITE_BUCKET}` +
      `/files/${file.bucketFileId}/download?project=${APPWRITE_PROJECT}`;

    const res = await fetch(url, {
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT,
        'X-Appwrite-Key':     APPWRITE_KEY,
      },
    });

    if (!res.ok) {
      console.error('[file-chat] Appwrite download failed:', res.status, res.statusText, url);
      return { provider: 'groq', kind: 'none', fileName: file.name, mimeType: file.mimeType || '', size: file.size };
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const mime = file.mimeType || '';

  if (mime === 'application/pdf') {
      try {
        const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
        return { provider: 'groq', kind: 'text', text: text.slice(0, 20000) };
      } catch (err) {
        console.error('[file-chat] PDF extract error:', err);
        return { provider: 'groq', kind: 'none', fileName: file.name, mimeType: mime, size: file.size };
      }
    }

    if (mime.startsWith('image/')) {
      return { provider: 'groq', kind: 'none', fileName: file.name, mimeType: mime, size: file.size };
    }

    if (
      mime.startsWith('text/') ||
      mime === 'application/json' ||
      mime === 'application/xml'
    ) {
      const text = buffer.toString('utf-8').slice(0, 20000);
      return { provider: 'groq', kind: 'text', text };
    }

    return { provider: 'groq', kind: 'none', fileName: file.name, mimeType: mime, size: file.size };

  } catch (err) {
    console.error('[file-chat] Extraction error:', err);
    return { provider: 'groq', kind: 'none', fileName: file.name, mimeType: file.mimeType || '', size: file.size };
  }
}

function makeStream(source: AsyncIterable<string>): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        for await (const chunk of source) {
          controller.enqueue(enc.encode(chunk));
        }
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { message, file, history = [] } = await request.json();

    if (!message || !file) {
      return Response.json({ error: 'Missing message or file' }, { status: 400 });
    }

    const limiter = rateLimit(`ai:${file.userId || getClientIp(request)}`, {
      limit:    AI_FILE_CHAT_LIMIT,
      windowMs: AI_RATE_LIMIT_WINDOW_MS,
    });
    if (!limiter.allowed) return rateLimitResponse(limiter);

    const extracted = await extractFileContent(file);

const dailyLimits: Record<string, number> = { groq: 1000 };
    const quota = checkDailyQuota(extracted.provider, dailyLimits[extracted.provider], 0.85);
    if (!quota.allowed) {
      return Response.json(
        {
          error:          `Daily AI limit reached. Resets at ${quota.resetsAt}`,
          quotaExhausted: true,
          resetsAt:       quota.resetsAt,
        },
        { status: 429, headers: rateLimitHeaders(limiter) }
      );
    }

    const streamHeaders = {
      ...rateLimitHeaders(limiter),
      'Content-Type': 'text/plain; charset=utf-8',
    };

    // ── GEMINI path: images + PDFs ─────────────────────────────────────────────
    // if (extracted.provider === 'gemini') {
    //   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    //   const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    //   const label = extracted.kind === 'pdf' ? 'PDF document' : 'image';
    //   const systemPrompt =
    //     `You are an expert file analyst. The user has opened a ${label} named "${file.name}". ` +
    //     `Carefully read and analyze ALL content in this ${label}. ` +
    //     `Give detailed, specific answers based on what you actually see — not generic responses. ` +
    //     `When asked to summarize, cover all key points. When asked about specific details, be precise.`;

    //   const result = await model.generateContentStream([
    //     { text: `${systemPrompt}\n\nUser question: ${message}` },
    //     { inlineData: { data: extracted.base64, mimeType: extracted.mimeType } },
    //   ]);

    //   incrementDailyQuota('gemini');
    //   return new Response(
    //     makeStream((async function* () {
    //       for await (const chunk of result.stream) yield chunk.text();
    //     })()),
    //     { headers: streamHeaders }
    //   );
    // }

    // ── GROQ path: text files + metadata fallback ──────────────────────────────
    const systemMessage =
      extracted.kind === 'text'
        ? `You are an expert file analyst. The user has opened a file named "${file.name}" ` +
          `(${file.mimeType || 'unknown type'}, ${(file.size / 1024).toFixed(1)} KB).\n\n` +
          `COMPLETE FILE CONTENT:\n\`\`\`\n${extracted.text}\n\`\`\`\n\n` +
          `Answer ALL questions based on the actual content above. Be specific, detailed, and thorough. ` +
          `Quote relevant parts when helpful.`
        : `You are a helpful assistant. The user is viewing a file named "${extracted.fileName}" ` +
          `(type: ${extracted.mimeType || 'unknown'}, size: ${(extracted.size / 1024).toFixed(1)} KB).\n\n` +
          `This file type cannot be read directly. Tell the user what this file type typically contains, ` +
          `answer based on the metadata, and suggest they download it to view the full content.`;

    const groqHistory = (history as { role: string; parts: string }[]).map(m => ({
      role:    (m.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.parts,
    }));

    const completion = await groq.chat.completions.create({
      model:    GROQ_MODEL,
      stream:   true,
      messages: [
        { role: 'system',  content: systemMessage },
        ...groqHistory,
        { role: 'user',    content: message },
      ],
    });

    incrementDailyQuota('groq');

    return new Response(
      makeStream((async function* () {
        for await (const chunk of completion) {
          yield chunk.choices[0]?.delta?.content || '';
        }
      })()),
      { headers: streamHeaders }
    );

  } catch (error: any) {
    console.error('[file-chat] Unhandled error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}