# Advanced Pattern Finder

This directory contains the advanced pattern finding logic based on the official Pattern Fit Finder specifications from the Word document.

## Files

- `patternFinder.ts` - Core pattern finding logic and scoring algorithms
- `__tests__/patternFinder.test.ts` - Unit tests for the pattern finder

## Features

### 🎯 **Accurate Scoring System**
Based on the official Word document specifications:

1. **Neck Fit Scoring** - Asymmetrical gaussian curve (0.5-1.0 range)
2. **Chest Fit Scoring** - Linear ranges with ideal fit calculation
3. **Length Fit Scoring** - Tail type dependent logic
4. **Breed Matching** - Pattern key matching with penalty system

### 📏 **Measurement Precision**
- Neck circumference: to nearest 0.25 inch
- Chest circumference: to nearest 0.25 inch  
- Back length: to nearest 1.0 inch
- Tail type: 4 specific types supported
- Chondrodystrophic leg handling

### 🏷️ **Fit Labels**
- **Best Fit**: Score ≥ 0.85
- **Good Fit**: Score 0.65-0.84
- **Might Fit**: Score 0.5-0.64
- **Poor Fit**: Score < 0.5

### 🚫 **Disqualification Rules**
- Neck measurement outside acceptable range
- Chest measurement outside acceptable range
- Length score < 0.75
- Pattern not suitable for measurements

## Usage

### Basic Usage

```typescript
import { findPatterns, UserInput } from '@/utils/patternFinder';
import { patternsFromCsv } from '@/data/patternsFromCsv';

const userInput: UserInput = {
  breed: 'beagle',
  neckCircumference: 12.5,
  chestCircumference: 20.0,
  backLength: 16.0,
  tailType: 'straight',
  chondrodystrophic: false
};

const results = findPatterns(userInput, patternsFromCsv);
```

### Advanced Usage

```typescript
import { 
  findPatterns, 
  getTailTypes, 
  getAvailableBreeds,
  UserInput 
} from '@/utils/patternFinder';

// Get available options
const tailTypes = getTailTypes();
const breeds = getAvailableBreeds();

// Find patterns
const results = findPatterns(userInput, allPatterns);
```

## Scoring Algorithm Details

### Neck Scoring
- **Ideal Range**: Score = 1.0
- **Below Ideal**: Linear interpolation 0.5-1.0
- **Above Ideal**: Linear interpolation 1.0-0.5
- **Outside Range**: Disqualified

### Chest Scoring
- **Ideal Range**: Chest_Acceptable_Low + 1.0 ± 1.0
- **Within Ideal**: Score = 1.0
- **Within Acceptable**: Score = 0.85
- **Outside Range**: Disqualified

### Length Scoring (Tail Type Dependent)

#### Down/Tucked Tail
- **Ideal**: 5-15% longer than dog length
- **Range**: 0-25% longer
- **Score**: 0.75-1.0

#### Straight Tail
- **Ideal**: 90-110% of dog length
- **Score**: 0.75-1.0

#### Bobbed/Docked or Up/Curly Tail
- **Ideal**: 90-105% of dog length
- **Score**: 0.75-1.0

## Breed Matching

The system uses official breed aliases from the Word document:

```typescript
const breedAliases = {
  'beagle': 'BG',
  'boston terrier': 'BT',
  'boxer': 'BX',
  'chihuahua': 'CH',
  'dachshund': 'DA',
  'doberman pinscher': 'DP',
  'english bulldog': 'EB',
  'french bulldog': 'FB',
  'great dane': 'GD',
  'greyhound': 'GH',
  'golden retriever': 'GR',
  'labrador retriever': 'GR', // Alternative breed
  'german shorthaired pointer': 'GSP',
  'dalmatian': 'GSP', // Alternative breed
  'italian greyhound': 'IG',
  'jack russell terrier': 'JR',
  'miniature dachshund': 'MD',
  'miniature pinscher': 'MP',
  'miniature poodle': 'MPD',
  'pug': 'PG',
  'rhodesian ridgeback': 'RR',
  'german shepherd': 'RR', // Alternative breed
  'rat terrier': 'RT',
  'vizsla': 'VS',
  'weimaraner': 'WM',
  'whippet': 'WP'
};
```

## Fit Notes

The system generates contextual fit notes based on scoring:

- **Neck Notes**: "slightly roomy" or "slightly snug" warnings
- **Chest Notes**: "ideal range" or "acceptable range" feedback
- **Length Notes**: Tail-specific coverage guidance
- **Chondrodystrophic Notes**: Special leg length considerations

## Testing

Run the test suite:

```bash
npm test patternFinder
```

The tests verify:
- Pattern finding accuracy
- Score calculations
- Disqualification logic
- Breed matching
- Chondrodystrophic handling

## Integration

The pattern finder integrates with:
- `patternsFromCsv.ts` - Pattern data from CSV migration
- `AdvancedFitFinder.tsx` - React component for UI
- Type definitions in `types/index.ts`

## Performance

- Processes 91 patterns efficiently
- O(n) complexity for pattern matching
- Real-time scoring calculations
- Optimized for web performance
