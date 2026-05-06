import { UserInput, AdvancedFitResult } from '@/types';
import { findPatterns } from './patternFinder';
import { wholesalePatterns } from '../data/wholesalePatterns';

export interface WholesaleMatch extends AdvancedFitResult {
  rank: number;
}

export function findWholesaleMatches(userInput: UserInput): WholesaleMatch[] {
  const categorized = findPatterns(userInput, wholesalePatterns);

  const all = [
    ...categorized.bestFit,
    ...categorized.goodFit,
    ...categorized.mightFit,
    ...categorized.poorFit,
  ].sort((a, b) => b.finalScore - a.finalScore);

  return all.slice(0, 3).map((result, i) => ({
    ...result,
    rank: i + 1,
  }));
}

export function scoreToPercent(finalScore: number): number {
  return Math.round(finalScore * 100);
}
