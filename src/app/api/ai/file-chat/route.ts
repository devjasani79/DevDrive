import Groq from 'groq-sdk';
import { NextRequest } from 'next/server';
import { FileItem } from '@/types/files';

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

    const hasContent = !!fileContent;
    const isImage    = fileContent?.type === 'image';
    const model      = isImage ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';

    // Build user message — different structure for images
    let userContent: any;
    if (isImage && fileContent) {
      userContent = [
        {
          type: 'image_url',
          image_url: { url: `data:${fileContent.mimeType};base64,${fileContent.data}` },
        },
        { type: 'text', text: message },
      ];
    } else if (fileContent?.type === 'text') {
      userContent = `FILE CONTENT:\n\`\`\`\n${fileContent.data.slice(0, 8000)}\n\`\`\`\n\nUSER QUESTION: ${message}`;
    } else {
      userContent = message;
    }

    const result = await groq.chat.completions.create({
      model,
      stream: true,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: buildPrompt(file, hasContent) },
        ...history.map((h: any) => ({
          role: h.role === 'user' ? 'user' as const : 'assistant' as const,
          content: h.parts,
        })),
        { role: 'user', content: userContent },
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
    console.error('[File Chat Error]', error?.message);

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