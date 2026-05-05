'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ExternalLink, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { PRODUCT_TYPES, ProductType, UserInput } from '@/types';
import { WholesaleMatch, scoreToPercent } from '@/utils/wholesalePatternFinder';
import { buildShopifyProductUrl } from '@/lib/shopify-url-builder';

interface WholesaleResultsProps {
  results: WholesaleMatch[];
  measurements: UserInput;
  storeCode: string;
  onNewCustomer: () => void;
}

export default function WholesaleResults({
  results,
  measurements,
  onNewCustomer,
}: WholesaleResultsProps) {
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  const toggleNotes = (rank: number) => {
    setExpandedNotes((prev) => ({ ...prev, [rank]: !prev[rank] }));
  };

  const viewProduct = (
    productHandle: string,
    variantId: string,
    productType: ProductType,
    patternName?: string
  ) => {
    try {
      const size = patternName ? patternName.split(' - ')[1] : undefined;
      const url = buildShopifyProductUrl(productHandle, variantId, productType, measurements, size);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      const storeUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL?.replace(/^https?:\/\//, '') || '';
      if (storeUrl && productHandle) {
        window.open(`https://${storeUrl}/products/${productHandle}`, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const getFitColor = (label: string) => {
    switch (label) {
      case 'Best Fit': return 'bg-green-100 text-green-800 border-green-200';
      case 'Good Fit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Might Fit': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Poor Fit': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-400 text-yellow-900';
      case 2: return 'bg-gray-300 text-gray-800';
      case 3: return 'bg-amber-600 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Fit Results</h1>
          <p className="text-xs text-gray-500">{measurements.breed} &bull; {measurements.neckCircumference}&quot; neck &bull; {measurements.chestCircumference}&quot; chest &bull; {measurements.backLength}&quot; back</p>
        </div>
        <Button
          onClick={onNewCustomer}
          className="bg-brand-teal hover:bg-brand-teal-dark text-white flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm"
        >
          <RotateCcw className="h-4 w-4" />
          New Customer
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {results.map((result) => {
          const score = scoreToPercent(result.finalScore);
          const notesOpen = expandedNotes[result.rank] ?? false;

          return (
            <div key={result.pattern.id} className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              {/* Match header */}
              <div className="bg-gradient-to-r from-brand-teal/8 to-transparent p-5 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  {/* Rank badge */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${getRankColor(result.rank)}`}>
                    #{result.rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {/* Pattern code chip */}
                      <span className="font-mono text-sm font-bold bg-gray-900 text-white px-2.5 py-1 rounded-md tracking-wider">
                        {result.pattern.patternCode}
                      </span>
                      {/* Fit label */}
                      <Badge className={`text-xs font-semibold px-2.5 py-1 border ${getFitColor(result.fitLabel)}`}>
                        {result.fitLabel}
                      </Badge>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{result.pattern.name}</h2>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-3xl font-extrabold text-brand-teal tabular-nums">{score}%</div>
                    <div className="text-xs text-gray-400 font-medium">match score</div>
                  </div>
                </div>

                {/* Fit notes toggle */}
                {result.fitNotes.length > 0 && (
                  <button
                    onClick={() => toggleNotes(result.rank)}
                    className="mt-3 flex items-center gap-1 text-sm text-gray-500 hover:text-brand-teal transition-colors font-medium"
                  >
                    {notesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {notesOpen ? 'Hide' : 'Show'} fit notes ({result.fitNotes.length})
                  </button>
                )}

                {notesOpen && (
                  <ul className="mt-3 space-y-1.5 bg-white/60 rounded-lg p-3">
                    {result.fitNotes.map((note, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-brand-teal font-bold mt-0.5">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Products */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="h-4 w-4 text-brand-teal" />
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Available Products</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(PRODUCT_TYPES).map(([type, name]) => {
                    const products = result.products?.[type as ProductType] || [];
                    const product = products[0];
                    const hasProduct = product && !product.id.startsWith('default-');

                    return (
                      <div
                        key={type}
                        className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:border-brand-teal/40 hover:shadow-md transition-all duration-200"
                      >
                        {/* Image */}
                        <div className="aspect-square w-full bg-white flex items-center justify-center relative overflow-hidden">
                          {hasProduct && product.featuredImage ? (
                            <Image
                              src={product.featuredImage}
                              alt={product.title}
                              fill
                              sizes="(max-width: 640px) 50vw, 25vw"
                              className="object-cover"
                              quality={90}
                              placeholder="blur"
                              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                            />
                          ) : (
                            <div className="flex flex-col items-center text-gray-300">
                              <ShoppingCart className="h-6 w-6 mb-1" />
                              <span className="text-xs">{name}</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-3 flex flex-col flex-1">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{name}</div>
                          {hasProduct && (
                            <div className="text-sm font-bold text-brand-teal mb-2">
                              From ${parseFloat(product.price).toFixed(2)}
                            </div>
                          )}
                          <div className="flex-1" />
                          {hasProduct ? (
                            <Button
                              size="sm"
                              className="w-full text-xs py-2 mt-2 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-lg"
                              onClick={() => viewProduct(product.handle, product.variant.id, type as ProductType, result.pattern.name)}
                              disabled={!product.availableForSale}
                            >
                              {product.availableForSale ? (
                                <><ExternalLink className="h-3 w-3 mr-1" />View</>
                              ) : (
                                'Out of Stock'
                              )}
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="w-full text-xs py-2 mt-2 border-gray-200 text-gray-400 rounded-lg" disabled>
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
          );
        })}

        {/* Bottom reset */}
        <div className="text-center pt-4 pb-8">
          <Button
            onClick={onNewCustomer}
            className="bg-brand-teal hover:bg-brand-teal-dark text-white px-8 py-3 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Next Customer
          </Button>
        </div>
      </div>
    </div>
  );
}
