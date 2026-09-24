'use client';

import Image from 'next/image';

/**
 * Measuring illustration shown beside the focused remeasurement instruction
 * on the no-result panel (Brief, Priority 3).
 *
 * The source PNG is 1335x1178; next/image serves a small WebP/AVIF sized for
 * the ~160px slot rather than the full 637 KB file. Kept to the same 140px
 * height as the diagram it replaced so the panel layout does not change.
 */
export default function MeasurementDiagram() {
  return (
    <Image
      src="/dog_measure.png"
      alt="Illustration of a dog showing where to measure the chest, just behind the front legs"
      width={1335}
      height={1178}
      sizes="160px"
      className="h-[140px] w-auto"
    />
  );
}
