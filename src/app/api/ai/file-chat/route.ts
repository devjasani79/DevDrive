// src/app/api/ai/file-chat/route.ts
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

// ── Model config ─────────────────────────────────────────────────────────────
// gemini-2.0-flash supports vision and is on the free tier
// gemini-2.0-flash-lite is cheaper but less accurate — use flash for images
const GROQ_TEXT_MODEL   = process.env.GROQ_FILE_TEXT_MODEL || 'llama-3.3-70b-versatile';
const GEMINI_VISION_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildPrompt(file: FileItem, hasContent: boolean): string {
  return `You are an AI assistant helping a user understand a specific file in their GoogleDevDrive cloud storage.

FILE DETAILS:
- Name: ${file.name}
- Type: ${file.type}
- MIME type: ${file.mimeType || 'unknown'}
- Size: ${Math.round(file.size / 1024)}KB
- Uploaded: ${new Date(file.$createdAt).toLocaleDateString()}
- Modified: ${new Date(file.$updatedAt).toLocaleDateString()}
- Location: ${file.parentId ? 'Inside a folder' : 'Root (My Drive)'}

${hasContent
    ? 'You have been given the actual file content. Use it to answer questions accurately and specifically.'
    : 'You do NOT have access to the file contents — only the metadata above. Be honest about this limitation.'
  }

Think step by step:
1. What is the user asking about this file?
2. What information do you have (content or metadata only)?
3. Give a clear, direct, specific answer.`;
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

// ── Gemini vision handler ─────────────────────────────────────────────────────
async function geminiVisionResponse(
  systemPrompt: string,
  message: string,
  imageData: { data: string; mimeType: string },
  history: { role: string; parts: string }[],
  extraHeaders: HeadersInit
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set — add it to your .env.local and Vercel env vars');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: GEMINI_VISION_MODEL,
    systemInstruction: systemPrompt,
  });

  // Include recent history as text context
  const historyText = history
    .slice(-6)
    .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.parts}`)
    .join('\n');

  const result = await model.generateContentStream([
    {
      text: `${historyText ? `RECENT CONVERSATION:\n${historyText}\n\n` : ''}USER QUESTION: ${message}`,
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
      'X-AI-Model': GEMINI_VISION_MODEL,
      ...extraHeaders,
    },
  });
}

// ── Groq text handler ─────────────────────────────────────────────────────────
async function groqTextResponse(
  systemPrompt: string,
  message: string,
  fileContent: any,
  history: { role: string; parts: string }[],
  extraHeaders: HeadersInit
) {
  let userText = message;

  if (fileContent?.type === 'text' && fileContent.data?.trim()) {
    userText = `FILE CONTENT:\n\`\`\`\n${fileContent.data.slice(0, 8000)}\n\`\`\`\n\nUSER QUESTION: ${message}`;
  } else if (fileContent?.type === 'none' && fileContent.reason) {
    userText = `NOTE: ${fileContent.reason}\n\nUSER QUESTION: ${message}`;
  }

  const result = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
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
      'X-AI-Model': GROQ_TEXT_MODEL,
      ...extraHeaders,
    },
  });
}

// ── Main route ────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not set' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message, file, fileContent, history = [] } = await request.json();

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const limiter = rateLimit(`ai:file-chat:${file?.userId || getClientIp(request)}`, {
      limit: AI_FILE_CHAT_LIMIT,
      windowMs: AI_RATE_LIMIT_WINDOW_MS,
    });
    if (!limiter.allowed) return rateLimitResponse(limiter);

    const hasContent = !!fileContent && fileContent.type !== 'none';
    const isImage    = fileContent?.type === 'image' && !!fileContent.data;
    const rlHeaders  = rateLimitHeaders(limiter);

    const systemPrompt = buildPrompt(file, hasContent);

    if (isImage) {
      return await geminiVisionResponse(systemPrompt, message, fileContent, history, rlHeaders);
    }

    return await groqTextResponse(systemPrompt, message, fileContent, history, rlHeaders);

  } catch (error: any) {
    console.error('[file-chat] Error:', error?.message, error?.status);

    if (error?.status === 429) {
      return new Response(JSON.stringify({
        error: 'AI rate limit reached — wait a moment and try again.',
      }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    // Gemini API key missing or invalid
    if (error?.message?.includes('GEMINI_API_KEY')) {
      return new Response(JSON.stringify({
        error: 'Image analysis requires a Gemini API key. Add GEMINI_API_KEY to your environment variables.',
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      error: error?.message || 'Something went wrong',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}