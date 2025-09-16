import { CoatPattern, UserInput, AdvancedFitResult } from '@/types';

// Re-export types from the main types file
export type { UserInput, AdvancedFitResult };

// Breed alias mapping from the document
const breedAliases: Record<string, string> = {
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
  'labrador retriever': 'GR', // Alternative breed for GR
  'german shorthaired pointer': 'GSP',
  'dalmatian': 'GSP', // Alternative breed for GSP
  'italian greyhound': 'IG',
  'jack russell terrier': 'JR',
  'miniature dachshund': 'MD',
  'miniature pinscher': 'MP',
  'miniature poodle': 'MPD',
  'pug': 'PG',
  'rhodesian ridgeback': 'RR',
  'german shepherd': 'RR', // Alternative breed for RR
  'rat terrier': 'RT',
  'vizsla': 'VS',
  'weimaraner': 'WM',
  'whippet': 'WP'
};

/**
 * Normalize breed name for matching
 */
function normalizeBreed(breed: string): string {
  return breed.toLowerCase().trim();
}

/**
 * Get pattern key for breed
 */
function getPatternKey(breed: string): string | null {
  const normalizedBreed = normalizeBreed(breed);
  return breedAliases[normalizedBreed] || null;
}

/**
 * Calculate neck fit score using asymmetrical gaussian curve
 * Based on the document's scoring logic
 */
function calculateNeckScore(
  userNeck: number,
  acceptableLow: number,
  idealLow: number,
  idealHigh: number,
  acceptableHigh: number
): { score: number; note?: string; disqualified: boolean } {
  // Disqualification: outside acceptable range
  if (userNeck < acceptableLow || userNeck > acceptableHigh) {
    return { score: 0, disqualified: true };
  }

  // Calculate score using gaussian curve approximation
  let score: number;
  let note: string | undefined;

  if (userNeck >= idealLow && userNeck <= idealHigh) {
    // Ideal range - score 1.0
    score = 1.0;
  } else if (userNeck < idealLow) {
    // Between acceptable low and ideal low - score 0.5 to 1.0
    const range = idealLow - acceptableLow;
    const position = (userNeck - acceptableLow) / range;
    score = 0.5 + (position * 0.5);
    note = "The neck on this pattern may be slightly roomy for your pup.";
  } else {
    // Between ideal high and acceptable high - score 0.5 to 1.0
    const range = acceptableHigh - idealHigh;
    const position = (userNeck - idealHigh) / range;
    score = 1.0 - (position * 0.5);
    note = "The neck on this pattern may be slightly snug for your pup, but it is within the acceptable range.";
  }

  return { score: Math.max(0.5, Math.min(1.0, score)), note, disqualified: false };
}

/**
 * Calculate chest fit score using linear ranges
 * Based on the document's scoring logic
 */
function calculateChestScore(
  userChest: number,
  acceptableLow: number,
  acceptableHigh: number
): { score: number; note: string; disqualified: boolean } {
  // Disqualification: outside acceptable range
  if (userChest < acceptableLow || userChest > acceptableHigh) {
    return { score: 0, disqualified: true, note: "" };
  }

  // Ideal chest fit is equal to Chest_Acceptable_Low + 1.0
  const idealChest = acceptableLow + 1.0;
  
  let score: number;
  let note: string;

  if (userChest >= idealChest - 1.0 && userChest <= idealChest + 1.0) {
    // Within 1.0 of ideal chest fit
    score = 1.0;
    note = "The chest on this pattern is within the ideal range for your pup.";
  } else {
    // Within acceptable range but not ideal
    score = 0.85;
    note = "The chest fit on this pattern falls within the acceptable range for your pup's measurements.";
  }

  return { score, note, disqualified: false };
}

/**
 * Calculate length fit score based on tail type
 * Based on the document's tail type dependent logic
 */
