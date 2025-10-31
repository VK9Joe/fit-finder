'use client';

import { useEffect } from 'react';

/**
 * Component that handles iframe-specific body styling
 * Removes overflow: hidden when running in an iframe to allow proper scrolling
 */
export default function IframeBodyHandler() {
  useEffect(() => {
    // Check if we're running in an iframe
    const isInIframe = window.parent !== window;

    if (isInIframe) {
      // Remove overflow hidden to allow iframe scrolling
      document.body.style.overflow = 'auto';

      // Also ensure html element allows scrolling
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.height = 'auto';
    }
  }, []);

  return null; // This component doesn't render anything
}
