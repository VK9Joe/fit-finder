'use client';

import { useState } from 'react';
import { DogMeasurements } from '@/types';
import { dogBreeds } from '@/data/realPatterns';

interface FormErrors {
  [key: string]: string | undefined;
}

interface FitFinderFormProps {
  onSubmit: (measurements: DogMeasurements) => void;
  isLoading?: boolean;
}

export default function FitFinderForm({ onSubmit, isLoading = false }: FitFinderFormProps) {
  const [measurements, setMeasurements] = useState<Partial<DogMeasurements>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  const isFormComplete = () => {
    return measurements.breed && 
           measurements.length && measurements.length > 0 &&
           measurements.neckMeasurement && measurements.neckMeasurement > 0 &&
           measurements.chestMeasurement && measurements.chestMeasurement > 0 &&
           measurements.legLength && 
           measurements.tailType;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!measurements.breed) {
      newErrors.breed = "Please select your dog's breed";
    }
    if (!measurements.length || measurements.length <= 0) {
      newErrors.length = 'Please enter a valid length measurement';
    }
    if (!measurements.neckMeasurement || measurements.neckMeasurement <= 0) {
      newErrors.neckMeasurement = 'Please enter a valid neck measurement';
    }
    if (!measurements.chestMeasurement || measurements.chestMeasurement <= 0) {
      newErrors.chestMeasurement = 'Please enter a valid chest measurement';
    }
    if (!measurements.legLength) {
      newErrors.legLength = "Please select your dog's leg length";
    }
    if (!measurements.tailType) {
      newErrors.tailType = "Please select your dog's tail type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(measurements as DogMeasurements);
    }
  };

  const updateMeasurement = (field: keyof DogMeasurements, value: string | number) => {
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
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Breed
                  </label>
                  <div className="relative">
                    <select
                      value={measurements.breed || ''}
                      onChange={(e) => updateMeasurement('breed', e.target.value)}
                      className={`block w-full h-12 pl-4 pr-10 py-3 border rounded-lg text-gray-900 text-base ${
                        errors.breed ? 'border-red-300' : 'border-gray-300'
                      } bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                    >
                      <option value="" disabled>Select your dog&apos;s breed</option>
                      {dogBreeds.map((breed) => (
                        <option key={breed} value={breed}>
                          {breed}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  {errors.breed && (
                    <p className="text-red-500 text-sm mt-1">{errors.breed}</p>
                  )}
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
                {/* Length */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Length
                  </label>
                  <input
                    type="number"
                    value={measurements.length || ''}
                    onChange={(e) => updateMeasurement('length', parseFloat(e.target.value) || 0)}
                    placeholder="24"
                    className={`w-full h-12 px-4 border rounded-lg text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                      errors.length ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="1"
                    step="0.5"
                  />
                  {errors.length && (
                    <p className="text-red-500 text-sm mt-1">{errors.length}</p>
                  )}
                </div>

                {/* Neck */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Neck
                  </label>
                  <input
                    type="number"
                    value={measurements.neckMeasurement || ''}
                    onChange={(e) => updateMeasurement('neckMeasurement', parseFloat(e.target.value) || 0)}
                    placeholder="16"
                    className={`w-full h-12 px-4 border rounded-lg text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                      errors.neckMeasurement ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="1"
                    step="0.5"
                  />
                  {errors.neckMeasurement && (
                    <p className="text-red-500 text-sm mt-1">{errors.neckMeasurement}</p>
                  )}
                </div>

                {/* Chest */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Chest
                  </label>
                  <input
                    type="number"
                    value={measurements.chestMeasurement || ''}
                    onChange={(e) => updateMeasurement('chestMeasurement', parseFloat(e.target.value) || 0)}
                    placeholder="28"
                    className={`w-full h-12 px-4 border rounded-lg text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                      errors.chestMeasurement ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="1"
                    step="0.5"
                  />
                  {errors.chestMeasurement && (
                    <p className="text-red-500 text-sm mt-1">{errors.chestMeasurement}</p>
                  )}
                </div>
              </div>

              {/* Tip */}
              <div className="mt-8 p-5 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-primary mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-base text-primary font-semibold leading-relaxed">
                      Use a soft tape measure with your dog standing naturally for the most accurate measurements.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Physical Characteristics */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Physical Characteristics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Leg Length */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Leg Length
                  </label>
                  <div className="relative">
                    <select
                      value={measurements.legLength || ''}
                      onChange={(e) => updateMeasurement('legLength', e.target.value as 'short' | 'long')}
                      className={`block w-full h-12 pl-4 pr-10 py-3 border rounded-lg text-gray-900 text-base ${
                        errors.legLength ? 'border-red-300' : 'border-gray-300'
                      } bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                    >
                      <option value="" disabled>Choose leg length</option>
                      <option value="short">Short</option>
                      <option value="long">Long</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  {errors.legLength && (
                    <p className="text-red-500 text-sm mt-1">{errors.legLength}</p>
                  )}
                </div>

                {/* Tail Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Tail Type
                  </label>
                  <div className="relative">
                    <select
                      value={measurements.tailType || ''}
                      onChange={(e) => updateMeasurement('tailType', e.target.value as 'straight' | 'curled' | 'sickle' | 'otter')}
                      className={`block w-full h-12 pl-4 pr-10 py-3 border rounded-lg text-gray-900 text-base ${
                        errors.tailType ? 'border-red-300' : 'border-gray-300'
                      } bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                    >
                      <option value="" disabled>Select tail type</option>
                      <option value="straight">Straight</option>
                      <option value="curled">Curled</option>
                      <option value="sickle">Sickle</option>
                      <option value="otter">Otter</option>
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
                    'Find My Perfect Fit'
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