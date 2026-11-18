'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { ILLUSTRATIONS } from '@/components/MeasurementDiagram';

/**
 * How to take each measurement, from the client's measuring guides. The copy is
 * the guides' own wording, shown as real text so it stays readable on a phone.
 */
const GUIDES = {
  neckCircumference: {
    illustration: ILLUSTRATIONS.neck,
    guide:
      'Measure around the base of the neck, where it meets the shoulders. Keep the tape snug but not tight. ' +
      'Measuring higher up near the head will give you the wrong size.',
  },
  chestCircumference: {
    illustration: ILLUSTRATIONS.chest,
    guide:
      'Measure around the widest part of the chest, just behind the front legs. Make sure your dog is standing ' +
      'and the tape is snug but not tight.',
  },
  backLength: {
    illustration: ILLUSTRATIONS.length,
    guide:
      'Measure from the withers (base of the neck, just ahead of the shoulder blades) to where the tail meets ' +
      'the spine. Keep the tape straight along the back.',
  },
} as const;

export type MeasurementFieldName = keyof typeof GUIDES;

/** The id of a field's guide text, for the input's aria-describedby. */
export const guideId = (field: MeasurementFieldName) => `${field}-guide`;

interface MeasurementFieldProps {
  field: MeasurementFieldName;
  label: ReactNode;
  /** The input and its error message. The input's id must be `field`. */
  children: ReactNode;
}

/**
 * One measurement with its illustration beside it: picture on the left and
 * label, instructions and input on the right; stacked on phones.
 */
export default function MeasurementField({ field, label, children }: MeasurementFieldProps) {
  const { illustration, guide } = GUIDES[field];
  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 md:gap-6 md:items-center">
      {/* Decorative: the guide text beside it says the same thing. */}
      <div className="relative aspect-[6/5] w-full">
        <Image
          src={illustration.src}
          alt=""
          fill
          sizes="(min-width: 768px) 280px, 90vw"
          className="object-contain"
        />
      </div>
      <div>
        <label htmlFor={field} className="block text-sm font-semibold text-gray-800">
          {label}
        </label>
        <p id={guideId(field)} className="text-sm text-gray-600 mt-1 mb-3 leading-relaxed">
          {guide}
        </p>
        {children}
      </div>
    </div>
  );
}
