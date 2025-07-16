// app/finish/page.tsx
import { Suspense } from 'react';
import FinishClient from './FinishClient';

export default function FinishPage() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Loading...</p>}>
      <FinishClient />
    </Suspense>
  );
}
