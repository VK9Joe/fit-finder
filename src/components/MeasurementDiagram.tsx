'use client';

import { FocusField } from '@/utils/noResultDiagnosis';

/**
 * Schematic side view of a dog with one measurement highlighted, shown beside a
 * focused remeasurement instruction (Brief, Priority 3).
 *
 * Drawn inline rather than loaded as an asset so it scales cleanly and can
 * highlight whichever measurement is actually in question.
 */
export default function MeasurementDiagram({ field }: { field: FocusField }) {
  const highlight = '#0d9488';
  const muted = '#cbd5e1';

  const isNeck = field === 'neckCircumference';
  const isChest = field === 'chestCircumference';
  const isLength = field === 'backLength' || field === 'tailType';

  return (
    <svg
      viewBox="0 0 240 140"
      role="img"
      aria-label={`Diagram showing where to measure the ${
        isNeck ? 'neck' : isChest ? 'chest' : 'back length'
      }`}
      className="w-full max-w-[240px] h-auto"
    >
      {/* body */}
      <path
        d="M70 60 Q70 46 90 46 L150 46 Q172 46 176 62 L180 82 Q181 94 170 94 L82 94 Q70 94 70 82 Z"
        fill="#f1f5f9"
        stroke={muted}
        strokeWidth="2"
      />
      {/* head + muzzle */}
      <circle cx="58" cy="52" r="17" fill="#f1f5f9" stroke={muted} strokeWidth="2" />
      <path d="M44 56 L30 60 L44 66 Z" fill="#f1f5f9" stroke={muted} strokeWidth="2" strokeLinejoin="round" />
      <path d="M62 36 L56 24 L70 30 Z" fill="#f1f5f9" stroke={muted} strokeWidth="2" strokeLinejoin="round" />
      {/* legs */}
      <rect x="84" y="94" width="9" height="30" rx="4" fill="#f1f5f9" stroke={muted} strokeWidth="2" />
      <rect x="104" y="94" width="9" height="30" rx="4" fill="#f1f5f9" stroke={muted} strokeWidth="2" />
      <rect x="148" y="94" width="9" height="30" rx="4" fill="#f1f5f9" stroke={muted} strokeWidth="2" />
      <rect x="164" y="94" width="9" height="30" rx="4" fill="#f1f5f9" stroke={muted} strokeWidth="2" />
      {/* tail */}
      <path d="M180 62 Q196 52 192 34" fill="none" stroke={muted} strokeWidth="3" strokeLinecap="round" />

      {/* neck: around the base of the neck, where the collar sits */}
      {isNeck && (
        <>
          <ellipse cx="76" cy="62" rx="9" ry="21" fill="none" stroke={highlight} strokeWidth="3.5" />
          <text x="76" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill={highlight}>
            Neck
          </text>
          <line x1="76" y1="24" x2="76" y2="38" stroke={highlight} strokeWidth="2" />
        </>
      )}

      {/* chest: widest part of the ribcage, just behind the front legs */}
      {isChest && (
        <>
          <ellipse cx="120" cy="70" rx="11" ry="25" fill="none" stroke={highlight} strokeWidth="3.5" />
          <text x="120" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill={highlight}>
            Chest
          </text>
          <line x1="120" y1="24" x2="120" y2="43" stroke={highlight} strokeWidth="2" />
        </>
      )}

      {/* back length: base of neck to base of tail */}
      {isLength && (
        <>
          <line x1="80" y1="40" x2="178" y2="40" stroke={highlight} strokeWidth="3.5" strokeLinecap="round" />
          <line x1="80" y1="33" x2="80" y2="47" stroke={highlight} strokeWidth="3" strokeLinecap="round" />
          <line x1="178" y1="33" x2="178" y2="47" stroke={highlight} strokeWidth="3" strokeLinecap="round" />
          <text x="129" y="24" textAnchor="middle" fontSize="12" fontWeight="700" fill={highlight}>
            Back length
          </text>
        </>
      )}
    </svg>
  );
}
