'use client';

import Image from 'next/image';

/**
 * Measuring illustrations, used beside each measurement field on the form and
 * in the no-result panel (Brief, Priority 3).
 *
 * They are cropped from the client's three measuring guides (Step One: neck,
 * Step Two: chest, Step Three: length). The titles, intro paragraphs and small
 * black notes are removed; that copy is shown as real text beside the image,
 * where it stays readable on a phone. The short coloured callouts ("Great!",
 * "Avoid…", the length markers) stay in the artwork. next/image serves resized
 * versions rather than the 1200px source files.
 */
export const ILLUSTRATIONS = {
  neck: {
    src: '/measure_neck.png',
    width: 1200,
    height: 990,
    alt: 'Illustration of a dog showing where to measure the neck: low, at the base where it meets the shoulders',
  },
  length: {
    src: '/measure_length.png',
    width: 1200,
    height: 994,
    alt: 'Illustration of a dog showing the back length: from the withers, just ahead of the shoulder blades, to where the tail meets the spine',
  },
  chest: {
    src: '/measure_chest.png',
    width: 1200,
    height: 1098,
    alt: 'Illustration of a dog showing where to measure the chest, just behind the front legs',
  },
} as const;

export default function MeasurementDiagram({ kind }: { kind: keyof typeof ILLUSTRATIONS }) {
  const { src, width, height, alt } = ILLUSTRATIONS[kind];
  return <Image src={src} alt={alt} width={width} height={height} sizes="160px" className="h-[140px] w-auto" />;
}
