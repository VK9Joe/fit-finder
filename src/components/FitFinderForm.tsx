'use client';

import { useState } from 'react';
import { UserInput } from '@/types';
import { getTailTypes } from '@/utils/patternFinder';
import { BreedAutocomplete } from '@/components/BreedAutocomplete';

interface FormErrors {
  [key: string]: string | undefined;
}

interface FitFinderFormProps {
  onSubmit: (measurements: UserInput) => void;
  isLoading?: boolean;
  initialMeasurements?: UserInput | null;
  hasResults?: boolean;
}

export default function FitFinderForm({ onSubmit, isLoading = false, initialMeasurements = null, hasResults = false }: FitFinderFormProps) {
  const [measurements, setMeasurements] = useState<Partial<UserInput>>(() => {
    return initialMeasurements || {
      tailType: 'straight',
      chondrodystrophic: false
    };
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const isFormComplete = () => {
    return measurements.breed && 
           measurements.backLength && measurements.backLength > 0 &&
           measurements.neckCircumference && measurements.neckCircumference > 0 &&
           measurements.chestCircumference && measurements.chestCircumference > 0 &&
           measurements.tailType;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!measurements.breed) {
      newErrors.breed = "Please select your dog's breed";
    }
    if (!measurements.backLength || measurements.backLength <= 0) {
      newErrors.backLength = 'Please enter a valid back length measurement';
    }
    if (!measurements.neckCircumference || measurements.neckCircumference <= 0) {
      newErrors.neckCircumference = 'Please enter a valid neck measurement';
    }
    if (!measurements.chestCircumference || measurements.chestCircumference <= 0) {
      newErrors.chestCircumference = 'Please enter a valid chest measurement';
    }
    if (!measurements.tailType) {
      newErrors.tailType = "Please select your dog's tail type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(measurements as UserInput);
    }
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Measurements</h2>
                <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                  All in inches
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Neck Circumference */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Neck Circumference
                  </label>
                  <input
                    type="number"
                    value={measurements.neckCircumference || ''}
                    onChange={(e) => updateMeasurement('neckCircumference', parseFloat(e.target.value) || 0)}
                    placeholder="12.5"
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
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Chest Circumference
                  </label>
                  <input
                    type="number"
                    value={measurements.chestCircumference || ''}
                    onChange={(e) => updateMeasurement('chestCircumference', parseFloat(e.target.value) || 0)}
                    placeholder="18.75"
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
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Back Length
                  </label>
                  <input
                    type="number"
                    value={measurements.backLength || ''}
                    onChange={(e) => updateMeasurement('backLength', parseFloat(e.target.value) || 0)}
                    placeholder="15"
                    className={`w-full h-12 px-4 border rounded-lg text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                      errors.backLength ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="1"
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