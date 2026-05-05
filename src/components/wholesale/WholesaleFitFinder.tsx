'use client';

import { useState } from 'react';
import { UserInput, ProductType } from '@/types';
import { findWholesaleMatches, WholesaleMatch } from '@/utils/wholesalePatternFinder';
import { fetchAllProductsForPattern } from '@/lib/patternProducts';
import WholesaleGate from './WholesaleGate';
import WholesaleResults from './WholesaleResults';
import FitFinderForm from '@/components/FitFinderForm';

type AppState = 'gate' | 'form' | 'loading' | 'results';

export default function WholesaleFitFinder() {
  const [appState, setAppState] = useState<AppState>('gate');
  const [storeCode, setStoreCode] = useState('');
  const [results, setResults] = useState<WholesaleMatch[]>([]);
  const [lastMeasurements, setLastMeasurements] = useState<UserInput | null>(null);

  const handleAuthenticated = (code: string) => {
    setStoreCode(code);
    setAppState('form');
  };

  const handleFormSubmit = async (measurements: UserInput) => {
    setLastMeasurements(measurements);
    setAppState('loading');

    const matches = findWholesaleMatches(measurements);

    const enriched = await Promise.all(
      matches.map(async (match) => {
        const products = await fetchAllProductsForPattern(match.pattern.patternCode) as unknown as WholesaleMatch['products'];
        return { ...match, products };
      })
    );

    setResults(enriched);
    setAppState('results');
    logSubmission(measurements, enriched, storeCode);
  };

  const handleNewCustomer = () => {
    setResults([]);
    setLastMeasurements(null);
    setAppState('form');
  };

  return (
    <>
      {appState === 'gate' && (
        <WholesaleGate onAuthenticated={handleAuthenticated} />
      )}

      {appState === 'form' && (
        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <span className="text-xs font-mono bg-brand-teal/10 text-brand-teal px-3 py-1.5 rounded-full font-semibold border border-brand-teal/20">
              {storeCode}
            </span>
          </div>
          <FitFinderForm onSubmit={handleFormSubmit} isLoading={false} />
        </div>
      )}

      {appState === 'loading' && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-brand-teal border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Finding best matches...</p>
          </div>
        </div>
      )}

      {appState === 'results' && lastMeasurements && (
        <WholesaleResults
          results={results}
          measurements={lastMeasurements}
          storeCode={storeCode}
          onNewCustomer={handleNewCustomer}
        />
      )}
    </>
  );
}

async function logSubmission(
  measurements: UserInput,
  results: WholesaleMatch[],
  storeCode: string
) {
  try {
    const topResults = results.map((r) => ({
      rank: r.rank,
      patternCode: r.pattern.patternCode,
      name: r.pattern.name,
      fitLabel: r.fitLabel,
      score: `${Math.round(r.finalScore * 100)}%`,
      fitNotes: r.fitNotes.join('; '),
      productLinks: Object.values(r.products || {})
        .flat()
        .filter((p): p is NonNullable<typeof p> => !!p && !!p.handle)
        .map((p) => `https://k9apparel.com/products/${p.handle}`)
        .join(', '),
    }));

    await fetch('/api/wholesale/log-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeCode,
        timestamp: new Date().toLocaleString('en-US', {
          timeZone: 'UTC',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        breed: measurements.breed,
        neckCircumference: measurements.neckCircumference,
        chestCircumference: measurements.chestCircumference,
        backLength: measurements.backLength,
        tailType: measurements.tailType,
        chondrodystrophic: measurements.chondrodystrophic,
        topResults,
        userAgent: navigator.userAgent,
      }),
    });
  } catch {
    // Non-blocking — don't disrupt the retail flow
  }
}
