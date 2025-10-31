'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to handle iframe height communication with parent window
 * Automatically adjusts iframe height based on content
 */
export function useIframeHeight() {
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const scrollHandlerRef = useRef<((event: Event) => void) | null>(null);

  useEffect(() => {
    // Only run in iframe context
    if (typeof window === 'undefined' || window.parent === window) {
      return;
    }

  const updateHeight = () => {
    if (!containerRef.current) return;

    const height = containerRef.current.scrollHeight;
    
    // Only send height update if it's significantly different (more than 100px)
    const lastHeight = (window as Window & { lastIframeHeight?: number }).lastIframeHeight || 0;
    if (Math.abs(height - lastHeight) < 100) {
      return;
    }
    
    (window as Window & { lastIframeHeight?: number }).lastIframeHeight = height;
    
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

    // Handle scroll synchronization
    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const scrollTop = target.scrollTop;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;

      // Calculate how far we are from the bottom
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // If we're close to the bottom, notify parent to scroll
      if (distanceFromBottom < 100 && scrollTop > 0) {
        window.parent.postMessage({
          type: 'IFRAME_SCROLL_NEAR_BOTTOM',
          scrollTop: scrollTop,
          distanceFromBottom: distanceFromBottom,
          timestamp: Date.now()
        }, '*');
      }
    };

    // Add scroll listener to the main container
    if (containerRef.current) {
      containerRef.current.addEventListener('scroll', handleScroll, { passive: true });
      scrollHandlerRef.current = handleScroll;
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('message', handleParentResize);
    window.addEventListener('message', handleHeightRequest);

    // Update height when content changes (for dynamic content)
    const handleContentChange = () => {
      // Check if any dropdowns are open before updating height
      const openDropdowns = document.querySelectorAll('[data-state="open"]');
      if (openDropdowns.length > 0) {
        console.log('Dropdown open, skipping height update');
        return;
      }
      setTimeout(updateHeight, 200);
    };

    // Listen for custom events that indicate content changes
    window.addEventListener('contentChanged', handleContentChange);
    
    // Listen for dropdown state changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
          const target = mutation.target as HTMLElement;
          if (target.getAttribute('data-state') === 'closed') {
            // Dropdown closed, update height after a delay
            setTimeout(updateHeight, 300);
          }
        }
      });
    });
    
    // Observe dropdown elements
    const dropdownElements = document.querySelectorAll('[data-state]');
    dropdownElements.forEach(el => observer.observe(el, { attributes: true }));

    // Cleanup
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (scrollHandlerRef.current && containerRef.current) {
        containerRef.current.removeEventListener('scroll', scrollHandlerRef.current);
      }
      observer.disconnect();
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
