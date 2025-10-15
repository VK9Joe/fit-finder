import { UserInput, CoatPattern, AdvancedFitResult, CategorizedFitResults } from '@/types';
import { logScoreBreakdown, logFitProcess } from './fitLogger';

// Re-export types from the main types file
export type { UserInput, AdvancedFitResult };

// Size abbreviation to full word mapping
const SIZE_MAPPING: Record<string, string> = {
  'XS': 'Extra Small',
  'S': 'Small', 
  'M': 'Medium',
  'L': 'Large',
  'XL': 'Extra Large'
};

/**
 * Convert size abbreviation to full word
 */
export function getFullSizeName(size: string): string {
  return SIZE_MAPPING[size] || size;
}

/**
 * Format pattern name with full size word
 */
export function formatPatternName(breed: string, size: string): string {
  const fullSize = getFullSizeName(size);
  return `${breed} - ${fullSize}`;
}

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
  'rat terrier': 'RT',
  'rhodesian ridgeback': 'RR',
  'german shepherd': 'RR', // Alternative breed for RR
  'vizsla': 'VS',
  'weimaraner': 'WM',
  'whippet': 'WP'
};

function normalizeBreed(breed: string): string {
  return breed.toLowerCase().trim();
}

function getPatternKey(breed: string): string | null {
  const normalizedBreed = normalizeBreed(breed);
  return breedAliases[normalizedBreed] || null;
}

/**
 * Calculate neck fit score using asymmetric bell curve
 * Exactly as specified in the document with Python implementation
 */
function calculateNeckScore(
  userNeck: number,
  acceptableLow: number,
  idealLow: number,
  idealHigh: number,
  acceptableHigh: number
): { score: number; note?: string; disqualified: boolean; maxCombinedScore?: number } {
  // Disqualification: outside acceptable range
  if (userNeck < acceptableLow || userNeck > acceptableHigh) {
    return { score: 0, disqualified: true };
  }

  // Calculate asymmetric bell curve parameters (from Python file)
  const values = [acceptableLow, acceptableHigh, idealLow, idealHigh];
  const sortedValues = [...values].sort((a, b) => a - b);
  const mu = (sortedValues[1] + sortedValues[2]) / 2; // True median
  
  // Target height at acceptable bounds = 0.5
  const targetHeight = 0.5;
  const k = Math.sqrt(-2.0 * Math.log(targetHeight));
  
  // Calculate different sigma values for left and right sides
  const sigmaLeft = (mu - acceptableLow) / k;
  const sigmaRight = (acceptableHigh - mu) / k;
  
  // Calculate score using asymmetric Gaussian
  let score: number;
  if (userNeck <= mu) {
    score = Math.exp(-0.5 * Math.pow((userNeck - mu) / sigmaLeft, 2));
  } else {
    score = Math.exp(-0.5 * Math.pow((userNeck - mu) / sigmaRight, 2));
  }
  
  // Apply document-specified notes and score limits
  let note: string | undefined;
  let maxCombinedScore: number | undefined;
  
  if (userNeck >= acceptableLow && userNeck < idealLow) {
    note = "The neck on this pattern may be slightly roomy for your pup.";
    maxCombinedScore = 0.79; // Limit combined score to 0.79
  } else if (userNeck > idealHigh && userNeck <= acceptableHigh) {
    note = "The neck on this pattern may be slightly snug for your pup, but it is within the acceptable range.";
    maxCombinedScore = 0.79; // Limit combined score to 0.79
  }
  
  // Ensure score is between 0.5 and 1.0 within acceptable range
  score = Math.max(0.5, Math.min(1.0, score));
  
  return { score, note, disqualified: false, maxCombinedScore };
}

