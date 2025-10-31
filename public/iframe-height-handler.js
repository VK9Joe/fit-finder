/**
 * Iframe Height Handler for Shopify Integration
 * This script should be included in the parent Shopify page to handle iframe height updates
 */

(function() {
  'use strict';

  // Configuration
  const IFRAME_SELECTOR = '#fit-finder-iframe';
  const ALLOWED_ORIGINS = [
    // Add your iframe domain here
    'https://your-fit-finder-domain.com',
    'http://localhost:3000', // For development
  ];

  // State
  let iframe = null;
  let isResizing = false;
  let resizeTimeout = null;

  /**
   * Initialize the iframe height handler
   */
  function init() {
    iframe = document.querySelector(IFRAME_SELECTOR);
    
    if (!iframe) {
      console.warn('Fit Finder: Iframe not found with selector:', IFRAME_SELECTOR);
      return;
    }

    // Set initial styles
    iframe.style.overflow = 'hidden';
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.transition = 'height 0.3s ease-in-out';

    // Listen for height update messages
    window.addEventListener('message', handleMessage);

    // Listen for iframe load
    iframe.addEventListener('load', handleIframeLoad);

    console.log('Fit Finder: Iframe height handler initialized');
  }

  /**
   * Handle messages from the iframe
   */
  function handleMessage(event) {
    // Verify origin
    if (!isAllowedOrigin(event.origin)) {
      return;
    }

    const { type, height, scrollTop, distanceFromBottom, timestamp } = event.data || {};

    if (type === 'IFRAME_HEIGHT_UPDATE' && typeof height === 'number') {
      updateIframeHeight(height);
    }

    if (type === 'IFRAME_SCROLL_NEAR_BOTTOM') {
      handleIframeScroll(scrollTop, distanceFromBottom);
    }
  }

  /**
   * Check if the origin is allowed
   */
  function isAllowedOrigin(origin) {
    return ALLOWED_ORIGINS.some(allowed => 
      origin === allowed || origin.endsWith(allowed.replace(/^https?:\/\//, ''))
    );
  }

  /**
   * Update iframe height with smooth transition
   */
  function updateIframeHeight(height) {
    if (!iframe || isResizing) return;

    // Add some padding for better visual appearance
    const padding = 20;
    const newHeight = Math.max(height + padding, 400); // Minimum height of 400px

    // Debounce rapid height changes
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      isResizing = true;

      iframe.style.height = newHeight + 'px';

      // Reset resizing flag after transition
      setTimeout(() => {
        isResizing = false;
      }, 300);

      console.log('Fit Finder: Updated iframe height to', newHeight + 'px');
    }, 50);
  }

  /**
   * Handle iframe scroll synchronization
   */
  function handleIframeScroll(scrollTop, distanceFromBottom) {
    if (!iframe) return;

    // Get iframe position relative to viewport
    const iframeRect = iframe.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // If iframe bottom is near or below viewport, scroll parent window
    const iframeBottom = iframeRect.bottom;
    const scrollThreshold = 150; // pixels from bottom

    if (iframeBottom - windowHeight < scrollThreshold) {
      // Calculate how much to scroll the parent window
      const scrollAmount = scrollThreshold - (windowHeight - iframeBottom);

      // Smooth scroll the parent window
      window.scrollBy({
        top: scrollAmount,
        behavior: 'smooth'
      });

      console.log('Fit Finder: Scrolling parent window by', scrollAmount, 'px');
    }
  }

  /**
   * Handle iframe load event
   */
  function handleIframeLoad() {
    console.log('Fit Finder: Iframe loaded');
    
    // Request initial height from iframe
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'REQUEST_HEIGHT_UPDATE'
      }, '*');
    }
  }

  /**
   * Handle window resize
   */
  function handleWindowResize() {
    if (iframe && iframe.contentWindow) {
      // Notify iframe about parent resize
      iframe.contentWindow.postMessage({
        type: 'PARENT_WINDOW_RESIZED',
        width: window.innerWidth
      }, '*');
    }
  }

  /**
   * Cleanup function
   */
  function destroy() {
    if (iframe) {
      iframe.removeEventListener('load', handleIframeLoad);
    }
    window.removeEventListener('message', handleMessage);
    window.removeEventListener('resize', handleWindowResize);
    clearTimeout(resizeTimeout);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Handle window resize
  window.addEventListener('resize', handleWindowResize);

  // Expose cleanup function globally
  window.fitFinderHeightHandler = {
    destroy: destroy,
    updateHeight: updateIframeHeight
  };

})();
