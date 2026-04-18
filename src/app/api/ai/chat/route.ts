import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest } from 'next/server';
import { FileItem } from '@/types/files';

export async function POST(request: NextRequest) {
  try {
    const { message, files, history } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `You are an AI Drive Assistant for a Google Drive clone. Here is a summary of the user's files: ${JSON.stringify(
        files.slice(0, 50).map((file: FileItem) => ({
          name: file.name,
          type: file.type,
          mimeType: file.mimeType || 'unknown',
          sizeKB: Math.round(file.size / 1024),
          createdAt: file.$createdAt,
        }))
      )}. Answer the user's questions about their files or provide general assistance.`,
    });

    const chat = model.startChat({
      history: history.map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.parts }],
      })),
    });

    const result = await chat.sendMessageStream(message);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            controller.enqueue(new TextEncoder().encode(text));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}