'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileItem } from '@/types/files';
import { toast } from 'sonner';
import { Link2, Mail, Copy, Check, Loader2, Clock, Send } from 'lucide-react';

interface Props {
  file: FileItem | null;
  open: boolean;
  onClose: () => void;
}

const EXPIRY_OPTIONS = [
  { value: '1h',  label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d',  label: '7 days' },
];

export default function ShareDialog({ file, open, onClose }: Props) {
  const [expiry,          setExpiry]          = useState('24h');
  const [recipientEmail,  setRecipientEmail]  = useState('');
  const [shareUrl,        setShareUrl]        = useState('');
  const [loading,         setLoading]         = useState(false);
  const [sending,         setSending]         = useState(false);
  const [copied,          setCopied]          = useState(false);
  const [emailSent,       setEmailSent]       = useState(false);
  const [step,            setStep]            = useState<'config' | 'done'>('config');

  const reset = () => {
    setExpiry('24h');
    setRecipientEmail('');
    setShareUrl('');
    setLoading(false);
    setSending(false);
    setCopied(false);
    setEmailSent(false);
    setStep('config');
  };

  const handleClose = () => { reset(); onClose(); };

  const generateLink = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId:      file.$id,
          bucketFileId: file.bucketFileId,
          fileName:    file.name,
          mimeType:    file.mimeType || '',
          userId:      file.userId,
          expiry,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create link');

      setShareUrl(data.shareUrl);
      setStep('done');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const sendByEmail = async () => {
    if (!file || !shareUrl || !recipientEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error('Enter a valid email address');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId:         file.$id,
          bucketFileId:   file.bucketFileId,
          fileName:       file.name,
          mimeType:       file.mimeType || '',
          userId:         file.userId,
          expiry,
          recipientEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');

      if (data.emailSent) {
        setEmailSent(true);
        toast.success(`Link sent to ${recipientEmail}`);
      } else {
        // Email not configured — just show the link
        toast.info(data.emailNote || 'Email service not configured — copy the link manually');
        if (data.shareUrl) setShareUrl(data.shareUrl);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-[#0d0d1a] border border-white/10 rounded-2xl shadow-2xl text-white">

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <Link2 className="h-4 w-4" />
            </div>
            Share file
          </DialogTitle>
          <DialogDescription className="text-white/45 text-xs truncate">
            {file.name}
          </DialogDescription>
        </DialogHeader>

        {step === 'config' ? (
          <div className="space-y-5 pt-1">

            {/* Expiry selector */}
            <div className="space-y-2">
              <Label className="text-sm text-white/50 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Link expires after
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {EXPIRY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setExpiry(opt.value)}
                    className={`py-2 rounded-xl text-sm font-medium transition-all ${
                      expiry === opt.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-white/50 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Send to email (optional)
              </Label>
              <Input
                id="email"
                type="email"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="h-10 bg-white/4 border-white/10 focus:border-indigo-500/60 rounded-xl text-white placeholder:text-white/20"
              />
              <p className="text-xs text-white/30">
                Leave blank to just generate a link
              </p>
            </div>

            <button
              onClick={generateLink}
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl font-medium text-sm transition-all"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating link...</>
                : <><Link2 className="h-4 w-4" /> Generate share link</>
              }
            </button>
          </div>
        ) : (
          <div className="space-y-5 pt-1">

            {/* Success state */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 space-y-1">
              <p className="text-sm font-medium text-indigo-300">Link ready</p>
              <p className="text-xs text-white/40">
                Expires in {EXPIRY_OPTIONS.find(o => o.value === expiry)?.label}
              </p>
            </div>

            {/* Link copy row */}
            <div className="space-y-2">
              <Label className="text-sm text-white/50">Share link</Label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 h-10 px-3 bg-white/4 border border-white/10 rounded-xl text-xs text-white/60 truncate"
                />
                <button
                  onClick={copyLink}
                  className="w-10 h-10 flex items-center justify-center bg-white/8 hover:bg-white/12 border border-white/10 rounded-xl transition-colors shrink-0"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Send to email */}
            {!emailSent ? (
              <div className="space-y-2">
                <Label className="text-sm text-white/50">Also send by email</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="someone@example.com"
                    className="h-10 bg-white/4 border-white/10 focus:border-indigo-500/60 rounded-xl text-white placeholder:text-white/20"
                  />
                  <button
                    onClick={sendByEmail}
                    disabled={sending || !recipientEmail.trim()}
                    className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl transition-colors shrink-0"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-300">
                <Check className="h-4 w-4 shrink-0" />
                Email sent to {recipientEmail}
              </div>
            )}

            <button
              onClick={reset}
              className="w-full h-9 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Generate another link
            </button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}