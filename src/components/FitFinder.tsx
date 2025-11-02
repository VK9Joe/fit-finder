'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserInput } from '@/types';
import { findPatterns } from '@/utils/patternFinder';
import { getTop3PatternsWithProducts } from '@/lib/patternProducts';
import { patternsFromCsv } from '@/data/patternsFromCsv';
import { useIframeHeight, triggerHeightUpdate } from '@/hooks/useIframeHeight';
import FitFinderForm from './FitFinderForm';
import FitResults from './FitResults';

type AppState = 'form' | 'loading' | 'results';

export default function FitFinder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useIframeHeight();
  
  const [appState, setAppState] = useState<AppState>('form');
  const [enhancedResults, setEnhancedResults] = useState<{
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
  } | null>(null);
  
  const [lastMeasurements, setLastMeasurements] = useState<UserInput | null>(null);

  // Check URL parameters on mount and when they change
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const hasParams = ['breed', 'neck', 'chest', 'length', 'tail'].some(param => urlParams.has(param));
    
    if (hasParams) {
      const breed = urlParams.get('breed');
      const neck = parseFloat(urlParams.get('neck') || '0');
      const chest = parseFloat(urlParams.get('chest') || '0');
      const length = parseFloat(urlParams.get('length') || '0');
      const tail = urlParams.get('tail') as UserInput['tailType'];
      const chondro = urlParams.get('chondro') === 'true';

      // Validate that we have complete measurements
      if (breed && neck > 0 && chest > 0 && length > 0 && tail) {
        const measurements: UserInput = {
          breed,
          neckCircumference: neck,
          chestCircumference: chest,
          backLength: length,
          tailType: tail,
          chondrodystrophic: chondro
        };

        setLastMeasurements(measurements);
        loadResults(measurements);
      }
    } else {
      // Clear state if no parameters
      setAppState('form');
      setLastMeasurements(null);
      setEnhancedResults(null);
    }
  }, [searchParams]);

  // Save measurements to URL
  const saveMeasurements = (measurements: UserInput) => {
    try {
      // Update URL with query parameters
      const params = new URLSearchParams();
      params.set('breed', measurements.breed);
      params.set('neck', measurements.neckCircumference.toString());
      params.set('chest', measurements.chestCircumference.toString());
      params.set('length', measurements.backLength.toString());
      params.set('tail', measurements.tailType);
      if (measurements.chondrodystrophic) {
        params.set('chondro', 'true');
      }
      
      // Update URL without refreshing the page
      router.push(`?${params.toString()}`, { scroll: false });
      
      setLastMeasurements(measurements);
    } catch (error) {
      console.error('Error saving measurements:', error);
    }
  };

  // Load results based on measurements
  const loadResults = async (measurements: UserInput) => {
    setAppState('loading');

    // Scroll to loading state immediately
    setTimeout(() => {
      const loadingElement = document.getElementById('loading-state');
      if (loadingElement) {
        loadingElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);

    try {
      // Use the enhanced pattern finder
      const categorizedResults = findPatterns(measurements, patternsFromCsv);

      // Enhance with products
      const enhanced = await getTop3PatternsWithProducts(categorizedResults);
      setEnhancedResults(enhanced);
      setAppState('results');

      // Trigger height update after content changes
      setTimeout(() => {
        triggerHeightUpdate();
      }, 100);

    } catch (error) {
      console.error('Error getting fit results:', error);
      setEnhancedResults(null);
      setAppState('results');

      // Trigger height update even on error
      setTimeout(() => {
        triggerHeightUpdate();
      }, 100);
    }
  };

  const handleFormSubmit = async (measurements: UserInput) => {
    saveMeasurements(measurements);
    await loadResults(measurements);
  };

  const handleStartOver = () => {
    // Clear URL parameters to show form
    router.push('/', { scroll: false });
    setAppState('form');
    setLastMeasurements(null);
    setEnhancedResults(null);
    
    // Trigger height update after state change
    setTimeout(() => {
      triggerHeightUpdate();
    }, 100);
  };

  // Regular layout - always show form, conditionally show results below
  return (
    <div ref={containerRef} className="relative w-full">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-8">
        {/* Form - always visible */}
        <FitFinderForm
          onSubmit={handleFormSubmit}
          isLoading={appState === 'loading'}
          initialMeasurements={lastMeasurements}
          hasResults={appState === 'results' && enhancedResults !== null}
        />

        {/* Loading state - shown below form */}
        {appState === 'loading' && (
          <div id="loading-state" className="mt-12 text-center py-16">
            <div className="inline-flex items-center px-8 py-4 bg-brand-teal/10 rounded-xl">
              <svg className="animate-spin -ml-1 mr-4 h-8 w-8 text-brand-teal" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg font-semibold text-brand-teal">Finding your perfect fit...</span>
            </div>
          </div>
        )}

        {/* Results - shown below form when available */}
        {appState === 'results' && enhancedResults && (
          <div id="fit-results" className="mt-12">
            <FitResults
              results={enhancedResults}
              measurements={lastMeasurements || undefined}
              onStartOver={handleStartOver}
            />
          </div>
        )}
      </div>
    </div>
  );
}