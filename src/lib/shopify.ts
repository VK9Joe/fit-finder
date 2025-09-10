/**
 * Shopify Storefront API GraphQL client
 * Uses env vars:
 * - NEXT_PUBLIC_SHOPIFY_STORE_URL - Your Shopify store URL (e.g. your-store.myshopify.com)
 * - NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN - Storefront API access token
 */

// Comprehensive product interface with all available fields from Shopify GraphQL API
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  vendor: string;
  availableForSale: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  tags: string[];
  
  // SEO fields
  seo: {
    title: string | null;
    description: string | null;
  };
  
  // Online store details
  onlineStoreUrl: string | null;
  isGiftCard: boolean;
  
  // Media and images
  featuredImage: ShopifyImage | null;
  images?: ShopifyImage[];
  media?: ShopifyMedia[];
  
  // Pricing
  priceRange: {
    minVariantPrice: MoneyV2;
    maxVariantPrice: MoneyV2;
  };
  compareAtPriceRange: {
    minVariantPrice: MoneyV2;
    maxVariantPrice: MoneyV2;
  };
  
  // Inventory
  totalInventory?: number; // Optional: requires additional scope
  hasOutOfStockVariants: boolean;
  
  // Options and variants
  options: ProductOption[];
  variants: ProductVariant[];
  
  // Collections
  collections?: Collection[];
  
  // Custom product data
  metafields?: {
    namespace: string;
    key: string;
    value: string;
  }[];
  
  // Selling plans (subscriptions) - Optional: requires additional scope
  sellingPlanGroups?: SellingPlanGroup[];
}

export interface ShopifyImage {
  id: string;
  url: string;
  width: number;
  height: number;
  altText: string | null;
}

export interface ShopifyMedia {
  id: string;
  mediaContentType: string; // VIDEO, IMAGE, EXTERNAL_VIDEO, MODEL_3D, etc.
  alt: string | null;
  previewImage: {
    url: string;
  } | null;
  status: string;
  // Media-specific fields would be added based on mediaContentType
}

export interface MoneyV2 {
  amount: string;
  currencyCode: string;
}

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  barcode: string | null;
  availableForSale: boolean;
  currentlyNotInStock: boolean;
  price: MoneyV2;
  compareAtPrice: MoneyV2 | null;
  quantityAvailable?: number; // Optional: requires inventory scope
  weight: number;
  weightUnit: string;
  requiresShipping: boolean;
  selectedOptions: {
    name: string;
    value: string;
  }[];
  image: ShopifyImage | null;
}

export interface Collection {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml: string;
  updatedAt: string;
  image: ShopifyImage | null;
}


export interface SellingPlanGroup {
  name: string;
  options: {
    name: string;
    values: string[];
  }[];
  sellingPlans: {
    id: string;
    name: string;
    description: string | null;
    options: { name: string; value: string }[];
    priceAdjustments: {
      adjustmentValue: {
        __typename: string;
        adjustmentPercentage?: number;
        price?: MoneyV2;
        adjustmentAmount?: MoneyV2;
      };
      orderCount: number | null;
    }[];
    recurringDeliveries: boolean;
  }[];
}

/**
 * Fetch products with all available details using GraphQL Storefront API
 */
export async function fetchProducts(
  limit: number = 10,
  cursor?: string
): Promise<{ products: ShopifyProduct[], pageInfo: { hasNextPage: boolean, endCursor: string } }> {
  // Import helpers and queries
  const { shopifyStorefrontRequest, transformProductNode } = await import('./shopify-helpers');
  const { PRODUCTS_QUERY } = await import('./queries');
  
  const variables = {
    first: limit,
    ...(cursor ? { after: cursor } : {})
  };

  interface ProductsResponse {
    products: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
      edges: Array<{
        node: Record<string, unknown>;
      }>;
    };
  }

  const data = await shopifyStorefrontRequest<ProductsResponse>(PRODUCTS_QUERY, variables);
  
  // Transform the nested GraphQL response to a cleaner structure
  const products = data.products.edges.map(edge => transformProductNode(edge.node));
  
  return {
    products,
    pageInfo: data.products.pageInfo
  };
}

/**
 * Fetch a single product by handle with all available details
 */
export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  // Import helpers and queries
  const { shopifyStorefrontRequest, transformProductNode } = await import('./shopify-helpers');
  const { PRODUCT_BY_HANDLE_QUERY } = await import('./queries');

  interface ProductResponse {
    productByHandle: Record<string, unknown> | null;
  }

  const data = await shopifyStorefrontRequest<ProductResponse>(PRODUCT_BY_HANDLE_QUERY, { handle });
  
  if (!data.productByHandle) return null;
  
  return transformProductNode(data.productByHandle);
}

/**
 * Search products by query with all available details
 */
export async function searchProducts(
  query: string,
  limit: number = 10
): Promise<ShopifyProduct[]> {
  // Import helpers and queries
  const { shopifyStorefrontRequest, transformProductNode } = await import('./shopify-helpers');
  const { SEARCH_PRODUCTS_QUERY } = await import('./queries');
  
  interface SearchResponse {
    products: {
      edges: Array<{
        node: Record<string, unknown>;
      }>;
    };
  }
  
  const data = await shopifyStorefrontRequest<SearchResponse>(
    SEARCH_PRODUCTS_QUERY, 
    { query, first: limit }
  );
  
  return data.products.edges.map(edge => transformProductNode(edge.node));
}