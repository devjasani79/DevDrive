'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { FileItem } from '@/types/files';
import { toast } from 'sonner';
import { Link2, Mail, Copy, Check, Loader2, Send } from 'lucide-react';

interface Props {
  file:    FileItem | null;
  open:    boolean;
  onClose: () => void;
}

// Build the Appwrite direct-view URL client-side.
// These are NEXT_PUBLIC_ vars so they're available in the browser bundle.
function buildDirectUrl(bucketFileId: string): string {
  const host    = process.env.NEXT_PUBLIC_APPWRITE_HOST_URL!;
  const bucket  = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
  return `${host}/storage/buckets/${bucket}/files/${bucketFileId}/view?project=${project}`;
}

export default function ShareDialog({ file, open, onClose }: Props) {
  const [directUrl,      setDirectUrl]      = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sending,        setSending]        = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [emailSent,      setEmailSent]      = useState(false);
  const [step,           setStep]           = useState<'config' | 'done'>('config');

  const reset = () => {
    setDirectUrl('');
    setRecipientEmail('');
    setSending(false);
    setCopied(false);
    setEmailSent(false);
    setStep('config');
  };

  const handleClose = () => { reset(); onClose(); };

  // Build the direct URL instantly — no backend call, no token, no expiry nonsense.
  const generateLink = () => {
    if (!file?.bucketFileId) {
      toast.error('No storage file ID — cannot generate link');
      return;
    }
    const url = buildDirectUrl(file.bucketFileId);
    setDirectUrl(url);
    setStep('done');
  };

  const copyLink = async () => {
    if (!directUrl) return;
    await navigator.clipboard.writeText(directUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const sendByEmail = async () => {
    if (!file || !directUrl || !recipientEmail) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      toast.error('Enter a valid email address');
      return;
    }

    setSending(true);
    try {
      // /api/share only sends the email now — we supply the URL ourselves
      const res = await fetch('/api/share', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName:       file.name,
          mimeType:       file.mimeType || '',
          directUrl,          // ← pre-built Appwrite URL, no token needed
          recipientEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');

      if (data.emailSent) {
        setEmailSent(true);
        toast.success(`Link sent to ${recipientEmail}`);
      } else {
        toast.info(data.emailNote || 'Email service not configured — copy the link manually');
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

            {/* Email input (optional — user can skip and just copy) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-white/50 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Send to email <span className="text-white/25">(optional)</span>
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
                Leave blank to just copy the link
              </p>
            </div>

            <button
              onClick={generateLink}
              className="w-full h-11 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium text-sm transition-all"
            >
              <Link2 className="h-4 w-4" />
              Generate share link
            </button>
          </div>

        ) : (
          <div className="space-y-5 pt-1">

            {/* Ready banner */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 space-y-1">
              <p className="text-sm font-medium text-indigo-300">Link ready</p>
              <p className="text-xs text-white/40">Direct Appwrite link — always accessible</p>
            </div>

            {/* Copy row */}
            <div className="space-y-2">
              <Label className="text-sm text-white/50">Share link</Label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={directUrl}
                  className="flex-1 h-10 px-3 bg-white/4 border border-white/10 rounded-xl text-xs text-white/60 truncate"
                />
                <button
                  onClick={copyLink}
                  className="w-10 h-10 flex items-center justify-center bg-white/8 hover:bg-white/12 border border-white/10 rounded-xl transition-colors shrink-0"
                >
                  {copied
                    ? <Check className="h-4 w-4 text-emerald-400" />
                    : <Copy className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>

            {/* Email send */}
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
                    {sending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Send className="h-4 w-4" />
                    }
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
              Close
            </button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}