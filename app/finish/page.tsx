// app/finish/page.tsx
import { Suspense } from 'react';
import FinishClient from './FinishClient';

export default function FinishPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FinishClient />
    </Suspense>
  );
}
