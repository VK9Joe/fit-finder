'use client';

import { FitResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, ExternalLink, Star, CheckCircle, AlertCircle } from 'lucide-react';

// Helper function to truncate description text
function truncateDescription(text: string | undefined, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

interface FitResultsProps {
  results: FitResult[];
  onStartOver: () => void;
}

export default function FitResults({ results, onStartOver }: FitResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 75) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-orange-100 text-orange-800 border-orange-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4" />;
    if (score >= 75) return <Star className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const handleAddToCart = async (result: FitResult) => {
    // Check if we have Shopify product data
    if (result.shopifyProduct) {
      try {
        // Build a Shopify cart URL with the first variant
        const variantId = result.shopifyProduct.variantIds?.[0];
        if (!variantId) {
          throw new Error('No product variant available');
        }

        // Create a checkout URL with product details using Shopify cart API
        const checkoutUrl = `/cart/add?id=${variantId}&quantity=1`;
        
        // Add fit score as line item property if supported by the store
        const fullUrl = `${checkoutUrl}&properties[Fit Score]=${Math.round(result.score)}%`;
        
        // Open in current window for Shopify integration
        window.location.href = fullUrl;
      } catch (error) {
        console.error('Failed to add to cart:', error);
        // Fallback to product page
        window.open(result.shopifyProduct.productUrl, '_blank');
      }
    } else {
      // Fallback to demo behavior for pattern-only results
      try {
        // For demo purposes, we'll simulate success and redirect
        console.log('Adding to cart:', {
          id: result.pattern.productId,
          quantity: 1,
          properties: {
            'Fit Score': `${Math.round(result.score)}%`,
            'Pattern Code': result.pattern.patternCode,
            'Size': result.pattern.size
          }
        });
        
        // Create a checkout URL with product details
        const checkoutUrl = `/cart/add?id=${result.pattern.productId}&quantity=1&properties[Fit-Score]=${Math.round(result.score)}%25&properties[Pattern-Code]=${result.pattern.patternCode}`;
        
        // Open in current window for Shopify integration
        window.location.href = checkoutUrl;
      } catch (error) {
        console.error('Failed to add to cart:', error);
        // Fallback to product page
        window.open(result.pattern.productUrl, '_blank');
      }
    }
  };

  const handleViewProduct = (result: FitResult) => {
    const productUrl = result.shopifyProduct?.productUrl || result.pattern.productUrl;
    window.open(productUrl, '_blank');
  };

  if (results.length === 0) {
    return (
      <Card className="text-center">
        <CardContent className="pt-12 pb-12">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <div>
              <CardTitle className="text-2xl mb-4">No Perfect Matches Found</CardTitle>
              <CardDescription className="text-base max-w-md mx-auto">
                We couldn&apos;t find coats matching your measurements. Try adjusting them or contact us for custom sizing.
              </CardDescription>
            </div>
            <Button onClick={onStartOver} variant="outline" size="lg" className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white">
              Try Different Measurements
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Results Header */}
      <Card className="professional-card">
        <CardContent className="pt-10 pb-10">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-6 py-3">
              <CheckCircle className="h-5 w-5" />
              <span className="font-bold text-lg">Perfect Matches Found!</span>
            </div>
            <CardTitle className="text-4xl font-bold text-gray-900">Your Perfect Fit Recommendations</CardTitle>
            <CardDescription className="text-xl max-w-3xl mx-auto text-gray-600">
              We found {results.length} coat{results.length > 1 ? 's' : ''} that match your dog&apos;s measurements. 
              Each recommendation includes detailed fit analysis and direct purchase options.
            </CardDescription>
            <div className="inline-block bg-brand-teal/10 text-brand-teal px-4 py-2 rounded-full font-medium text-sm">
              Performance Outerwear + Perfect Fit
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {results.map((result, index) => (
          <Card key={result.pattern.id} className="professional-card hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            {/* Best Match Badge */}
            {index === 0 && (
              <div className="absolute top-4 left-4 z-10">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-md">
                  <Star className="w-3 h-3 mr-1" />
                  BEST MATCH
                </Badge>
              </div>
            )}

            {/* Fit Score Badge */}
            <div className="absolute top-4 right-4 z-10">
              <Badge className={`${getScoreColor(result.score)} border font-semibold`}>
                {getScoreIcon(result.score)}
                <span className="ml-1">{Math.round(result.score)}% Fit</span>
              </Badge>
            </div>

            {/* Product Image Area */}
            <div className="relative h-64 bg-white flex items-center justify-center overflow-hidden">
              {result.shopifyProduct?.featuredImage ? (
                <div className="flex items-center justify-center w-full h-full p-2">
                  <img 
                    src={result.shopifyProduct.featuredImage} 
                    alt={result.shopifyProduct.title || result.pattern.name}
                    className="max-w-full max-h-full object-contain"
                    style={{ maxHeight: "220px" }}
                  />
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-600">{result.pattern.category}</div>
                </div>
              )}
            </div>

            <CardContent className="p-6">
              {/* Product Info */}
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-xl group-hover:text-teal-600 transition-colors">
                    {result.shopifyProduct?.title || result.pattern.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {truncateDescription(result.shopifyProduct?.description || result.pattern.description, 80)}
                  </CardDescription>
                </div>

                {/* Product Details */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>{result.pattern.size}</span>
                  </div>
                  {result.pattern.patternCode && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{result.pattern.patternCode}</span>
                    </div>
                  )}
                </div>

                {/* Key Features */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Key Features:</div>
                  <div className="flex flex-wrap gap-1">
                    {result.pattern.features.slice(0, 3).map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Fit Notes */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                    Fit Analysis
                  </div>
                  <div className="space-y-2">
                    {result.fitNotes.slice(0, 3).map((note, noteIndex) => (
                      <div key={noteIndex} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{note}</span>
                      </div>
                    ))}
                    {result.fitNotes.length > 3 && (
                      <div className="text-teal-600 font-medium text-sm">
                        +{result.fitNotes.length - 3} more benefits
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Price and Actions */}
                <div className="flex flex-col h-[180px]"> {/* Fixed height container for consistent alignment */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold">
                      ${result.shopifyProduct?.price || result.pattern.price}
                      {result.shopifyProduct?.currencyCode && 
                        <span className="text-sm ml-1 font-normal">{result.shopifyProduct.currencyCode}</span>
                      }
                    </div>
                    <div className="text-sm text-gray-500">Free shipping</div>
                  </div>

                  {/* This spacer pushes buttons to the bottom */}
                  <div className="flex-grow"></div>
                  
                  <div className="space-y-2 mt-auto"> {/* mt-auto pushes to bottom */}
                    <Button
                      onClick={() => handleAddToCart(result)}
                      className="w-full bg-brand-teal hover:bg-brand-teal-dark text-white"
                      size="lg"
                      disabled={result.shopifyProduct?.availableForSale === false}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {result.shopifyProduct?.availableForSale === false 
                        ? 'Out of Stock' 
                        : `Add to Cart - $${result.shopifyProduct?.price || result.pattern.price}`}
                    </Button>
                    <Button
                      onClick={() => handleViewProduct(result)}
                      variant="outline"
                      className="w-full border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Actions */}
      <Card>
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            <div>
              <CardTitle className="text-xl mb-2">Not quite right?</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Try adjusting your measurements or contact our expert team for personalized sizing assistance.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onStartOver} variant="outline" size="lg" className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white">
              Try Different Measurements
            </Button>
            <Button size="lg" className="bg-brand-teal hover:bg-brand-teal-dark text-white">
              Contact Sizing Expert
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Indicators */}
      <Card className="professional-card">
        <CardContent className="pt-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <div className="font-bold text-lg">Perfect Fit Guarantee</div>
              <div className="text-sm text-gray-600">Free exchanges if the fit isn&apos;t perfect</div>
            </div>
            
            <div className="space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <ShoppingCart className="w-8 h-8 text-primary" />
              </div>
              <div className="font-bold text-lg">Fast & Free Shipping</div>
              <div className="text-sm text-gray-600">2-day delivery on all orders</div>
            </div>
            
            <div className="space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <div className="font-bold text-lg">5-Star Reviews</div>
              <div className="text-sm text-gray-600">Trusted by thousands of pet parents</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}