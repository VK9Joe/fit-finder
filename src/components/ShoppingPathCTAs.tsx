'use client';

import { ArrowRight, Package, LayoutGrid, RefreshCw } from 'lucide-react';
import { buildShoppingLinks } from '@/lib/shopify-shopping-links';
import { logEvent } from '@/utils/submissionTracking';

interface ShoppingPathCTAsProps {
  /** Display name, e.g. "Golden Retriever - Medium". Used only as a fallback. */
  patternName: string;
  /** The pattern's own breed field, preferred over parsing the display name. */
  breed?: string;
  /** The pattern's own size code ("M"), preferred over parsing the display name. */
  sizeCode?: string;
}

/**
 * The three shopping paths offered beneath a single recommendation.
 *
 * Every link is built from this recommendation's own breed and size, so each
 * card on the results page points at its own products rather than sharing one
 * set of links.
 *
 * Links open with target="_top" on purpose: the Fit Finder runs inside a
 * cross-origin iframe on the storefront, so a normal link would load the shop
 * inside the iframe. Navigating the top window also means the customer lands on
 * the storefront with the persistent fit bar still showing their breed and size.
 */
export default function ShoppingPathCTAs({ patternName, breed: breedProp, sizeCode: sizeCodeProp }: ShoppingPathCTAsProps) {
  const links = buildShoppingLinks(patternName, { breed: breedProp, sizeCode: sizeCodeProp });
  if (!links) return null;

  const { breed, sizeCode, kitBuilder, individualProducts, reCoat } = links;

  // Which shopping path the customer took. Sent as a beacon because these links
  // navigate the whole storefront page away, which would cancel a normal request.
  const trackClick = (linkType: string, url: string) => () =>
    logEvent('product_link_click', { linkType, patternName, breed, sizeCode, url }, { beacon: true });

  return (
    <div className="border-t border-gray-200 pt-6 mt-2">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Shop This Recommendation</h3>
        <span className="text-xs font-semibold text-brand-teal bg-brand-teal/10 border border-brand-teal/20 px-2.5 py-1 rounded-full">
          {breed} &middot; {sizeCode}
        </span>
      </div>

      {/* 1. Kit Builder — first and largest */}
      <a
        href={kitBuilder}
        target="_top"
        onClick={trackClick('kit_builder', kitBuilder)}
        className="group flex items-center justify-between gap-4 w-full bg-brand-teal hover:bg-brand-teal-dark text-white rounded-xl px-5 py-5 md:px-6 md:py-6 shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <span className="flex items-center gap-3 md:gap-4 min-w-0">
          <Package className="h-6 w-6 md:h-7 md:w-7 shrink-0" />
          <span className="min-w-0">
            <span className="block text-base md:text-xl font-bold leading-tight">
              Shop the Kit for This Breed
            </span>
            <span className="block text-xs md:text-sm text-white/80 mt-1">
              Build a complete {breed} kit in size {sizeCode}
            </span>
          </span>
        </span>
        <ArrowRight className="h-5 w-5 md:h-6 md:w-6 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
      </a>

      {/* 2. Individual products, then 3. ReCoat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <a
          href={individualProducts}
          target="_top"
          onClick={trackClick('individual_products', individualProducts)}
          className="group flex items-center justify-between gap-3 bg-white border-2 border-brand-teal/40 hover:border-brand-teal hover:bg-brand-teal/5 text-brand-teal rounded-xl px-4 py-4 transition-all duration-200"
        >
          <span className="flex items-center gap-3 min-w-0">
            <LayoutGrid className="h-5 w-5 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm md:text-base font-semibold leading-tight">
                Shop Individual Breed Products
              </span>
              <span className="block text-xs text-brand-teal/70 mt-0.5">
                All {breed} products in size {sizeCode}
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
        </a>

        <a
          href={reCoat}
          target="_top"
          onClick={trackClick('recoat', reCoat)}
          className="group flex items-center justify-between gap-3 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 rounded-xl px-4 py-4 transition-all duration-200"
        >
          <span className="flex items-center gap-3 min-w-0">
            <RefreshCw className="h-4 w-4 shrink-0 text-gray-500" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight">
                Shop ReCoat Products
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                In-stock ReCoat, {breed} size {sizeCode}
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-hover:translate-x-1" />
        </a>
      </div>
    </div>
  );
}