/**
 * Calculate chest fit score exactly as specified in document
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

  // Per document: ideal chest fit = Chest_Acceptable_Low + 1.0
  const idealChest = acceptableLow + 1.0;
  
  let score: number;
  let note: string;

  // Document specifies:
  // - Score 0.6 at Chest_Acceptable_High
  // - Score rises linearly to 1.0 at ideal chest fit (Chest_Acceptable_Low + 1.0)  
  // - Score falls from 1.0 to 0.85 at Chest_Acceptable_Low
  
  if (userChest === idealChest) {
    score = 1.0;
    note = "The chest on this pattern is within the ideal range for your pup.";
  } else if (userChest >= acceptableLow && userChest < idealChest) {
    // Between acceptableLow and ideal: falling from 0.85 to 1.0
    const position = (userChest - acceptableLow) / (idealChest - acceptableLow);
    score = 0.85 + (position * 0.15);
    if (Math.abs(userChest - idealChest) <= 1.0) {
      note = "The chest on this pattern is within the ideal range for your pup.";
    } else {
      note = "The chest fit on this pattern falls within the acceptable range for your pup's measurements.";
    }
  } else if (userChest > idealChest && userChest <= acceptableHigh) {
    // Between ideal and acceptableHigh: falling from 1.0 to 0.6
    const position = (userChest - idealChest) / (acceptableHigh - idealChest);
    score = 1.0 - (position * 0.4);
    if (Math.abs(userChest - idealChest) <= 1.0) {
      note = "The chest on this pattern is within the ideal range for your pup.";
    } else {
      note = "The chest fit on this pattern falls within the acceptable range for your pup's measurements.";
    }
  } else {
    // Should not reach here due to disqualification check
    score = 0.6;
    note = "The chest fit on this pattern falls within the acceptable range for your pup's measurements.";
  }

  return { score: Math.max(0.6, Math.min(1.0, score)), note, disqualified: false };
}

/**
 * Calculate length fit score based on tail type - exactly per document
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
      // console.log('🎯 Down/Tucked Tail Logic:');
      // console.log('   Ideal point: Dog length × 1.15 (115%)');
      // console.log('   Scoring curve: Linear drop-off from ideal to range edges');
      
      // Down/Tucked Tail - Per document with proper linear drop-off
      if (lengthRatio <= 1.05) {
        // Below 105%: Linear drop from 0.75 at 105% to 0 at 0%
        score = Math.max(0, 0.75 + ((lengthRatio - 1.05) / 1.05) * 0.75);
        // console.log(`📉 Below range: ${(lengthRatio * 100).toFixed(1)}% → ${(score * 100).toFixed(1)}% score (linear drop)`);
        note = "The length on this pattern will provide some extra coverage beyond your pup's tailset without interfering with tail function or risk of soiling.";
      } else if (lengthRatio >= 1.05 && lengthRatio < 1.15) {
        // 105-115%: Rising from 0.75 to 1.0 (5-15% longer)
        score = 0.75 + ((lengthRatio - 1.05) / 0.10) * 0.25;
        // console.log(`📈 Rising curve: ${(lengthRatio * 100).toFixed(1)}% → ${(score * 100).toFixed(1)}% score`);
        // console.log(`   Calculation: 0.75 + ((${lengthRatio.toFixed(3)} - 1.05) / 0.10) × 0.25 = ${score.toFixed(3)}`);
        note = "The length on this pattern will provide some extra coverage beyond your pup's tailset without interfering with tail function or risk of soiling.";
      } else if (lengthRatio >= 1.15 && lengthRatio <= 1.25) {
        // 115-125%: Falling from 1.0 to 0.75 (15-25% longer)
        score = 1.0 - ((lengthRatio - 1.15) / 0.10) * 0.25;
        // console.log(`📉 Falling curve: ${(lengthRatio * 100).toFixed(1)}% → ${(score * 100).toFixed(1)}% score`);
        // console.log(`   Calculation: 1.0 - ((${lengthRatio.toFixed(3)} - 1.15) / 0.10) × 0.25 = ${score.toFixed(3)}`);
        note = "The length on this pattern will provide excellent additional coverage beyond your pup's tailset without interfering with tail function or risk of soiling.";
      } else {
        // Above 125%: Linear drop from 0.75 to 0
        score = Math.max(0, 0.75 - ((lengthRatio - 1.25) / 0.25) * 0.75);
        // console.log(`📉 Above range: ${(lengthRatio * 100).toFixed(1)}% → ${(score * 100).toFixed(1)}% score (linear drop)`);
        note = "The length on this pattern will provide excellent additional coverage beyond your pup's tailset without interfering with tail function or risk of soiling.";
      }
      break;

    case 'straight':
      // console.log('🎯 Straight Tail Logic:');
      // console.log('   Ideal point: Dog length × 1.05 (105%)');
      // console.log('   Scoring curve: Linear drop-off from ideal to range edges');
      
      // Straight Tail - Per document with proper linear drop-off
      if (lengthRatio <= 0.90) {
        // Below 90%: Linear drop from 0.75 at 90% to 0 at 0%
        score = Math.max(0, 0.75 + ((lengthRatio - 0.90) / 0.90) * 0.75);
        // console.log(`📉 Below range: ${(lengthRatio * 100).toFixed(1)}% → ${(score * 100).toFixed(1)}% score (linear drop)`);
        note = "The length on this pattern is slightly short for your pup but within the acceptable range. It should land at a good spot near your pup's tail and provide excellent coverage for the shoulders and back.";
      } else if (lengthRatio >= 0.90 && lengthRatio < 0.95) {
        // 90-95%: Rising from 0.75 towards 1.0
        score = 0.75 + ((lengthRatio - 0.90) / 0.15) * 0.25;
        // console.log(`📈 Rising curve: ${(lengthRatio * 100).toFixed(1)}% → ${(score * 100).toFixed(1)}% score`);
        // console.log(`   Calculation: 0.75 + ((${lengthRatio.toFixed(3)} - 0.90) / 0.15) × 0.25 = ${score.toFixed(3)}`);
        note = "The length on this pattern is slightly short for your pup but within the acceptable range. It should land at a good spot near your pup's tail and provide excellent coverage for the shoulders and back.";
      } else if (lengthRatio >= 0.95 && lengthRatio <= 1.05) {
        // 95-105%: Ideal range
        score = 0.75 + ((lengthRatio - 0.90) / 0.15) * 0.25;
        // console.log(`📈 Ideal range: ${(lengthRatio * 100).toFixed(1)}% → ${(score * 100).toFixed(1)}% score`);
        // console.log(`   Calculation: 0.75 + ((${lengthRatio.toFixed(3)} - 0.90) / 0.15) × 0.25 = ${score.toFixed(3)}`);
        note = "The length on this pattern is ideal for your pup. Expect it to land very close to your pup's tailset, provide excellent coverage for the shoulders and back, and not impede tail function or be at risk of soiling.";
      } else if (lengthRatio > 1.05 && lengthRatio <= 1.10) {
        // 105-110%: Falling from peak to 0.75
        score = 1.0 - ((lengthRatio - 1.05) / 0.05) * 0.25;
        // console.log(`📉 Falling curve: ${(lengthRatio * 100).toFixed(1)}% → ${(score * 100).toFixed(1)}% score`);
        // console.log(`   Calculation: 1.0 - ((${lengthRatio.toFixed(3)} - 1.05) / 0.05) × 0.25 = ${score.toFixed(3)}`);
        note = "The length on this pattern is slightly long for your pup, but still within the acceptable range. It should not impede tail function or be at risk of soiling.";
      } else {
        // Above 110%: Linear drop from 0.75 to 0
        score = Math.max(0, 0.75 - ((lengthRatio - 1.10) / 0.20) * 0.75);
        // console.log(`📉 Above range: ${(lengthRatio * 100).toFixed(1)}% → ${(score * 100).toFixed(1)}% score (linear drop)`);
        note = "The length on this pattern is slightly long for your pup, but still within the acceptable range. It should not impede tail function or be at risk of soiling.";
      }
      break;

    case 'bobbed/docked':
    case 'up or curly':
      // console.log('🎯 Docked/Bobbed/Up/Curly Tail Logic:');
      // console.log('   Ideal point: Dog length × 0.95 (95%)');
      // console.log('   Scoring curve: Linear drop-off from ideal to range edges');
      
      // Docked, Bobbed, Up, or Curly Tail - Per document with proper linear drop-off
      if (lengthRatio <= 0.90) {
        // Below 90%: Linear drop from 0.75 at 90% to 0 at 0%
        score = Math.max(0, 0.75 + ((lengthRatio - 0.90) / 0.90) * 0.75);
        // console.log(`📉 Below range: ${(lengthRatio * 100).toFixed(1)}% → ${(score * 100).toFixed(1)}% score (linear drop)`);
        note = "The length of this pattern is ideal for your pup's tail type. It will provide full coverage for your pup's shoulders and back without impeding tail function or risk of soiling.";
      } else if (lengthRatio >= 0.90 && lengthRatio < 0.95) {
        // 90-95%: Rising from 0.75 to 1.0
        score = 0.75 + ((lengthRatio - 0.90) / 0.05) * 0.25;
        // console.log(`📈 Rising curve: ${(lengthRatio * 100).toFixed(1)}% → ${(score * 100).toFixed(1)}% score`);
        // console.log(`   Calculation: 0.75 + ((${lengthRatio.toFixed(3)} - 0.90) / 0.05) × 0.25 = ${score.toFixed(3)}`);
        note = "The length of this pattern is ideal for your pup's tail type. It will provide full coverage for your pup's shoulders and back without impeding tail function or risk of soiling.";
      } else if (lengthRatio >= 0.95 && lengthRatio <= 1.05) {
        // 95-105%: Falling from 1.0 to 0.75
        score = 1.0 - ((lengthRatio - 0.95) / 0.10) * 0.25;
        // console.log(`📉 Falling curve: ${(lengthRatio * 100).toFixed(1)}% → ${(score * 100).toFixed(1)}% score`);
        // console.log(`   Calculation: 1.0 - ((${lengthRatio.toFixed(3)} - 0.95) / 0.10) × 0.25 = ${score.toFixed(3)}`);
        note = "The length of this pattern is at the longer end of the acceptable range for your pup's tail type. It will provide full coverage for your pup's shoulders and back without impeding tail function or risk of soiling.";
      } else {
        // Above 105%: Linear drop from 0.75 to 0
        score = Math.max(0, 0.75 - ((lengthRatio - 1.05) / 0.20) * 0.75);
        // console.log(`📉 Above range: ${(lengthRatio * 100).toFixed(1)}% → ${(score * 100).toFixed(1)}% score (linear drop)`);
        note = "The length of this pattern is at the longer end of the acceptable range for your pup's tail type. It will provide full coverage for your pup's shoulders and back without impeding tail function or risk of soiling.";
      }
      break;

    default:
      score = 0.75;
      note = "This pattern should provide adequate coverage for your pup.";
      // console.log('⚠️ Unknown tail type, using default score');
  }

  // Disqualification: Score < 0.75
  const disqualified = score < 0.75;
  
  // console.log(`🏁 Final length score: ${(score * 100).toFixed(1)}%`);
  if (disqualified) {
    // console.log('❌ DISQUALIFIED: Length score below 75% threshold');
  } else {
    // console.log('✅ Length score meets minimum threshold');
  }
  // console.groupEnd();

  return { score: Math.max(0, score), note, disqualified };
}

/**
 * Calculate final score exactly as specified in document
 */
