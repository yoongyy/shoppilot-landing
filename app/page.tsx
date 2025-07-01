'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ShopifyConnectButton from '@/components/ShopifyConnectButton';

export default function Page() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [shopStatus, setShopStatus] = useState<'idle' | 'deploying' | 'done' | 'error'>('idle');
  const [shopMessage, setShopMessage] = useState('');
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop');

  // 自动部署到 Shopify 商店（仅首次进入有 shop 参数时）
  useEffect(() => {
    if (shop && shopStatus === 'idle') {
      setShopStatus('deploying');
      setShopMessage(`正在为 ${shop} 自动部署商店内容...`);

      fetch('/api/shopify/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setShopStatus('done');
            setShopMessage(`✅ 已成功部署内容到商店：${shop}`);
          } else {
            throw new Error(data.error || '未知错误');
          }
        })
        .catch((err) => {
          console.error(err);
          setShopStatus('error');
          setShopMessage('❌ 自动部署失败，请稍后重试。');
        });
    }
  }, [shop]);

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

      {/* 自动部署提示 */}
      {shop && (
        <div className="w-full max-w-xl text-center mb-6">
          <p className="text-sm text-blue-600">{shopMessage}</p>
        </div>
      )}

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

      {/* 连接 Shopify 商店按钮 */}
      <ShopifyConnectButton />

      <footer className="mt-16 text-center text-gray-400 text-sm">
        <p>© 2025 ShopPilot.app · AI驱动 · 一句话开店 · hello@shoppilot.app</p>
      </footer>
    </main>
  );
}
