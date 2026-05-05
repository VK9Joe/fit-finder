import { UserInput, AdvancedFitResult, ProductType } from '@/types';
import { findPatterns } from './patternFinder';
import { wholesalePatterns } from '../data/wholesalePatterns';

export interface WholesaleMatch extends AdvancedFitResult {
  rank: number;
  products?: Record<ProductType, Array<{
    id: string;
    title: string;
    handle: string;
    price: string;
    currencyCode: string;
    availableForSale: boolean;
    featuredImage?: string;
    variant: {
      id: string;
      sku: string;
      skuInfo: { color: string };
    };
  }>>;
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
