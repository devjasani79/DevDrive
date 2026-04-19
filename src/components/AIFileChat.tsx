'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, X, Bot, User, FileText, Image, Film, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileItem } from '@/types/files';
import { toast } from 'sonner';

interface Message { role: 'user' | 'model'; parts: string }
interface FileContent { type: 'text' | 'image'; data: string; mimeType: string }

interface Props {
  file: FileItem | null;
  open: boolean;
  onClose: () => void;
  getFileViewUrl: (id: string) => string;
}

function FileTypeIcon({ mimeType }: { mimeType?: string }) {
  if (mimeType?.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (mimeType?.startsWith('video/')) return <Film className="h-4 w-4" />;
  if (mimeType?.startsWith('text/') || mimeType === 'application/json') return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

function getCapabilityLabel(mimeType?: string, loading?: boolean): { label: string; color: string } {
  if (loading) return { label: 'Analyzing file...', color: 'text-primary' };
  if (!mimeType) return { label: 'AI can see metadata only', color: 'text-muted-foreground' };
  if (mimeType.startsWith('image/')) return { label: 'AI can see the full image', color: 'text-green-400' };
  if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'text/csv')
    return { label: 'AI can read the file content', color: 'text-green-400' };
  return { label: 'AI can see metadata only', color: 'text-muted-foreground' };
}

const FILE_SUGGESTIONS: Record<string, string[]> = {
  image:    ['Describe this image', 'What colours are dominant?', 'What objects can you see?'],
  text:     ['Summarize this file', 'What is the main topic?', 'List the key points'],
  default:  ['When was this uploaded?', 'How large is this file?', 'What type is this file?'],
};

function getSuggestions(mimeType?: string): string[] {
  if (mimeType?.startsWith('image/')) return FILE_SUGGESTIONS.image;
  if (mimeType?.startsWith('text/') || mimeType === 'application/json') return FILE_SUGGESTIONS.text;
  return FILE_SUGGESTIONS.default;
}

export default function AIFileChat({ file, open, onClose, getFileViewUrl }: Props) {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const bottomRef                     = useRef<HTMLDivElement>(null);
  const inputRef                      = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!open || !file) return;
    setMessages([]); setFileContent(null); setInput('');
    if (file.bucketFileId && file.mimeType) fetchContent();
    setTimeout(() => inputRef.current?.focus(), 150);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file?.$id]);

  const fetchContent = async () => {
    if (!file?.bucketFileId || !file.mimeType) return;
    const mime = file.mimeType;
    const isImage = mime.startsWith('image/');
    const isText  = mime.startsWith('text/') || mime === 'application/json';
    if (!isImage && !isText) return;

    setLoadingFile(true);
    try {
      const url = getFileViewUrl(file.bucketFileId);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Fetch failed');

      if (isImage) {
        const blob = await res.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload  = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        setFileContent({ type: 'image', data: base64, mimeType: mime });
      } else {
        const text = await res.text();
        setFileContent({ type: 'text', data: text, mimeType: mime });
      }
    } catch {
      toast.error('Could not load file content — AI will use metadata only');
    } finally {
      setLoadingFile(false);
    }
  };

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

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let content = '';
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

  const cap = getCapabilityLabel(file.mimeType, loadingFile);
  const suggestions = getSuggestions(file.mimeType);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg h-150 flex flex-col p-0 glass border-white/10 shadow-2xl rounded-2xl overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-white/8 shrink-0">
          <DialogTitle className="flex items-center gap-2.5 text-base">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            Ask AI about this file
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-xs mt-1">
            <FileTypeIcon mimeType={file.mimeType} />
            <span className="font-medium text-foreground truncate max-w-45">{file.name}</span>
            <span className="text-white/20">·</span>
            <span className={cap.color}>{cap.label}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {/* Empty state with suggestions */}
          {messages.length === 0 && !loadingFile && (
            <div className="text-center space-y-4 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Ask anything about</p>
                <p className="text-sm text-primary font-semibold truncate px-4">{file.name}</p>
              </div>
              <div className="space-y-2">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="w-full text-left text-xs px-4 py-2.5 rounded-xl glass glass-hover text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading file */}
          {loadingFile && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Reading file content...
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-primary' : 'bg-white/8'}`}>
                {msg.role === 'user'
                  ? <User className="h-3 w-3 text-white" />
                  : <Bot className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div className={`max-w-[82%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-sm'
                  : 'glass text-foreground rounded-tl-sm'
              }`}>
                {msg.parts || <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-white/8 flex gap-2 shrink-0">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={`Ask about ${file.name}...`}
            disabled={isLoading || loadingFile}
            className="flex-1 glass border-white/10 bg-transparent focus:border-primary/50 rounded-xl text-sm"
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim() || loadingFile}
            className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}