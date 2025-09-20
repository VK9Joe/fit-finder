# Shopify Store Iframe Integration Guide

This guide explains how to embed the fit-finder app as an iframe in your Shopify store and handle cart functionality.

## Overview

The fit-finder app is designed to work seamlessly when embedded as an iframe in a Shopify store. It can add products directly to the parent store's cart using Shopify's AJAX Cart API.

## Integration Steps

### 1. Embed the Iframe in Your Shopify Store

Add this code to your Shopify template (e.g., in a page template or custom section):

```html
<!-- Fit Finder Iframe -->
<div class="fit-finder-container">
  <iframe 
    id="fit-finder-iframe"
    src="https://your-fit-finder-domain.com"
    width="100%" 
    height="400"
    frameborder="0"
    style="border: none; border-radius: 8px; overflow: hidden;"
    loading="lazy">
  </iframe>
</div>

<!-- Include the iframe height handler script -->
<script src="https://your-fit-finder-domain.com/iframe-height-handler.js"></script>

<!-- Measurements Auto-Population Script -->
<script>
// Auto-populate special instructions with measurements from fit-finder
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const measurementsParam = urlParams.get('measurements');
  
  if (measurementsParam) {
    try {
      const measurements = JSON.parse(decodeURIComponent(measurementsParam));
      
      // Try multiple selectors for different themes
      const selectors = [
        'textarea[name*="special instructions" i]',
        'textarea[name*="special instructions for seller" i]',
        'textarea[name*="note" i]',
        'textarea[name*="message" i]',
        'textarea[name*="instructions" i]',
        'textarea[name*="comment" i]',
        'textarea[name*="order note" i]',
        'textarea[name*="customer note" i]'
      ];
      
      let instructionsField = null;
      for (const selector of selectors) {
        instructionsField = document.querySelector(selector);
        if (instructionsField) break;
      }
      
      if (instructionsField) {
        const instructions = `Dog Measurements from Fit-Finder:
Breed: ${measurements.breed}
Neck: ${measurements.neck}" 
Chest: ${measurements.chest}"
Length: ${measurements.length}"
Tail: ${measurements.tail}
Chondrodystrophic: ${measurements.chondro ? 'Yes' : 'No'}

Please use these measurements for sizing.`;
        
        instructionsField.value = instructions;
        instructionsField.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('Fit-Finder: Measurements auto-populated in special instructions');
      }
    } catch (error) {
      console.log('Fit-Finder: Error parsing measurements:', error);
    }
  }
});
</script>

<style>
.fit-finder-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

#fit-finder-iframe {
  min-height: 400px;
  transition: height 0.3s ease-in-out;
}

@media (max-width: 768px) {
  .fit-finder-container {
    padding: 10px;
  }
}
</style>
```

### 2. Listen for Cart Events (Optional)

Add this JavaScript to handle cart update events from the iframe:

```html
<script>
// Listen for messages from the fit-finder iframe
window.addEventListener('message', function(event) {
  // Verify the origin for security
  if (event.origin !== 'https://your-fit-finder-domain.com') {
    return;
  }
  
  if (event.data.type === 'PRODUCT_ADDED_TO_CART') {
    console.log('Product added to cart:', event.data);
    
    // Update cart UI (if your theme supports it)
    if (window.Shopify && window.Shopify.theme && window.Shopify.theme.cartDrawer) {
      window.Shopify.theme.cartDrawer.open();
    }
    
    // Or trigger a custom cart refresh
    if (typeof refreshCart === 'function') {
      refreshCart();
    }
    
    // Show a notification (optional)
    showCartNotification(event.data.productTitle);
  }
});

// Optional: Custom notification function
function showCartNotification(productTitle) {
  // Create a simple notification
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    ">
      ✅ ${productTitle} added to cart!
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}
</script>
```

### 3. Create a Dedicated Page (Recommended)

Create a new page template in your Shopify theme:

1. Go to **Online Store > Themes > Actions > Edit Code**
2. Create a new template: `templates/page.fit-finder.liquid`
3. Add the following content:

