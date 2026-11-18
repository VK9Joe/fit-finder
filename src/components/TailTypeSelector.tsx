'use client';

import Image from 'next/image';
import type { UserInput } from '@/types';
import {
  TAIL_TYPE_HELPER,
  TAIL_TYPE_OPTIONS,
  TAIL_TYPE_QUESTION,
} from '@/data/tailTypeOptions';

interface TailTypeSelectorProps {
  value: UserInput['tailType'] | undefined;
  onChange: (value: UserInput['tailType']) => void;
  error?: string;
}

/**
 * The tail-type question as four tappable cards. Each card shows a side-view
 * illustration of where the coat ends, the tail-type label and one line about
 * coat length. Under the cards is a native radio group, so arrow keys and
 * screen readers work as usual.
 *
 * The id "tailType" lets the no-result panel scroll to this question and focus it.
 */
export default function TailTypeSelector({ value, onChange, error }: TailTypeSelectorProps) {
  return (
    <fieldset id="tailType" tabIndex={-1} aria-describedby="tailType-help" className="focus:outline-none">
      <legend className="block text-base font-semibold text-gray-900">{TAIL_TYPE_QUESTION}</legend>
      <p id="tailType-help" className="text-sm text-gray-600 mt-1 mb-4 leading-relaxed">
        {TAIL_TYPE_HELPER}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TAIL_TYPE_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`relative flex flex-col cursor-pointer rounded-xl border-2 p-2 transition-colors has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-(--brand-teal) has-[input:focus-visible]:ring-offset-2 ${
                selected
                  ? 'border-(--brand-teal) bg-(--brand-teal)/5'
                  : `bg-white hover:border-gray-300 ${error ? 'border-red-300' : 'border-gray-200'}`
              }`}
            >
              <input
                type="radio"
                name="tailType"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />

              {/* Every illustration gets the same frame so the coat endpoints line up across cards. */}
              <span className="relative block aspect-[10/7] w-full overflow-hidden rounded-lg bg-gray-50">
                <Image
                  src={option.artwork}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 170px, 45vw"
                  className="object-contain"
                />
              </span>

              <span className="mt-2 px-1 text-sm font-semibold text-gray-900">{option.label}</span>
              <span className="mt-0.5 px-1 pb-1 text-xs leading-snug text-gray-600">{option.caption}</span>

              {selected && (
                <span
                  aria-hidden="true"
                  className="absolute top-3 left-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-teal text-white shadow-sm"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </label>
          );
        })}
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </fieldset>
  );
}
