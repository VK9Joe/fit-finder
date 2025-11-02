import { ShopifyProductInfo, ProductType, CategorizedFitResults, AdvancedFitResult } from '@/types';

/**
 * Fetch products for a specific pattern and product type
 */
export async function fetchProductsForPattern(
  patternCode: string, 
  productType: ProductType
): Promise<ShopifyProductInfo[]> {
  try {
    const response = await fetch(
      `/api/shopify/products/by-pattern?patternCode=${patternCode}&productType=${productType}`,
      { cache: 'no-store' }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error(`Error fetching products for pattern ${patternCode}, type ${productType}:`, error);
    return [];
  }
}

/**
 * Fetch all product types for a specific pattern in one API call
 */
export async function fetchAllProductsForPattern(
  patternCode: string
): Promise<Record<ProductType, ShopifyProductInfo[]>> {
  try {
    const response = await fetch(
      `/api/shopify/products/by-pattern?patternCode=${patternCode}`,
      { cache: 'no-store' }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    
    const data = await response.json();
    // Convert the response to our expected format
    const productsByType: Record<ProductType, ShopifyProductInfo[]> = {
      'RC': data.productsByType?.RC || [],
      'TW': data.productsByType?.TW || [],
      'WC': data.productsByType?.WC || [],
      'CC': data.productsByType?.CC || []
    };
    
    console.log(`Fetched products for ${patternCode}:`, {
      RC: data.productsByType?.RC?.length || 0,
      TW: data.productsByType?.TW?.length || 0, 
      WC: data.productsByType?.WC?.length || 0,
      CC: data.productsByType?.CC?.length || 0,
      total: data.total || 0,
      debug: data.debug
    });
    return productsByType;
  } catch (error) {
    console.error(`Error fetching all products for pattern ${patternCode}:`, error);
    // Return empty arrays for all product types on error
    return {
      'RC': [],
      'TW': [],
      'WC': [],
      'CC': []
    };
  }
}

/**
 * Enhance fit results with product information
 */
export async function enhanceFitResultsWithProducts(
  categorizedResults: CategorizedFitResults
): Promise<CategorizedFitResults> {
  const enhanced: CategorizedFitResults = {
    bestFit: [],
    goodFit: [],
    mightFit: [],
    poorFit: []
  };

  // Process each category
  for (const [category, results] of Object.entries(categorizedResults)) {
    const enhancedResults = await Promise.all(
      results.map(async (result: AdvancedFitResult) => {
        const products = await fetchAllProductsForPattern(result.pattern.patternCode);
        
        return {
          ...result,
          products
        };
      })
    );

    enhanced[category as keyof CategorizedFitResults] = enhancedResults;
  }

  return enhanced;
}

/**
 * Get the top 3 patterns with their products
 */
export async function getTop3PatternsWithProducts(
  categorizedResults: CategorizedFitResults
): Promise<{
  bestFit: AdvancedFitResult[];
  goodFit: AdvancedFitResult[];
  mightFit: AdvancedFitResult[];
}> {
  const enhanced = await enhanceFitResultsWithProducts(categorizedResults);
  
  return {
    bestFit: enhanced.bestFit.slice(0, 3), // Top 3 best fit
    goodFit: enhanced.goodFit.slice(0, 3), // Top 3 good fit
    mightFit: enhanced.mightFit.slice(0, 3) // Top 3 might fit
  };
}
