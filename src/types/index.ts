// Types for the Dog Coat Fit Finder App

export interface DogMeasurements {
  breed: string;
  length: number; // in inches
  neckMeasurement: number; // in inches
  chestMeasurement: number; // in inches
  legLength: 'short' | 'long'; // leg length type
  tailType: 'straight' | 'curled' | 'sickle' | 'otter'; // tail type
}

export interface CoatPattern {
  id: string;
  name: string;
  breed: string;
  size: string;
  category: string;
  patternCode: string;
  measurements: {
    minLength: number;
    maxLength: number;
    minTailSize: number;
    maxTailSize: number;
    minNeck: number;
    maxNeck: number;
    minChest: number;
    maxChest: number;
  };
  productId: string;
  productUrl: string;
  price: number;
  imageUrl: string;
  description: string;
  features: string[];
  targetBreeds: string[];
}

export interface ShopifyProductInfo {
  id: string;
  title: string;
  handle: string;
  description: string;
  productUrl: string;
  price: number;
  currencyCode: string;
  featuredImage?: string;
  variantIds?: string[];
  availableForSale?: boolean;
}

export interface FitResult {
  pattern: CoatPattern;
  score: number;
  fitNotes: string[];
  shopifyProduct?: ShopifyProductInfo | null;
}

export interface FormErrors {
  breed?: string;
  length?: string;
  neckMeasurement?: string;
  chestMeasurement?: string;
  legLength?: string;
  tailType?: string;
}

export type FormStep = 1 | 2 | 3 | 4 | 5;