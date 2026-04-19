import Groq from 'groq-sdk';
import { NextRequest } from 'next/server';
import { FileItem } from '@/types/files';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── RECURSIVE TREE BUILDER ──────────────────────────────────────────────────
// The old version only saw the root folder. This builds a full tree so the AI
// knows about every file in every subfolder — including path context.

interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  path: string;           // full path like "Projects/2024/report.pdf"
  mimeType?: string;
  sizeKB: number;
  uploaded: string;
  children?: TreeNode[];  // for folders
}

function buildTree(files: FileItem[], parentId: string | null = null, currentPath = ''): TreeNode[] {
  return files
    .filter(f => (f.parentId ?? null) === parentId)
    .map(f => {
      const nodePath = currentPath ? `${currentPath}/${f.name}` : f.name;
      if (f.type === 'folder') {
        return {
          name: f.name,
          type: 'folder' as const,
          path: nodePath,
          sizeKB: 0,
          uploaded: new Date(f.$createdAt).toLocaleDateString(),
          children: buildTree(files, f.$id, nodePath),
        };
      }
      return {
        name: f.name,
        type: 'file' as const,
        path: nodePath,
        mimeType: f.mimeType,
        sizeKB: Math.round(f.size / 1024),
        uploaded: new Date(f.$createdAt).toLocaleDateString(),
      };
    });
}

function flattenTree(nodes: TreeNode[]): { path: string; type: string; mimeType?: string; sizeKB: number; uploaded: string }[] {
  const result: ReturnType<typeof flattenTree> = [];
  for (const node of nodes) {
    result.push({ path: node.path, type: node.type, mimeType: node.mimeType, sizeKB: node.sizeKB, uploaded: node.uploaded });
    if (node.children) result.push(...flattenTree(node.children));
  }
  return result;
}

function buildSystemPrompt(files: FileItem[]): string {
  const totalSize  = files.reduce((s, f) => s + f.size, 0);
  const totalFiles = files.filter(f => f.type === 'file').length;
  const folders    = files.filter(f => f.type === 'folder').length;

  // Build recursive tree so AI understands folder structure
  const tree     = buildTree(files);
  const flat     = flattenTree(tree);

  // Compact file list with full paths — AI now knows "Projects/2024/report.pdf" not just "report.pdf"
  const fileLines = flat
    .filter(f => f.type === 'file')
    .slice(0, 80)
    .map(f => `• ${f.path} | ${f.mimeType?.split('/')[1] || 'file'} | ${f.sizeKB}KB | ${f.uploaded}`)
    .join('\n');

  // Folder structure summary
  const folderLines = flat
    .filter(f => f.type === 'folder')
    .map(f => `📁 ${f.path}`)
    .join('\n');

  // Type breakdown
  const byType: Record<string, number> = {};
  files.filter(f => f.type === 'file').forEach(f => {
    const cat = f.mimeType?.split('/')[0] || 'other';
    byType[cat] = (byType[cat] || 0) + 1;
  });
  const typeBreakdown = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  return `You are an intelligent AI Drive Assistant inside GoogleDevDrive.
You have FULL visibility into the user's entire drive — all files across ALL subfolders.

## DRIVE OVERVIEW
- Total: ${files.length} items (${totalFiles} files, ${folders} folders)
- Storage used: ${(totalSize / (1024 * 1024)).toFixed(2)} MB of 500MB
- File types: ${typeBreakdown || 'none yet'}

## FOLDER STRUCTURE
${folderLines || '(no folders — all files at root)'}

## ALL FILES (with full paths showing which folder each file is in)
${fileLines || 'No files uploaded yet.'}
${flat.filter(f => f.type === 'file').length > 80 ? `\n...and ${flat.filter(f => f.type === 'file').length - 80} more files` : ''}

## HOW TO REASON
Think step by step before answering:
1. UNDERSTAND: What is the user actually asking? (find a file, storage stats, folder contents, organization help?)
2. SCAN: Look at the full paths above — files inside subfolders show as "FolderName/filename.ext"
3. CALCULATE: For storage or count questions, use the data above
4. ANSWER: Be specific. Reference actual file names and their full paths.

## STRICT RULES
- NEVER make up filenames — only reference files from the list above
- When mentioning a file inside a folder, include its path: "Projects/report.pdf"
- If asked about file contents (what's inside), say you can only see metadata
- For "what's in folder X" questions — filter the file list by path prefix
- Be concise but complete. Use bullet points for lists of files.
- If the drive is empty, say so and suggest uploading files.`;
}

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not set' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message, files, history } = await request.json();

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
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
    console.error('[Groq Chat Error]', error?.message);
    if (error?.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit hit — wait a moment and try again.' }), {
        status: 429, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: error?.message || 'Something went wrong' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}