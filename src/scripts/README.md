# CSV to JSON Migration Script

This script converts the breed size chart CSV data into structured JSON format for use in the Fit Finder application.

## Files Generated

- `src/data/patternsFromCsv.json` - Raw JSON data
- `src/data/patternsFromCsv.ts` - TypeScript module for direct import

## Usage

```bash
npm run migrate-csv
```

## What the Script Does

1. **Reads the CSV file**: `Breed Size Chart rev.2025.08.27 - Chart Measurements.csv`
2. **Parses measurement data**: Converts all numeric values and ranges
3. **Maps pattern codes**: Converts codes like "BG-S" to readable names
4. **Generates structured data**: Creates patterns with detailed measurements
5. **Adds metadata**: Includes pricing, descriptions, and target breeds

## Key Features

### Enhanced Measurements
- **Acceptable ranges** for neck, chest, and length
- **Ideal ranges** for better fit scoring
- **Multiple length types**: TW, RC, WC, CC lengths
- **Pattern finished measurements** for accuracy
- **Legacy measurements** for comparison

### Pattern Categories
- 23 different pattern categories
- 5 size variations (XS, S, M, L, XL)
- 91 total patterns converted

### Smart Mapping
- Pattern codes mapped to readable names
- Breed-specific targeting
- Dynamic pricing based on category and size
- Feature generation based on pattern type

## Data Structure

Each pattern includes:
```typescript
{
  id: string;
  name: string;
  breed: string;
  size: string;
  category: string;
  patternCode: string;
  measurements: {
    // Basic ranges
    minLength, maxLength,
    minNeck, maxNeck,
    minChest, maxChest,
    
    // Ideal ranges for better scoring
    idealNeckMin, idealNeckMax,
    idealChestMin, idealChestMax,
    
    // Multiple length measurements
    twLength, rcLength, wcLength, ccLength,
    
    // Pattern finished measurements
    patternFinishedNeck,
    patternFinishedChestMin, patternFinishedChestMax,
    
    // Legacy measurements
    oldNeckMin, oldNeckMax,
    oldChestMin, oldChestMax,
    oldLengthMin, oldLengthMax
  };
  productId: string;
  productUrl: string;
  price: number;
  imageUrl: string;
  description: string;
  features: string[];
  targetBreeds: string[];
}
```

## Integration

To use the converted data in your application:

```typescript
import { patternsFromCsv } from '@/data/patternsFromCsv';

// Use patternsFromCsv instead of realPatterns
const patterns = patternsFromCsv;
```

The converted data is fully compatible with your existing `CoatPattern` interface and can be used as a drop-in replacement for your current pattern data.
