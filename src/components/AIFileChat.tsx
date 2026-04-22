'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Send, Loader2, Bot, User,
  FileText, Image, Film, File,
} from 'lucide-react';
import { Input }  from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FileItem } from '@/types/files';
import { toast }   from 'sonner';

interface Message { role: 'user' | 'model'; parts: string }

interface Props {
  file:           FileItem | null;
  open:           boolean;
  onClose:        () => void;
  getFileViewUrl: (id: string) => string; // kept for API compatibility
}

// ── helpers ──────────────────────────────────────────────────────────────────────

function FileTypeIcon({ mimeType }: { mimeType?: string }) {
  if (mimeType?.startsWith('image/'))                                     return <Image    className="h-4 w-4" />;
  if (mimeType?.startsWith('video/'))                                     return <Film     className="h-4 w-4" />;
  if (mimeType === 'application/pdf')                                     return <FileText className="h-4 w-4 text-red-400" />;
  if (mimeType?.startsWith('text/') || mimeType === 'application/json')  return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

function capabilityLabel(mimeType?: string): { label: string; color: string } {
  if (!mimeType)                                                          return { label: 'Metadata only',           color: 'text-muted-foreground' };
  if (mimeType.startsWith('image/'))                                      return { label: 'AI can see the image',    color: 'text-emerald-400' };
  if (mimeType === 'application/pdf')                                     return { label: 'AI can read the PDF',     color: 'text-emerald-400' };
  if (mimeType.startsWith('text/') || mimeType === 'application/json')   return { label: 'AI can read the content', color: 'text-emerald-400' };
  return { label: 'Metadata only', color: 'text-muted-foreground' };
}

function suggestions(mimeType?: string): string[] {
  if (mimeType?.startsWith('image/'))                                   return ['Describe this image in detail', 'What colours are dominant?', 'What objects can you see?'];
  if (mimeType === 'application/pdf')                                   return ['Summarize this PDF', 'What are the key points?', 'What topic does this cover?'];
  if (mimeType?.startsWith('text/') || mimeType === 'application/json') return ['Summarize this file', 'What is the main topic?', 'List the key points'];
  return ['When was this file uploaded?', 'How large is this file?', 'What type of file is this?'];
}

// ── component ────────────────────────────────────────────────────────────────────

export default function AIFileChat({ file, open, onClose }: Props) {
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset conversation whenever the dialog opens for a new file
  useEffect(() => {
    if (!open || !file) return;
    setMessages([]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [open, file?.$id]);

  // ── send message ──────────────────────────────────────────────────────────────
  // NOTE: We do NOT send fileContent from the client.
  // The server (/api/ai/file-chat) downloads the file from Appwrite using the API
  // key and extracts the content server-side. This is more secure and reliable.
  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading || !file) return;

    setMessages(p => [...p, { role: 'user', parts: msg }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/file-chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        // Only send message + file metadata + history.
        // Server fetches the actual file bytes from Appwrite itself.
        body: JSON.stringify({ message: msg, file, history: messages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      const reader  = res.body?.getReader();
      if (!reader) throw new Error('No response stream');
      const decoder = new TextDecoder();
      let content   = '';

      setMessages(p => [...p, { role: 'model', parts: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setMessages(p => {
          const n = [...p];
          n[n.length - 1] = { role: 'model', parts: content };
          return n;
        });
      }
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong');
      setMessages(p => p.filter((_, i) => i !== p.length - 1));
      setInput(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!file) return null;

  const cap  = capabilityLabel(file.mimeType);
  const sugg = suggestions(file.mimeType);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg h-150 flex flex-col p-0 bg-[#0d0d1a] border border-white/10 shadow-2xl rounded-2xl overflow-hidden">

        {/* ── Header ── */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-white/8 shrink-0">
          <DialogTitle className="flex items-center gap-2.5 text-base text-white">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            Ask AI about this file
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-xs mt-1 min-w-0">
            <FileTypeIcon mimeType={file.mimeType} />
            <span className="font-medium text-white/80 truncate max-w-45">{file.name}</span>
            <span className="text-white/20 shrink-0">·</span>
            <span className={`${cap.color} shrink-0`}>{cap.label}</span>
          </DialogDescription>
        </DialogHeader>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {messages.length === 0 && (
            <div className="text-center space-y-4 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-indigo-400" />
              </div>

              <div>
                <p className="text-sm font-medium text-white">Ask anything about</p>
                <p className="text-sm text-indigo-400 font-semibold truncate px-4">{file.name}</p>
              </div>

              <div className="space-y-2">
                {sugg.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={isLoading}
                    className="w-full text-left text-xs px-4 py-2.5 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 text-white/55 hover:text-white/80 transition-colors disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-white/8'}`}>
                {msg.role === 'user'
                  ? <User className="h-3 w-3 text-white" />
                  : <Bot  className="h-3 w-3 text-white/50" />
                }
              </div>
              <div className={`max-w-[82%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-white/6 border border-white/8 text-white/85 rounded-tl-sm'
              }`}>
                {msg.parts || <Loader2 className="h-3 w-3 animate-spin opacity-50" />}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* ── Input ── */}
        <div className="px-4 pb-4 pt-2 border-t border-white/8 flex gap-2 shrink-0">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={`Ask about ${file.name}…`}
            disabled={isLoading}
            className="flex-1 bg-white/4 border-white/10 focus:border-indigo-500/60 rounded-xl text-sm text-white placeholder:text-white/25"
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0"
          >
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send    className="h-4 w-4" />
            }
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}