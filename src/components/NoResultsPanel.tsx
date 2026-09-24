'use client';

import { AlertCircle, ArrowRight, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserInput } from '@/types';
import { NoResultDiagnosis } from '@/utils/noResultDiagnosis';
import MeasurementDiagram from './MeasurementDiagram';
import { logEvent } from '@/utils/submissionTracking';

/**
 * What a customer sees when nothing matched (Brief, Priority 3).
 *
 * Replaces the old "No Patterns Found — try again" dead end. Only 25% of
 * sessions that started with a no-result ever recovered, so this names the one
 * measurement or rule that blocked the match, shows where to measure it, and
 * gives a single action to correct it without restarting the questionnaire.
 */

interface NoResultsPanelProps {
  diagnosis: NoResultDiagnosis;
  /** Sends the customer back to one field with it focused. */
  onCorrectField: (field: NoResultDiagnosis['focusField']) => void;
  /** Applies the tail type that would match and re-runs. */
  onApplyTailType: (tailType: UserInput['tailType']) => void;
  /** Re-runs matching on neck and chest only. */
  onSkipBackLength: () => void;
  onStartOver: () => void;
}

const SUPPORT_URL = 'https://k9apparel.com/pages/contact-us';
const MADE_TO_MEASURE_URL = 'https://k9apparel.com/collections/made-to-measure';
const MEASURING_GUIDE_URL = 'https://k9apparel.com/pages/measure-dog-for-breed-specific-coats';

export default function NoResultsPanel({
  diagnosis,
  onCorrectField,
  onApplyTailType,
  onSkipBackLength,
  onStartOver,
}: NoResultsPanelProps) {
  const { code, focusField, headline, detail, suggestedTailType, skipLengthWouldMatch } = diagnosis;

  // Records that a no-result customer went to a human for help, so the team can
  // see which reasons end in a support contact. Beacon, because the link leaves the page.
  const trackHelpClick = (channel: 'contact_us' | 'made_to_measure') => () =>
    logEvent('customer_service_click', { channel, noResultReason: code }, { beacon: true });

  return (
    <div id="no-results" className="mt-12">
      <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 overflow-hidden">
        <div className="bg-amber-50 px-6 py-5 border-b border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{headline}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Nothing is wrong with your dog&apos;s measurements — this just tells us which one to look at.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            {focusField && (
              <div className="shrink-0 mx-auto md:mx-0">
                <MeasurementDiagram field={focusField} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-gray-700 leading-relaxed">{detail}</p>

              <div className="flex flex-wrap gap-3 mt-5">
                {/* The single most useful next action, which varies by reason. */}
                {suggestedTailType && (
                  <Button
                    onClick={() => onApplyTailType(suggestedTailType)}
                    className="bg-brand-teal hover:bg-brand-teal-dark text-white"
                  >
                    Try &ldquo;{suggestedTailType}&rdquo;
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}

                {skipLengthWouldMatch && (
                  <Button
                    onClick={onSkipBackLength}
                    className="bg-brand-teal hover:bg-brand-teal-dark text-white"
                  >
                    Match on neck &amp; chest only
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}

                {focusField && !suggestedTailType && !skipLengthWouldMatch && (
                  <Button
                    onClick={() => onCorrectField(focusField)}
                    className="bg-brand-teal hover:bg-brand-teal-dark text-white"
                  >
                    Correct this measurement
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}

                <a
                  href={MEASURING_GUIDE_URL}
                  target="_top"
                  className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Measuring guide
                </a>

                <Button variant="outline" onClick={onStartOver} className="border-gray-300 text-gray-700">
                  Start over
                </Button>
              </div>
            </div>
          </div>

          {/* A route to a human, always — never a dead end. */}
          <div className="mt-6 pt-5 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
            <LifeBuoy className="h-5 w-5 text-brand-teal shrink-0" />
            <p className="text-sm text-gray-600 flex-1">
              {code === 'NO_PATTERN_COVERAGE'
                ? 'These measurements are valid, so this is one for our team.'
                : 'Still stuck after re-measuring?'}{' '}
              <a
                href={SUPPORT_URL}
                target="_top"
                onClick={trackHelpClick('contact_us')}
                className="text-brand-teal hover:text-brand-teal-dark font-semibold underline"
              >
                Contact Customer Service
              </a>{' '}
              or look at{' '}
              <a
                href={MADE_TO_MEASURE_URL}
                target="_top"
                onClick={trackHelpClick('made_to_measure')}
                className="text-brand-teal hover:text-brand-teal-dark font-semibold underline"
              >
                made-to-measure
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
