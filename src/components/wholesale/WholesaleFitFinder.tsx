'use client';

import { useState } from 'react';
import { UserInput } from '@/types';
import { findWholesaleMatches, WholesaleMatch } from '@/utils/wholesalePatternFinder';
import WholesaleGate from './WholesaleGate';
import WholesaleResults from './WholesaleResults';
import WholesaleForm from './WholesaleForm';

type AppState = 'gate' | 'form' | 'results';
type Unit = 'in' | 'cm';

interface DisplayValues {
  neck: number;
  chest: number;
  backLength: number;
  unit: Unit;
}

export default function WholesaleFitFinder() {
  const [appState, setAppState] = useState<AppState>('gate');
  const [storeCode, setStoreCode] = useState('');
  const [results, setResults] = useState<WholesaleMatch[]>([]);
  const [lastMeasurements, setLastMeasurements] = useState<UserInput | null>(null);
  const [displayValues, setDisplayValues] = useState<DisplayValues | null>(null);

  const handleAuthenticated = (code: string) => {
    setStoreCode(code);
    setAppState('form');
  };

  const handleFormSubmit = (
    measurements: UserInput,
    unit: Unit,
    rawValues: { neck: number; chest: number; backLength: number }
  ) => {
    setLastMeasurements(measurements);
    setDisplayValues({ ...rawValues, unit });
    const matches = findWholesaleMatches(measurements);
    setResults(matches);
    setAppState('results');
    logSubmission(measurements, matches, storeCode);
  };

  const handleNewCustomer = () => {
    setResults([]);
    setLastMeasurements(null);
    setDisplayValues(null);
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
          <WholesaleForm onSubmit={handleFormSubmit} />
        </div>
      )}

      {appState === 'results' && lastMeasurements && (
        <WholesaleResults
          results={results}
          measurements={lastMeasurements}
          displayValues={displayValues ?? undefined}
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
      fitLabel: r.fitLabel,
      fitNotes: r.fitNotes.join('; '),
      lengthSkipped: r.lengthSkipped ?? false,
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
    // Non-blocking
  }
}
