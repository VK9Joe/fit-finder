'use client';

import { ProductType } from '@/types';
import {
  buildShoppingLinks,
  buildBreedSizeCollectionUrl,
  parsePatternName,
} from '@/lib/shopify-shopping-links';
import { buildShopifyProductUrl } from '@/lib/shopify-url-builder';
import { logEvent } from '@/utils/submissionTracking';
import { saveFitForRecommendation } from '@/utils/voyagersFit';

/**
 * "Shop this recommendation": the shopping paths beneath one recommendation,
 * laid out per the client's revised design — a Kit Builder banner, one card per
 * product type, and a ReCoat panel.
 *
 * Every link is built from this recommendation's own breed and size, opens in
 * the same window, and saves this card's breed and size for the storefront's
 * fit bar before leaving, so the bar matches the card the customer clicked.
 *
 * target="_top" is required: the Fit Finder runs in a cross-origin iframe, and a
 * plain link would load the storefront inside the iframe.
 */

interface CardProduct {
  handle: string;
  price: string;
  currencyCode: string;
  variant: { id: string };
}

interface MeasurementsForUrl {
  breed: string;
  neckCircumference: number;
  chestCircumference: number;
  backLength: number;
  tailType: string;
  chondrodystrophic: boolean;
}

interface ShoppingPathCTAsProps {
  /** Display name, e.g. "Golden Retriever - Medium". Used only as a fallback. */
  patternName: string;
  /** The pattern's own breed field, preferred over parsing the display name. */
  breed?: string;
  /** The pattern's own size code ("M"), preferred over parsing the display name. */
  sizeCode?: string;
  /** Products for this pattern, keyed by product type code. */
  products?: Record<string, CardProduct[]>;
  /** What the customer entered, carried onto product links. */
  measurements?: MeasurementsForUrl;
}

const PRODUCT_CARDS: Array<{ type: ProductType; name: string; collection: string; fill: string; stroke: string }> = [
  { type: 'RC', name: 'Raincoat', collection: 'dog-rain-coats', fill: '#E9A93A', stroke: '#B97F1E' },
  { type: 'TW', name: 'Tummy Warmer', collection: 'dog-tummy-warmers', fill: '#7B2941', stroke: '#561A2C' },
  { type: 'WC', name: 'Winter Coat', collection: 'dog-winter-coats', fill: '#3159A8', stroke: '#1F3E7A' },
  { type: 'CC', name: 'Cooling Coat', collection: 'cooling-coats', fill: '#58B0D6', stroke: '#2E86AD' },
];

/** "110.0" -> "$110", "49.99" -> "$49.99" */
function formatPrice(amount: string, currencyCode: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return '';
  const shown = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return `From $${shown} ${currencyCode || 'USD'}`;
}

