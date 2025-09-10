import { ShopifyProduct } from './shopify';

/**
 * Generic function to make GraphQL requests to Shopify Storefront API
 */
export async function shopifyStorefrontRequest<T>(
  query: string, 
  variables?: Record<string, unknown>
): Promise<T> {
  const storeUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL?.replace(/^https?:\/\//, '');
  const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  // Debug logging to help troubleshoot connection issues
  console.log('Shopify Store URL:', storeUrl);
  console.log('Storefront Token Format:', storefrontToken 
    ? `${storefrontToken.substring(0, 5)}...${storefrontToken.substring(storefrontToken.length - 3)}` 
    : 'undefined');

  if (!storeUrl || !storefrontToken) {
    throw new Error('Missing Shopify env vars: ensure NEXT_PUBLIC_SHOPIFY_STORE_URL and NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN are set');
  }

  const endpoint = `https://${storeUrl}/api/2024-04/graphql.json`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': storefrontToken,
  };

  console.log('GraphQL Request:', {
    endpoint,
    headers: Object.keys(headers).join(', '),
    variables
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    cache: 'no-store' // Disable caching for dynamic data
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('Shopify GraphQL error:', {
      status: res.status,
      statusText: res.statusText,
      url: res.url,
      response: text
    });
    
    let errorMsg = `Shopify GraphQL request failed (${res.status})`;
    
    // Add specific guidance based on status code
    if (res.status === 401) {
      errorMsg += ": Authentication failed. Check your NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN is correct.";
      errorMsg += "\n\nFor Storefront API, you need a storefront access token that begins with 'shpat_'";
      errorMsg += "\nCreate this in your Shopify Admin under Settings → Apps → API credentials → Storefront API";
    } else if (text) {
      errorMsg += `: ${text}`;
    }
    
    throw new Error(errorMsg);
  }

  const json = await res.json() as { data?: T; errors?: Array<{ message: string }>; };
  
  if (json.errors?.length) {
    console.error('Shopify GraphQL errors:', json.errors);
    throw new Error(`Shopify GraphQL errors: ${json.errors.map(e => e.message).join('; ')}`);
  }
  
  if (!json.data) {
    throw new Error('No data returned from Shopify GraphQL API');
  }
  
  return json.data;
}

/**
 * Transform GraphQL connection edges to a simple array
 */
export function mapConnectionToNodes<T>(connection: { edges: Array<{ node: T }> } | undefined | null): T[] {
  if (!connection?.edges) return [];
  return connection.edges.map(edge => edge.node);
}

/**
 * Transform a product node from GraphQL to our ShopifyProduct structure
 */
export function transformProductNode(node: Record<string, unknown>): ShopifyProduct {
  const transformedProduct: Record<string, unknown> = { ...node };
  
  // Transform connection patterns to simple arrays
  if (node.images && typeof node.images === 'object' && 'edges' in node.images) {
    transformedProduct.images = mapConnectionToNodes(node.images as { edges: Array<{ node: unknown }> });
  }
  if (node.media && typeof node.media === 'object' && 'edges' in node.media) {
    transformedProduct.media = mapConnectionToNodes(node.media as { edges: Array<{ node: unknown }> });
  }
  if (node.collections && typeof node.collections === 'object' && 'edges' in node.collections) {
    transformedProduct.collections = mapConnectionToNodes(node.collections as { edges: Array<{ node: unknown }> });
  }
  
  // Transform nested connection patterns
  if (node.variants) {
    transformedProduct.variants = (node.variants as { edges: Array<{ node: Record<string, unknown> }> }).edges.map(({ node: variant }) => {
      return variant;
    });
  }
  
  if (node.metafields) {
    // Handle metafields directly (they're not in a connection pattern in the updated query)
    transformedProduct.metafields = Array.isArray(node.metafields) ? node.metafields : [node.metafields];
  }
  
  // Set defaults for missing fields
  if (!transformedProduct.variants) transformedProduct.variants = [];
  
  // Determine if any variants are out of stock
  transformedProduct.hasOutOfStockVariants = (transformedProduct.variants as Array<{ availableForSale: boolean }>).some(
    (v) => !v.availableForSale
  );
  
  return transformedProduct as unknown as ShopifyProduct;
}