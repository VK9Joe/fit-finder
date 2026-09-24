'use client';

import { useState, useEffect } from 'react';
import { UserInput } from '@/types';
import { getTailTypes } from '@/utils/patternFinder';
import { BreedAutocomplete } from '@/components/BreedAutocomplete';
import {
  validateMeasurements,
  toInches,
  SKIP_LENGTH,
  ValidationReasonCode,
} from '@/utils/measurementValidation';

type Unit = 'in' | 'cm';

interface FormErrors {
  [key: string]: string | undefined;
}

interface FitFinderFormProps {
  /** Receives measurements already converted to inches, plus the unit used to enter them. */
  onSubmit: (measurements: UserInput, meta: { unit: Unit }) => void;
  isLoading?: boolean;
  initialMeasurements?: UserInput | null;
  hasResults?: boolean;
  /** Reported so every validation failure is logged with a reason code. */
  onValidationFailure?: (reasonCodes: ValidationReasonCode[]) => void;
  /** Focuses a field the results area asked the customer to correct. */
  focusField?: keyof UserInput | null;
}

export default function FitFinderForm({
  onSubmit,
  isLoading = false,
  initialMeasurements = null,
  hasResults = false,
  onValidationFailure,
  focusField = null,
}: FitFinderFormProps) {
  // Values are held in whatever unit the customer picked and converted on submit.
  const [unit, setUnit] = useState<Unit>('in');
  const [measurements, setMeasurements] = useState<Partial<UserInput>>(() => {
    return initialMeasurements || {
      tailType: 'straight',
      chondrodystrophic: false
    };
  });
  const [backLengthRaw, setBackLengthRaw] = useState<string>(() =>
    initialMeasurements?.backLength === 0 ? '00' : (initialMeasurements?.backLength?.toString() ?? '')
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const isLengthSkip = backLengthRaw === '00';

  const unitLabel = unit === 'cm' ? 'cm' : 'inches';
  const placeholders =
    unit === 'cm'
      ? { neck: '32', chest: '48', length: '38' }
      : { neck: '12.5', chest: '18.75', length: '15' };

  // The no-result panel can point the customer at one field to correct; bring it
  // into view rather than making them hunt for it.
  useEffect(() => {
    if (!focusField) return;
    const element = document.getElementById(focusField);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (element as HTMLInputElement | HTMLSelectElement).focus({ preventScroll: true });
  }, [focusField]);

  const isFormComplete = () => {
    return measurements.breed &&
           measurements.neckCircumference && measurements.neckCircumference > 0 &&
           measurements.chestCircumference && measurements.chestCircumference > 0 &&
           (isLengthSkip || (measurements.backLength && measurements.backLength > 0)) &&
           (isLengthSkip || measurements.tailType);
  };

  /** The entered values converted to the inches the scoring engine works in. */
  const toInchesInput = () => ({
    neckCircumference: measurements.neckCircumference
      ? toInches(measurements.neckCircumference, unit)
      : measurements.neckCircumference,
    chestCircumference: measurements.chestCircumference
      ? toInches(measurements.chestCircumference, unit)
      : measurements.chestCircumference,
    backLength: isLengthSkip
      ? SKIP_LENGTH
      : measurements.backLength
        ? toInches(measurements.backLength, unit)
        : measurements.backLength,
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!measurements.breed) {
      newErrors.breed = "Please select your dog's breed";
    }
    if (!isLengthSkip && (!measurements.backLength || measurements.backLength <= 0)) {
      newErrors.backLength = 'Please enter a valid back length measurement';
    }
    if (!measurements.neckCircumference || measurements.neckCircumference <= 0) {
      newErrors.neckCircumference = 'Please enter a valid neck measurement';
    }
    if (!measurements.chestCircumference || measurements.chestCircumference <= 0) {
      newErrors.chestCircumference = 'Please enter a valid chest measurement';
    }
    if (!isLengthSkip && !measurements.tailType) {
      newErrors.tailType = "Please select your dog's tail type";
    }

    // Range, unit and neck-vs-chest checks, so impossible measurements never
    // reach the scoring engine. Reported for logging with their reason codes.
    const validation = validateMeasurements(toInchesInput());
    for (const [field, error] of Object.entries(validation.errors)) {
      if (!newErrors[field]) newErrors[field] = error.message;
    }
    if (!validation.ok) {
      onValidationFailure?.(validation.reasonCodes);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const inInches = toInchesInput();
    const submission = {
      ...measurements,
      ...inInches,
      tailType: isLengthSkip ? measurements.tailType || 'straight' : measurements.tailType,
    } as UserInput;

    onSubmit(submission, { unit });
  };

  const updateMeasurement = (field: keyof UserInput, value: string | number | boolean) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div className="py-16 px-4"> 
      <div className="max-w-3xl mx-auto">
        {/* Form Card */}
        <div className="professional-card overflow-hidden">
          <div className="px-8 py-10">
            
            {/* Dog Information */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dog Information</h2>
              <p className="text-sm text-gray-600 mb-6">
                Every fit begins with a tape measure.{' '}
                <a 
                  href="https://k9apparel.com/pages/measure-dog-for-breed-specific-coats" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-teal hover:text-brand-teal-dark underline font-medium"
                >
                  Click here for our measuring guide.
                </a>
              </p>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Breed
                  </label>
                  <BreedAutocomplete
                    value={measurements.breed || ''}
                    onValueChange={(value) => updateMeasurement('breed', value)}
                    error={!!errors.breed}
                    className="w-full"
                  />
                  {errors.breed && (
                    <p className="text-red-500 text-sm mt-1">{errors.breed}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Start typing to search breeds. Can&apos;t find yours? Select &quot;Breed Not Listed&quot; or &quot;Mixed Breed&quot;
                  </p>
                </div>
              </div>
            </div>

            {/* Measurements */}
            <div className="mb-10">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Measurements</h2>
                {/* A real unit choice, rather than hoping customers read "inches" */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-medium">Measured in</span>
                  <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                    {(['in', 'cm'] as Unit[]).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => {
                          setUnit(u);
                          setErrors({});
                        }}
                        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                          unit === u
                            ? 'bg-white text-brand-teal shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {u === 'in' ? 'inches' : 'cm'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Neck Circumference */}
                <div>
                  <label htmlFor="neckCircumference" className="block text-sm font-semibold text-gray-800 mb-3">
                    Neck Circumference <span className="text-gray-500 font-normal">({unitLabel})</span>
                  </label>
                  <input
                    id="neckCircumference"
                    type="number"
                    value={measurements.neckCircumference || ''}
                    onChange={(e) => updateMeasurement('neckCircumference', parseFloat(e.target.value) || 0)}
                    placeholder={placeholders.neck}
                    className={`w-full h-12 px-4 border rounded-lg text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                      errors.neckCircumference ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="1"
                    step="0.25"
                  />
                  {errors.neckCircumference && (
                    <p className="text-red-500 text-sm mt-1">{errors.neckCircumference}</p>
                  )}
                </div>

                {/* 2. Chest Circumference */}
                <div>
                  <label htmlFor="chestCircumference" className="block text-sm font-semibold text-gray-800 mb-3">
                    Chest Circumference <span className="text-gray-500 font-normal">({unitLabel})</span>
                  </label>
                  <input
                    id="chestCircumference"
                    type="number"
                    value={measurements.chestCircumference || ''}
                    onChange={(e) => updateMeasurement('chestCircumference', parseFloat(e.target.value) || 0)}
                    placeholder={placeholders.chest}
                    className={`w-full h-12 px-4 border rounded-lg text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                      errors.chestCircumference ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="1"
                    step="0.25"
                  />
                  {errors.chestCircumference && (
                    <p className="text-red-500 text-sm mt-1">{errors.chestCircumference}</p>
                  )}
                </div>

                {/* 3. Back Length */}
                <div>
                  <label htmlFor="backLength" className="block text-sm font-semibold text-gray-800 mb-3">
                    Back Length <span className="text-gray-500 font-normal">({unitLabel})</span>
                  </label>
                  <input
                    id="backLength"
                    type="number"
                    value={backLengthRaw}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setBackLengthRaw(raw);
                      const parsed = raw === '00' ? 0 : (parseFloat(raw) || 0);
                      setMeasurements(prev => ({ ...prev, backLength: parsed }));
                      if (errors.backLength) {
                        setErrors(prev => ({ ...prev, backLength: undefined }));
                      }
                    }}
                    placeholder={placeholders.length}
                    className={`w-full h-12 px-4 border rounded-lg text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                      errors.backLength ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="0"
                    step="1"
                  />
                  {errors.backLength && (
                    <p className="text-red-500 text-sm mt-1">{errors.backLength}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Physical Characteristics */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Physical Characteristics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tail Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Tail Type
                  </label>
                  <div className="relative">
                    <select
                      id="tailType"
                      value={measurements.tailType || ''}
                      onChange={(e) => updateMeasurement('tailType', e.target.value as UserInput['tailType'])}
                      className={`block w-full h-12 pl-4 pr-10 py-3 border rounded-lg text-gray-900 text-base ${
                        errors.tailType ? 'border-red-300' : 'border-gray-300'
                      } bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                    >
                      <option value="" disabled>Choose tail type</option>
                      {getTailTypes().map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  {errors.tailType && (
                    <p className="text-red-500 text-sm mt-1">{errors.tailType}</p>
                  )}
                </div>

                {/* Chondrodystrophic Legs */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Leg Type
                  </label>
                  <div className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg">
                    <input
                      type="checkbox"
                      id="chondrodystrophic"
                      checked={measurements.chondrodystrophic || false}
                      onChange={(e) => updateMeasurement('chondrodystrophic', e.target.checked)}
                      className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="chondrodystrophic" className="text-sm text-gray-700">
                      Very short legs (like Corgi, Basset Hound, Dachshund)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-10 border-t border-gray-200 mt-8">
              <div className="text-center space-y-4">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !isFormComplete()}
                  className={`inline-flex items-center px-10 py-4 rounded-lg font-bold text-lg transition-all transform ${
                    isFormComplete() && !isLoading
                      ? 'bg-brand-teal hover:bg-brand-teal-dark text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Finding perfect fit...
                    </>
                  ) : (
                    hasResults ? 'Update Results' : 'Find My Perfect Fit'
                  )}
                </button>
                
                {!isFormComplete() && !isLoading && (
                  <p className="text-sm text-gray-500 mt-4">
                    Complete all fields to find the best-fitting coats
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-base text-gray-500 font-medium">
            Trusted by thousands of dog owners worldwide
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Performance Outerwear + Perfect Fit
          </p>
        </div>
      </div>
    </div>
  );
}