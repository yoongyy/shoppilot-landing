'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function FinishContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const [shop, setShop] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/shopify/order-status?sessionId=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          setShop(data.shop || '');
          setLoading(false);
        });
    }
  }, [sessionId]);

  if (!sessionId) {
    return (
      <main className="min-h-screen flex justify-center items-center text-center p-6">
        <p className="text-red-600 text-lg">❌ Missing session ID. Please try again from the beginning.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col justify-center items-center p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">🎉 Shopify Connected!</h1>
      {loading ? (
        <p className="text-gray-500">Checking store connection...</p>
      ) : (
        <>
          <p className="text-lg text-green-600 mb-4">
            ✅ Successfully connected to <strong>{shop}</strong>
          </p>
          <p className="text-gray-600 max-w-md">
            Your selected theme will be automatically uploaded shortly. You’ll receive an email once the setup is complete.
          </p>
        </>
      )}
      <a
        href="/"
        className="mt-8 inline-block px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
      >
        🔁 Back to Home
      </a>
    </main>
  );
}

export default function FinishPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">🔄 Loading...</div>}>
      <FinishContent />
    </Suspense>
  );
}
