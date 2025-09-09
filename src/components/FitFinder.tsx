'use client';

import { useState } from 'react';
import { DogMeasurements, FitResult } from '@/types';
import FitFinderForm from './FitFinderForm';
import FitResults from './FitResults';

type AppState = 'form' | 'loading' | 'results';

export default function FitFinder() {
  const [appState, setAppState] = useState<AppState>('form');
  const [results, setResults] = useState<FitResult[]>([]);

  const handleFormSubmit = async (measurements: DogMeasurements) => {
    setAppState('loading');
    
    try {
      // Call secure API endpoint
      const response = await fetch('/api/patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          measurements,
          useDummyData: true // Always use dummy data for now, can be toggled later
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setAppState('results');
      } else {
        throw new Error(data.error || 'Failed to get results');
      }
    } catch (error) {
      console.error('Error getting fit results:', error);
      // Fallback to empty results with error state
      setResults([]);
      setAppState('results');
    }
  };

  const handleStartOver = () => {
    setAppState('form');
    setResults([]);
  };

  return (
    <div className="relative">
      {/* Hero Section */}
      {appState === 'form' && (
        <div className="relative overflow-hidden">
          {/* Hero Background Image */}
          <div className="relative h-[450px] md:h-[550px] lg:h-[700px] w-full bg-cover bg-center bg-no-repeat"
               style={{ backgroundImage: 'url(/hero_bg.png)' }}>
            {/* Overlay for better text contrast */}
            <div className="absolute inset-0 bg-black/20"></div>
            
            {/* Fit-Finder Heading */}
            <div className="absolute left-8 md:left-16 top-[45%] transform -translate-y-1/2 z-10">
              <h1 className="text-3xl md:text-4xl text-white/90 font-medium drop-shadow-lg">
                Fit-Finder
              </h1>
            </div>
            
            {/* Bottom Banner */}
            <div className="absolute bottom-0 left-0 right-0 py-6 w-full bg-brand-teal shadow-lg">
              <div className="container mx-auto text-center">
                <p className="text-white text-xl md:text-3xl font-bold tracking-wide">Performance Outerwear + Perfect Fit</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {appState === 'form' && (
          <FitFinderForm
            onSubmit={handleFormSubmit}
            isLoading={false}
          />
        )}

        {appState === 'results' && (
          <FitResults
            results={results}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  );
}