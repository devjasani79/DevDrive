'use client';

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for monitoring
    console.error('[Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div>
          <h1 className="text-7xl font-bold text-foreground">500</h1>
          <p className="text-2xl font-semibold text-foreground mt-2">Server Error</p>
        </div>
        <p className="text-muted-foreground text-lg">
          Something went wrong on our end. Our team has been notified and is working to fix it.
        </p>
        {error.digest && (
          <div className="bg-muted p-3 rounded-lg text-left">
            <p className="text-xs text-muted-foreground font-mono break-all">
              Error ID: {error.digest}
            </p>
          </div>
        )}
        <div className="flex gap-4 justify-center">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
