'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to handle iframe height communication with parent window
 * Automatically adjusts iframe height based on content
 */
export function useIframeHeight() {
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    // Only run in iframe context
    if (typeof window === 'undefined' || window.parent === window) {
      return;
    }

    const updateHeight = () => {
      if (!containerRef.current) return;

      const height = containerRef.current.scrollHeight;
      
      // Send height to parent window
      window.parent.postMessage({
        type: 'IFRAME_HEIGHT_UPDATE',
        height: height,
        timestamp: Date.now()
      }, '*');
    };

    // Initial height update
    updateHeight();

    // Set up ResizeObserver to watch for content changes
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => {
        // Debounce updates
        setTimeout(updateHeight, 100);
      });

      if (containerRef.current) {
        resizeObserverRef.current.observe(containerRef.current);
      }
    }

    // Fallback: Update height on window resize
    const handleResize = () => {
      setTimeout(updateHeight, 100);
    };

    // Listen for parent window resize events
    const handleParentResize = (event: MessageEvent) => {
      if (event.data?.type === 'PARENT_WINDOW_RESIZED') {
        setTimeout(updateHeight, 100);
      }
    };

    // Listen for height update requests from parent
    const handleHeightRequest = (event: MessageEvent) => {
      if (event.data?.type === 'REQUEST_HEIGHT_UPDATE') {
        updateHeight();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('message', handleParentResize);
    window.addEventListener('message', handleHeightRequest);

    // Update height when content changes (for dynamic content)
    const handleContentChange = () => {
      setTimeout(updateHeight, 200);
    };

    // Listen for custom events that indicate content changes
    window.addEventListener('contentChanged', handleContentChange);

    // Cleanup
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('message', handleParentResize);
      window.removeEventListener('message', handleHeightRequest);
      window.removeEventListener('contentChanged', handleContentChange);
    };
  }, []);

  return containerRef;
}

/**
 * Utility function to trigger height update manually
 */
export function triggerHeightUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('contentChanged'));
  }
}
