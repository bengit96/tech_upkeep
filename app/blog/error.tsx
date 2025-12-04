'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Blog page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <div className="mb-6">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-100 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-400 mb-4">
            We encountered an error while loading this blog post.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-4 text-left">
              <p className="text-red-300 text-sm font-mono break-all">
                {error.message}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </Button>
          <Link href="/" className="block">
            <Button
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
