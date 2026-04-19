'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/client/auth';

export default function OAuthSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Completing sign in...');

  useEffect(() => {
    const verify = async () => {
      // Give Appwrite a moment to finalize the session cookie
      await new Promise(r => setTimeout(r, 500));

      const maxAttempts = 8;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        setStatus(`Verifying your account${'.'.repeat(attempt % 4)}`);
        try {
          const result = await getCurrentUser();
          if (result.success && result.data?.user) {
            router.replace('/dashboard');
            return;
          }
        } catch {
          // keep trying
        }
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 800));
        }
      }

      // All retries failed
      router.replace('/signin?error=oauth_session_failed');
    };

    verify();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {/* Spinner */}
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}