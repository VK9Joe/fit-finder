'use client';

import { AlertCircle, ArrowRight, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserInput } from '@/types';
import { NoResultDiagnosis, otherTailOptions } from '@/utils/noResultDiagnosis';
import MeasurementDiagram from './MeasurementDiagram';
import { logEvent } from '@/utils/submissionTracking';

/**
 * What a customer sees when nothing matched (Brief, Priority 3).
 *
 * Names the measurement or rule that blocked the match and gives a way to fix it
 * without restarting the questionnaire. Wording follows the client's review.
 * Every route to help goes to Customer Service; made-to-measure is no longer
 * offered anywhere in the Fit Finder.
 */

interface NoResultsPanelProps {
  diagnosis: NoResultDiagnosis;
  /** Sends the customer back to one field with it focused. */
  onCorrectField: (field: NoResultDiagnosis['focusField']) => void;
  /** Applies a different tail type and re-runs. */
  onApplyTailType: (tailType: UserInput['tailType']) => void;
  /** Re-runs matching on neck and chest only. */
  onSkipBackLength: () => void;
  onStartOver: () => void;
}

const SUPPORT_URL = 'https://k9apparel.com/pages/contact-us';
const MEASURING_GUIDE_URL = 'https://k9apparel.com/pages/measure-dog-for-breed-specific-coats';

const NECK_ADVICE =
  'Measure around the base of the neck, where it meets the shoulders. Keep the tape snug but not tight. ' +
  'Measuring higher up near the head will give you the wrong size.';
const CHEST_ADVICE = 'Measure around the widest part of the ribcage, just behind the front legs.';

const TAIL_LENGTH_COPY = [
  "We rank pattern fit based on where the coat lands on your pup's back.",
  'Patterns for straight-tailed pups are standard length.',
  'Patterns for bobbed/docked and up or curly tails are shorter in length to prevent tail interference.',
  'Patterns for down/tucked tails are longer and designed for additional coverage.',
];

const primaryButton = 'bg-brand-teal hover:bg-brand-teal-dark text-white';

export default function NoResultsPanel({
  diagnosis,
  onCorrectField,
  onApplyTailType,
  onSkipBackLength,
  onStartOver,
}: NoResultsPanelProps) {
  const { code, focusField, headline, detail, currentTailType, skipLengthWouldMatch } = diagnosis;

  const isTail = code === 'TAIL_RULE';
  const isNeckOrChest = code === 'CHEST_OUT_OF_RANGE' || code === 'NECK_OUT_OF_RANGE';

  // Records that a no-result customer went to Customer Service, so the team can
  // see which reasons end in a support contact. Beacon, because the link leaves the page.
  const trackHelpClick = () =>
    logEvent('customer_service_click', { channel: 'contact_us', noResultReason: code }, { beacon: true });

  return (
    <div id="no-results" className="mt-12">
      <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 overflow-hidden">
        <div className="bg-amber-50 px-6 py-5 border-b border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{headline}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {isTail
                  ? 'Let’s double-check your pup’s tail type and fit.'
                  : 'Let’s double-check your pup’s measurements.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isNeckOrChest ? (
            // Neck and chest are measured together, so show both, each with its advice.
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(
                [
                  ['neck', 'Neck', NECK_ADVICE],
                  ['chest', 'Chest', CHEST_ADVICE],
                ] as const
              ).map(([kind, title, advice]) => (
                <div key={kind} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <MeasurementDiagram kind={kind} />
                  <h3 className="font-bold text-gray-900 mt-3">{title}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed mt-1">{advice}</p>
                </div>
              ))}
            </div>
          ) : isTail ? (
            <ul className="space-y-2 text-gray-700 leading-relaxed">
              {TAIL_LENGTH_COPY.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 leading-relaxed">{detail}</p>
          )}

          <div className="flex flex-wrap gap-3 mt-6">
            {/* Tail type: offer the two length groups the customer did not choose. */}
            {isTail &&
              otherTailOptions(currentTailType).map((option) => (
                <Button key={option.value} onClick={() => onApplyTailType(option.value)} className={primaryButton}>
                  Try &ldquo;{option.label}&rdquo;
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ))}

            {skipLengthWouldMatch && (
              <Button onClick={onSkipBackLength} className={primaryButton}>
                Match on neck &amp; chest only
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {focusField && !isTail && !skipLengthWouldMatch && (
              <Button onClick={() => onCorrectField(focusField)} className={primaryButton}>
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
                onClick={trackHelpClick}
                className="text-brand-teal hover:text-brand-teal-dark font-semibold underline"
              >
                Contact Customer Service
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
