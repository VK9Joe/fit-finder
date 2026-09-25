'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import ShoppingPathCTAs from './ShoppingPathCTAs';
import { FitLegend, CrossBreedNote } from './FitExplanation';
import { formatBreedName } from '@/data/breedList';

interface FitResultsProps {
  results: {
    bestFit?: Array<{
      pattern: {
        id: string;
        name: string;
        description: string;
        price: number;
        category?: string;
        size?: string;
        patternCode?: string;
        measurements?: { rcLength?: number };
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
        category?: string;
        size?: string;
        patternCode?: string;
        measurements?: { rcLength?: number };
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
        category?: string;
        size?: string;
        patternCode?: string;
        measurements?: { rcLength?: number };
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
  // Check if there are any results at all
  const hasAnyResults = !!(results && (
    (results.bestFit && results.bestFit.length > 0) ||
    (results.goodFit && results.goodFit.length > 0) ||
    (results.mightFit && results.mightFit.length > 0)
  ));

  // Show no results message if no patterns were found
  if (!results || !hasAnyResults) {
    return (
      <div id="no-results" className="text-center py-16">
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Patterns Found</h2>
        <div className="max-w-2xl mx-auto mb-8">
          <p className="text-gray-600 text-lg leading-relaxed">
            We could not find a pattern that fits the measurements you provided. Please double check your measurements, and try choosing a different tail type. If there are still no viable patterns, please{' '}
            <a
              href="https://k9apparel.com/pages/contact-us"
              target="_top"
              className="text-brand-teal hover:text-brand-teal-dark font-semibold underline"
            >
              contact Customer Service
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
      category?: string;
      size?: string;
      patternCode?: string;
      measurements?: { rcLength?: number };
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
                {result.pattern.measurements?.rcLength !== undefined && (
                  <Badge className="bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium px-3 py-1">
                    RC: {result.pattern.measurements.rcLength}&quot;
                  </Badge>
                )}
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

              {/* Why this card may be named after a different breed */}
              <CrossBreedNote
                enteredBreed={measurements?.breed}
                patternName={result.pattern.name}
                patternBreed={result.pattern.category}
                patternCode={result.pattern.patternCode}
              />
            </div>
          </div>
        </div>

        {/* Shopping paths for this specific breed + size recommendation */}
        <div className="px-4 py-5 md:p-6">
          <ShoppingPathCTAs
            patternName={result.pattern.name}
            breed={result.pattern.category}
            sizeCode={result.pattern.size}
            products={result.products}
            measurements={measurements}
          />
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
              <div className="text-sm font-bold text-gray-900">{formatBreedName(measurements.breed)}</div>
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

      <div className="mt-8">
        <FitLegend />
      </div>

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