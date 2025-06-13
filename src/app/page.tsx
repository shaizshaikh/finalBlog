
import React, { Suspense } from 'react';
import HomePageClientContent, { HomePageLoader } from '@/components/HomePageClientContent';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<HomePageLoader initialMessage="Loading page structure..." />}>
      <HomePageClientContent />
    </Suspense>
  );
}
