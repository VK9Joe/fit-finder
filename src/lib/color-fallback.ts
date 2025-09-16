/**
 * Color fallback utilities for product selection
 * Handles automatic color selection when preferred colors are out of stock
 */

// Color priority order (most preferred first)
// This can be customized based on your business needs
export const COLOR_PRIORITY = [
  'BL',  // Blue
  'BG',  // Burgundy  
  'RD',  // Red
  'GR',  // Green
  'BK',  // Black
  'WH',  // White
  'NV',  // Navy
  'BR',  // Brown
  'GY',  // Gray
  'PN',  // Pink
  'PR',  // Purple
  'YL',  // Yellow
  'OR',  // Orange
  'TE',  // Teal
  'LB',  // Light Blue
  'DB',  // Dark Blue
  'LG',  // Light Green
  'DG',  // Dark Green
  'DEFAULT' // Fallback for products without color codes
] as const;

export type ColorCode = typeof COLOR_PRIORITY[number];

/**
 * Select the best available color from a list of variants
 * @param variants Array of product variants grouped by color
 * @param preferredColors Optional custom color priority list
 * @returns The best available variant or null if none found
 */
export function selectBestAvailableColor<T extends {
  variant: {
    availableForSale: boolean;
    skuInfo?: {
      color: string;
    };
  };
}>(
  variants: Record<string, T[]>,
  preferredColors: readonly string[] = COLOR_PRIORITY
): T | null {
  let selectedVariant = null;
  
  // First, try to find an available variant in priority order
  for (const preferredColor of preferredColors) {
    if (variants[preferredColor]) {
      const availableVariant = variants[preferredColor].find(v => v.variant.availableForSale);
      if (availableVariant) {
        selectedVariant = availableVariant;
        break;
      }
    }
  }
  
  // If no preferred color is available, try any available color
  if (!selectedVariant) {
    for (const color of Object.keys(variants)) {
      const availableVariant = variants[color].find(v => v.variant.availableForSale);
      if (availableVariant) {
        selectedVariant = availableVariant;
        break;
      }
    }
  }
  
  // If still no available variant, take the first one (even if out of stock)
  if (!selectedVariant) {
    const firstColor = Object.keys(variants)[0];
    if (firstColor && variants[firstColor].length > 0) {
      selectedVariant = variants[firstColor][0];
    }
  }
  
  return selectedVariant;
}

/**
 * Get color information for debugging
 * @param variants Variants grouped by color
 * @returns Color availability information
 */
export function getColorAvailabilityInfo<T extends {
  variant: {
    availableForSale: boolean;
    skuInfo?: {
      color: string;
    };
  };
}>(variants: Record<string, T[]>): {
  totalColors: number;
  availableColors: string[];
  unavailableColors: string[];
  selectedColor?: string;
  selectedAvailable: boolean;
} {
  const allColors = Object.keys(variants);
  const availableColors = allColors.filter(color => 
    variants[color].some(v => v.variant.availableForSale)
  );
  const unavailableColors = allColors.filter(color => 
    !variants[color].some(v => v.variant.availableForSale)
  );
  
  const selectedVariant = selectBestAvailableColor(variants, COLOR_PRIORITY);
  
  return {
    totalColors: allColors.length,
    availableColors,
    unavailableColors,
    selectedColor: selectedVariant?.variant.skuInfo?.color,
    selectedAvailable: selectedVariant?.variant.availableForSale || false
  };
}

/**
 * Create a custom color priority based on business rules
 * @param season Current season (affects color preferences)
 * @param productType Type of product (RC, TW, WC, CC)
 * @returns Customized color priority array
 */
export function createCustomColorPriority(
  season?: 'spring' | 'summer' | 'fall' | 'winter',
  productType?: string
): readonly string[] {
  let customPriority = [...COLOR_PRIORITY] as string[];
  
  // Adjust based on season
  if (season) {
    switch (season) {
      case 'spring':
        customPriority = ['GR', 'YL', 'PN', 'LB', ...COLOR_PRIORITY.filter(c => !['GR', 'YL', 'PN', 'LB'].includes(c))];
        break;
      case 'summer':
        customPriority = ['WH', 'LB', 'YL', 'TE', ...COLOR_PRIORITY.filter(c => !['WH', 'LB', 'YL', 'TE'].includes(c))];
        break;
      case 'fall':
        customPriority = ['OR', 'BR', 'RD', 'GY', ...COLOR_PRIORITY.filter(c => !['OR', 'BR', 'RD', 'GY'].includes(c))];
        break;
      case 'winter':
        customPriority = ['BK', 'NV', 'WH', 'RD', ...COLOR_PRIORITY.filter(c => !['BK', 'NV', 'WH', 'RD'].includes(c))];
        break;
    }
  }
  
  // Adjust based on product type
  if (productType) {
    switch (productType) {
      case 'RC': // Rain Coat - prefer darker colors
        customPriority = ['BK', 'NV', 'DB', 'DG', ...customPriority.filter(c => !['BK', 'NV', 'DB', 'DG'].includes(c))];
        break;
      case 'WC': // Winter Coat - prefer warm colors
        customPriority = ['RD', 'OR', 'BR', 'BK', ...customPriority.filter(c => !['RD', 'OR', 'BR', 'BK'].includes(c))];
        break;
      case 'CC': // Cooling Coat - prefer light colors
        customPriority = ['WH', 'LB', 'TE', 'YL', ...customPriority.filter(c => !['WH', 'LB', 'TE', 'YL'].includes(c))];
        break;
      case 'TW': // Tummy Warmer - prefer neutral colors
        customPriority = ['BK', 'WH', 'GY', 'BR', ...customPriority.filter(c => !['BK', 'WH', 'GY', 'BR'].includes(c))];
        break;
    }
  }
  
  return customPriority;
}

/**
 * Validate color code format
 * @param colorCode Color code to validate
 * @returns True if valid color code format
 */
export function isValidColorCode(colorCode: string): boolean {
  return /^[A-Z]{2,3}$/.test(colorCode) || colorCode === 'DEFAULT';
}

/**
 * Get color display name
 * @param colorCode Color code
 * @returns Human-readable color name
 */
export function getColorDisplayName(colorCode: string): string {
  const colorMap: Record<string, string> = {
    'BL': 'Blue',
    'BG': 'Burgundy',
    'RD': 'Red',
    'GR': 'Green',
    'BK': 'Black',
    'WH': 'White',
    'NV': 'Navy',
    'BR': 'Brown',
    'GY': 'Gray',
    'PN': 'Pink',
    'PR': 'Purple',
    'YL': 'Yellow',
    'OR': 'Orange',
    'TE': 'Teal',
    'LB': 'Light Blue',
    'DB': 'Dark Blue',
    'LG': 'Light Green',
    'DG': 'Dark Green',
    'DEFAULT': 'Default'
  };
  
  return colorMap[colorCode] || colorCode;
}