```liquid
<div class="page-width">
  <div class="page-header">
    <h1 class="page-title">{{ page.title }}</h1>
    {% if page.content != blank %}
      <div class="page-content">
        {{ page.content }}
      </div>
    {% endif %}
  </div>
  
  <!-- Fit Finder Iframe -->
  <div class="fit-finder-wrapper">
    <iframe 
      id="fit-finder-iframe"
      src="https://your-fit-finder-domain.com"
      width="100%" 
      height="400"
      frameborder="0"
      style="border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;"
      loading="lazy">
      <p>Your browser doesn't support iframes. <a href="https://your-fit-finder-domain.com" target="_blank">Click here to open the fit finder</a>.</p>
    </iframe>
  </div>
</div>

<style>
.fit-finder-wrapper {
  margin: 30px 0;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
}

#fit-finder-iframe {
  background: white;
  min-height: 400px;
  transition: height 0.3s ease-in-out;
}

@media (max-width: 768px) {
  .fit-finder-wrapper {
    padding: 10px;
    margin: 20px 0;
  }
}
</style>

<!-- Measurements Auto-Population Script -->
<script>
// Auto-populate special instructions with measurements from fit-finder
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const measurementsParam = urlParams.get('measurements');
  
  if (measurementsParam) {
    try {
      const measurements = JSON.parse(decodeURIComponent(measurementsParam));
      
      // Try multiple selectors for different themes
      const selectors = [
        'textarea[name*="special instructions" i]',
        'textarea[name*="special instructions for seller" i]',
        'textarea[name*="note" i]',
        'textarea[name*="message" i]',
        'textarea[name*="instructions" i]',
        'textarea[name*="comment" i]',
        'textarea[name*="order note" i]',
        'textarea[name*="customer note" i]'
      ];
      
      let instructionsField = null;
      for (const selector of selectors) {
        instructionsField = document.querySelector(selector);
        if (instructionsField) break;
      }
      
      if (instructionsField) {
        const instructions = `Dog Measurements from Fit-Finder:
Breed: ${measurements.breed}
Neck: ${measurements.neck}" 
Chest: ${measurements.chest}"
Length: ${measurements.length}"
Tail: ${measurements.tail}
Chondrodystrophic: ${measurements.chondro ? 'Yes' : 'No'}

Please use these measurements for sizing.`;
        
        instructionsField.value = instructions;
        instructionsField.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Optional: Scroll to the field to show it's been populated
        instructionsField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        console.log('Fit-Finder: Measurements auto-populated in special instructions');
      } else {
        console.log('Fit-Finder: Special instructions field not found');
      }
    } catch (error) {
      console.log('Fit-Finder: Error parsing measurements:', error);
    }
  }
});
</script>

<!-- Cart Integration Script -->
<script>
window.addEventListener('message', function(event) {
  if (event.origin !== 'https://your-fit-finder-domain.com') return;
  
  if (event.data.type === 'PRODUCT_ADDED_TO_CART') {
    console.log('Fit Finder: Product added to cart', event.data);
    
    // Try to open cart drawer (theme-dependent)
    setTimeout(() => {
      if (window.Shopify?.theme?.cartDrawer?.open) {
        window.Shopify.theme.cartDrawer.open();
      } else if (document.querySelector('[data-cart-drawer]')) {
        document.querySelector('[data-cart-drawer]').classList.add('active');
      }
    }, 500);
    
    // Refresh cart count if element exists
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        const cartCount = document.querySelector('.cart-count, [data-cart-count]');
        if (cartCount) {
          cartCount.textContent = cart.item_count;
        }
      })
      .catch(err => console.log('Cart refresh failed:', err));
  }
});
</script>
```

4. Create a new page in your Shopify admin:
   - Go to **Online Store > Pages > Add page**
   - Title: "Dog Coat Fit Finder"
   - Template: Select your new "fit-finder" template
   - URL: `/pages/fit-finder`

## How It Works

### Measurements Auto-Population

The fit-finder app automatically includes user measurements in product URLs, which can be used to populate the "special instructions for seller" field:

