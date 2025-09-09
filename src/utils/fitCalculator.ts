import { DogMeasurements, CoatPattern, FitResult } from '@/types';

/**
 * Calculate fit score for a dog's measurements against a coat pattern
 * Advanced scoring system with multiple factors and breed-specific adjustments
 * Higher score = better fit (0-100 scale)
 */
export function calculateFitScore(
  measurements: DogMeasurements,
  pattern: CoatPattern
): number {
  const { length, neckMeasurement, chestMeasurement, legLength, tailType, breed } = measurements;
  const { measurements: patternMeasurements } = pattern;

  let totalScore = 0;

  // Core measurement scores with different weights
  // Chest is most critical for comfort and mobility
  const chestScore = calculateMeasurementScore(
    chestMeasurement,
    patternMeasurements.minChest,
    patternMeasurements.maxChest
  );
  totalScore += chestScore * 0.35; // 35% weight

  // Length is second most important for coverage
  const lengthScore = calculateMeasurementScore(
    length,
    patternMeasurements.minLength,
    patternMeasurements.maxLength
  );
  totalScore += lengthScore * 0.30; // 30% weight

  // Neck is important for comfort but more forgiving
  const neckScore = calculateMeasurementScore(
    neckMeasurement,
    patternMeasurements.minNeck,
    patternMeasurements.maxNeck
  );
  totalScore += neckScore * 0.25; // 25% weight

  // Tail consideration (estimated based on length)
  const estimatedTailSize = length * 0.5; // Rough estimation
  const tailScore = calculateMeasurementScore(
    estimatedTailSize,
    patternMeasurements.minTailSize,
    patternMeasurements.maxTailSize
  );
  totalScore += tailScore * 0.10; // 10% weight

  // Breed compatibility bonus
  const breedBonus = calculateBreedCompatibility(breed, pattern);
  totalScore += breedBonus;

  // Size category bonus (prefer exact size matches)
  const sizeBonus = calculateSizeBonus(measurements, pattern);
  totalScore += sizeBonus;

  // Leg length and tail type adjustments
  const physicalBonus = calculatePhysicalCharacteristicsBonus(legLength, tailType, pattern);
  totalScore += physicalBonus;

  return Math.min(100, Math.max(0, totalScore));
}

/**
 * Calculate score for individual measurement with improved tolerance
 */
function calculateMeasurementScore(
  measurement: number,
  min: number,
  max: number
): number {
  if (measurement >= min && measurement <= max) {
    // Perfect fit within range - bonus for being in the ideal center
    const center = (min + max) / 2;
    const distanceFromCenter = Math.abs(measurement - center);
    const range = max - min;
    const centerScore = Math.max(90, 100 - (distanceFromCenter / range) * 10);
    return centerScore;
  } else if (measurement < min) {
    // Too small - more forgiving tolerance
    const difference = min - measurement;
    const tolerance = (max - min) * 0.15; // 15% tolerance
    if (difference <= tolerance) {
      return Math.max(70, 85 - (difference / tolerance) * 15);
    } else {
      return Math.max(0, 70 - (difference - tolerance) * 8);
    }
  } else {
    // Too large - similar tolerance
    const difference = measurement - max;
    const tolerance = (max - min) * 0.15; // 15% tolerance
    if (difference <= tolerance) {
      return Math.max(70, 85 - (difference / tolerance) * 15);
    } else {
      return Math.max(0, 70 - (difference - tolerance) * 8);
    }
  }
}

/**
 * Calculate breed compatibility bonus
 */
function calculateBreedCompatibility(dogBreed: string, pattern: CoatPattern): number {
  if (pattern.targetBreeds.includes(dogBreed)) {
    return 8; // Direct breed match
  }
  
  // Check for size-based compatibility
  const smallBreeds = ['Chihuahua', 'Yorkshire Terrier', 'Pomeranian', 'Maltese', 'Toy Poodle'];
  const largeBreeds = ['Great Dane', 'Mastiff', 'Saint Bernard', 'Newfoundland', 'Rottweiler'];
  
  if (smallBreeds.includes(dogBreed) && pattern.size === 'S') {
    return 4;
  }
  if (largeBreeds.includes(dogBreed) && (pattern.size === 'L' || pattern.size === 'XL')) {
    return 4;
  }
  
  // Mixed breed or unknown gets neutral score
  if (dogBreed === 'Mixed Breed' || dogBreed === 'Other') {
    return 2;
  }
  
  return 0;
}

/**
 * Calculate size category bonus
 */
function calculateSizeBonus(measurements: DogMeasurements, pattern: CoatPattern): number {
  const { length, chestMeasurement } = measurements;
  
  // Determine if measurements align with size category expectations
  const sizeExpectations = {
    'S': { maxLength: 20, maxChest: 24 },
    'M': { maxLength: 26, maxChest: 30 },
    'L': { maxLength: 32, maxChest: 36 },
    'XL': { maxLength: 40, maxChest: 44 },
  };
  
  const expectedSize = sizeExpectations[pattern.size as keyof typeof sizeExpectations];
  if (!expectedSize) return 0;
  
  const lengthFits = length <= expectedSize.maxLength * 1.1; // 10% tolerance
  const chestFits = chestMeasurement <= expectedSize.maxChest * 1.1;
  
  if (lengthFits && chestFits) {
    return 3; // Good size alignment
  } else if (lengthFits || chestFits) {
    return 1; // Partial alignment
  }
  
  return 0;
}

