'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function FinishContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const [shop, setShop] = useState('');
  // const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'paid' | 'pending_payment' | 'error'>('loading');
  const [stripeSessionUrl, setStripeSessionUrl] = useState('');

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/shopify/order-status?sessionId=${sessionId}`)
        .then(res => res.json())
        .then(async (data) => {
          setShop(data.shop || '');
          // setLoading(false);
          if (data.status === 'paid') {
            setStatus('paid');
          } else if (data.status === 'pending_payment') {
            setStatus('pending_payment');

            // Fetch Stripe Checkout Session URL
            const stripeRes = await fetch('/api/create-checkout-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                sessionId: sessionId,
                themeId: data.themeId,
                email: data.email,
                amount: data.amount,
               }),
            });
            const stripeData = await stripeRes.json();
            setStripeSessionUrl(stripeData.url || '');
          } else {
            setStatus('error');
          }
        })
        .catch(() => setStatus('error'));
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
      {status === 'loading' && <p className="text-gray-500">Checking store connection...</p>}

      {status === 'paid' && (
        <>
          <p className="text-lg text-green-600 mb-4">
            ✅ Successfully connected to <strong>{shop}</strong>
          </p>
          <p className="text-gray-600 max-w-md">
            Your selected theme will be uploaded shortly. You’ll receive an email once done.
          </p>
        </>
      )}

      {status === 'pending_payment' && (
        <>
          <p className="text-lg text-yellow-600 mb-4">
            ⚠️ Theme payment required before setup.
          </p>
          <p className="text-gray-600 max-w-md mb-4">
            Please complete your payment to proceed with deploying the theme to <strong>{shop}</strong>.
          </p>
          <a
            href={stripeSessionUrl}
            target="_blank"
            className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
          >
            💳 Pay Now
          </a>
        </>
      )}

      {status === 'error' && (
        <p className="text-red-600">❌ An error occurred. Please try again later.</p>
      )}

      <a
        href="/"
        className="mt-10 inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-xl shadow hover:bg-gray-300 transition"
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
