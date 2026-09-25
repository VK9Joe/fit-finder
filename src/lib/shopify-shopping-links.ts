/**
 * Shopping-path CTA links for a single Fit Finder recommendation.
 *
 * Every recommendation is a breed + size pair — pattern names are always of the
 * form "Golden Retriever - M" — and each CTA has to carry that specific pair
 * through to the storefront:
 *
 *   1. Kit Builder        /pages/{breed-handle}-kits
 *   2. Individual products /collections/all?breed&size
 *   3. ReCoat              /collections/recoat?breed&size&availability
 *
 * The filter values below are not guesses: they were read from the store's live
 * Storefront API filter definitions, which publish the exact value each filter
 * expects. Getting one wrong does not error, it silently returns an empty
 * collection, so they are pinned here rather than derived.
 */

/**
 * Storefront origin without a trailing slash. Defaults to https; an explicit
 * http:// is kept so the full click-through flow can be tested locally.
 */
export function getStoreOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL;
  if (!configured) {
    console.warn('NEXT_PUBLIC_SHOPIFY_STORE_URL is not configured, using k9apparel.com as fallback');
  }
  const value = (configured || 'k9apparel.com').trim();
  const protocol = value.startsWith('http://') ? 'http' : 'https';
  const host = value.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return `${protocol}://${host}`;
}

/** "Golden Retriever" -> "golden-retriever" */
function toHandle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Kit Builder pages whose handle is not just the slugified breed name.
 * Every other catalog breed was confirmed to resolve at /pages/{handle}-kits.
 */
const KIT_HANDLE_OVERRIDES: Record<string, string> = {
  // /pages/jack-russell-terrier-kits is a 404; the live page is jack-russell-kits.
  'Jack Russell Terrier': 'jack-russell',
};

/**
 * Storefront breed_filter values that differ from the pattern catalog's breed
 * name. Filtering on the catalog name for these returns nothing at all.
 */
const BREED_FILTER_OVERRIDES: Record<string, string> = {
  'French Bulldog': 'French Bulldog (Standard)',
  'Jack Russell Terrier': 'Jack Russell',
};

/**
 * Sizes reach this module from two different places that disagree on spelling:
 * findPatterns renders "Beagle - Small" while findPatternsNoLength renders
 * "Beagle - S". Both must resolve to the same filter value, so everything is
 * normalised to the catalog's own size code before lookup.
 */
const SIZE_ALIASES: Record<string, string> = {
  XS: 'XS',
  XSMALL: 'XS',
  'X-SMALL': 'XS',
  'EXTRA SMALL': 'XS',
  S: 'S',
  SMALL: 'S',
  M: 'M',
  MEDIUM: 'M',
  L: 'L',
  LARGE: 'L',
  XL: 'XL',
  XLARGE: 'XL',
  'X-LARGE': 'XL',
  'EXTRA LARGE': 'XL',
};

/** Resolve any spelling of a size to the catalog code, or null if unrecognised. */
export function normalizeSizeCode(raw: string): string | null {
  if (!raw) return null;
  const key = raw.trim().toUpperCase().replace(/\s+/g, ' ');
  return SIZE_ALIASES[key] ?? null;
}

/**
 * Values for filter.v.option.size. S, M and L are grouped by Shopify into
 * FilterSettingGroups and must be filtered by the group GID; XS and XL are not
 * grouped and filter by their plain option value. Sending a GID for XS/XL, or a
 * bare letter for S/M/L, yields an empty collection.
 */
const SIZE_FILTER_VALUES: Record<string, string> = {
  XS: 'XS',
  S: 'gid://shopify/FilterSettingGroup/93716542',
  M: 'gid://shopify/FilterSettingGroup/93749310',
  L: 'gid://shopify/FilterSettingGroup/93782078',
  XL: 'XL',
};