function calculateLengthScore(
  userLength: number,
  patternLength: number,
  tailType: UserInput['tailType']
): { score: number; note: string; disqualified: boolean } {
  const lengthRatio = patternLength / userLength;
  let score: number;
  let note: string;

  switch (tailType) {
    case 'down/tucked':
      // Pattern allowed to be longer than dog's body
      // Ideal: 5-15% longer (1.05-1.15)
      if (lengthRatio >= 1.05 && lengthRatio <= 1.15) {
        score = 1.0;
      } else if (lengthRatio >= 1.0 && lengthRatio < 1.05) {
        // 0-5% longer: rising from 0.75 to 1.0
        score = 0.75 + ((lengthRatio - 1.0) / 0.05) * 0.25;
      } else if (lengthRatio > 1.15 && lengthRatio <= 1.25) {
        // 15-25% longer: falling from 1.0 to 0.75
        score = 1.0 - ((lengthRatio - 1.15) / 0.10) * 0.25;
      } else {
        score = 0.75;
      }
      note = "This pattern will provide some extra coverage for your pup without interfering with tail function.";
      break;

    case 'straight':
      // Score 0.75 at 90%, rising to 1.0 at 105%, then falling to 0.75 at 110%
      if (lengthRatio >= 0.90 && lengthRatio < 1.05) {
        score = 0.75 + ((lengthRatio - 0.90) / 0.15) * 0.25;
      } else if (lengthRatio >= 1.05 && lengthRatio <= 1.10) {
        score = 1.0 - ((lengthRatio - 1.05) / 0.05) * 0.25;
      } else {
        score = 0.75;
      }
      note = "This pattern should land at just the right spot for your pup without impeding tail function or risk of soiling.";
      break;

    case 'bobbed/docked':
    case 'up or curly':
      // Score 0.75 at 90%, rising to 1.0 at 95%, then falling to 0.75 at 105%
      if (lengthRatio >= 0.90 && lengthRatio < 0.95) {
        score = 0.75 + ((lengthRatio - 0.90) / 0.05) * 0.25;
      } else if (lengthRatio >= 0.95 && lengthRatio <= 1.05) {
        score = 1.0 - ((lengthRatio - 0.95) / 0.10) * 0.25;
      } else {
        score = 0.75;
      }
      note = "This pattern should provide sufficient coverage for your pup without impeding tail function or risk of soiling.";
      break;

    default:
      score = 0.75;
      note = "This pattern should provide adequate coverage for your pup.";
  }

  // Disqualification: Score < 0.75
  const disqualified = score < 0.75;
  return { score: Math.max(0, score), note, disqualified };
}

/**
 * Calculate final score and determine fit label
 */
function calculateFinalScore(
  neckScore: number,
  chestScore: number,
  lengthScore: number,
  breedMatch: boolean
): { finalScore: number; fitLabel: AdvancedFitResult['fitLabel'] } {
  // Apply breed penalty if no match
  const breedPenalty = breedMatch ? 0 : -0.1;
  
  // Calculate weighted average of the scores (neck 35%, chest 40%, length 25%)
  const weightedScore = (neckScore * 0.35) + (chestScore * 0.40) + (lengthScore * 0.25);
  const finalScore = Math.max(0, Math.min(1.0, weightedScore + breedPenalty));

  // Determine fit label based on final score
  let fitLabel: AdvancedFitResult['fitLabel'];
  if (finalScore >= 0.85) {
    fitLabel = 'Best Fit';
  } else if (finalScore >= 0.65) {
    fitLabel = 'Good Fit';
  } else if (finalScore >= 0.5) {
    fitLabel = 'Might Fit';
  } else {
    fitLabel = 'Poor Fit';
  }

  return { finalScore, fitLabel };
}

/**
 * Categorized fit results interface
 */
export interface CategorizedFitResults {
  bestFit: AdvancedFitResult[];
  goodFit: AdvancedFitResult[];
  mightFit: AdvancedFitResult[];
  poorFit: AdvancedFitResult[];
}

/**
 * Main pattern finding function - returns top 3 categories
 */
