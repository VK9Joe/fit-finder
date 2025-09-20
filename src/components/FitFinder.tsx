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

  // Regular layout
  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hero Section - Always visible */}
      <div className="relative overflow-hidden">
        {/* Hero Background Image */}
        <div className="relative h-[450px] md:h-[550px] lg:h-[700px] w-full bg-cover bg-center bg-no-repeat"
             style={{ backgroundImage: 'url(/hero_bg.png)' }}>
          {/* Overlay for better text contrast */}
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Dynamic Heading based on state */}
          <div className="absolute left-8 md:left-16 top-[45%] transform -translate-y-1/2 z-10">
            <h1 className="text-3xl md:text-4xl text-white/90 font-medium drop-shadow-lg">
              {appState === 'form' ? 'Fit-Finder' : 'Your Perfect Fit Results'}
            </h1>
            {appState === 'results' && enhancedResults && (
              <p className="text-white/80 text-sm md:text-base drop-shadow-md mt-2">
                Found {[
                  ...(enhancedResults.bestFit || []),
                  ...(enhancedResults.goodFit || []),
                  ...(enhancedResults.mightFit || [])
                ].length} pattern{[
                  ...(enhancedResults.bestFit || []),
                  ...(enhancedResults.goodFit || []),
                  ...(enhancedResults.mightFit || [])
                ].length !== 1 ? 's' : ''} that match your dog&apos;s measurements
              </p>
            )}
          </div>
          
          {/* Bottom Banner */}
          <div className="absolute bottom-0 left-0 right-0 py-6 w-full bg-brand-teal shadow-lg">
            <div className="container mx-auto text-center">
              <p className="text-white text-xl md:text-3xl font-bold tracking-wide">Performance Outerwear + Perfect Fit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {appState === 'form' && (
          <FitFinderForm
            onSubmit={handleFormSubmit}
            isLoading={false}
            initialMeasurements={lastMeasurements}
          />
        )}

        {appState === 'results' && (
          <FitResults
            results={enhancedResults || { bestFit: [], goodFit: [], mightFit: [] }}
            measurements={lastMeasurements || undefined}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  );
}