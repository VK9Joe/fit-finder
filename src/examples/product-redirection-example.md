# Product Redirection with Color Fallback

This example demonstrates how the enhanced fit finder now redirects users to product detail pages instead of adding items directly to cart, with intelligent color fallback when preferred colors are out of stock.

## How It Works

### 1. Color Fallback Logic
When a product has multiple color variants, the system:
1. **Prioritizes available colors** based on a predefined priority list
2. **Falls back to next available color** if the preferred one is out of stock
3. **Shows the selected color** in the product card

### 2. Product Redirection
Instead of adding to cart, the "View Product" button:
1. **Redirects to the product detail page** using the product handle
2. **Works in iframe contexts** (for Shopify store embedding)
3. **Shows all available colors and options** on the product page

## Example Flow

### User Journey
1. User completes fit finder form
2. System finds matching patterns (e.g., "BG-S" for Beagle Small)
3. For each product type (RC, TW, WC, CC), system:
   - Finds all color variants for that pattern
   - Selects the best available color using fallback logic
   - Displays the product card with selected color

### Color Priority Example
For a **Tummy Warmer (TW)** in **Winter**:
- Priority: `['RD', 'OR', 'BR', 'BK', ...]` (warm colors first)
- If Red is out of stock → tries Orange
- If Orange is out of stock → tries Brown
- And so on...

### Product URL Construction
```
Base URL: https://k9apparel.com
Product Handle: beagle-dog-tummy-warmer
Final URL: https://k9apparel.com/products/beagle-dog-tummy-warmer
```

## Code Example

```tsx
// Color fallback selection
const selectedVariant = selectBestAvailableColor(colorVariants, customColorPriority);

// Product redirection
const viewProduct = (productHandle: string, productTitle: string) => {
  const productUrl = `${shopifyDomain}/products/${productHandle}`;
  window.location.href = productUrl;
};
```

## Benefits

### For Users
- **See all available colors** and options on the product page
- **Compare different variants** before purchasing
- **Access full product information** including reviews, sizing, etc.
- **Better shopping experience** with complete product details

### For Store Owners
- **Higher conversion rates** as users see all options
- **Reduced cart abandonment** from incomplete product information
- **Better inventory management** as users can see what's actually available
- **Improved customer satisfaction** with transparent availability

## Configuration

### Color Priority
Customize color preferences in `src/lib/color-fallback.ts`:

```typescript
export const COLOR_PRIORITY = [
  'BL',  // Blue (most preferred)
  'BG',  // Burgundy
  'RD',  // Red
  'GR',  // Green
  // ... more colors
];
```

### Seasonal Adjustments
Colors automatically adjust based on season:
- **Spring**: Green, Yellow, Pink, Light Blue
- **Summer**: White, Light Blue, Yellow, Teal
- **Fall**: Orange, Brown, Red, Gray
- **Winter**: Black, Navy, White, Red

### Product Type Preferences
Different product types have different color preferences:
- **Rain Coats**: Darker colors (Black, Navy, Dark Blue)
- **Winter Coats**: Warm colors (Red, Orange, Brown)
- **Cooling Coats**: Light colors (White, Light Blue, Teal)
- **Tummy Warmers**: Neutral colors (Black, White, Gray)

## Debug Information

The API now provides detailed debug information:

```json
{
  "debug": {
    "season": "winter",
    "selectedColorsByType": {
      "TW": [{
        "color": "RD",
        "available": true,
        "sku": "TW-BG-S-RD-001"
      }]
    }
  }
}
```

## Testing

To test the color fallback:
1. Set some color variants as out of stock in Shopify
2. Run the fit finder with a matching pattern
3. Check the console logs to see color selection process
4. Verify the selected color is the best available option

## Future Enhancements

- **Color swatches** in the product cards
- **Multiple color options** displayed per product type
- **Color preference learning** based on user behavior
- **Dynamic color recommendations** based on breed characteristics
