/**
 * Shopify Cart Integration for Iframe Usage
 * Handles adding products to cart when embedded in a Shopify store
 */

export interface CartItem {
  id: string; // variant ID
  quantity: number;
  properties?: Record<string, string>; // optional line item properties
}

export interface CartResponse {
  items: Array<{
    id: number;
    variant_id: number;
    title: string;
    price: number;
    quantity: number;
    sku: string;
  }>;
  item_count: number;
  total_price: number;
  currency: string;
}

/**
 * Add product to Shopify cart using AJAX API
 * Works best when embedded in Shopify store as iframe
 */
export async function addToShopifyCart(
  variantId: string,
  quantity: number = 1,
  properties?: Record<string, string>
): Promise<CartResponse> {
  const shopifyDomain = getShopifyDomain();
  
  const cartItem: CartItem = {
    id: variantId,
    quantity,
    ...(properties && { properties })
  };

  const response = await fetch(`https://${shopifyDomain}/cart/add.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cartItem)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add to cart: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Add multiple products to cart at once
 */
export async function addMultipleToShopifyCart(
  items: CartItem[]
): Promise<CartResponse> {
  const shopifyDomain = getShopifyDomain();

  const response = await fetch(`https://${shopifyDomain}/cart/add.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add multiple items to cart: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Get current cart contents
 */
export async function getShopifyCart(): Promise<CartResponse> {
  const shopifyDomain = getShopifyDomain();

  const response = await fetch(`https://${shopifyDomain}/cart.js`);
  
  if (!response.ok) {
    throw new Error(`Failed to get cart: ${response.status}`);
  }

  return response.json();
}

/**
 * Get Shopify store domain
 */
function getShopifyDomain(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || '';
  }

  // If we're in an iframe, try to get parent domain
  if (window.parent !== window) {
    try {
      return window.parent.location.hostname;
    } catch {
      // Cross-origin iframe, use env var
      return process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || window.location.hostname;
    }
  }

  return process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || window.location.hostname;
}

/**
 * Notify parent window about cart updates
 */
export function notifyParentWindow(
  type: string,
  data: Record<string, unknown>
) {
  if (typeof window !== 'undefined' && window.parent !== window) {
    window.parent.postMessage({
      type,
      timestamp: Date.now(),
      ...data
    }, '*');
  }
}

/**
 * Try to trigger cart drawer in parent Shopify theme
 */
export function triggerCartDrawer() {
  if (typeof window === 'undefined' || window.parent === window) {
    return false;
  }

  try {
    const parent = window.parent as Window & {
      Shopify?: {
        theme?: {
          cartDrawer?: {
            open: () => void;
          };
        };
      };
      CartDrawer?: {
        open: () => void;
      };
      theme?: {
        cart?: {
          open: () => void;
        };
      };
      document: Document;
    };
    
    // Try common Shopify theme cart functions
    if (parent.Shopify?.theme?.cartDrawer?.open) {
      parent.Shopify.theme.cartDrawer.open();
      return true;
    }
    
    if (parent.CartDrawer?.open) {
      parent.CartDrawer.open();
      return true;
    }
    
    if (parent.theme?.cart?.open) {
      parent.theme.cart.open();
      return true;
    }

    // Try to find and click cart drawer trigger
    const cartTriggers = [
      '[data-cart-drawer-trigger]',
      '[data-cart-toggle]',
      '.cart-drawer-trigger',
      '.js-cart-drawer-open',
      '#cart-drawer-toggle'
    ];

    for (const selector of cartTriggers) {
      const element = parent.document.querySelector(selector);
      if (element && 'click' in element && typeof (element as HTMLElement).click === 'function') {
        (element as HTMLElement).click();
        return true;
      }
    }

    // Dispatch custom event as fallback
    const event = new CustomEvent('openCartDrawer', {
      detail: { source: 'fit-finder-iframe' }
    });
    parent.document.dispatchEvent(event);
    
    return true;
  } catch (error) {
    console.log('Could not trigger cart drawer:', error);
    return false;
  }
}

/**
 * Update cart count in parent window
 */
export async function updateCartCount() {
  try {
    const cart = await getShopifyCart();
    
    if (typeof window !== 'undefined' && window.parent !== window) {
      const parent = window.parent as Window & {
        document: Document;
      };
      
      // Try to update cart count elements
      const countSelectors = [
        '.cart-count',
        '[data-cart-count]',
        '.js-cart-count',
        '#cart-count',
        '.header-cart-count'
      ];

      for (const selector of countSelectors) {
        const element = parent.document.querySelector(selector);
        if (element) {
          element.textContent = cart.item_count.toString();
        }
      }

      // Notify parent about count update
      notifyParentWindow('CART_COUNT_UPDATED', {
        itemCount: cart.item_count,
        totalPrice: cart.total_price
      });
    }
  } catch (error) {
    console.log('Could not update cart count:', error);
  }
}

/**
 * Generate cart URL for fallback redirect
 */
export function generateCartUrl(variantId: string, quantity: number = 1): string {
  const shopifyDomain = getShopifyDomain();
  return `https://${shopifyDomain}/cart/${variantId}:${quantity}`;
}

/**
 * Enhanced add to cart with all fallback mechanisms
 */
export async function enhancedAddToCart(
  variantId: string,
  productTitle: string,
  quantity: number = 1,
  properties?: Record<string, string>
): Promise<boolean> {
  try {
    // Method 1: Try AJAX Cart API
    const cartData = await addToShopifyCart(variantId, quantity, properties);
    
    // Notify parent window
    notifyParentWindow('PRODUCT_ADDED_TO_CART', {
      variantId,
      productTitle,
      quantity,
      cartData
    });
    
    // Try to trigger cart drawer
    triggerCartDrawer();
    
    // Update cart count
    updateCartCount();
    
    return true;
    
  } catch (ajaxError) {
    console.log('AJAX cart failed, trying direct URL method:', ajaxError);
    
    // Method 2: Direct cart URL redirect
    try {
      const cartUrl = generateCartUrl(variantId, quantity);
      
      if (window.parent !== window) {
        window.parent.location.href = cartUrl;
      } else {
        window.location.href = cartUrl;
      }
      
      return true;
    } catch (redirectError) {
      console.error('All cart methods failed:', redirectError);
      return false;
    }
  }
}

/**
 * Validate variant ID format
 */
export function isValidVariantId(variantId: string): boolean {
  // Shopify variant IDs can be numbers or GIDs
  const numericPattern = /^\d+$/;
  const gidPattern = /^gid:\/\/shopify\/ProductVariant\/\d+$/;
  
  return numericPattern.test(variantId) || gidPattern.test(variantId);
}

/**
 * Extract numeric variant ID from GID
 */
export function extractVariantId(variantId: string): string {
  if (variantId.startsWith('gid://shopify/ProductVariant/')) {
    return variantId.split('/').pop() || variantId;
  }
  return variantId;
}
