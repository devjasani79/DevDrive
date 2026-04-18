
import Groq from 'groq-sdk';
import { NextRequest } from 'next/server';
import { FileItem } from '@/types/files';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildSystemPrompt(files: FileItem[]): string {
  const totalSize  = files.reduce((sum, f) => sum + f.size, 0);
  const totalFiles = files.filter(f => f.type === 'file').length;
  const folders    = files.filter(f => f.type === 'folder').length;

  const fileList = files
    .slice(0, 40)
    .map(f => `• ${f.name} | ${f.type} | ${Math.round(f.size / 1024)}KB | ${new Date(f.$createdAt).toLocaleDateString()}`)
    .join('\n');

  return `You are an AI Drive Assistant inside GoogleDevDrive, a personal cloud storage app.

DRIVE SUMMARY:
- ${files.length} total items: ${totalFiles} files, ${folders} folders
- Storage used: ${(totalSize / (1024 * 1024)).toFixed(2)} MB

FILES:
${fileList || 'No files uploaded yet.'}

INSTRUCTIONS:
Think step by step before answering:
1. What is the user asking? (find a file, storage stats, general help?)
2. Which files from the list above are relevant?
3. Give a clear, direct answer using only files that exist in the list above.

RULES:
- Never make up filenames — only reference files from the list
- If asked about file contents (what's inside a PDF etc), say you can only see metadata not contents
- Use bullet points when listing multiple files
- Be concise and friendly`;
}

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message, files, history } = await request.json();

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      stream: true,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: buildSystemPrompt(files) },
        ...history.map((h: any) => ({
          role: h.role === 'user' ? 'user' as const : 'assistant' as const,
          content: h.parts,
        })),
        { role: 'user', content: message },
      ],
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) controller.enqueue(new TextEncoder().encode(text));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error: any) {
    console.error('[Groq Error]', error?.message);

    if (error?.status === 429) {
      return new Response(JSON.stringify({ error: 'Too many requests — wait a few seconds and try again.' }), {
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