function calculateFinalScore(
  neckScore: number,
  chestScore: number,
  lengthScore: number,
  breedMatch: boolean,
  maxCombinedScore?: number
): { finalScore: number; fitLabel: AdvancedFitResult['fitLabel'] } {
  // Per document: finalScore = (neckScore + chestScore + lengthScore) / 3
  let finalScore = (neckScore + chestScore + lengthScore) / 3;
  
  // Apply breed penalty if no match: -0.1 to final combined score
  if (!breedMatch) {
    finalScore -= 0.1;
  }
  
  // Apply neck-based combined score limit if specified
  if (maxCombinedScore !== undefined) {
    // console.log(`⚠️ Applying neck-based score limit: ${(finalScore * 100).toFixed(1)}% → ${(maxCombinedScore * 100).toFixed(1)}%`);
    finalScore = Math.min(finalScore, maxCombinedScore);
  }
  
  // Ensure score is between 0 and 1
  finalScore = Math.max(0, Math.min(1.0, finalScore));

  // Determine fit label based on document thresholds
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
 * Get the appropriate pattern length based on tail type and pattern code
 * For tucked tail breeds (GH, IG, WP, GD, RR) with down/tucked tails,
 * use RC (Rain Coat) length which is longer. Otherwise use TW (Tummy Warmer) length.
 */
function getPatternLength(
  pattern: CoatPattern,
  tailType: UserInput['tailType']
): number {
  const { measurements } = pattern;
  const patternPrefix = pattern.patternCode.split('-')[0];
  
  // List of tucked tail pattern codes - these patterns are designed for breeds with tucked tails
  const tuckedTailPatternPrefixes = ['GH', 'IG', 'WP', 'GD', 'RR'];
  
  // For down/tucked tails on tucked tail patterns, use RC (Rain Coat) or WC (Winter Coat) length
  // These are 15-20% longer than TW length to provide extra coverage for tucked tails
  if (tailType === 'down/tucked' && tuckedTailPatternPrefixes.includes(patternPrefix)) {
    return measurements.rcLength ?? measurements.wcLength ?? measurements.twLength ?? measurements.minLength ?? 0;
  }
  
  // For all other cases, use TW (Tummy Warmer) length as standard
  return measurements.twLength ?? measurements.minLength ?? 0;
}

/**
 * Find patterns using exact document specification
 */
export function findPatterns(
  userInput: UserInput,
  allPatterns: CoatPattern[]
): CategorizedFitResults {
  // console.log('🔍 Starting fit analysis for your dog...');
  // console.log(`Dog details: ${userInput.breed}, Neck: ${userInput.neckCircumference}", Chest: ${userInput.chestCircumference}", Length: ${userInput.backLength}", Tail: ${userInput.tailType}`);
  
  const results: AdvancedFitResult[] = [];
  
  // Get user's pattern key for breed matching
  const userPatternKey = getPatternKey(userInput.breed);

  // First filter: Only process patterns within acceptable neck range
  const neckFilteredPatterns = allPatterns.filter(pattern => {
    const measurements = pattern.measurements;
    return userInput.neckCircumference >= measurements.minNeck && 
           userInput.neckCircumference <= measurements.maxNeck;
  });

  // console.log(`📏 Neck filter: ${neckFilteredPatterns.length} patterns passed neck measurement filter out of ${allPatterns.length} total patterns`);

  for (const pattern of neckFilteredPatterns) {
    const measurements = pattern.measurements;
    const fitNotes: string[] = [];
    let disqualified = false;
    let disqualificationReason: string | undefined;

    // Check breed match
    const patternBreedCode = pattern.patternCode.split('-')[0];
    const breedMatch = userPatternKey === patternBreedCode;
    // console.log(`🐶 Breed match check: User breed "${userInput.breed}" → ${userPatternKey || 'none'} | Pattern ${pattern.patternCode} → ${patternBreedCode} | Match: ${breedMatch ? '✓' : '✗'}`);

    // Calculate neck score
    const neckResult = calculateNeckScore(
      userInput.neckCircumference,
      measurements.minNeck,
      measurements.idealNeckMin ?? measurements.minNeck,
      measurements.idealNeckMax ?? measurements.maxNeck,
      measurements.maxNeck
    );

    if (neckResult.disqualified) {
      disqualified = true;
      disqualificationReason = "Neck measurement outside acceptable range";
      continue;
    }

    if (neckResult.note) {
      fitNotes.push(neckResult.note);
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
      continue;
    }

    fitNotes.push(chestResult.note);

    // Calculate length score using appropriate length field for tail type
    const patternLength = getPatternLength(pattern, userInput.tailType);
    const lengthResult = calculateLengthScore(
      userInput.backLength,
      patternLength,
      userInput.tailType
    );

    if (lengthResult.disqualified) {
      disqualified = true;
      disqualificationReason = "Length score below threshold";
      continue;
    }

    fitNotes.push(lengthResult.note);

    // Add chondrodystrophic note if applicable
    if (userInput.chondrodystrophic) {
      fitNotes.push("Our patterns will generally fit the body/torso of chondrodystrophic (short legged) pups, but in some cases the raincoat skirting may be too long and cause movement restrictions. We encourage you to try on your new product and promptly initiate a return if it does not fit.");
    }

    // Add special note for tucked tail breed patterns
    const tuckedTailPatterns = [
      'GH-S', 'GH-M', 'GH-L', 'GH-XL',
      'IG-S', 'IG-M', 'IG-L', 'IG-XL',
      'WP-S', 'WP-M', 'WP-L', 'WP-XL',
      'GD-S', 'GD-M', 'GD-L', 'GD-XL',
      'RR-S', 'RR-M', 'RR-L', 'RR-XL'
    ];
    if (tuckedTailPatterns.includes(pattern.patternCode)) {
      fitNotes.push("This pattern group is specially designed to provide additional coverage for breeds with tucked tails. Raincoats and Winter Coats for this breed will fit as described. Tummy Warmers and Cooling Coats will fit as described in the neck and chest, and will be slightly shorter in length.");
    }

    // Calculate final score
    const finalResult = calculateFinalScore(
      neckResult.score,
      chestResult.score,
      lengthResult.score,
      breedMatch,
      neckResult.maxCombinedScore
    );

    // Create pattern with formatted name
    const patternWithFormattedName = {
      ...pattern,
      name: formatPatternName(pattern.category, pattern.size)
    };

    const result: AdvancedFitResult = {
      pattern: patternWithFormattedName,
      finalScore: finalResult.finalScore,
      fitLabel: finalResult.fitLabel,
      neckScore: neckResult.score,
      chestScore: chestResult.score,
      lengthScore: lengthResult.score,
      fitNotes,
      disqualified,
      disqualificationReason
    };

    results.push(result);

    // Log detailed breakdown for top patterns
    if (!disqualified && finalResult.finalScore >= 0.65) {
      logScoreBreakdown({
        neckScore: neckResult.score,
        chestScore: chestResult.score,
        lengthScore: lengthResult.score,
        finalScore: finalResult.finalScore,
        breedMatch,
        pattern,
        userInput
      });
    }
  }

  // Sort by final score (highest first)
  results.sort((a, b) => b.finalScore - a.finalScore);

  // Limit to top 3 results only
  const topResults = results.slice(0, 3);

  // Log overall process summary
  logFitProcess(userInput, topResults);

  // Categorize results based on document thresholds
  const categorized: CategorizedFitResults = {
    bestFit: topResults.filter(r => !r.disqualified && r.finalScore >= 0.85),
    goodFit: topResults.filter(r => !r.disqualified && r.finalScore >= 0.65 && r.finalScore < 0.85),
    mightFit: topResults.filter(r => !r.disqualified && r.finalScore >= 0.5 && r.finalScore < 0.65),
    poorFit: topResults.filter(r => r.disqualified || r.finalScore < 0.5)
  };

  return categorized;
}

export function getTailTypes(): UserInput['tailType'][] {
  return ['down/tucked', 'bobbed/docked', 'straight', 'up or curly'];
}

export function getAvailableBreeds(): string[] {
  return Object.keys(breedAliases).sort();
}

// Product types mapping
export const PRODUCT_TYPES = {
  'RC': 'Rain Coat',
  'TW': 'Tummy Warmer', 
  'WC': 'Winter Coat',
  'CC': 'Cooling Coat'
} as const;

export type ProductType = keyof typeof PRODUCT_TYPES;

// Parse SKU function for product processing
export function parseSKU(sku: string): {
  productType: ProductType;
  patternCode: string;
  size: string;
  color: string;
  variant?: string;
} | null {
  const skuParts = sku.split('-');
  if (skuParts.length < 3) return null;
  
  const [productType, patternCode, size, color = '', variant = ''] = skuParts;
  
  // Validate product type
  if (!Object.keys(PRODUCT_TYPES).includes(productType)) {
    return null;
  }
  
  return {
    productType: productType as ProductType,
    patternCode,
    size,
    color,
    variant: variant || undefined
  };
}