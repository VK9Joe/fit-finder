import { ProductType } from '@/types';

/**
 * Build Shopify product URLs with collections and variants
 * Based on the K9 Apparel URL structure
 */

// Map product types to their collection paths
const COLLECTION_PATHS: Record<ProductType, string> = {
  'WC': 'dog-winter-coats',
  'RC': 'dog-rain-coats', 
  'TW': 'dog-tummy-warmers',
  'CC': 'cooling-coats'
};

// Extract store URL from environment variable
function getStoreUrl(): string {
  const storeUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL;
  if (!storeUrl) {
    // Fallback to k9apparel.com if env var not set (for development/testing)
    console.warn('NEXT_PUBLIC_SHOPIFY_STORE_URL is not configured, using k9apparel.com as fallback');
    return 'k9apparel.com';
  }
  // Remove protocol if present
  return storeUrl.replace(/^https?:\/\//, '');
}

/**
 * Extract numeric variant ID from Shopify GID
 * e.g., "gid://shopify/ProductVariant/41417460711486" => "41417460711486"
 */
function extractVariantId(variantId: string): string {
  if (variantId.startsWith('gid://shopify/ProductVariant/')) {
    return variantId.split('/').pop() || variantId;
  }
  return variantId;
}

/**
 * Build a complete Shopify product URL with collection and variant
 * @param productHandle - The product handle (slug)
 * @param variantId - The variant ID (can be GID or numeric)
 * @param productType - The product type to determine collection
 * @param measurements - Optional measurements to include in URL
 * @returns Complete Shopify product URL
 */
export function buildShopifyProductUrl(
  productHandle: string,
  variantId: string,
  productType: ProductType,
  measurements?: {
    breed: string;
    neckCircumference: number;
    chestCircumference: number;
    backLength: number;
    tailType: string;
    chondrodystrophic: boolean;
  }
): string {
  const storeUrl = getStoreUrl();
  const collectionPath = COLLECTION_PATHS[productType];
  const numericVariantId = extractVariantId(variantId);
  
  let url = `https://${storeUrl}/collections/${collectionPath}/products/${productHandle}?variant=${numericVariantId}`;
  
  // Add measurements as URL parameters if provided
  if (measurements) {
    const measurementsParam = JSON.stringify({
      breed: measurements.breed,
      neck: measurements.neckCircumference,
      chest: measurements.chestCircumference,
      length: measurements.backLength,
      tail: measurements.tailType,
      chondro: measurements.chondrodystrophic
    });
    url += `&measurements=${encodeURIComponent(measurementsParam)}`;
  }
  
  return url;
}

/**
 * Build a collection URL for a specific product type
 * @param productType - The product type
 * @returns Collection URL
 */
export function buildCollectionUrl(productType: ProductType): string {
  const storeUrl = getStoreUrl();
  const collectionPath = COLLECTION_PATHS[productType];
  
  return `https://${storeUrl}/collections/${collectionPath}`;
}

/**
 * Get the collection name for display purposes
 * @param productType - The product type
 * @returns Human-readable collection name
 */
export function getCollectionDisplayName(productType: ProductType): string {
  const names: Record<ProductType, string> = {
    'WC': 'Dog Winter Coats',
    'RC': 'Dog Rain Coats',
    'TW': 'Dog Tummy Warmers', 
    'CC': 'Cooling Coats'
  };
  return names[productType];
}
