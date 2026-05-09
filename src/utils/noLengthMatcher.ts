import { UserInput, CoatPattern, AdvancedFitResult, CategorizedFitResults } from '@/types';

// Mirrors breedAliases in patternFinder.ts — keep in sync if breeds are added there
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
  'labrador retriever': 'GR',
  'german shorthaired pointer': 'GSP',
  'dalmatian': 'GSP',
  'italian greyhound': 'IG',
  'jack russell terrier': 'JR',
  'miniature dachshund': 'MD',
  'miniature pinscher': 'MP',
  'miniature poodle': 'MPD',
  'pug': 'PG',
  'rat terrier': 'RT',
  'rhodesian ridgeback': 'RR',
  'german shepherd': 'RR',
  'vizsla': 'VS',
  'weimaraner': 'WM',
  'whippet': 'WP',
};

function getBreedKey(breed: string): string | null {
  return breedAliases[breed.toLowerCase().trim()] || null;
}

// Replicates calculateNeckScore from patternFinder.ts exactly
function calcNeckScore(userNeck: number, p: CoatPattern): { score: number; notes: string[]; disqualified: boolean; maxCombined?: number } {
  const { minNeck, maxNeck, idealNeckMin, idealNeckMax } = p.measurements;
  if (userNeck < minNeck || userNeck > maxNeck) return { score: 0, notes: [], disqualified: true };

  const idealLow = idealNeckMin ?? minNeck;
  const idealHigh = idealNeckMax ?? maxNeck;
  const sorted = [minNeck, maxNeck, idealLow, idealHigh].sort((a, b) => a - b);
  const mu = (sorted[1] + sorted[2]) / 2;
  const k = Math.sqrt(-2.0 * Math.log(0.5));
  const sigmaLeft = (mu - minNeck) / k;
  const sigmaRight = (maxNeck - mu) / k;
  const sigma = userNeck <= mu ? sigmaLeft : sigmaRight;
  let score = sigma > 0 ? Math.exp(-0.5 * Math.pow((userNeck - mu) / sigma, 2)) : 1.0;
  score = Math.max(0.5, Math.min(1.0, score));

  const notes: string[] = [];
  let maxCombined: number | undefined;
  if (userNeck >= minNeck && userNeck < idealLow) {
    notes.push("The neck on this pattern may be slightly roomy for your pup.");
    maxCombined = 0.79;
  } else if (userNeck > idealHigh && userNeck <= maxNeck) {
    notes.push("The neck on this pattern may be slightly snug for your pup, but it is within the acceptable range.");
    maxCombined = 0.79;
  }
  return { score, notes, disqualified: false, maxCombined };
}

// Replicates calculateChestScore from patternFinder.ts exactly
function calcChestScore(userChest: number, p: CoatPattern): { score: number; notes: string[]; disqualified: boolean } {
  const { minChest, maxChest } = p.measurements;
  if (userChest < minChest || userChest > maxChest) return { score: 0, notes: [], disqualified: true };

  const idealChest = minChest + 1.0;
  let score: number;
  if (userChest <= idealChest) {
    const pos = (userChest - minChest) / (idealChest - minChest);
    score = 0.85 + pos * 0.15;
  } else {
    const pos = (userChest - idealChest) / (maxChest - idealChest);
    score = 1.0 - pos * 0.4;
  }
  score = Math.max(0.6, Math.min(1.0, score));

  const note = Math.abs(userChest - idealChest) <= 1.0
    ? "The chest on this pattern is within the ideal range for your pup."
    : "The chest fit on this pattern falls within the acceptable range for your pup's measurements.";
  return { score, notes: [note], disqualified: false };
}

/** Score every pattern using neck + chest only. Returns flat array sorted by finalScore desc. */
export function scorePatternsNoLength(userInput: UserInput, patterns: CoatPattern[]): AdvancedFitResult[] {
  const breedKey = getBreedKey(userInput.breed);

  return patterns
    .map((pattern): AdvancedFitResult | null => {
      const neck = calcNeckScore(userInput.neckCircumference, pattern);
      if (neck.disqualified) return null;
      const chest = calcChestScore(userInput.chestCircumference, pattern);
      if (chest.disqualified) return null;

      const patternKey = pattern.patternCode.split('-')[0];
      const breedMatch = breedKey !== null && breedKey === patternKey;

      let finalScore = (neck.score + chest.score) / 2;
      if (!breedMatch) finalScore -= 0.1;
      if (neck.maxCombined !== undefined) finalScore = Math.min(finalScore, neck.maxCombined);
      finalScore = Math.max(0, Math.min(1, finalScore));

      let fitLabel: AdvancedFitResult['fitLabel'];
      if (finalScore >= 0.85) fitLabel = 'Best Fit';
      else if (finalScore >= 0.65) fitLabel = 'Good Fit';
      else if (finalScore >= 0.50) fitLabel = 'Might Fit';
      else fitLabel = 'Poor Fit';

      return {
        pattern,
        finalScore,
        fitLabel,
        neckScore: neck.score,
        chestScore: chest.score,
        lengthScore: 0,
        fitNotes: [...neck.notes, ...chest.notes],
        disqualified: false,
      };
    })
    .filter((r): r is AdvancedFitResult => r !== null)
    .sort((a, b) => b.finalScore - a.finalScore);
}

/** Bucket-style result identical to findPatterns(), but using neck+chest only. */
export function findPatternsNoLength(userInput: UserInput, patterns: CoatPattern[]): CategorizedFitResults {
  const scored = scorePatternsNoLength(userInput, patterns);
  return {
    bestFit:  scored.filter(r => r.finalScore >= 0.85).slice(0, 3),
    goodFit:  scored.filter(r => r.finalScore >= 0.65 && r.finalScore < 0.85).slice(0, 3),
    mightFit: scored.filter(r => r.finalScore >= 0.50 && r.finalScore < 0.65).slice(0, 3),
    poorFit:  scored.filter(r => r.finalScore < 0.50).slice(0, 3),
  };
}