export interface ShoppingLinks {
  /** Breed as the catalog names it, e.g. "Golden Retriever". */
  breed: string;
  /** Size code as the catalog stores it, e.g. "M". */
  sizeCode: string;
  kitBuilder: string;
  individualProducts: string;
  reCoat: string;
}

/**
 * Split a pattern name ("Golden Retriever - M") into its breed and size.
 * Uses the last separator so breeds containing " - " cannot break the split.
 */
export function parsePatternName(patternName: string): { breed: string; sizeCode: string } | null {
  if (!patternName) return null;

  const separatorIndex = patternName.lastIndexOf(' - ');
  if (separatorIndex === -1) return null;

  const breed = patternName.slice(0, separatorIndex).trim();
  const sizeCode = patternName.slice(separatorIndex + 3).trim();
  if (!breed || !sizeCode) return null;

  return { breed, sizeCode };
}

/**
 * Kit Builder landing page for a breed, with the size preselected.
 *
 * The Kit Builder reads ?size= and selects it when it exactly matches one of its
 * size options, which are the catalog codes (XS, S, M, L, XL) on every kit page.
 */
export function buildKitBuilderUrl(breed: string, sizeCode?: string): string {
  const handle = KIT_HANDLE_OVERRIDES[breed] ?? toHandle(breed);
  const size = sizeCode ? normalizeSizeCode(sizeCode) : null;
  const query = size ? `?size=${encodeURIComponent(size)}` : '';
  return `${getStoreOrigin()}/pages/${handle}-kits${query}`;
}

/**
 * A collection filtered to this breed and size, used for a product type when
 * there is no single product to link to.
 */
export function buildBreedSizeCollectionUrl(collectionHandle: string, breed: string, sizeCode: string): string {
  return buildFilteredCollectionUrl(collectionHandle, breed, sizeCode, false);
}

function buildFilteredCollectionUrl(
  collectionHandle: string,
  breed: string,
  sizeCode: string,
  inStockOnly: boolean
): string {
  const params = new URLSearchParams();
  params.set('filter.p.m.custom.breed_filter', BREED_FILTER_OVERRIDES[breed] ?? breed);

  const normalized = normalizeSizeCode(sizeCode);
  const sizeValue = normalized ? SIZE_FILTER_VALUES[normalized] : undefined;
  // An unmapped size would filter the collection down to nothing. Dropping the
  // size filter leaves a useful breed-filtered page instead of a dead end.
  if (sizeValue) {
    params.set('filter.v.option.size', sizeValue);
  }

  if (inStockOnly) {
    params.set('filter.v.availability', '1');
  }

  return `${getStoreOrigin()}/collections/${collectionHandle}?${params.toString()}`;
}

/** All products for this breed and size. */
export function buildIndividualProductsUrl(breed: string, sizeCode: string): string {
  return buildFilteredCollectionUrl('all', breed, sizeCode, false);
}

/** ReCoat products for this breed and size, limited to what is in stock. */
export function buildReCoatUrl(breed: string, sizeCode: string): string {
  return buildFilteredCollectionUrl('recoat', breed, sizeCode, true);
}

/**
 * Every shopping link for one recommendation.
 *
 * Prefers the pattern's own `category` and `size` fields. The display name is
 * only a fallback: it is a presentation string, and the two matchers format it
 * differently, so it is not a reliable source of the size.
 */
export function buildShoppingLinks(
  patternName: string,
  structured?: { breed?: string; sizeCode?: string }
): ShoppingLinks | null {
  const parsed = parsePatternName(patternName);

  const breed = structured?.breed?.trim() || parsed?.breed;
  const rawSize = structured?.sizeCode?.trim() || parsed?.sizeCode;
  if (!breed || !rawSize) return null;

  const sizeCode = normalizeSizeCode(rawSize) ?? rawSize;
  return {
    breed,
    sizeCode,
    kitBuilder: buildKitBuilderUrl(breed, sizeCode),
    individualProducts: buildIndividualProductsUrl(breed, sizeCode),
    reCoat: buildReCoatUrl(breed, sizeCode),
  };
}
