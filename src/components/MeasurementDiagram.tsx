'use client';

import Image from 'next/image';

/**
 * Measuring illustrations for the no-result panel (Brief, Priority 3).
 *
 * The neck and back-length images are the client's measuring guides with their
 * baked-in titles and notes removed; that copy is shown as real text beside
 * them, where it stays readable at this size. next/image serves small resized versions of
 * both rather than the source files.
 */
const ILLUSTRATIONS = {
  neck: {
    src: '/measure_neck.png',
    width: 800,
    height: 729,
    alt: 'Illustration of a dog showing where to measure the neck: low, at the base where it meets the shoulders',
  },
  length: {
    src: '/measure_length.png',
    width: 900,
    height: 739,
    alt: 'Illustration of a dog showing the back length: from the withers, just ahead of the shoulder blades, to where the tail meets the spine',
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
