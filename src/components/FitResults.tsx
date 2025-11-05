'use client';

import { PRODUCT_TYPES, ProductType } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ShoppingCart, CheckCircle, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { buildShopifyProductUrl } from '@/lib/shopify-url-builder';

interface FitResultsProps {
  results: {
    bestFit?: Array<{
      pattern: {
        id: string;
        name: string;
        description: string;
        price: number;
      };
      finalScore: number;
      fitLabel: string;
      neckScore: number;
      chestScore: number;
      lengthScore: number;
      fitNotes: string[];
      products?: Record<string, Array<{
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
          skuInfo: {
            color: string;
          };
        };
      }>>;
    }>;
    goodFit?: Array<{
      pattern: {
        id: string;
        name: string;
        description: string;
        price: number;
      };
      finalScore: number;
      fitLabel: string;
      neckScore: number;
      chestScore: number;
      lengthScore: number;
      fitNotes: string[];
      products?: Record<string, Array<{
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
          skuInfo: {
            color: string;
          };
        };
      }>>;
    }>;
    mightFit?: Array<{
      pattern: {
        id: string;
        name: string;
        description: string;
        price: number;
      };
      finalScore: number;
      fitLabel: string;
      neckScore: number;
      chestScore: number;
      lengthScore: number;
      fitNotes: string[];
      products?: Record<string, Array<{
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
          skuInfo: {
            color: string;
          };
        };
      }>>;
    }>;
  };
  measurements?: {
    breed: string;
    neckCircumference: number;
    chestCircumference: number;
    backLength: number;
    tailType: string;
    chondrodystrophic: boolean;
  };
  onStartOver: () => void;
}

