'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface WholesaleGateProps {
  onAuthenticated: (storeCode: string) => void;
}

export default function WholesaleGate({ onAuthenticated }: WholesaleGateProps) {
  const [storeCode, setStoreCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = storeCode.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter your store code.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/wholesale/verify-store-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeCode: trimmed }),
      });
      const data = await res.json();
      if (data.ok) {
        onAuthenticated(trimmed);
      } else {
        setError('Invalid store code. Please check with your K9 Apparel representative.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-teal/10 mb-4">
            <svg className="w-8 h-8 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Wholesale Fit Finder</h1>
          <p className="text-gray-500 text-sm">Enter your store code to access the retailer sizing tool</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="storeCode" className="block text-sm font-semibold text-gray-700 mb-2">
              Store Code
            </label>
            <input
              id="storeCode"
              type="text"
              value={storeCode}
              onChange={(e) => {
                setStoreCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="e.g. 3456WICA"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-xl font-mono tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors"
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            {error && (
              <p className="text-red-600 text-sm mt-2 text-center font-medium">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || !storeCode.trim()}
            className="w-full bg-brand-teal hover:bg-brand-teal-dark text-white py-4 rounded-xl font-semibold text-base transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Access Fit Finder'}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          K9 Apparel Wholesale Portal &mdash; Authorized Retailers Only
        </p>
      </div>
    </div>
  );
}
