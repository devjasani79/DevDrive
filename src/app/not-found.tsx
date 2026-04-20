import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-7xl font-bold text-foreground">404</h1>
          <p className="text-2xl font-semibold text-foreground mt-2">Page Not Found</p>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto text-lg">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button>Home</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
