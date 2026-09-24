'use client';

import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { parsePatternName } from '@/lib/shopify-shopping-links';
import { getBreedPatternKey } from '@/utils/patternFinder';
import { formatBreedName } from '@/data/breedList';

/**
 * Copy that explains how matching works (Brief, Priority 5).
 *
 * Only ~26% of successful attempts put the customer's own breed first, because
 * the tool matches on measurements across shared patterns. That is correct
 * behaviour, but a different breed name reads as an error unless it is explained.
 *
 * Every statement here has to match calculateFinalScore: the score is the average
 * of neck, chest and length fit, patterns outside the customer's breed family
 * lose 0.1, and a roomy or snug neck caps the score at 0.79.
 */

const FIT_LABELS: Array<{ label: string; className: string; meaning: string }> = [
  {
    label: 'Best Fit',
    className: 'bg-green-100 text-green-800',
    meaning: 'Your dog’s neck, chest and back length all fit this pattern, with the neck in its ideal zone.',
  },
  {
    label: 'Good Fit',
    className: 'bg-blue-100 text-blue-800',
    meaning:
      'A solid fit. One measurement may sit toward the roomy or snug side, or the pattern is cut for a different breed.',
  },
  {
    label: 'Might Fit',
    className: 'bg-yellow-100 text-yellow-800',
    meaning: 'Within range, but close to the edge of it. We recommend trying it on.',
  },
];

/** Explains the fit labels and why breed names may differ. */
export function FitLegend() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6">
      <div className="flex items-start gap-3 mb-4">
        <Info className="h-5 w-5 text-brand-teal shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-gray-900">How we picked these</h3>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            We rank patterns mainly by how well your dog&apos;s neck, chest and back length fit
            them. Patterns cut for your breed get a small head start, but many breeds share a
            body shape, so a pattern named for another breed can still be the best fit.
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FIT_LABELS.map(({ label, className, meaning }) => (
          <div key={label} className="bg-gray-50 rounded-lg p-3">
            <dt>
              <span className={`${className} text-xs font-medium px-2.5 py-1 rounded-full`}>{label}</span>
            </dt>
            <dd className="text-xs text-gray-600 mt-2 leading-relaxed">{meaning}</dd>
          </div>
        ))}
      </dl>

      <p className="text-xs text-gray-500 mt-4 leading-relaxed">
        These are guides, not guarantees. Please try the coat on and start a return promptly if it
        does not fit.
      </p>
    </div>
  );
}

const NO_SPECIFIC_BREED = ['mixed breed', 'breed not listed'];

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

/** "Beagle" -> "Beagles"; good enough for the breed names in this catalog. */
function plural(breed: string): string {
  return /s$/i.test(breed) ? breed : `${breed}s`;
}

/**
 * Shown on a card whose pattern is named after a different breed than the one
 * the customer entered. The wording depends on why that happened, because the
 * three cases mean different things:
 *
 *   - the entered breed is fitted from this pattern family (Labrador -> Golden Retriever)
 *   - the entered breed has its own patterns, and this one still fit better
 *   - the entered breed has no patterns, so every pattern was compared
 */
export function CrossBreedNote({
  enteredBreed,
  patternName,
  patternBreed,
  patternCode,
}: {
  enteredBreed?: string;
  patternName: string;
  patternBreed?: string;
  patternCode?: string;
}) {
  const recommendedBreed = patternBreed ?? parsePatternName(patternName)?.breed;
  if (!enteredBreed || !recommendedBreed) return null;
  if (normalise(enteredBreed) === normalise(recommendedBreed)) return null;

  const customerFamily = getBreedPatternKey(enteredBreed);
  // The breed field stores lowercase values ("labrador retriever"); show them as names.
  const breedName = formatBreedName(enteredBreed.trim());
  const patternFamily = patternCode?.split('-')[0] ?? null;

  let message: ReactNode;
  if (NO_SPECIFIC_BREED.includes(normalise(enteredBreed))) {
    message = (
      <>
        <span className="font-semibold">Why a {recommendedBreed} pattern?</span> We compared your
        dog&apos;s measurements against every pattern we make, and this one is among the closest fits.
      </>
    );
  } else if (customerFamily && customerFamily === patternFamily) {
    message = (
      <>
        <span className="font-semibold">Why a {recommendedBreed} pattern?</span>{' '}
        {plural(breedName)} are fitted from our {recommendedBreed} pattern. The two share a body
        shape, so this is the pattern made for your dog.
      </>
    );
  } else if (customerFamily) {
    message = (
      <>
        <span className="font-semibold">Why a {recommendedBreed} pattern?</span> We do have patterns
        cut for {plural(breedName)}, and they get a small head start in our ranking. Your dog&apos;s
        measurements still fit this one better.
      </>
    );
  } else {
    message = (
      <>
        <span className="font-semibold">Why a {recommendedBreed} pattern?</span> We don&apos;t have a
        pattern cut specifically for {plural(breedName)}, so we compared your dog&apos;s
        measurements against every pattern we make. This one is among the closest fits.
      </>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
      <p className="text-xs text-blue-900 leading-relaxed">{message}</p>
    </div>
  );
}
