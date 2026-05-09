import { UserInput, AdvancedFitResult } from '@/types';
import { findPatterns } from './patternFinder';
import { scorePatternsNoLength } from './noLengthMatcher';
import { wholesalePatterns } from '../data/wholesalePatterns';

export interface WholesaleMatch extends AdvancedFitResult {
  rank: number;
  lengthSkipped?: boolean;
}

export function findWholesaleMatches(userInput: UserInput): WholesaleMatch[] {
  if (userInput.backLength === 0) {
    const scored = scorePatternsNoLength(userInput, wholesalePatterns);
    return scored.slice(0, 3).map((r, i) => ({ ...r, rank: i + 1, lengthSkipped: true }));
  }

  const categorized = findPatterns(userInput, wholesalePatterns);
  const all = [
    ...categorized.bestFit,
    ...categorized.goodFit,
    ...categorized.mightFit,
    ...categorized.poorFit,
  ].sort((a, b) => b.finalScore - a.finalScore);

  return all.slice(0, 3).map((result, i) => ({ ...result, rank: i + 1 }));
}

export function scoreToPercent(finalScore: number): number {
  return Math.round(finalScore * 100);
}
