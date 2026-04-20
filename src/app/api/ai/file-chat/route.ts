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

const GROQ_FILE_TEXT_MODEL = process.env.GROQ_FILE_TEXT_MODEL || process.env.GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile';
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
const IMAGE_TEST_MODE = process.env.AI_IMAGE_TEST_MODE === 'true';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildPrompt(file: FileItem, hasContent: boolean): string {
  return `You are an AI assistant helping a user understand a specific file stored in their GoogleDevDrive cloud storage.

FILE DETAILS:
- Name: ${file.name}
- Type: ${file.type}
- MIME type: ${file.mimeType || 'unknown'}
- Size: ${Math.round(file.size / 1024)}KB
- Uploaded: ${new Date(file.$createdAt).toLocaleDateString()}
- Modified: ${new Date(file.$updatedAt).toLocaleDateString()}
- Location: ${file.parentId ? 'Inside a folder' : 'Root (My Drive)'}

${hasContent
  ? 'You have been given the actual file content. Use it to answer questions accurately.'
  : 'You do NOT have access to the file contents — only metadata above. If asked about contents, say so honestly.'
}

Think step by step:
1. What is the user asking about this file?
2. What information do you have available (content or metadata)?
3. Give a clear, direct answer. Be concise.`;
}

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not set' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message, file, fileContent, history } = await request.json();

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const limiter = rateLimit(`ai:file-chat:${file?.userId || getClientIp(request)}`, {
      limit: AI_FILE_CHAT_LIMIT,
      windowMs: AI_RATE_LIMIT_WINDOW_MS,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const hasTextContent = fileContent?.type === 'text' && !!fileContent.data?.trim();
    const hasImageContent = fileContent?.type === 'image' && !!fileContent.data;
    const hasContent = hasTextContent || hasImageContent;
    const model = GROQ_FILE_TEXT_MODEL;

    // Build user message — different structure for images
    if (hasImageContent && IMAGE_TEST_MODE) {
      return createPlainTextResponse(
        `Image test mode is enabled. I received ${file.name} (${fileContent.mimeType}, ${Math.round(fileContent.data.length * 0.75 / 1024)}KB as base64 data). Real image understanding is disabled in this mode, so no Gemini tokens were used.`,
        {
          ...rateLimitHeaders(limiter),
          'X-AI-Provider': 'local-test',
          'X-AI-Model': 'image-test-mode',
        },
      );
    }

    if (hasImageContent) {
      if (!process.env.GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set for image chat' }), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }

      return await createGeminiVisionResponse(
        buildPrompt(file, hasContent),
        message,
        { data: fileContent.data, mimeType: fileContent.mimeType },
        history,
        rateLimitHeaders(limiter),
      );
    }

    const stream = await createGroqTextFileStream(
      buildPrompt(file, hasContent),
      message,
      fileContent,
      history,
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-AI-Provider': 'groq',
        'X-AI-Model': model,
        ...rateLimitHeaders(limiter),
      },
    });

  } catch (error: any) {
    console.error('[File Chat Error]', error?.message);

    if (error?.status === 429) {
      return new Response(JSON.stringify({
        error: 'AI provider quota or rate limit reached. Wait a moment and try again, or switch/enable another vision model.',
      }), {
        status: 429, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (error?.status === 429) {
      return new Response(JSON.stringify({ error: 'Too many requests — wait a moment and try again.' }), {
        status: 429, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: error?.message || 'Something went wrong' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

function streamText(iterator: AsyncIterable<string>) {
  return new ReadableStream({
    async start(controller) {
      for await (const text of iterator) {
        if (text) controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();
    },
  });
}

function createPlainTextResponse(text: string, headers: HeadersInit = {}) {
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...headers,
    },
  });
}

async function createGeminiVisionResponse(
  systemPrompt: string,
  message: string,
  fileContent: { data: string; mimeType: string },
  history: any[] = [],
  headers: HeadersInit = {},
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: GEMINI_IMAGE_MODEL,
    systemInstruction: systemPrompt,
  });

  const historyText = history
    .slice(-8)
    .map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.parts}`)
    .join('\n');

  const result = await model.generateContentStream([
    {
      text: `${historyText ? `RECENT CHAT:\n${historyText}\n\n` : ''}USER QUESTION: ${message}`,
    },
    {
      inlineData: {
        data: fileContent.data,
        mimeType: fileContent.mimeType,
      },
    },
  ]);

  const stream = streamText((async function* () {
    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  })());

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-AI-Provider': 'gemini',
      'X-AI-Model': GEMINI_IMAGE_MODEL,
      ...headers,
    },
  });
}

async function createGroqTextFileStream(
  systemPrompt: string,
  message: string,
  fileContent: any,
  history: any[] = [],
) {
  let userText = message;
  if (fileContent?.type === 'text' && fileContent.data?.trim()) {
    userText = `FILE CONTENT:\n\`\`\`\n${fileContent.data.slice(0, 8000)}\n\`\`\`\n\nUSER QUESTION: ${message}`;
  } else if (fileContent?.type === 'none' && fileContent.reason) {
    userText = `FILE CONTENT STATUS: ${fileContent.reason}${fileContent.detail ? `\nDETAIL: ${fileContent.detail}` : ''}\n\nUSER QUESTION: ${message}`;
  }

  const result = await groq.chat.completions.create({
    model: GROQ_FILE_TEXT_MODEL,
    stream: true,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map((h: any) => ({
        role: h.role === 'user' ? 'user' as const : 'assistant' as const,
        content: h.parts,
      })),
      { role: 'user', content: userText },
    ],
  });

  return streamText((async function* () {
    for await (const chunk of result) {
      yield chunk.choices[0]?.delta?.content || '';
    }
  })());
}
