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
    // Basic ranges
    minLength: number;
    maxLength: number;
    minNeck: number;
    maxNeck: number;
    minChest: number;
    maxChest: number;
    
    // Ideal ranges for better scoring
    idealNeckMin?: number;
    idealNeckMax?: number;
    idealChestMin?: number;
    idealChestMax?: number;
    
    // Multiple length measurements
    twLength?: number;
    rcLength?: number;
    wcLength?: number;
    ccLength?: number;
    
    // Pattern finished measurements
    patternFinishedNeck?: number;
    patternFinishedChestMin?: number;
    patternFinishedChestMax?: number;
    
    // Legacy measurements for comparison
    oldNeckMin?: number;
    oldNeckMax?: number;
    oldChestMin?: number;
    oldChestMax?: number;
    oldLengthMin?: number;
    oldLengthMax?: number;
    
    // Legacy tail size (for backward compatibility)
    minTailSize?: number;
    maxTailSize?: number;
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

// New interfaces for the advanced pattern finder
export interface UserInput {
  breed: string;
  neckCircumference: number;
  chestCircumference: number;
  backLength: number;
  tailType: 'down/tucked' | 'bobbed/docked' | 'straight' | 'up or curly';
  chondrodystrophic: boolean; // very short legs like Corgi, Basset Hound, Dachshund
}

export interface AdvancedFitResult {
  pattern: CoatPattern;
  finalScore: number;
  fitLabel: 'Best Fit' | 'Good Fit' | 'Might Fit' | 'Poor Fit';
  neckScore: number;
  chestScore: number;
  lengthScore: number;
  fitNotes: string[];
  disqualified: boolean;
  disqualificationReason?: string;
}

// Categorized fit results
export interface CategorizedFitResults {
  bestFit: AdvancedFitResult[];
  goodFit: AdvancedFitResult[];
  mightFit: AdvancedFitResult[];
  poorFit: AdvancedFitResult[];
}

// Product type definitions
export const PRODUCT_TYPES = {
  'RC': 'Rain Coat',
  'TW': 'Tummy Warmer', 
  'WC': 'Winter Coat',
  'CC': 'Cooling Coat'
} as const;

export type ProductType = keyof typeof PRODUCT_TYPES;

// Enhanced fit result with products
export interface EnhancedFitResult extends AdvancedFitResult {
  products: {
    [K in ProductType]?: ShopifyProductInfo[];
  };
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