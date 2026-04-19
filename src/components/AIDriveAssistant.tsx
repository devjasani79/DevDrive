'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2, X, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileItem } from '@/types/files';
import { toast } from 'sonner';

interface Message { role: 'user' | 'model'; content: string }

const SUGGESTIONS = [
  'What files did I upload recently?',
  'How much storage am I using?',
  'Find my largest files',
];

export default function AIDriveAssistant({ files }: { files: FileItem[] }) {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    const userMsg: Message = { role: 'user', content: msg };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => ({ role: m.role, parts: m.content }));

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, files, history }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let content = '';
      setMessages(p => [...p, { role: 'model', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setMessages(p => { const n = [...p]; n[n.length - 1].content = content; return n; });
      }
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong');
      setMessages(p => p.slice(0, -1));
      setInput(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(p => !p)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center glow-primary"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-85 sm:w-95 h-130 glass rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10">

          {/* Header */}
          <div className="px-4 py-3 border-b border-white/8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">AI Drive Assistant</p>
              <p className="text-xs text-muted-foreground">{files.length} items in your drive</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center space-y-4 pt-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Ask anything about your files</p>
                  <p className="text-xs text-muted-foreground mt-1">I can see your file names, sizes, and dates</p>
                </div>
                <div className="space-y-2">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="w-full text-left text-xs px-3 py-2 rounded-xl glass glass-hover text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center f-0 mt-0.5 ${msg.role === 'user' ? 'bg-primary' : 'bg-white/8'}`}>
                  {msg.role === 'user'
                    ? <User className="h-3 w-3 text-white" />
                    : <Bot className="h-3 w-3 text-muted-foreground" />
                  }
                </div>
                <div className={`max-w-[82%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'glass text-foreground rounded-tl-sm'
                }`}>
                  {msg.content || <Loader2 className="h-3 w-3 animate-spin" />}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'model' && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-lg bg-white/8 flex items-center justify-center">
                  <Bot className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="glass px-3 py-2 rounded-xl rounded-tl-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/8 flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask about your files..."
              disabled={isLoading}
              className="flex-1 glass border-white/10 bg-transparent focus:border-primary/50 rounded-xl text-sm"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors f-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}