'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';
import { UserInput } from '@/types';
import { WholesaleMatch } from '@/utils/wholesalePatternFinder';

interface DisplayValues {
  neck: number;
  chest: number;
  backLength: number;
  unit: 'in' | 'cm';
}

interface WholesaleResultsProps {
  results: WholesaleMatch[];
  measurements: UserInput;
  displayValues?: DisplayValues;
  storeCode: string;
  onNewCustomer: () => void;
}

export default function WholesaleResults({
  results,
  measurements,
  displayValues,
  onNewCustomer,
}: WholesaleResultsProps) {
  const getFitColor = (label: string) => {
    switch (label) {
      case 'Best Fit':  return 'bg-green-100 text-green-800 border-green-200';
      case 'Good Fit':  return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Might Fit': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Poor Fit':  return 'bg-red-100 text-red-800 border-red-200';
      default:          return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-400 text-yellow-900';
      case 2: return 'bg-gray-300 text-gray-800';
      case 3: return 'bg-amber-600 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  // Build measurement summary line using original user-entered values when available
  const unit = displayValues?.unit ?? 'in';
  const neck = displayValues?.neck ?? measurements.neckCircumference;
  const chest = displayValues?.chest ?? measurements.chestCircumference;
  const backLength = displayValues?.backLength ?? measurements.backLength;
  const unitSuffix = unit === 'cm' ? ' cm' : '"';

  const measurementSummary = [
    `${neck}${unitSuffix} neck`,
    `${chest}${unitSuffix} chest`,
    backLength === 0 ? 'length skipped' : `${backLength}${unitSuffix} back`,
  ].join(' • ');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Fit Results</h1>
          <p className="text-xs text-gray-500">
            {measurements.breed} &bull; {measurementSummary}
          </p>
        </div>
        <Button
          onClick={onNewCustomer}
          className="bg-brand-teal hover:bg-brand-teal-dark text-white flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm"
        >
          <RotateCcw className="h-4 w-4" />
          New Customer
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* No results */}
        {results.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md border border-amber-200 p-6 text-center">
            <p className="text-gray-700 font-medium">
              No results for those measurements. Please check your measurements and try again. Consider changing the tail type, as that will affect length matching.
            </p>
            <Button
              onClick={onNewCustomer}
              className="mt-5 bg-brand-teal hover:bg-brand-teal-dark text-white px-6 py-2 rounded-lg font-medium"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Result cards */}
        {results.map((result) => (
          <div key={result.pattern.id} className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            <div className="p-5">
              {/* Header row */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-base font-bold shadow-sm ${getRankStyle(result.rank)}`}>
                  #{result.rank}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-2xl font-extrabold text-gray-900 tracking-wider">
                    {result.pattern.patternCode}
                    {result.pattern.measurements.rcLength !== undefined && (
                      <span className="text-gray-500 font-semibold text-xl ml-2">
                        ({unit === 'cm'
                          ? (Math.round(result.pattern.measurements.rcLength * 2.54 * 10) / 10)
                          : result.pattern.measurements.rcLength})
                      </span>
                    )}
                  </span>
                  <Badge className={`text-xs font-semibold px-2.5 py-1 border ${getFitColor(result.fitLabel)}`}>
                    {result.fitLabel}
                  </Badge>
                  {result.lengthSkipped && (
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      neck &amp; chest only
                    </span>
                  )}
                </div>
              </div>

              {/* Fit notes */}
              {result.fitNotes.length > 0 && (
                <ul className="space-y-1.5 bg-gray-50 rounded-xl p-4">
                  {result.fitNotes.map((note, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2 leading-relaxed">
                      <span className="text-brand-teal font-bold mt-0.5 flex-shrink-0">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}

        {results.length > 0 && (
          <div className="text-center pt-4 pb-8">
            <Button
              onClick={onNewCustomer}
              className="bg-brand-teal hover:bg-brand-teal-dark text-white px-8 py-3 rounded-xl font-semibold text-base shadow-md"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Next Customer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
