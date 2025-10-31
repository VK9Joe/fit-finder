
/**
 * Measurements Auto-Populate Script for Shopify Integration
 * This script automatically populates the "special instructions for seller" field
 * with measurements from the fit-finder app when users are redirected to product pages.
 */

(function() {
    'use strict';
  
    console.log('Fit-Finder: Measurements auto-populate script loading...');
  
    // Configuration
    const ALLOWED_ORIGINS = [
      'https://fit-finder-topaz.vercel.app',
      'https://your-fit-finder-domain.com',
      'http://localhost:3000' // For development
    ];
  
    // Field selectors to try (in order of preference)
    const FIELD_SELECTORS = [
      'textarea[name*="special instructions for seller" i]',
      'textarea[name*="special instructions" i]',
      'textarea[name*="note" i]',
      'textarea[name*="message" i]',
      'textarea[name*="instructions" i]',
      'textarea[name*="comment" i]',
      'textarea[name*="order note" i]',
      'textarea[name*="customer note" i]',
      'textarea[name*="special request" i]',
      'textarea[name*="additional notes" i]',
      'textarea[name*="customization" i]',
      'textarea[name*="personalization" i]'
    ];
  
    /**
     * Check if the origin is allowed
     */
    function isAllowedOrigin(origin) {
      return ALLOWED_ORIGINS.some(allowed => 
        origin === allowed || origin.endsWith(allowed.replace(/^https?:\/\//, ''))
      );
    }
  
    /**
     * Find the special instructions field
     */
    function findInstructionsField() {
      for (const selector of FIELD_SELECTORS) {
        const field = document.querySelector(selector);
        if (field) {
          console.log('Fit-Finder: Found instructions field with selector:', selector);
          return field;
        }
      }
      return null;
    }
  
    /**
     * Format measurements into a readable string
     */
    function formatMeasurements(measurements, productInfo = null) {
      let instructions = `Dog Measurements from Fit-Finder:
  Breed: ${measurements.breed}
  Neck: ${measurements.neck}" 
  Chest: ${measurements.chest}"
  Length: ${measurements.length}"
  Tail: ${measurements.tail}
  Chondrodystrophic: ${measurements.chondro ? 'Yes' : 'No'}`;
  
      // Add product and size information if available
      if (productInfo) {
        instructions += `\n\nProduct Information:
  Product: ${productInfo.productName || 'N/A'}
  Size: ${productInfo.size || 'N/A'}`;
        
        if (productInfo.color) {
          instructions += `\nColor: ${productInfo.color}`;
        }
        
        if (productInfo.pattern) {
          instructions += `\nPattern: ${productInfo.pattern}`;
        }
      }
  
      instructions += `\n\nPlease use these measurements for sizing.`;
      
      return instructions;
    }
  
    /**
     * Populate the instructions field with measurements
     */
    function populateInstructions(measurements, productInfo = null) {
      const field = findInstructionsField();
      
      if (!field) {
        console.log('Fit-Finder: No instructions field found');
        return false;
      }
  
      const instructions = formatMeasurements(measurements, productInfo);
      
      // Set the value
      field.value = instructions;
      
      // Trigger change event for form validation
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Focus the field briefly to show it's been populated
      field.focus();
      setTimeout(() => {
        field.blur();
      }, 100);
      
      console.log('Fit-Finder: Measurements auto-populated in special instructions');
      return true;
    }
  
    /**
     * Extract product information from URL or page
     */
    function extractProductInfo() {
      const urlParams = new URLSearchParams(window.location.search);
      const productInfo = {};
      
      // Try to get product info from URL parameters
      if (urlParams.get('product')) {
        productInfo.productName = urlParams.get('product');
      }
      if (urlParams.get('size')) {
        productInfo.size = urlParams.get('size');
      }
      if (urlParams.get('color')) {
        productInfo.color = urlParams.get('color');
      }
      if (urlParams.get('pattern')) {
        productInfo.pattern = urlParams.get('pattern');
      }
      
      // Try to extract from page title or meta tags
      if (!productInfo.productName) {
        const title = document.title;
        if (title && !title.includes('Shopify')) {
          productInfo.productName = title;
        }
      }
      
      // Try to extract from product name in page content
      if (!productInfo.productName) {
        const productTitle = document.querySelector('h1.product-title, .product-title, h1[class*="product"], .product-name');
        if (productTitle) {
          productInfo.productName = productTitle.textContent.trim();
        }
      }
      
      // Try to extract size from selected variant
      if (!productInfo.size) {
        const sizeElement = document.querySelector('.variant-selector select option:checked, .size-selector select option:checked, [data-variant-size]');
        if (sizeElement) {
          productInfo.size = sizeElement.textContent.trim();
        }
      }
      
      // Try to extract color from selected variant
      if (!productInfo.color) {
        const colorElement = document.querySelector('.color-selector .selected, .variant-color.selected, [data-variant-color]');
        if (colorElement) {
          productInfo.color = colorElement.textContent.trim();
        }
      }
      
      return productInfo;
    }
  
    /**
     * Handle measurements from URL parameters
     */
    function handleUrlMeasurements() {
      const urlParams = new URLSearchParams(window.location.search);
      const measurementsParam = urlParams.get('measurements');
      
      if (!measurementsParam) {
        console.log('Fit-Finder: No measurements found in URL');
        return;
      }
  
      try {
        const measurements = JSON.parse(decodeURIComponent(measurementsParam));
        
        // Validate measurements object
        if (!measurements.breed || typeof measurements.neck !== 'number' || 
            typeof measurements.chest !== 'number' || typeof measurements.length !== 'number') {
          console.log('Fit-Finder: Invalid measurements format');
          return;
        }
  
        console.log('Fit-Finder: Processing measurements:', measurements);
        
        // Extract product information
        const productInfo = extractProductInfo();
        console.log('Fit-Finder: Product info:', productInfo);
        
        // Wait for DOM to be ready, then populate
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => populateInstructions(measurements, productInfo), 100);
          });
        } else {
          setTimeout(() => populateInstructions(measurements, productInfo), 100);
        }
        
      } catch (error) {
        console.log('Fit-Finder: Error parsing measurements:', error);
      }
    }
  
    /**
     * Handle messages from iframe (for real-time updates)
     */
    function handleIframeMessage(event) {
      // Verify origin
      if (!isAllowedOrigin(event.origin)) {
        return;
      }
  
      const { type, measurements, productInfo } = event.data || {};
  
      if (type === 'MEASUREMENTS_UPDATE' && measurements) {
        console.log('Fit-Finder: Received measurements from iframe:', measurements);
        
        // Extract product info if not provided
        const extractedProductInfo = productInfo || extractProductInfo();
        
        // Try to populate immediately
        populateInstructions(measurements, extractedProductInfo);
      }
    }
  
    /**
     * Initialize the measurements auto-populate functionality
     */
    function init() {
      console.log('Fit-Finder: Initializing measurements auto-populate...');
      
      // Handle URL parameters first (highest priority)
      handleUrlMeasurements();
      
      // Listen for messages from iframe
      window.addEventListener('message', handleIframeMessage);
      
      // Also check for measurements on page load (in case of page refresh)
      window.addEventListener('load', () => {
        setTimeout(() => {
          handleUrlMeasurements();
        }, 500);
      });
      
      console.log('Fit-Finder: Measurements auto-populate initialized');
    }
  
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
    // Expose functions globally for debugging
    window.fitFinderMeasurements = {
      populateInstructions,
      findInstructionsField,
      formatMeasurements,
      handleUrlMeasurements,
    };
  
  })();
  
  