export default function ShoppingPathCTAs({
  patternName,
  breed: breedProp,
  sizeCode: sizeCodeProp,
  products,
  measurements,
}: ShoppingPathCTAsProps) {
  const links = buildShoppingLinks(patternName, { breed: breedProp, sizeCode: sizeCodeProp });
  if (!links) return null;

  const { breed, sizeCode, kitBuilder, reCoat } = links;

  // Save this card's fit for the storefront bar, and record which path was taken.
  // The log is a beacon because the navigation that follows would cancel a fetch.
  const onShop = (linkType: string, url: string) => () => {
    saveFitForRecommendation(measurements?.breed, breed, sizeCode);
    logEvent('product_link_click', { linkType, patternName, breed, sizeCode, url }, { beacon: true });
  };

  // One card per product type that exists in this breed and size. Out-of-stock
  // items still link to their product page: many are made to order and can be
  // sold at zero stock. A type with no product in this size is left out.
  const sizeForProductUrl = parsePatternName(patternName)?.sizeCode;
  const cards = PRODUCT_CARDS.flatMap((card) => {
    const product = products?.[card.type]?.[0];
    if (!product) return [];
    const url = product.variant?.id
      ? buildShopifyProductUrl(product.handle, product.variant.id, card.type, measurements, sizeForProductUrl)
      : buildBreedSizeCollectionUrl(card.collection, breed, sizeCode);
    return [{ ...card, url, price: formatPrice(product.price, product.currencyCode) }];
  });

  return (
    <div className="border border-gray-200 rounded-2xl p-4 md:p-6 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900">Shop this recommendation</h3>
        <span className="text-xs md:text-sm font-semibold text-gray-900 border border-gray-300 px-3 py-1.5 rounded-full">
          {breed} &middot; Size {sizeCode}
        </span>
      </div>

      {/* 1. Kit Builder — first and largest */}
      <div className="grid md:grid-cols-[57fr_43fr] rounded-xl overflow-hidden">
        <div className="bg-[#0b5c63] text-white px-6 py-7 md:px-7 md:py-8 flex flex-col justify-center">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-white/75">Start with a kit</p>
          <p className="text-2xl md:text-[28px] font-bold leading-tight mt-2">Ready for every adventure</p>
          <p className="text-sm text-white/85 mt-2 leading-relaxed max-w-sm">
            Coordinated gear for changing weather, in your dog&apos;s recommended fit.
          </p>
          <a
            href={kitBuilder}
            target="_top"
            onClick={onShop('kit_builder', kitBuilder)}
            className="self-start mt-5 inline-flex items-center bg-white text-[#0b5c63] font-bold text-sm px-5 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Explore kits&rarr;
          </a>
        </div>
        <KitIllustration />
      </div>

      {/* 2. Individual products */}
      {cards.length > 0 && (
        <div className="mt-6">
          <h4 className="font-bold text-gray-900">Shop individual products</h4>
          <p className="text-sm text-gray-500 mt-0.5">Choose just the gear your dog needs.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-3">
            {cards.map((card) => (
              <div key={card.type} className="flex items-center gap-4 border border-gray-200 rounded-xl p-3">
                <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
                  <CoatIcon fill={card.fill} stroke={card.stroke} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm md:text-base">{card.name}</p>
                  {card.price && <p className="font-bold text-brand-teal text-sm md:text-base mt-1">{card.price}</p>}
                  <a
                    href={card.url}
                    target="_top"
                    onClick={onShop(`product_${card.type}`, card.url)}
                    className="inline-block mt-2 font-bold text-sm text-brand-teal underline underline-offset-4 hover:text-brand-teal-dark"
                  >
                    View product &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. ReCoat */}
      <div className="mt-6 rounded-xl border border-[#eadfcb] bg-[#f8f4ec] px-5 py-5 md:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="max-w-xl">
          <h4 className="font-bold text-gray-900">Shop ReCoats</h4>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            Give great gear another adventure. Explore available ReCoats in this fit at a lower price;
            colors and quantities vary.
          </p>
        </div>
        <a
          href={reCoat}
          target="_top"
          onClick={onShop('recoat', reCoat)}
          className="shrink-0 font-bold text-sm text-brand-teal underline underline-offset-4 hover:text-brand-teal-dark"
        >
          See available ReCoats &rarr;
        </a>
      </div>
    </div>
  );
}

/** Flat mountain scene with a dog in a coat, from the client's layout. */
function KitIllustration() {
  return (
    <div className="relative min-h-[170px] md:min-h-0 bg-[#cfe4e4]">
      <svg viewBox="0 0 430 245" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id="kitSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d5e9e9" />
            <stop offset="1" stopColor="#b9d8d6" />
          </linearGradient>
        </defs>
        <rect width="430" height="245" fill="url(#kitSky)" />
        <circle cx="345" cy="58" r="30" fill="#f4eed2" />
        <path d="M-10 190 L95 30 L185 150 L250 70 L340 175 L430 95 L440 245 L-10 245 Z" fill="#9ec5be" />
        <path d="M-10 205 L60 120 L140 200 L215 115 L300 205 L380 150 L440 200 L440 245 L-10 245 Z" fill="#6fa39b" />
        <path d="M-10 212 Q120 190 230 206 T440 200 L440 245 L-10 245 Z" fill="#8db3ad" />
        <g fill="#f7fbfb">
          <path d="M22 186 L28 160 L34 186 Z" />
          <path d="M36 190 L40 172 L44 190 Z" />
          <path d="M352 184 L358 158 L364 184 Z" />
          <path d="M368 188 L372 170 L376 188 Z" />
        </g>
        {/* dog */}
        <g fill="#1f4e57">
          <path d="M150 150 L150 190 L158 190 L160 158 Z" />
          <path d="M165 150 L168 192 L176 192 L174 150 Z" />
          <path d="M210 150 L208 192 L216 192 L220 152 Z" />
          <path d="M224 148 L228 190 L236 190 L232 146 Z" />
          <path d="M148 128 L140 104 L150 120 Z" />
          <path d="M232 118 L242 96 L250 102 L262 98 L256 110 L266 116 L250 122 L240 140 Z" />
          <path d="M146 124 Q190 112 238 120 L240 156 Q190 164 148 156 Z" />
        </g>
        {/* coat */}
        <path d="M158 120 Q196 110 234 118 L236 150 Q196 158 160 152 Z" fill="#e1a043" />
        <path d="M172 118 L174 150 M218 116 L220 150" stroke="#f4d9a8" strokeWidth="3" />
      </svg>
      <span className="absolute right-3 bottom-3 text-[10px] font-bold tracking-[0.12em] uppercase text-white bg-[#1f4e57]/90 rounded-full px-3 py-1.5">
        Made for the journey
      </span>
    </div>
  );
}

/** Flat coat icon used on each product card. */
function CoatIcon({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg viewBox="0 0 64 48" className="w-16 h-12 md:w-20 md:h-14" aria-hidden="true">
      <path
        d="M5 14 L24 8 L44 10 L58 20 L54 36 L40 34 L34 42 L20 40 L12 34 L6 26 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M5 14 L12 26 L6 26 Z" fill={stroke} opacity="0.35" />
      <path d="M24 8 L28 36 M44 10 L46 34" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
