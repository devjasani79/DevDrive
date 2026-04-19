'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Completing Google sign in...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        const secret = params.get('secret');
        const error  = params.get('error');

        if (error) {
          router.replace(`/signin?error=oauth_${error}`);
          return;
        }

        if (!userId || !secret) {
          // No params — not a token callback, just go verify
          router.replace('/auth/oauth-success');
          return;
        }

        setStatus('Creating your session...');

        // THIS is the key step — exchange userId + secret for a real session cookie
        const { account } = await import('@/lib/appwrite');
        await account.createSession(userId, secret);

        // Now the session cookie is set — verify it
        router.replace('/auth/oauth-success');
      } catch (err) {
        console.error('[OAuthCallback]', err);
        router.replace('/signin?error=oauth_callback_failed');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}