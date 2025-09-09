import { NextRequest, NextResponse } from 'next/server';
import { coatPatterns } from '@/data/realPatterns';
import { DogMeasurements, ShopifyProductInfo } from '@/types';
import { findBestFits } from '@/utils/fitCalculator';
import { fetchProducts, ShopifyProduct } from '@/lib/shopify';

// Rate limiting setup (in production, use Redis or similar)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10; // Max 10 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];
  
  // Remove old requests outside the window
  const validRequests = userRequests.filter((time: number) => now - time < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= MAX_REQUESTS) {
    return true;
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitMap.set(ip, validRequests);
  
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    
    // Check rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Validate request body
    const body = await request.json();
    const { measurements, useDummyData = true } = body;

    if (!measurements) {
      return NextResponse.json(
        { error: 'Missing measurements data' },
        { status: 400 }
      );
    }

    // Validate measurements structure
    const requiredFields = ['breed', 'length', 'neckMeasurement', 'chestMeasurement', 'legLength', 'tailType'];
    const missingFields = requiredFields.filter(field => !measurements[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate measurement values
    if (measurements.length <= 0 || measurements.neckMeasurement <= 0 || measurements.chestMeasurement <= 0) {
      return NextResponse.json(
        { error: 'Invalid measurement values' },
        { status: 400 }
      );
    }

    // Log request for analytics (in production, use proper logging)
    console.log(`Fit request from ${ip}:`, {
      breed: measurements.breed,
      useDummyData,
      timestamp: new Date().toISOString()
    });

    // Calculate best fits using internal pattern database - limit to 3 products
    const bestFits = findBestFits(measurements as DogMeasurements, coatPatterns, 3);

    // Attempt to fetch real Shopify products if not using dummy data
    let shopifyProducts: ShopifyProduct[] = [];
    let useShopifyProducts = false;
    
    if (!useDummyData) {
      try {
        // Check if Shopify API credentials are configured
        if (process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL && process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
          // Fetch products from Shopify (limit to 20 for efficiency)
          const shopifyResult = await fetchProducts(20);
          shopifyProducts = shopifyResult.products;
          useShopifyProducts = shopifyProducts.length > 0;
          
          console.log(`Successfully fetched ${shopifyProducts.length} products from Shopify`);
        } else {
          console.log('Shopify API credentials not configured, using pattern database only');
        }
      } catch (shopifyError) {
        console.error('Error fetching Shopify products:', shopifyError);
        // Continue with pattern database results if Shopify API fails
      }
    } else {
      console.log('Using dummy data as requested');
    }

    // Map patterns to Shopify products where possible
    const enrichedResults = bestFits.map(result => {
      const basicResult = {
        pattern: {
          id: result.pattern.id,
          name: result.pattern.name,
          size: result.pattern.size,
          category: result.pattern.category,
          productId: result.pattern.productId,
          productUrl: result.pattern.productUrl,
          price: result.pattern.price,
          description: result.pattern.description,
          features: result.pattern.features,
          targetBreeds: result.pattern.targetBreeds,
          patternCode: result.pattern.patternCode,
          // DO NOT include internal measurements
        },
        score: result.score,
        fitNotes: result.fitNotes,
        shopifyProduct: null as ShopifyProductInfo | null
      };
      
      // If we have Shopify products, try to find a matching one
      if (useShopifyProducts) {
        // Look for Shopify product with tag or product type matching pattern code or category
        const matchingProduct = shopifyProducts.find(product => {
          // Check if tags include the pattern code
          const hasPattermCodeTag = product.tags?.some(tag => 
            tag === result.pattern.patternCode || 
            tag.includes(result.pattern.size)
          );
          
          // Check if product type matches category
          const hasMatchingType = product.productType?.toLowerCase()
            .includes(result.pattern.category.toLowerCase());
          
          // Check if title includes size
          const hasSizeInTitle = product.title?.includes(result.pattern.size);
          
          return hasPattermCodeTag || hasMatchingType || hasSizeInTitle;
        });
        
        if (matchingProduct) {
          // Add Shopify product data
          basicResult.shopifyProduct = {
            id: matchingProduct.id,
            title: matchingProduct.title,
            handle: matchingProduct.handle,
            description: matchingProduct.description,
            productUrl: matchingProduct.onlineStoreUrl || `/products/${matchingProduct.handle}`,
            price: parseFloat(matchingProduct.priceRange.minVariantPrice.amount),
            currencyCode: matchingProduct.priceRange.minVariantPrice.currencyCode,
            featuredImage: matchingProduct.featuredImage?.url,
            variantIds: matchingProduct.variants.map(variant => variant.id),
            availableForSale: matchingProduct.availableForSale
          };
          
          // Update product URL to Shopify product
          basicResult.pattern.productUrl = matchingProduct.onlineStoreUrl || `/products/${matchingProduct.handle}`;
          
          // Use actual Shopify price if available
          if (matchingProduct.priceRange?.minVariantPrice?.amount) {
            basicResult.pattern.price = parseFloat(matchingProduct.priceRange.minVariantPrice.amount);
          }
        }
      }
      
      return basicResult;
    });

    return NextResponse.json({
      success: true,
      results: enrichedResults,
      usingShopifyProducts: useShopifyProducts,
      usedDummyData: useDummyData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pattern matching error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}