1. **URL Parameters**: Measurements are passed as JSON in the URL
2. **Auto-Population**: JavaScript detects and populates the special instructions field
3. **Formatted Display**: Measurements are displayed in a clear, readable format
4. **Theme Compatible**: Works with most Shopify themes

### Iframe Height Management

The fit-finder app automatically adjusts its iframe height to match the content, eliminating scrollbars:

1. **Automatic Height Detection**: The app uses ResizeObserver to detect content changes
2. **Parent Communication**: Height updates are sent to the parent window via postMessage
3. **Smooth Transitions**: Height changes are animated for a professional appearance
4. **Responsive Design**: Height adjusts automatically on window resize

**Key Features:**
- No scrollbars in the iframe
- Smooth height transitions (0.3s ease-in-out)
- Minimum height of 400px for better UX
- Automatic height updates on content changes
- Responsive to parent window resize

### Cart Addition Process

1. **User selects fit results** in the iframe
2. **Clicks "Add to Cart"** on a recommended product
3. **Iframe makes AJAX request** to `/cart/add.js` endpoint
4. **Product is added** to the parent store's cart
5. **Success message** is shown to the user
6. **Parent window is notified** via postMessage
7. **Cart drawer/UI is updated** (if supported by theme)

### Fallback Mechanisms

The app includes multiple fallback methods:

1. **Primary**: Shopify AJAX Cart API (`/cart/add.js`)
2. **Secondary**: Direct cart URL (`/cart/VARIANT_ID:QUANTITY`)
3. **Tertiary**: Parent window redirect to cart page

### Browser Compatibility

- **Modern browsers**: Full AJAX cart functionality
- **Older browsers**: Falls back to cart page redirects
- **Mobile devices**: Optimized for touch interactions

## Environment Configuration

Make sure your fit-finder app has the correct environment variables:

```env
NEXT_PUBLIC_SHOPIFY_STORE_URL=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-token
```

## Security Considerations

### CORS Configuration

Ensure your iframe domain is allowed:

```javascript
// In your fit-finder app, add domain validation
const allowedDomains = [
  'your-store.myshopify.com',
  'your-custom-domain.com'
];

// Validate parent domain
const validateParentDomain = () => {
  try {
    const parentDomain = window.parent.location.hostname;
    return allowedDomains.includes(parentDomain);
  } catch (e) {
    return false; // Cross-origin restriction
  }
};
```

### Message Validation

Always validate messages from the iframe:

```javascript
window.addEventListener('message', function(event) {
  // Verify origin
  if (!event.origin.includes('your-fit-finder-domain.com')) {
    return;
  }
  
  // Validate message structure
  if (event.data && event.data.type === 'PRODUCT_ADDED_TO_CART') {
    // Handle the message
  }
});
```

## Testing

### Local Testing

1. Set up a local tunnel (ngrok, localtunnel, etc.)
2. Use the tunnel URL in your Shopify iframe
3. Test cart functionality with real products

### Production Testing

1. Deploy your fit-finder app
2. Update iframe src in Shopify
3. Test with various product types and browser conditions

## Troubleshooting

### Common Issues

1. **Cart not updating**: Check browser console for CORS errors
2. **Iframe not loading**: Verify domain settings and HTTPS
3. **Products not found**: Ensure variant IDs are correct
4. **Theme compatibility**: Some themes may need custom cart refresh logic

### Debug Information

The app provides detailed console logging:

```javascript
// Check browser console for:
console.log('Successfully added PRODUCT_NAME to cart:', cartData);
console.log('AJAX cart API failed, trying direct cart URL method:', error);
console.log('Could not trigger cart drawer, but item was added successfully');
```

## Performance Optimization

### Iframe Loading

Use lazy loading for better page performance:

```html
<iframe loading="lazy" src="..."></iframe>
```

### Cache Management

Set appropriate cache headers for the iframe content:

```
Cache-Control: public, max-age=3600
```

## Support

If you encounter issues:

1. Check browser developer console for errors
2. Verify Shopify Cart API is enabled
3. Test with different browsers and devices
4. Ensure HTTPS is properly configured

The fit-finder app is designed to work seamlessly with most Shopify themes and provides robust fallback mechanisms for maximum compatibility.
