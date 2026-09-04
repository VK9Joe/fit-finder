'use client';

/**
 * Persistence of the final Fit Finder result for the Voyager theme's
 * persistent fit bar.
 *
 * The bar reads localStorage['voyagersFit'] on the storefront origin. This app
 * runs inside a cross-origin iframe, so a localStorage write here lands on the
 * iframe's own origin and the theme can never see it. We therefore do both:
 *
 *   1. write locally  - covers the app being opened directly, or ever served
 *                       same-origin (e.g. behind a Shopify App Proxy)
 *   2. postMessage    - the theme listens and writes the value into its own
 *                       localStorage, which is the copy the bar actually reads
 */

export const VOYAGERS_FIT_KEY = 'voyagersFit';
export const VOYAGERS_FIT_MESSAGE = 'VOYAGERS_FIT_UPDATED';

export interface VoyagersFit {
  breed: string;
  pattern: string;
  apparelSize: string;
}

// Pattern data stores sizes as codes; the bar displays full words.
const SIZE_LABELS: Record<string, string> = {
  XS: 'X-Small',
  S: 'Small',
  M: 'Medium',
  L: 'Large',
  XL: 'X-Large',
};

/**
 * Expand a pattern size code ("S") into its display name ("Small").
 * Unknown codes pass through unchanged rather than being dropped.
 */
export function toApparelSize(sizeCode: string): string {
  const code = sizeCode.trim().toUpperCase();
  return SIZE_LABELS[code] ?? sizeCode.trim();
}

/**
 * Build the payload from a breed and a pattern name of the form
 * "Beagle - S", which is how every pattern in the catalog is named.
 */
export function buildVoyagersFit(breed: string, patternName: string): VoyagersFit | null {
  if (!breed || !patternName) return null;

  const separatorIndex = patternName.lastIndexOf(' - ');
  if (separatorIndex === -1) return null;

  const pattern = patternName.slice(0, separatorIndex).trim();
  const sizeCode = patternName.slice(separatorIndex + 3).trim();
  if (!pattern || !sizeCode) return null;

  return {
    breed: breed.trim(),
    pattern,
    apparelSize: toApparelSize(sizeCode),
  };
}

/**
 * Save the result for the persistent bar: locally, and to the parent theme.
 */
export function saveVoyagersFit(fit: VoyagersFit): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(VOYAGERS_FIT_KEY, JSON.stringify(fit));
  } catch (error) {
    // Private browsing / storage disabled / partitioned storage - the parent
    // copy below is what the bar reads anyway, so this is not fatal.
    console.warn('Could not write voyagersFit to localStorage:', error);
  }

  if (window.parent !== window) {
    window.parent.postMessage(
      {
        type: VOYAGERS_FIT_MESSAGE,
        key: VOYAGERS_FIT_KEY,
        payload: fit,
        timestamp: Date.now(),
      },
      '*'
    );
  }
}
