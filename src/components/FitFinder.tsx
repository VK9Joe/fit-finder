'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserInput } from '@/types';
import { findPatterns } from '@/utils/patternFinder';
import { findPatternsNoLength } from '@/utils/noLengthMatcher';
import { getTop3PatternsWithProducts } from '@/lib/patternProducts';
import { patternsFromCsv } from '@/data/patternsFromCsv';
import { useIframeHeight, triggerHeightUpdate } from '@/hooks/useIframeHeight';
import { buildVoyagersFit, saveVoyagersFit } from '@/utils/voyagersFit';
import { diagnoseNoResult, NoResultDiagnosis, FocusField } from '@/utils/noResultDiagnosis';
import { ValidationReasonCode } from '@/utils/measurementValidation';
import {
  resetAttemptId,
  createEventId,
  fingerprintMeasurements,
  changedFields,
  logEvent,
  isQaSession,
} from '@/utils/submissionTracking';
import NoResultsPanel from './NoResultsPanel';
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
  } | null>(null);
  
  const [lastMeasurements, setLastMeasurements] = useState<UserInput | null>(null);
  const fromFormSubmit = useRef(false);

  // Why nothing matched, and the one field we are asking the customer to correct.
  const [diagnosis, setDiagnosis] = useState<NoResultDiagnosis | null>(null);
  const [focusField, setFocusField] = useState<FocusField | null>(null);
  // Remounts the form so a corrected value actually appears in the fields.
  const [formKey, setFormKey] = useState(0);

  // Duplicate-submission guards. Refs rather than state: a double tap fires again
  // before React has re-rendered the button as disabled.
  const submissionInFlight = useRef(false);
  const currentEventId = useRef<string>('');
  const lastLoggedFingerprint = useRef<string | null>(null);
  const previousMeasurements = useRef<UserInput | null>(null);
  const selectedUnit = useRef<'in' | 'cm'>('in');
  // Set just before a submission writes its measurements into the URL. That URL
  // change re-fires the effect below, which would otherwise score the dog a
  // second time and race the load already in progress.
  const pendingUrlFingerprint = useRef<string | null>(null);

  // Latch the ?qa=1 flag on load. The first submission replaces the query string
  // with the measurements, so reading it later would lose the flag.
  useEffect(() => {
    isQaSession();
  }, []);

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

      // Validate that we have complete measurements (length === 0 is the skip-length signal)
      if (breed && neck > 0 && chest > 0 && length >= 0 && tail) {
        const measurements: UserInput = {
          breed,
          neckCircumference: neck,
          chestCircumference: chest,
          backLength: length,
          tailType: tail,
          chondrodystrophic: chondro
        };

        // Our own submission just put these in the URL; its results are already
        // loading. Back/forward and refresh have no pending marker, so they load.
        if (pendingUrlFingerprint.current === fingerprintMeasurements(measurements)) {
          pendingUrlFingerprint.current = null;
          return;
        }

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
      // Only mark it when the URL will actually change; otherwise the effect never
      // fires to clear the marker, and it would wrongly swallow a later navigation.
      if (window.location.search !== `?${params.toString()}`) {
        pendingUrlFingerprint.current = fingerprintMeasurements(measurements);
      }
      router.push(`?${params.toString()}`, { scroll: false });
      
      setLastMeasurements(measurements);
    } catch (error) {
      console.error('Error saving measurements:', error);
    }
  };

  const logSubmission = (
    measurements: UserInput,
    results: typeof enhancedResults,
    noResultReason?: string
  ) => {
    const allResults = [
      ...(results?.bestFit ?? []),
      ...(results?.goodFit ?? []),
      ...(results?.mightFit ?? []),
    ];

    const topResults = allResults.slice(0, 3).map((r) => {
      const productLinks = Object.values(r.products ?? {})
        .flat()
        .map((p) => `https://k9apparel.com/products/${p.handle}`)
        .filter((v, i, arr) => arr.indexOf(v) === i);
      return {
        name: r.pattern.name,
        fitLabel: r.fitLabel,
        fitNotes: r.fitNotes.join(', '),
        productLinks: productLinks.join(', '),
      };
    });

    logEvent(
      'submission',
      {
        validationOutcome: 'passed',
        validationReasonCodes: '',
        noResultReason: noResultReason ?? '',
        resultConfidence: allResults[0]?.fitLabel ?? 'No Result',
        resultCount: allResults.length,
        unit: selectedUnit.current,
        // What the customer changed since their previous attempt
        changedFields: changedFields(previousMeasurements.current, measurements).join(', '),
        ...measurements,
        topResults,
      },
      // The idempotency key: one deliberate submission, one event id.
      { eventId: currentEventId.current }
    );
  };

  /**
   * Logged when the form blocks a submission, so each validation failure is
   * recorded with its reason code rather than vanishing.
   */
  const logValidationFailure = (reasonCodes: ValidationReasonCode[]) => {
    logEvent('validation_failure', {
      validationOutcome: 'failed',
      validationReasonCodes: reasonCodes.join(', '),
      unit: selectedUnit.current,
    });
  };

  // Persist the top recommendation for the theme's persistent fit bar
  const persistVoyagersFit = (measurements: UserInput, results: typeof enhancedResults) => {
    const topResult =
      results?.bestFit?.[0] ?? results?.goodFit?.[0] ?? results?.mightFit?.[0];
    if (!topResult) return;

    const fit = buildVoyagersFit(measurements.breed, topResult.pattern.name);
    if (fit) {
      saveVoyagersFit(fit);
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
      // Use the enhanced pattern finder; route to no-length matcher when backLength is 0
      const categorizedResults = measurements.backLength === 0
        ? findPatternsNoLength(measurements, patternsFromCsv)
        : findPatterns(measurements, patternsFromCsv);

      // Enhance with products
      const enhanced = await getTop3PatternsWithProducts(categorizedResults);
      const matched =
        enhanced.bestFit.length > 0 || enhanced.goodFit.length > 0 || enhanced.mightFit.length > 0;

      // Work out which measurement or rule blocked the match, so the customer is
      // never left with an empty results area.
      const noResultDiagnosis = matched ? null : diagnoseNoResult(measurements, patternsFromCsv);
      setDiagnosis(noResultDiagnosis);

      setEnhancedResults(enhanced);
      setAppState('results');
      persistVoyagersFit(measurements, enhanced);
      if (fromFormSubmit.current) {
        fromFormSubmit.current = false;
        logSubmission(measurements, enhanced, noResultDiagnosis?.code);
        previousMeasurements.current = measurements;
      }

      // Trigger height update after content changes
      setTimeout(() => {
        triggerHeightUpdate();
        
        // Scroll to appropriate section
        const hasAnyResults = !!(enhanced && (
          (enhanced.bestFit && enhanced.bestFit.length > 0) ||
          (enhanced.goodFit && enhanced.goodFit.length > 0) ||
          (enhanced.mightFit && enhanced.mightFit.length > 0)
        ));
        
        const targetElement = hasAnyResults 
          ? document.getElementById('fit-results')
          : document.getElementById('no-results');
          
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);

    } catch (error) {
      console.error('Error getting fit results:', error);
      setEnhancedResults(null);
      setAppState('results');

      // Trigger height update even on error
      setTimeout(() => {
        triggerHeightUpdate();
        
        // Scroll to no results message
        const noResultsElement = document.getElementById('no-results');
        if (noResultsElement) {
          noResultsElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    }
  };

  const handleFormSubmit = async (
    measurements: UserInput,
    meta: { unit: 'in' | 'cm' } = { unit: 'in' }
  ) => {
    // Synchronous gate: twenty rapid taps still produce one scoring request.
    if (submissionInFlight.current) return;
    submissionInFlight.current = true;

    try {
      selectedUnit.current = meta.unit;

      // Re-submitting an unchanged form is a duplicate, not a new attempt: the
      // results on screen are already the answer. Nothing is re-scored or
      // logged until the customer changes an input or starts over.
      const fingerprint = fingerprintMeasurements(measurements);
      if (fingerprint === lastLoggedFingerprint.current && appState === 'results') {
        document
          .getElementById(diagnosis ? 'no-results' : 'fit-results')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      currentEventId.current = createEventId();
      lastLoggedFingerprint.current = fingerprint;
      fromFormSubmit.current = true;

      setFocusField(null);
      saveMeasurements(measurements);
      await loadResults(measurements);
    } finally {
      submissionInFlight.current = false;
    }
  };

  /** Re-run with one field changed, preserving every other answer. */
  const resubmitWith = async (changes: Partial<UserInput>) => {
    if (!lastMeasurements) return;
    const next = { ...lastMeasurements, ...changes } as UserInput;
    setLastMeasurements(next);
    setFormKey((key) => key + 1);
    await handleFormSubmit(next, { unit: selectedUnit.current });
  };

  const handleCorrectField = (field: FocusField | undefined) => {
    if (!field) return;
    setFocusField(field);
  };

  const handleApplyTailType = (tailType: UserInput['tailType']) => {
    void resubmitWith({ tailType });
  };

  const handleSkipBackLength = () => {
    void resubmitWith({ backLength: 0 });
  };

  const handleStartOver = () => {
    // Clear URL parameters to show form
    router.push('/', { scroll: false });
    setAppState('form');
    setLastMeasurements(null);
    setEnhancedResults(null);
    setDiagnosis(null);
    setFocusField(null);
    setFormKey((key) => key + 1);

    // A fresh run at the form is a new dog, so start a new attempt and allow the
    // same measurements to be logged again.
    resetAttemptId();
    lastLoggedFingerprint.current = null;
    previousMeasurements.current = null;
    
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
          key={formKey}
          onSubmit={handleFormSubmit}
          isLoading={appState === 'loading'}
          initialMeasurements={lastMeasurements}
          hasResults={appState === 'results' && diagnosis === null && enhancedResults !== null}
          onValidationFailure={logValidationFailure}
          focusField={focusField}
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

        {/* No match: explain which measurement or rule blocked it */}
        {appState === 'results' && diagnosis && (
          <NoResultsPanel
            diagnosis={diagnosis}
            onCorrectField={handleCorrectField}
            onApplyTailType={handleApplyTailType}
            onSkipBackLength={handleSkipBackLength}
            onStartOver={handleStartOver}
          />
        )}

        {/* Results - shown below form when available */}
        {appState === 'results' && !diagnosis && enhancedResults && (
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