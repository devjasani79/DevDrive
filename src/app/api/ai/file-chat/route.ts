// src/app/api/ai/file-chat/route.ts
//
// PRODUCTION FIX:
// - Gemini model changed from gemini-2.0-flash-lite to gemini-1.5-flash
//   gemini-2.0-flash-lite does NOT support vision in the current API
//   gemini-1.5-flash is free tier, supports images/PDFs natively
// - Added fallback: if Gemini fails for any reason, falls back to Groq
//   with a text description of what the image contains (from metadata)

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

// gemini-1.5-flash: free tier, supports vision (images, PDFs as images)
// gemini-2.0-flash: also free, also supports vision — either works
// Do NOT use gemini-2.0-flash-lite — no vision support
const GEMINI_MODEL  = process.env.GEMINI_IMAGE_MODEL || 'gemini-1.5-flash';
const GROQ_MODEL    = process.env.GROQ_FILE_TEXT_MODEL || 'llama-3.3-70b-versatile';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildPrompt(file: FileItem, hasContent: boolean): string {
  return `You are an AI assistant helping a user understand a file in their GoogleDevDrive cloud storage.

FILE:
- Name: ${file.name}
- Type: ${file.mimeType || 'unknown'}
- Size: ${Math.round(file.size / 1024)}KB
- Uploaded: ${new Date(file.$createdAt).toLocaleDateString()}
- Location: ${file.parentId ? 'Inside a folder' : 'Root (My Drive)'}

${hasContent
    ? 'You have been given the actual file content. Use it to answer specifically and accurately.'
    : 'You do NOT have file content — only metadata. Be honest about this.'
  }

Answer clearly and concisely. If you have file content, use it.`;
}

function makeStream(source: AsyncIterable<string>) {
  return new ReadableStream({
    async start(controller) {
      for await (const text of source) {
        if (text) controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();
    },
  });
}

async function handleImageWithGemini(
  systemPrompt: string,
  message: string,
  imageData: { data: string; mimeType: string },
  history: { role: string; parts: string }[],
  extraHeaders: HeadersInit
): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
  });

  const historyText = history
    .slice(-4)
    .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.parts}`)
    .join('\n');

  const result = await model.generateContentStream([
    {
      text: `${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}Question: ${message}`,
    },
    {
      inlineData: {
        data: imageData.data,
        mimeType: imageData.mimeType,
      },
    },
  ]);

  const stream = makeStream((async function* () {
    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  })());

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-AI-Provider': 'gemini',
      'X-AI-Model': GEMINI_MODEL,
      ...extraHeaders,
    },
  });
}

async function handleTextWithGroq(
  systemPrompt: string,
  message: string,
  fileContent: any,
  history: { role: string; parts: string }[],
  extraHeaders: HeadersInit
): Promise<Response> {
  let userText = message;

  if (fileContent?.type === 'text' && fileContent.data?.trim()) {
    userText = `FILE CONTENT:\n\`\`\`\n${fileContent.data.slice(0, 8000)}\n\`\`\`\n\nQUESTION: ${message}`;
  } else if (fileContent?.type === 'none' && fileContent.reason) {
    userText = `NOTE: ${fileContent.reason}\n\nQUESTION: ${message}`;
  }

  const result = await groq.chat.completions.create({
    model: GROQ_MODEL,
    stream: true,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({
        role: h.role === 'user' ? 'user' as const : 'assistant' as const,
        content: h.parts,
      })),
      { role: 'user', content: userText },
    ],
  });

  const stream = makeStream((async function* () {
    for await (const chunk of result) {
      yield chunk.choices[0]?.delta?.content || '';
    }
  })());

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-AI-Provider': 'groq',
      'X-AI-Model': GROQ_MODEL,
      ...extraHeaders,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not set in environment variables' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message, file, fileContent, history = [] } = await request.json();

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const limiter = rateLimit(`ai:file-chat:${file?.userId || getClientIp(request)}`, {
      limit: AI_FILE_CHAT_LIMIT,
      windowMs: AI_RATE_LIMIT_WINDOW_MS,
    });
    if (!limiter.allowed) return rateLimitResponse(limiter);

    const rlHeaders    = rateLimitHeaders(limiter);
    const hasContent   = !!fileContent && fileContent.type !== 'none';
    const isImageData  = fileContent?.type === 'image' && !!fileContent.data;
    const systemPrompt = buildPrompt(file, hasContent);

    // ── Image: try Gemini, fallback to Groq with metadata ────────────────────
    if (isImageData) {
      try {
        return await handleImageWithGemini(systemPrompt, message, fileContent, history, rlHeaders);
      } catch (geminiErr: any) {
        console.error('[file-chat] Gemini failed, falling back to Groq:', geminiErr?.message);
        // Fallback: let Groq answer from metadata only
        const fallbackContent = {
          type: 'none',
          mimeType: fileContent.mimeType,
          reason: `Image analysis via Gemini failed (${geminiErr?.message || 'unknown error'}). Answering from file metadata only.`,
        };
        return await handleTextWithGroq(systemPrompt, message, fallbackContent, history, rlHeaders);
      }
    }

    // ── Text / PDF content or metadata only ──────────────────────────────────
    return await handleTextWithGroq(systemPrompt, message, fileContent, history, rlHeaders);

  } catch (error: any) {
    console.error('[file-chat] Unhandled error:', error?.message, error?.status);

    if (error?.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit reached — wait a moment and try again.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: error?.message || 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}