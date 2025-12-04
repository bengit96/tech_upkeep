'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/layout/Logo';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console and optionally to an error tracking service
    console.error('Application error:', error);

    // TODO: Send to error tracking service (e.g., Sentry)
    // Example:
    // Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-xl p-8">
        <div className="text-center mb-8">
          <Logo size="md" variant="default" className="mb-6" />
          <AlertTriangle className="h-20 w-20 text-red-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-100 mb-3">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-400 text-lg mb-4">
            We're sorry for the inconvenience. An unexpected error occurred.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm font-semibold mb-2">
              Error Details (Development Only):
            </p>
            <p className="text-red-300 text-sm font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-red-400 text-xs mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2 h-12 text-base"
          >
            <RefreshCcw className="h-5 w-5" />
            Try again
          </Button>
          <Link href="/" className="block">
            <Button
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 flex items-center justify-center gap-2 h-12 text-base"
            >
              <Home className="h-5 w-5" />
              Return to homepage
            </Button>
          </Link>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