export default function FitResults({ results, measurements, onStartOver }: FitResultsProps) {
  // View product functionality - redirects to Shopify with pre-selected variant and measurements
  const viewProduct = (productHandle: string, variantId: string, productType: ProductType, patternName?: string) => {
    try {
      // Extract size from fitLabel (e.g., "Medium - Good Fit" -> "Medium")
      const size = patternName ? patternName.split(' - ')[1] : undefined;
      
      const productUrl = buildShopifyProductUrl(productHandle, variantId, productType, measurements, size);
      // Open in new tab to maintain user's place in the fit finder
      window.open(productUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to build product URL:', error);
      // Fallback - try to open product page without variant
      const storeUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL?.replace(/^https?:\/\//, '') || '';
      if (storeUrl && productHandle) {
        window.open(`https://${storeUrl}/products/${productHandle}`, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Check if there are any results at all
  const hasAnyResults = !!(results && (
    (results.bestFit && results.bestFit.length > 0) ||
    (results.goodFit && results.goodFit.length > 0) ||
    (results.mightFit && results.mightFit.length > 0)
  ));

  // Show no results message if no patterns were found
  if (!results || !hasAnyResults) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Patterns Found</h2>
        <div className="max-w-2xl mx-auto mb-8">
          <p className="text-gray-600 text-lg leading-relaxed">
            We could not find a pattern that fits the measurements you provided. Please double check your measurements, and try choosing a different tail type. If there are no viable patterns, please visit our{' '}
            <a 
              href="https://k9apparel.com/collections/made-to-measure" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brand-teal hover:text-brand-teal-dark font-semibold underline"
            >
              Made-to-Measure page
            </a>.
          </p>
        </div>
        <Button onClick={onStartOver} className="bg-brand-teal hover:bg-brand-teal-dark text-white">
          Try Again
        </Button>
      </div>
    );
  }

  const getFitLabelColor = (label: string) => {
    switch (label) {
      case 'Best Fit': return 'bg-green-100 text-green-800';
      case 'Good Fit': return 'bg-blue-100 text-blue-800';
      case 'Might Fit': return 'bg-yellow-100 text-yellow-800';
      case 'Poor Fit': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderPatternCard = (result: {
    pattern: {
      id: string;
      name: string;
      description: string;
      price: number;
    };
    finalScore: number;
    fitLabel: string;
    neckScore: number;
    chestScore: number;
    lengthScore: number;
    fitNotes: string[];
    products?: Record<string, Array<{
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
        skuInfo: {
          color: string;
        };
      };
    }>>;
  }, globalIndex: number) => {
    // Use the global index directly as ranking (1-based)
    const ranking = globalIndex + 1;

    return (
      <div key={result.pattern.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 mt-16">
        {/* Pattern Header */}
        <div className="bg-gradient-to-r from-brand-teal/10 to-primary/10 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="text-sm font-semibold text-brand-teal bg-white px-3 py-1 rounded-full shadow-sm">#{ranking}</div>
                <Badge className={`${getFitLabelColor(result.fitLabel)} text-xs font-medium px-3 py-1`}>
                  {result.fitLabel}
                </Badge>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{result.pattern.name}</h2>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">{result.pattern.description}</p>
              
              {/* Fit Notes - Moved to replace Fit scores section */}
              {result.fitNotes.length > 0 && (
                <div className="bg-white/50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="h-5 w-5 mr-2 text-brand-teal" />
                    <h4 className="font-semibold text-gray-900">Fit Notes</h4>
                  </div>
                  <ul className="space-y-2">
                    {result.fitNotes.map((note: string, noteIndex: number) => (
                      <li key={noteIndex} className="text-sm text-gray-700 flex items-start leading-relaxed">
                        <span className="text-brand-teal mr-2 mt-1 font-bold">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="px-4 py-5 md:p-6">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <ShoppingCart className="h-5 w-5 mr-2 text-brand-teal" />
              <h3 className="text-lg font-semibold text-gray-900">Available Products</h3>
            </div>
            
            {/* Products Grid - Enhanced with images and cart functionality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {Object.entries(PRODUCT_TYPES).map(([type, name]) => {
                const products = result.products?.[type as ProductType] || [];
                const product = products[0]; // Get first product of each type
                
                // Always show product card even if no specific product data is available
                // This ensures we don't show "Coming Soon" when products are actually available
                const defaultProduct = {
                  id: `default-${type}`,
                  title: `${name}`,
                  description: `${name} for ${result.pattern.name}`,
                  price: result.pattern.price || 39.99,
                  availableForSale: true
                };
                
                const displayProduct = product || defaultProduct;

                // Check if we have actual products for this type
                const hasProducts = displayProduct && displayProduct.id && !displayProduct.id.startsWith('default-');

                return (
                  <div key={type} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-brand-teal/30 hover:shadow-lg transition-all duration-300 flex flex-col h-full group">
                    {/* Product Image */}
                    <div className="aspect-square w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                      {hasProducts && displayProduct.featuredImage ? (
                        <Image
                          src={displayProduct.featuredImage}
                          alt={displayProduct.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          quality={90}
                          priority={false}
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <ShoppingCart className="h-8 w-8 mb-2" />
                          <span className="text-xs font-medium">{name}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info - flex-grow to push button to bottom */}
                    <div className="p-3 md:p-4 flex flex-col flex-grow">
                      <div className="text-sm font-semibold text-gray-900 mb-2 overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }} title={displayProduct.title}>
                        {hasProducts ? displayProduct.title : `${name} - ${result.pattern.name}`}
                      </div>
                      
                      {/* Price */}
                      <div className="text-lg font-bold text-brand-teal mb-2">
                        From ${hasProducts ? parseFloat(displayProduct.price).toFixed(2) : (result.pattern.price || 39.99).toFixed(2)} USD
                      </div>

                      {/* Spacer to push button to bottom */}
                      <div className="flex-grow"></div>

                      {/* View Product Button - now at bottom */}
                      {hasProducts ? (
                        <Button 
                          size="sm" 
                          className="w-full text-xs py-2.5 mt-3 bg-brand-teal hover:bg-brand-teal-dark text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                          onClick={() => viewProduct(displayProduct.handle, displayProduct.variant.id, type as ProductType, result.pattern.name)}
                          disabled={!displayProduct.availableForSale}
                        >
                          {displayProduct.availableForSale ? (
                            <>
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Product
                            </>
                          ) : (
                            '✗ Out of Stock'
                          )}
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full text-xs py-2.5 mt-3 border-brand-teal/30 text-brand-teal hover:bg-brand-teal/5 rounded-lg"
                          disabled
                        >
                          Coming Soon
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


        </div>
      </div>
    );
  };

  // Combine all results with global indexing
  const allResults = [
    ...(results.bestFit || []),
    ...(results.goodFit || []),
    ...(results.mightFit || [])
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* User Measurements Display */}
      {measurements && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-brand-teal/30 p-6 mt-16">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-brand-teal text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">✓</span>
            Your Dog&apos;s Measurements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">Breed</div>
              <div className="text-sm font-bold text-gray-900">{measurements.breed}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">Neck</div>
              <div className="text-sm font-bold text-gray-900">{measurements.neckCircumference}&quot;</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">Chest</div>
              <div className="text-sm font-bold text-gray-900">{measurements.chestCircumference}&quot;</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">Back Length</div>
              <div className="text-sm font-bold text-gray-900">{measurements.backLength}&quot;</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">Tail Type</div>
              <div className="text-sm font-bold text-gray-900 capitalize">{measurements.tailType}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">Leg Type</div>
              <div className="text-sm font-bold text-gray-900">{measurements.chondrodystrophic ? 'Very Short' : 'Normal'}</div>
            </div>
          </div>
        </div>
      )}

      {allResults.map((result, globalIndex: number) => 
        renderPatternCard(result, globalIndex)
      )}

      {/* Start Over Button */}
      <div className="text-center pt-6">
        <Button 
          onClick={onStartOver} 
          className="bg-brand-teal hover:bg-brand-teal-dark text-white px-8 py-3 rounded-lg text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Find Another Pattern
        </Button>
      </div>
    </div>
  );
}