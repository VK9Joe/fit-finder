'use client';

import Image from 'next/image';

/**
 * Measuring illustrations for the no-result panel (Brief, Priority 3).
 *
 * The neck image is the client's "Measure the neck" guide with its baked-in
 * title and side note removed; that copy is shown as real text beside it, where
 * it stays readable at this size. next/image serves small resized versions of
 * both rather than the source files.
 */
const ILLUSTRATIONS = {
  neck: {
    src: '/measure_neck.png',
    width: 800,
    height: 729,
    alt: 'Illustration of a dog showing where to measure the neck: low, at the base where it meets the shoulders',
  },
  chest: {
    src: '/dog_measure.png',
    width: 1335,
    height: 1178,
    alt: 'Illustration of a dog showing where to measure the chest, just behind the front legs',
  },
} as const;

export default function MeasurementDiagram({ kind }: { kind: keyof typeof ILLUSTRATIONS }) {
  const { src, width, height, alt } = ILLUSTRATIONS[kind];
  return <Image src={src} alt={alt} width={width} height={height} sizes="160px" className="h-[140px] w-auto" />;
}
