# Enhanced Pattern Fit Finder

This directory contains the enhanced pattern finding system that integrates with Shopify products and provides categorized results with all 4 product types.

## Components

### `EnhancedFitFinder.tsx`
The main component that provides:
- **Top 3 Categories**: Best Fit, Good Fit, Might Fit
- **4 Product Types**: Rain Coat (RC), Tummy Warmer (TW), Winter Coat (WC), Cooling Coat (CC)
- **SKU Pattern Matching**: Filters Shopify products by pattern codes
- **Interactive Product Browsing**: Tabbed interface for each product type

### `AdvancedFitFinder.tsx`
The original advanced fit finder with detailed scoring and measurements.

## Features

### 🎯 **Categorized Results**
- **Best Fit**: Score ≥ 0.85 (Top 3 patterns)
- **Good Fit**: Score 0.65-0.84 (Top 3 patterns)  
- **Might Fit**: Score 0.5-0.64 (Top 3 patterns)
- **Poor Fit**: Score < 0.5 (Filtered out)

### 🛍️ **Product Type Integration**
Each pattern shows all 4 product types:
- **RC** - Rain Coat
- **TW** - Tummy Warmer
- **WC** - Winter Coat  
- **CC** - Cooling Coat

### 🔍 **SKU Pattern Matching**
Products are filtered using SKU patterns like:
- `"TW-VS-XS-BG-RCB"` → Tummy Warmer, Vizsla, XS, Burgundy, RCB
- `"RC-BG-M-BL-001"` → Rain Coat, Beagle, Medium, Blue, 001

### 📊 **Enhanced Scoring Display**
- Individual scores for neck, chest, and length fit
- Visual progress bars for each measurement
- Color-coded scoring (green, blue, yellow, red)
- Detailed fit notes and recommendations

## API Integration

### `/api/shopify/products/by-pattern`
Filters Shopify products by pattern code and optionally by product type.

**Query Parameters:**
- `patternCode` (required): Pattern code like "VS-XS"
- `productType` (optional): RC, TW, WC, or CC
- `limit` (optional): Number of products to return

**Example:**
```
GET /api/shopify/products/by-pattern?patternCode=VS-XS&productType=TW
```

**Response:**
```json
{
  "ok": true,
  "products": [...],
  "patternCode": "VS-XS",
  "productType": "TW",
  "total": 5
}
```

## Usage

### Basic Usage
```tsx
import EnhancedFitFinder from '@/components/EnhancedFitFinder';

export default function MyPage() {
  return <EnhancedFitFinder />;
}
```

### Programmatic Usage
```typescript
import { findPatterns } from '@/utils/patternFinder';
import { getTop3PatternsWithProducts } from '@/lib/patternProducts';

// Get categorized results
const categorizedResults = findPatterns(userInput, patternsFromCsv);

// Enhance with products
const enhancedResults = await getTop3PatternsWithProducts(categorizedResults);
```

## SKU Pattern Format

The system expects SKUs in the format:
```
{PRODUCT_TYPE}-{PATTERN_CODE}-{SIZE}-{COLOR}-{VARIANT}
```

**Examples:**
- `TW-VS-XS-BG-RCB` - Tummy Warmer, Vizsla XS, Burgundy, RCB variant
- `RC-BG-M-BL-001` - Rain Coat, Beagle Medium, Blue, 001 variant
- `WC-GH-L-GR-002` - Winter Coat, Greyhound Large, Green, 002 variant
- `CC-CH-S-RD-003` - Cooling Coat, Chihuahua Small, Red, 003 variant

## Product Type Mapping

```typescript
const PRODUCT_TYPES = {
  'RC': 'Rain Coat',
  'TW': 'Tummy Warmer', 
  'WC': 'Winter Coat',
  'CC': 'Cooling Coat'
};
```

## Pattern Code Mapping

Pattern codes from the CSV data map to breed-specific patterns:
- `BG-S` → Beagle Small
- `VS-M` → Vizsla Medium  
- `GH-L` → Greyhound Large
- `CH-XS` → Chihuahua Extra Small

## File Structure

```
src/
├── components/
│   ├── EnhancedFitFinder.tsx    # Main enhanced component
│   ├── AdvancedFitFinder.tsx    # Original advanced component
│   └── ui/
│       └── tabs.tsx             # Tabs UI component
├── lib/
│   └── patternProducts.ts       # Product fetching logic
├── utils/
│   └── patternFinder.ts         # Core pattern finding logic
└── app/
    ├── enhanced-fit/
    │   └── page.tsx             # Enhanced fit page
    └── api/
        └── shopify/
            └── products/
                └── by-pattern/
                    └── route.ts # Pattern filtering API
```

## Performance Considerations

- **Parallel Product Fetching**: All 4 product types fetched simultaneously
- **Caching**: API responses cached for better performance
- **Lazy Loading**: Products loaded only when pattern is selected
- **Error Handling**: Graceful fallbacks for missing products

## Testing

The system includes comprehensive error handling:
- Missing products show "No products available" message
- Invalid SKUs are filtered out automatically
- Network errors are handled gracefully
- Pattern matching is case-insensitive

## Future Enhancements

- **Color Filtering**: Filter products by color codes
- **Size Variants**: Show all available sizes for each product type
- **Price Comparison**: Compare prices across product types
- **Inventory Status**: Show stock availability
- **Product Images**: Display product images from Shopify
