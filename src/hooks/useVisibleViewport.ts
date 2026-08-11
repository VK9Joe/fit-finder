'use client';

import { useCallback, useEffect, useRef } from 'react';

export interface VisibleBand {
  /** Top of the on-screen area, in this document's client coordinates. */
  top: number;
  /** Bottom of the on-screen area, in this document's client coordinates. */
  bottom: number;
}

/**
 * The slice of this document the user can actually see.
 *
 * Standalone that is just the window. Embedded in Shopify it is not: the parent
 * sizes the iframe to our full content height, so our own viewport covers the
 * whole page and only the parent knows which part of it is on screen. The parent
 * snippet posts PARENT_VIEWPORT as it scrolls; until it does (or if the store is
 * still on an older snippet) we fall back to our own viewport.
 */
export function useVisibleViewport() {
  const bandRef = useRef<VisibleBand | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || window.parent === window) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'PARENT_VIEWPORT') return;

      const { iframeTop, viewportHeight } = event.data;
      if (typeof iframeTop !== 'number' || typeof viewportHeight !== 'number') return;

      // The parent sizes the iframe to our content height, so we never scroll
      // internally and client coordinates match document coordinates here.
      bandRef.current = {
        top: Math.max(0, -iframeTop),
        bottom: Math.max(0, viewportHeight - iframeTop),
      };
    };

    window.addEventListener('message', handleMessage);
    window.parent.postMessage({ type: 'REQUEST_PARENT_VIEWPORT' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return useCallback((): VisibleBand => {
    if (bandRef.current) return bandRef.current;
    return { top: 0, bottom: typeof window === 'undefined' ? 0 : window.innerHeight };
  }, []);
}
