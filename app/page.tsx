'use client';

import { useState, useEffect, Suspense } from 'react';
import ShopifyConnectButton from '@/components/ShopifyConnectButton';
import { useSearchParams } from 'next/navigation';

function PageContent() {
  const searchParams = useSearchParams();
  const shop = searchParams?.get('shop') || '';

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 flex flex-col items-center p-6">
      <header className="w-full max-w-3xl text-center py-12">
        <h1 className="text-4xl font-bold mb-4">🛍️ ShopPilot</h1>
        <p className="text-lg text-gray-600">一句话生成你的 AI 电商商店（使用 Google Gemini）</p>
      </header>

      <section className="w-full max-w-xl flex flex-col items-center">
        <input
          type="text"
          placeholder="我想卖猫咪周边..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring focus:border-blue-300"
        />
        <button
          onClick={handleGenerate}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-2xl shadow hover:bg-blue-700 transition"
        >
          {loading ? '🚧 正在生成中...' : '🚀 生成我的商店内容'}
        </button>
      </section>

      {result && result.products && Array.isArray(result.products) && (
        <section className="w-full max-w-3xl mt-12 text-center">
          <h2 className="text-xl font-semibold mb-4">✨ 商店预览</h2>
          <div className="border rounded-xl p-6 shadow-sm bg-gray-50">
            <h3 className="text-2xl font-bold">{result.storeName}</h3>
            <p className="text-gray-600 mb-4">{result.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {result.products.map((product: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="rounded mb-2 w-full h-36 object-cover"
                  />
                  <h4 className="font-semibold">{product.name}</h4>
                  <p className="text-sm text-gray-500">{product.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <ShopifyConnectButton />

      <footer className="mt-16 text-center text-gray-400 text-sm">
        <p>© 2025 ShopPilot.app · AI驱动 · 一句话开店 · hello@shoppilot.app</p>
      </footer>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>🔄 加载中...</div>}>
      <PageContent />
    </Suspense>
  );
}
