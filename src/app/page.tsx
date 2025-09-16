import { Suspense } from 'react';
import FitFinder from '@/components/FitFinder';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <FitFinder />
      </Suspense>
    </div>
  );
}
