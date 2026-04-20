'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { verifyToken, type ShareToken } from '@/lib/share-token';
import { Download, AlertCircle, Loader2, Copy, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getFileIcon, formatDate } from '@/utils/fileUtils';

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;

  const [tokenData, setTokenData] = useState<ShareToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No share token provided');
      setLoading(false);
      return;
    }

    try {
      const payload = verifyToken(token);
      if (!payload) {
        setError('Invalid or expired share link');
      } else {
        setTokenData(payload);
      }
    } catch (err) {
      setError('Failed to verify share link');
      console.error('[share] Token verification error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getFileViewUrl = (): string => {
    if (!tokenData) return '';
    const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_HOST_URL;
    const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID;
    return `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${tokenData.bucketFileId}/view?project=${PROJECT_ID}`;
  };

  const handleDownload = () => {
    if (!tokenData) return;
    const url = getFileViewUrl();
    const a = document.createElement('a');
    a.href = url;
    a.download = tokenData.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download started');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const isImage = tokenData?.mimeType?.startsWith('image/');
  const isPDF = tokenData?.mimeType === 'application/pdf';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying share link...</p>
        </div>
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
            <h2 className="text-xl font-semibold">Invalid Link</h2>
          </div>
          <p className="text-muted-foreground mb-6">{error || 'This share link is not valid or has expired.'}</p>
          <a href="/" className="w-full">
            <Button className="w-full">Return Home</Button>
          </a>
        </div>
      </div>
    );
  }

  const fileViewUrl = getFileViewUrl();
  const expiresAt = new Date(tokenData.expiresAt);
  const isExpired = Date.now() > tokenData.expiresAt;

  if (isExpired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold">Link Expired</h2>
          </div>
          <p className="text-muted-foreground mb-2">This share link expired on:</p>
          <p className="text-yellow-600 dark:text-yellow-400 font-semibold mb-6">{formatDate(expiresAt.toISOString())}</p>
          <a href="/" className="w-full">
            <Button className="w-full">Return Home</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Shared File</h1>
          <p className="text-muted-foreground">
            Expires on {formatDate(expiresAt.toISOString())}
          </p>
        </div>

        {/* File Card */}
        <div className="glass rounded-2xl p-6 border border-white/10 space-y-6">
          {/* File Info Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  const Icon = getFileIcon(tokenData.mimeType);
                  return <Icon className="w-6 h-6 text-muted-foreground shrink-0" />;
                })()}
                <h2 className="text-2xl font-bold break-all">{tokenData.fileName}</h2>
              </div>
              <p className="text-muted-foreground text-sm">
                Type: {tokenData.mimeType || 'Unknown'}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                onClick={handleDownload}
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>

          {/* File Preview */}
          <div className="bg-black/20 rounded-lg overflow-hidden border border-white/5">
            {isImage ? (
              <div className="flex items-center justify-center min-h-96 bg-black/30">
                <img
                  src={fileViewUrl}
                  alt={tokenData.fileName}
                  className="max-h-96 object-contain"
                  onError={() => toast.error('Failed to load image')}
                />
              </div>
            ) : isPDF ? (
              <div className="flex flex-col items-center justify-center min-h-96 p-8">
                <FileIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="font-semibold mb-2">PDF File</p>
                <p className="text-muted-foreground text-sm text-center mb-6">
                  Download to view this PDF
                </p>
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-96 p-8">
                <FileIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="font-semibold mb-2">File Preview Not Available</p>
                <p className="text-muted-foreground text-sm text-center mb-6">
                  Download to view this file
                </p>
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Tip */}
        <div className="glass rounded-lg p-4 border border-white/10">
          <p className="text-muted-foreground text-sm">
            💡 <strong>Tip:</strong> This is a temporary share link. Download before it expires!
          </p>
        </div>
      </div>
    </div>
  );
}