/**
 * Calculate physical characteristics bonus
 */
function calculatePhysicalCharacteristicsBonus(
  legLength: 'short' | 'long',
  tailType: 'straight' | 'curled' | 'sickle' | 'otter',
  pattern: CoatPattern
): number {
  let bonus = 0;
  
  // Leg length considerations for different coat types
  if (pattern.category.toLowerCase().includes('sport') || pattern.category.toLowerCase().includes('adventure')) {
    if (legLength === 'long') {
      bonus += 2; // Active coats work better with longer legs
    }
  }
  
  if (pattern.category.toLowerCase().includes('comfort') || pattern.category.toLowerCase().includes('warmer')) {
    if (legLength === 'short') {
      bonus += 1; // Comfort coats can work well with shorter legs
    }
  }
  
  // Tail type considerations
  if (tailType === 'curled' || tailType === 'sickle') {
    bonus += 1; // These tail types generally work well with most coats
  }
  
  return bonus;
}

/**
 * Generate comprehensive fit notes based on measurements vs pattern
 */
export function generateFitNotes(
  measurements: DogMeasurements,
  pattern: CoatPattern
): string[] {
  const notes: string[] = [];
  const { length, neckMeasurement, chestMeasurement, legLength, tailType, breed } = measurements;
  const { measurements: patternMeasurements } = pattern;

  // Chest fit analysis (most important)
  const chestScore = calculateMeasurementScore(chestMeasurement, patternMeasurements.minChest, patternMeasurements.maxChest);
  if (chestScore >= 90) {
    notes.push('Perfect chest fit ensures optimal comfort and mobility');
  } else if (chestMeasurement < patternMeasurements.minChest) {
    const diff = patternMeasurements.minChest - chestMeasurement;
    if (diff <= 1) {
      notes.push('Slightly roomy chest fit - may provide extra comfort for active dogs');
    } else {
      notes.push('Loose chest fit - consider sizing down for better security');
    }
  } else if (chestMeasurement > patternMeasurements.maxChest) {
    const diff = chestMeasurement - patternMeasurements.maxChest;
    if (diff <= 1) {
      notes.push('Snug chest fit - monitor for comfort during extended wear');
    } else {
      notes.push('Tight chest fit - strongly consider sizing up for comfort');
    }
  }

  // Length coverage analysis
  const lengthScore = calculateMeasurementScore(length, patternMeasurements.minLength, patternMeasurements.maxLength);
  if (lengthScore >= 90) {
    notes.push('Ideal length provides complete back coverage and protection');
  } else if (length < patternMeasurements.minLength) {
    notes.push('Extended coverage design - coat will provide extra warmth and protection');
  } else if (length > patternMeasurements.maxLength) {
    notes.push('Compact fit design - ensures freedom of movement while providing core protection');
  }

  // Neck comfort assessment
  const neckScore = calculateMeasurementScore(neckMeasurement, patternMeasurements.minNeck, patternMeasurements.maxNeck);
  if (neckScore >= 90) {
    notes.push('Secure neck fit prevents coat shifting during activity');
  } else if (neckMeasurement < patternMeasurements.minNeck) {
    notes.push('Relaxed neck fit - check that coat stays in position during use');
  } else if (neckMeasurement > patternMeasurements.maxNeck) {
    notes.push('Close neck fit - ensure comfortable breathing and swallowing');
  }

  // Breed-specific benefits
  if (pattern.targetBreeds.includes(breed)) {
    notes.push(`Specifically designed for ${breed} body proportions and activity needs`);
  } else if (breed === 'Mixed Breed') {
    notes.push('Versatile design works well for mixed breed proportions');
  }

  // Physical characteristics considerations
  if (legLength === 'long' && pattern.category.toLowerCase().includes('sport')) {
    notes.push('Excellent choice for long-legged dogs who need freedom of movement');
  }
  
  if (tailType === 'curled' || tailType === 'sickle') {
    notes.push('Design accommodates curled tail positioning for comfort');
  }

  // Activity-specific benefits
  if (pattern.category.toLowerCase().includes('winter') || pattern.category.toLowerCase().includes('ice')) {
    notes.push('Superior cold weather protection with insulated design');
  } else if (pattern.category.toLowerCase().includes('rain') || pattern.category.toLowerCase().includes('storm')) {
    notes.push('Waterproof protection keeps your dog dry in wet conditions');
  } else if (pattern.category.toLowerCase().includes('sport') || pattern.category.toLowerCase().includes('adventure')) {
    notes.push('Athletic design supports active lifestyle and outdoor adventures');
  }

  // Add feature highlights
  if (pattern.features.length > 0) {
    const keyFeature = pattern.features[0];
    notes.push(`Key feature: ${keyFeature} enhances overall performance and comfort`);
  }

  return notes.slice(0, 4); // Limit to most important notes
}

/**
 * Find best fitting patterns for given measurements
 */
export function findBestFits(
  measurements: DogMeasurements,
  patterns: CoatPattern[],
  limit: number = 3
): FitResult[] {
  const results: FitResult[] = patterns.map(pattern => ({
    pattern,
    score: calculateFitScore(measurements, pattern),
    fitNotes: generateFitNotes(measurements, pattern),
  }));

  // Sort by score (highest first) and return top results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}