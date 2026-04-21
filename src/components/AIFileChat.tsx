'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Send, Loader2, Bot, User,
  FileText, Image, Film, File, AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileItem } from '@/types/files';
import { toast } from 'sonner';

interface Message    { role: 'user' | 'model'; parts: string }
interface FileContent { type: 'text' | 'image' | 'none'; data?: string; mimeType: string; pages?: number; reason?: string; detail?: string }

interface Props {
  file: FileItem | null;
  open: boolean;
  onClose: () => void;
  getFileViewUrl: (id: string) => string; // kept for signature compatibility
}

// ─── helpers ────────────────────────────────────────────────────────────────

function FileTypeIcon({ mimeType }: { mimeType?: string }) {
  if (mimeType?.startsWith('image/'))   return <Image    className="h-4 w-4" />;
  if (mimeType?.startsWith('video/'))   return <Film     className="h-4 w-4" />;
  if (mimeType === 'application/pdf')   return <FileText className="h-4 w-4 text-red-400" />;
  if (mimeType?.startsWith('text/') || mimeType === 'application/json')
                                        return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

function capabilityLabel(mimeType?: string, loading?: boolean): { label: string; color: string } {
  if (loading) return { label: 'Reading file…', color: 'text-primary' };
  if (!mimeType) return { label: 'Metadata only', color: 'text-muted-foreground' };
  if (mimeType.startsWith('image/'))   return { label: 'AI can see the image',    color: 'text-emerald-400' };
  if (mimeType === 'application/pdf')  return { label: 'AI can read PDF text',    color: 'text-emerald-400' };
  if (mimeType.startsWith('text/') || mimeType === 'application/json')
                                       return { label: 'AI can read the content', color: 'text-emerald-400' };
  return { label: 'Metadata only', color: 'text-muted-foreground' };
}

function suggestions(mimeType?: string): string[] {
  if (mimeType?.startsWith('image/'))  return ['Describe this image in detail', 'What colours are dominant?', 'What objects or people can you see?'];
  if (mimeType === 'application/pdf')  return ['Summarize this PDF', 'What are the key points?', 'What topic does this cover?'];
  if (mimeType?.startsWith('text/') || mimeType === 'application/json')
                                       return ['Summarize this file', 'What is the main topic?', 'List the key points'];
  return ['When was this uploaded?', 'How large is this file?', 'What type is this file?'];
}

// ─── component ──────────────────────────────────────────────────────────────

export default function AIFileChat({ file, open, onClose }: Props) {
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [proxyError,  setProxyError]  = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset and fetch content whenever the dialog opens for a new file
  useEffect(() => {
    if (!open || !file) return;
    setMessages([]);
    setFileContent(null);
    setProxyError('');
    setInput('');
    if (file.bucketFileId) fetchContent();
    setTimeout(() => inputRef.current?.focus(), 150);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file?.$id]);

  // ── fetch via server proxy (solves CORS + adds PDF support) ──────────────
  const fetchContent = async () => {
    if (!file?.bucketFileId || !file.mimeType) return;

    const mime     = file.mimeType;
    const isImage  = mime.startsWith('image/');
    const isPDF    = mime === 'application/pdf';
    const isText   = mime.startsWith('text/') || mime === 'application/json';

    // Only attempt types we can process
    if (!isImage && !isPDF && !isText) return;

    setLoadingFile(true);
    setProxyError('');

    try {
      const res = await fetch('/api/ai/file-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketFileId: file.bucketFileId, mimeType: mime, userId: file.userId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Proxy error ${res.status}`);
      }

      const data: FileContent = await res.json();
      setFileContent(data);

      if (data.type === 'none') {
        setProxyError(`${data.reason || 'This file type cannot be read'} — AI will use metadata only.`);
      }
    } catch (e: any) {
      console.error('[fetchContent]', e?.message);
      setProxyError('Could not read file content — AI will use metadata only.');
      toast.error('Could not load file content');
    } finally {
      setLoadingFile(false);
    }
  };

  // ── send message ─────────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading || !file) return;

    const userMsg: Message = { role: 'user', parts: msg };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/file-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, file, fileContent, history: messages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
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
        setMessages(p => { const n = [...p]; n[n.length - 1].parts = content; return n; });
      }
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong');
      setMessages(p => p.slice(0, -1));
      setInput(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!file) return null;

  const cap  = capabilityLabel(file.mimeType, loadingFile);
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

          {/* Empty / loading state */}
          {messages.length === 0 && (
            <div className="text-center space-y-4 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                {loadingFile
                  ? <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
                  : <Sparkles className="h-8 w-8 text-indigo-400" />
                }
              </div>

              {loadingFile ? (
                <p className="text-sm text-white/50">Reading file content…</p>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium text-white">Ask anything about</p>
                    <p className="text-sm text-indigo-400 font-semibold truncate px-4">{file.name}</p>
                  </div>

                  {/* Proxy error notice */}
                  {proxyError && (
                    <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-400/8 border border-amber-400/15 rounded-xl px-4 py-2.5 text-left mx-2">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      {proxyError}
                    </div>
                  )}

                  {/* Suggestion chips */}
                  <div className="space-y-2">
                    {sugg.map(s => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="w-full text-left text-xs px-4 py-2.5 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 text-white/55 hover:text-white/80 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Chat bubbles */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-white/8'}`}>
                {msg.role === 'user'
                  ? <User className="h-3 w-3 text-white" />
                  : <Bot className="h-3 w-3 text-white/50" />}
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
            disabled={isLoading || loadingFile}
            className="flex-1 bg-white/4 border-white/10 focus:border-indigo-500/60 rounded-xl text-sm text-white placeholder:text-white/25"
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim() || loadingFile}
            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}