export function findPatterns(
  userInput: UserInput,
  allPatterns: CoatPattern[]
): CategorizedFitResults {
  const results: AdvancedFitResult[] = [];
  const userPatternKey = getPatternKey(userInput.breed);

  for (const pattern of allPatterns) {
    const measurements = pattern.measurements;
    const fitNotes: string[] = [];
    let disqualified = false;
    let disqualificationReason: string | undefined;

    // Check breed match
    const breedMatch = userPatternKey === pattern.patternCode.split('-')[0];
    if (!breedMatch) {
      // Apply breed penalty but don't disqualify
    }

    // Calculate neck score
    const neckResult = calculateNeckScore(
      userInput.neckCircumference,
      measurements.minNeck,
      measurements.idealNeckMin ?? 0,
      measurements.idealNeckMax ?? 0,
      measurements.maxNeck
    );

    if (neckResult.disqualified) {
      disqualified = true;
      disqualificationReason = "Neck measurement outside acceptable range";
    } else {
      if (neckResult.note) {
        fitNotes.push(neckResult.note);
      }
    }

    // Calculate chest score
    const chestResult = calculateChestScore(
      userInput.chestCircumference,
      measurements.minChest,
      measurements.maxChest
    );

    if (chestResult.disqualified) {
      disqualified = true;
      disqualificationReason = "Chest measurement outside acceptable range";
    } else {
      fitNotes.push(chestResult.note);
    }

    // Calculate length score
    const lengthResult = calculateLengthScore(
      userInput.backLength,
      measurements.minLength, // Using minLength as the pattern length
      userInput.tailType
    );

    if (lengthResult.disqualified) {
      disqualified = true;
      disqualificationReason = "Length measurement outside acceptable range";
    } else {
      fitNotes.push(lengthResult.note);
    }

    // Add chondrodystrophic leg note if applicable
    if (userInput.chondrodystrophic) {
      fitNotes.push("Our patterns will generally fit the body/torso of chondrodystrophic pups, but in some cases the raincoat skirting may be too long and cause movement restrictions. We encourage you to try on your new product and promptly initiate a return if it does not fit.");
    }

    // Calculate final score and fit label
    const { finalScore, fitLabel } = calculateFinalScore(
      neckResult.score,
      chestResult.score,
      lengthResult.score,
      breedMatch
    );

    results.push({
      pattern,
      finalScore,
      fitLabel,
      neckScore: neckResult.score,
      chestScore: chestResult.score,
      lengthScore: lengthResult.score,
      fitNotes,
      disqualified,
      disqualificationReason
    });
  }

  // Filter out disqualified patterns and sort by score with tie-breaking
  const validResults = results
    .filter(result => !result.disqualified)
    .sort((a, b) => {
      // Primary sort: by final score (highest first)
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      
      // Tie-breaking: if same final score, sort by neck score (highest first)
      if (b.neckScore !== a.neckScore) {
        return b.neckScore - a.neckScore;
      }
      
      // Second tie-breaking: if same neck score, sort by chest score (highest first)
      if (b.chestScore !== a.chestScore) {
        return b.chestScore - a.chestScore;
      }
      
      // If all scores are equal, maintain original order
      return 0;
    });

  // Take only the top 3 results
  const topResults = validResults.slice(0, 3);

  // Categorize the top 3 results
  const categorized: CategorizedFitResults = {
    bestFit: topResults.filter(r => r.fitLabel === 'Best Fit'),
    goodFit: topResults.filter(r => r.fitLabel === 'Good Fit'),
    mightFit: topResults.filter(r => r.fitLabel === 'Might Fit'),
    poorFit: [] // We don't show poor fit in the top 3
  };

  return categorized;
}

/**
 * Get available tail types
 */
export function getTailTypes(): UserInput['tailType'][] {
  return ['down/tucked', 'bobbed/docked', 'straight', 'up or curly'];
}

/**
 * Get available breeds from the alias list
 */
export function getAvailableBreeds(): string[] {
  return Object.keys(breedAliases).sort();
}

/**
 * Product types mapping
 */
export const PRODUCT_TYPES = {
  'RC': 'Rain Coat',
  'TW': 'Tummy Warmer', 
  'WC': 'Winter Coat',
  'CC': 'Cooling Coat'
} as const;

export type ProductType = keyof typeof PRODUCT_TYPES;

/**
 * Parse SKU to extract product information
 * Example: "TW-VS-XS-BG-RCB" -> { productType: 'TW', patternCode: 'VS', size: 'XS', color: 'BG', variant: 'RCB' }
 */
export function parseSKU(sku: string): {
  productType: ProductType;
  patternCode: string;
  size: string;
  color: string;
  variant: string;
} | null {
  const parts = sku.split('-');
  if (parts.length < 4) return null;

  const productType = parts[0] as ProductType;
  const patternCode = parts[1];
  const size = parts[2];
  const color = parts[3];
  const variant = parts[4] || '';

  // Validate product type
  if (!PRODUCT_TYPES[productType]) return null;

  return {
    productType,
    patternCode,
    size,
    color,
    variant
  };
}

/**
 * Generate SKU pattern for a given pattern and product type
 * Example: patternCode="VS-XS", productType="TW" -> "TW-VS-XS"
 */
export function generateSKUPattern(patternCode: string, productType: ProductType): string {
  return `${productType}-${patternCode}`;
}

/**
 * Check if a product SKU matches a pattern
 */
export function doesSKUMatchPattern(sku: string, patternCode: string, productType?: ProductType): boolean {
  const parsed = parseSKU(sku);
  if (!parsed) return false;

  // Check if pattern matches (e.g., "VS-XS" matches "VS-XS")
  const patternMatch = parsed.patternCode === patternCode.split('-')[0] && 
                      parsed.size === patternCode.split('-')[1];

  // If product type specified, check that too
  if (productType) {
    return patternMatch && parsed.productType === productType;
  }

  return patternMatch;
}

/**
 * Get all product types for a given pattern
 */
export function getProductTypesForPattern(): ProductType[] {
  return Object.keys(PRODUCT_TYPES) as ProductType[];
}
