'use client';

import { useEffect, useRef } from 'react';

interface BlogVisitTrackerProps {
  page: string;
}

export default function BlogVisitTracker({ page }: BlogVisitTrackerProps) {
  const hasLogged = useRef(false);

  useEffect(() => {
    // Only log once per page load
    if (hasLogged.current) return;
    hasLogged.current = true;

    // Log visit to Discord
    const logVisit = async () => {
      try {
        await fetch('/api/blog/log-visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page,
            referrer: document.referrer,
          }),
        });
      } catch (error) {
        // Silently fail - don't disrupt user experience
        console.debug('Visit logging failed:', error);
      }
    };

    // Small delay to ensure page has loaded
    const timeout = setTimeout(logVisit, 500);

    return () => clearTimeout(timeout);
  }, [page]);

  // This component renders nothing
  return null;
}
