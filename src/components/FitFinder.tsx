'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserInput } from '@/types';
import { findPatterns } from '@/utils/patternFinder';
import { getTop3PatternsWithProducts } from '@/lib/patternProducts';
import { patternsFromCsv } from '@/data/patternsFromCsv';
import FitFinderForm from './FitFinderForm';
import FitResults from './FitResults';

type AppState = 'form' | 'loading' | 'results';

export default function FitFinder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
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

  // Load measurements from URL on component mount
  useEffect(() => {
    // Check URL parameters
    const breed = searchParams.get('breed');
    const neckCircumference = searchParams.get('neck');
    const chestCircumference = searchParams.get('chest');
    const backLength = searchParams.get('length');
    const tailType = searchParams.get('tail') as UserInput['tailType'] | null;
    const chondrodystrophic = searchParams.get('chondro') === 'true';
    
    // If URL has all required parameters, use them and show results
    if (breed && neckCircumference && chestCircumference && backLength && tailType) {
      const measurements: UserInput = {
        breed,
        neckCircumference: parseFloat(neckCircumference),
        chestCircumference: parseFloat(chestCircumference),
        backLength: parseFloat(backLength),
        tailType,
        chondrodystrophic
      };
      
      setLastMeasurements(measurements);
      loadResults(measurements);
    } else {
      // No URL parameters, show form
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
      // setResults(categorizedResults); // Removed - using enhancedResults instead
      
      // Enhance with products
      const enhanced = await getTop3PatternsWithProducts(categorizedResults);
      setEnhancedResults(enhanced);
      
      setAppState('results');
    } catch (error) {
      console.error('Error getting fit results:', error);
      // Fallback to empty results with error state
      // setResults(null); // Removed - using enhancedResults instead
      setEnhancedResults(null);
      setAppState('results');
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
  };

  return (
    <div className="relative">
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
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  );
}