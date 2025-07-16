// app/finish/FinishClient.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FinishClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('session_id');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/shopify/order-status?sessionId=${orderId}`) // ✅ fix typo: sessionId not session_id
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            setData(res.data);
          }
          setLoading(false);
        });
    }
  }, [orderId]);

  const handlePayNow = async () => {
    if (!data?.themeId || !data?.email || !orderId || !data?.amount) {
      alert('Missing info to start payment');
      return;
    }

    setIsPaying(true);

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId: data.themeId,
          email: data.email,
          sessionId: orderId,
          amount: data.amount,
        }),
      });

      const body = await res.json();
      if (body.url) {
        window.location.href = body.url;
      } else {
        alert('Failed to start payment');
      }
    } catch (e) {
      alert('Error redirecting to Stripe');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col justify-center items-center p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">🎉 Shopify Connected!</h1>

      {loading ? (
        <p className="text-gray-500">Checking store connection...</p>
      ) : data ? (
        <>
          <p className="text-lg text-green-600 mb-2">
            ✅ Connected to <strong>{data.shop}</strong>
          </p>

          {data.status === 'paid' ? (
            <>
              <p className="text-gray-600 max-w-md">
                Your theme is being processed. You’ll receive an email when the upload completes.
              </p>
              {data.previewUrl && (
                <a
                  href={data.previewUrl}
                  target="_blank"
                  className="mt-4 text-blue-500 underline block"
                >
                  🔍 View Store Preview
                </a>
              )}
            </>
          ) : data.amount > 0 ? (
            <>
              <p className="text-red-600 mb-2 font-semibold">
                🚫 Payment required to continue.
              </p>
              <p className="text-gray-600 mb-4">
                This theme costs <strong>${data.amount}</strong>. Please complete the payment to begin theme setup.
              </p>
              <button
                onClick={handlePayNow}
                disabled={isPaying}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
              >
                {isPaying ? 'Processing...' : '💳 Pay Now'}
              </button>
            </>
          ) : (
            <p className="text-gray-600">Something went wrong. Please contact support.</p>
          )}
        </>
      ) : (
        <p className="text-red-500">❌ Failed to load order info.</p>
      )}

      <a
        href="/"
        className="mt-8 inline-block px-6 py-3 bg-gray-100 text-sm rounded-xl border hover:bg-gray-200"
      >
        🔁 Back to Home
      </a>
    </main>
  );
}
