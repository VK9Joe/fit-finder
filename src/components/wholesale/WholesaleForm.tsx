'use client';

import { useState } from 'react';
import { UserInput } from '@/types';
import { getTailTypes } from '@/utils/patternFinder';
import { BreedAutocomplete } from '@/components/BreedAutocomplete';

interface WholesaleFormProps {
  onSubmit: (measurements: UserInput) => void;
  isLoading?: boolean;
}

type Unit = 'in' | 'cm';

const CM_TO_IN = 1 / 2.54;

function toInches(value: number, unit: Unit): number {
  return unit === 'cm' ? parseFloat((value * CM_TO_IN).toFixed(2)) : value;
}

export default function WholesaleForm({ onSubmit, isLoading = false }: WholesaleFormProps) {
  const [unit, setUnit] = useState<Unit>('cm');
  const [measurements, setMeasurements] = useState<Partial<UserInput>>({
    tailType: 'straight',
    chondrodystrophic: false,
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const isFormComplete = () =>
    measurements.breed &&
    measurements.backLength && measurements.backLength > 0 &&
    measurements.neckCircumference && measurements.neckCircumference > 0 &&
    measurements.chestCircumference && measurements.chestCircumference > 0 &&
    measurements.tailType;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string | undefined> = {};
    if (!measurements.breed) newErrors.breed = "Please select a breed";
    if (!measurements.backLength || measurements.backLength <= 0) newErrors.backLength = 'Enter a valid back length';
    if (!measurements.neckCircumference || measurements.neckCircumference <= 0) newErrors.neckCircumference = 'Enter a valid neck measurement';
    if (!measurements.chestCircumference || measurements.chestCircumference <= 0) newErrors.chestCircumference = 'Enter a valid chest measurement';
    if (!measurements.tailType) newErrors.tailType = "Please select a tail type";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const update = (field: keyof UserInput, value: string | number | boolean) => {
    setMeasurements((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    const m = measurements as UserInput;
    onSubmit({
      ...m,
      neckCircumference: toInches(m.neckCircumference, unit),
      chestCircumference: toInches(m.chestCircumference, unit),
      backLength: toInches(m.backLength, unit),
    });
  };

  const unitLabel = unit === 'cm' ? 'cm' : 'inches';
  const placeholders = unit === 'cm'
    ? { neck: '32', chest: '48', length: '38' }
    : { neck: '12.5', chest: '18.75', length: '15' };

  return (
    <div className="py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="professional-card overflow-hidden">
          <div className="px-8 py-10">

            {/* Breed */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dog Information</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Breed</label>
                <BreedAutocomplete
                  value={measurements.breed || ''}
                  onValueChange={(value) => update('breed', value)}
                  error={!!errors.breed}
                  className="w-full"
                />
                {errors.breed && <p className="text-red-500 text-sm mt-1">{errors.breed}</p>}
                <p className="text-xs text-gray-500 mt-2">
                  Start typing to search breeds. Can&apos;t find yours? Select &quot;Breed Not Listed&quot; or &quot;Mixed Breed&quot;
                </p>
              </div>
            </div>

            {/* Measurements */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Measurements</h2>

                {/* Unit toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                  {(['cm', 'in'] as Unit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => {
                        setUnit(u);
                        setMeasurements((prev) => ({
                          ...prev,
                          neckCircumference: undefined,
                          chestCircumference: undefined,
                          backLength: undefined,
                        }));
                      }}
                      className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                        unit === u
                          ? 'bg-white text-brand-teal shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {u === 'cm' ? 'Centimeters' : 'Inches'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { field: 'neckCircumference' as const, label: 'Neck Circumference', placeholder: placeholders.neck },
                  { field: 'chestCircumference' as const, label: 'Chest Circumference', placeholder: placeholders.chest },
                  { field: 'backLength' as const, label: 'Back Length', placeholder: placeholders.length },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      {label} <span className="font-normal text-gray-400">({unitLabel})</span>
                    </label>
                    <input
                      type="number"
                      value={measurements[field] || ''}
                      onChange={(e) => update(field, parseFloat(e.target.value) || 0)}
                      placeholder={placeholder}
                      className={`w-full h-12 px-4 border rounded-lg text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                        errors[field] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      min="1"
                      step={unit === 'cm' ? '0.5' : '0.25'}
                    />
                    {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Physical Characteristics */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Physical Characteristics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Tail Type</label>
                  <div className="relative">
                    <select
                      value={measurements.tailType || ''}
                      onChange={(e) => update('tailType', e.target.value as UserInput['tailType'])}
                      className={`block w-full h-12 pl-4 pr-10 py-3 border rounded-lg text-gray-900 text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                        errors.tailType ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="" disabled>Choose tail type</option>
                      {getTailTypes().map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  {errors.tailType && <p className="text-red-500 text-sm mt-1">{errors.tailType}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Leg Type</label>
                  <div className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg h-12">
                    <input
                      type="checkbox"
                      id="chondrodystrophic"
                      checked={measurements.chondrodystrophic || false}
                      onChange={(e) => update('chondrodystrophic', e.target.checked)}
                      className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="chondrodystrophic" className="text-sm text-gray-700">
                      Very short legs (Corgi, Basset, Dachshund)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-10 border-t border-gray-200">
              <div className="text-center">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !isFormComplete()}
                  className={`inline-flex items-center px-10 py-4 rounded-lg font-bold text-lg transition-all transform ${
                    isFormComplete() && !isLoading
                      ? 'bg-brand-teal hover:bg-brand-teal-dark text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? 'Finding matches...' : 'Find Best Patterns'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
