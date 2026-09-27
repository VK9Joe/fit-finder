import { NextResponse } from 'next/server';
import { ProductType } from '@/utils/patternFinder';
import { selectVariantForProductLink } from '@/lib/color-fallback';

// Helper function to fetch all products efficiently
async function fetchAllProductsMinimal() {
  const { shopifyStorefrontRequest } = await import('@/lib/shopify-helpers');
  const { MINIMAL_PRODUCTS_QUERY } = await import('@/lib/queries');
  
  let allProducts: Array<{
    id: string;
    title: string;
    handle: string;
    availableForSale: boolean;
    onlineStoreUrl: string | null;
    tags: string[];
    featuredImage: string | null;
    price: string;
    currencyCode: string;
    variants: Array<{
      id: string;
      sku: string;
      availableForSale: boolean;
      colorName: string | null;
      price: { amount: string; currencyCode: string };
    }>;
  }> = [];
  let cursor: string | undefined;
  let hasNextPage = true;
  
  while (hasNextPage) {
    const variables = {
      first: 250, // Max per request
      ...(cursor ? { after: cursor } : {})
    };

    const data = await shopifyStorefrontRequest(MINIMAL_PRODUCTS_QUERY, variables) as {
      products?: {
        edges?: Array<{
          node: {
            id: string;
            title: string;
            handle: string;
            availableForSale: boolean;
            onlineStoreUrl: string | null;
            tags: string[];
            featuredImage?: { url: string } | null;
            priceRange?: {
              minVariantPrice?: {
                amount: string;
                currencyCode: string;
              };
            };
            variants?: {
              edges?: Array<{
                node: {
                  id: string;
                  sku: string;
                  availableForSale: boolean;
                  price: { amount: string; currencyCode: string };
                  selectedOptions?: Array<{ name: string; value: string }>;
                };
              }>;
            };
          };
        }>;
        pageInfo?: {
          hasNextPage: boolean;
          endCursor: string;
        };
      };
    };
    
    // Transform the nested GraphQL response
    const products = data?.products?.edges?.map((edge) => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      availableForSale: edge.node.availableForSale,
      onlineStoreUrl: edge.node.onlineStoreUrl,
      tags: edge.node.tags || [],
      featuredImage: edge.node.featuredImage?.url || null,
      price: edge.node.priceRange?.minVariantPrice?.amount || '0',
      currencyCode: edge.node.priceRange?.minVariantPrice?.currencyCode || 'USD',
      variants: edge.node.variants?.edges?.map((vEdge) => ({
        id: vEdge.node.id,
        sku: vEdge.node.sku,
        availableForSale: vEdge.node.availableForSale,
        colorName: vEdge.node.selectedOptions?.find((o) => /^colou?r$/i.test(o.name))?.value ?? null,
        price: vEdge.node.price
      })) || []
    }));
    
    allProducts = [...allProducts, ...(products || [])];
    hasNextPage = data?.products?.pageInfo?.hasNextPage || false;
    cursor = data?.products?.pageInfo?.endCursor;
  }
  
  // console.log(`Fetched ${allProducts.length} total products from Shopify`);
  return allProducts;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patternCode = searchParams.get('patternCode');
    const productType = searchParams.get('productType') as ProductType | null;
    
    if (!patternCode) {
      return NextResponse.json({ 
        ok: false, 
        error: 'patternCode is required' 
      }, { status: 400 });
    }

    // Fetch ALL products efficiently
    const allProducts = await fetchAllProductsMinimal();
    
    if (!allProducts || allProducts.length === 0) {
      return NextResponse.json({ 
        ok: false, 
        error: 'No products found' 
      }, { status: 404 });
    }

    // console.log(`Looking for pattern: ${patternCode} in ${allProducts.length} products`);
    
    // Extract breed and size from pattern code (e.g., "VS-XS" -> breed="VS", size="XS")
    const patternParts = patternCode.split('-');
    if (patternParts.length < 2) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid pattern code format. Expected: BREED-SIZE (e.g., VS-XS)' 
      }, { status: 400 });
    }
    
    const expectedBreed = patternParts[0]; // VS, BG, etc.
    const expectedSize = patternParts[1];  // XS, S, M, L, XL

    // Group products by product type with color fallback logic
    const productsByType: Record<string, Array<{
      id: string;
      title: string;
      handle: string;
      price: string;
      currencyCode: string;
      availableForSale: boolean;
      featuredImage: string | null;
      onlineStoreUrl: string | null;
      variant: {
        id: string;
        sku: string;
        price: { amount: string; currencyCode: string };
        availableForSale: boolean;
        colorName: string | null;
        skuInfo: {
          productType: string;
          patternCode: string;
          size: string;
          color: string;
        };
      };
    }>> = {};
    let totalMatches = 0;
    
    // Process each product and its variants
    allProducts.forEach(product => {
      if (!product.variants || product.variants.length === 0) return;
      
      // Exclude ReCoat items based on tags
      const isRecoat = product.tags?.some(tag => tag.toLowerCase() === 'recoat');
      if (isRecoat) {
        console.log(`Filtering out ReCoat product: ${product.title} (tags: ${product.tags.join(', ')})`);
        return;
      }
      
      // Group variants by product type and color
      const variantsByType: Record<string, Record<string, Array<{
        id: string;
        title: string;
        handle: string;
        price: string;
        currencyCode: string;
        availableForSale: boolean;
        featuredImage: string | null;
        onlineStoreUrl: string | null;
        variant: {
          id: string;
          sku: string;
          price: { amount: string; currencyCode: string };
          availableForSale: boolean;
          colorName: string | null;
          skuInfo: {
            productType: string;
            patternCode: string;
            size: string;
            color: string;
          };
        };
      }>>> = {};
      
      // This product's variants in the recommended size, per type, in Shopify order.
      const orderedByType: Record<string, Array<(typeof variantsByType)[string][string][number]>> = {};

      product.variants.forEach((variant) => {
        if (!variant.sku) return;
        
        const skuParts = variant.sku.split('-');
        if (skuParts.length < 3) return; // Need at least: TYPE-BREED-SIZE
        
        const type = skuParts[0];     // RC, TW, WC, CC
        const breed = skuParts[1];    // VS, BG, etc.
        const size = skuParts[2];     // XS, S, M, L, XL
        const color = skuParts[3] || 'DEFAULT'; // Color (optional)
        
        // Check if this variant matches our pattern exactly
        if (breed === expectedBreed && size === expectedSize) {
          if (!variantsByType[type]) {
            variantsByType[type] = {};
          }
          if (!variantsByType[type][color]) {
            variantsByType[type][color] = [];
          }
          
          // Create a minimal product variant with only what we need
          const productVariant = {
            id: product.id,
            title: product.title,
            handle: product.handle,
            price: variant.price?.amount || product.price || '0',
            currencyCode: variant.price?.currencyCode || product.currencyCode || 'USD',
            availableForSale: variant.availableForSale && product.availableForSale,
            featuredImage: product.featuredImage,
            onlineStoreUrl: product.onlineStoreUrl, // Cart link
            variant: {
              id: variant.id,
              sku: variant.sku,
              price: variant.price,
              availableForSale: variant.availableForSale,
              colorName: variant.colorName,
              skuInfo: {
                productType: type,
                patternCode: breed,
                size: size,
                color: color
              }
            }
          };
          
          variantsByType[type][color].push(productVariant);
          (orderedByType[type] ??= []).push(productVariant);
        }
      });
      
      // For each product type, select the best available color
      Object.keys(variantsByType).forEach(type => {
        if (!productsByType[type]) {
          productsByType[type] = [];
        }
        
        // Green if purchasable in this size, else the first purchasable colour in
        // Shopify's order. Replaces a seasonal colour list that preferred Black and
        // never matched the store's colour codes.
        const selectedVariant = selectVariantForProductLink(orderedByType[type] ?? []);
        
        // Add the selected variant to the results
        if (selectedVariant) {
          // Avoid duplicates based on variant ID
          const exists = productsByType[type].some(p => p.variant?.id === selectedVariant.variant.id);
          if (!exists) {
            productsByType[type].push(selectedVariant);
            totalMatches++;
          }
        }
      });
    });
    
    // console.log(`Found ${totalMatches} matching products for pattern ${patternCode}:`, 
      // Object.keys(productsByType).map(type => `${type}: ${productsByType[type].length}`).join(', '));
    
    // Log color selection details for debugging
    Object.keys(productsByType).forEach(type => {
      const products = productsByType[type];
      if (products.length > 0) {
        const selectedColors = products.map(p => p.variant.skuInfo.color).join(', ');
        const availableStatus = products.map(p => p.variant.availableForSale ? '✓' : '✗').join(', ');
        // console.log(`${type} selected colors: [${selectedColors}] availability: [${availableStatus}]`);

      }
    });
    
    // Debug: Log some sample SKUs being processed
    if (totalMatches === 0) {
      const sampleSKUs = allProducts
        .flatMap(p => p.variants || [])
        .filter(v => v.sku)
        .slice(0, 10)
        .map(v => v.sku);
      // console.log(`No matches found. Sample SKUs being processed:`, sampleSKUs);
      // console.log(`Looking for breed: ${expectedBreed}, size: ${expectedSize}`);
    }

    // If specific product type requested, return only that type
    if (productType) {
      return NextResponse.json({
        ok: true,
        products: productsByType[productType] || [],
        patternCode,
        productType,
        total: productsByType[productType]?.length || 0,
        debug: {
          totalProductsSearched: allProducts.length,
          expectedBreed,
          expectedSize,
          allProductTypes: Object.keys(productsByType),
          selectedColors: productsByType[productType]?.map(p => ({
            color: p.variant.colorName ?? p.variant.skuInfo.color,
            available: p.variant.availableForSale,
            sku: p.variant.sku
          })) || []
        }
      });
    }

    // Return all product types
    return NextResponse.json({
      ok: true,
      productsByType,
      patternCode,
      total: totalMatches,
      debug: {
        totalProductsSearched: allProducts.length,
        expectedBreed,
        expectedSize,
        productTypesFound: Object.keys(productsByType),
        matchesByType: Object.keys(productsByType).reduce((acc, type) => {
          acc[type] = productsByType[type].length;
          return acc;
        }, {} as Record<string, number>),
        selectedColorsByType: Object.keys(productsByType).reduce((acc, type) => {
          acc[type] = productsByType[type].map(p => ({
            color: p.variant.colorName ?? p.variant.skuInfo.color,
            available: p.variant.availableForSale,
            sku: p.variant.sku
          }));
          return acc;
        }, {} as Record<string, Array<{
          color: string;
          available: boolean;
          sku: string;
        }>>)
      }
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch products by pattern';
    console.error('Products by pattern API error:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
