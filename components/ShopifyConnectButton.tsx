// components/ShopifyConnectButton.tsx
'use client';

import { useState } from 'react';

const SHOPIFY_API_KEY = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;

interface Props {
  sessionId: string;
}

export default function ShopifyConnectButton({ sessionId }: Props) {
  const [shopDomain, setShopDomain] = useState('');
  const [error, setError] = useState('');

  const handleConnect = () => {
    if (!shopDomain.endsWith('.myshopify.com')) {
      setError('请输入有效的 Shopify 商店域名（例如 yourstore.myshopify.com）');
      return;
    }

    // 解析并规范化用户输入
    let shop = shopDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    if (!shop.endsWith('.myshopify.com')) {
      alert('请输入有效的 Shopify 店铺地址（如 myshop.myshopify.com）');
      return;
    }


    // https://testshoppilot.myshopify.com

    const clientId = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;
    const redirectUri = encodeURIComponent('https://shoppilot.app/api/shopify/callback');
    const scope = encodeURIComponent('write_products,write_themes,write_content');
    // const scope = 'write_products';
    const state = 'shoppilot-secure-state'; // 可换成动态值避免伪造

    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}&session_id=${sessionId}&grant_options[]=per-user`;
    // console.log(authUrl)
    window.location.href = authUrl;
  };

  return (
    <div className="w-full max-w-md mx-auto mt-12 text-center">
      <h2 className="text-xl font-semibold mb-4">🔗 连接你的 Shopify 商店</h2>
      <input
        type="text"
        placeholder="testshoppilot.myshopify.com"
        value={shopDomain}
        // defaultValue="testshoppilot.myshopify.com"
        onChange={(e) => setShopDomain(e.target.value.trim())}
        className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none"
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      <button
        onClick={handleConnect}
        className="mt-4 px-6 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition"
      >
        🚀 连接 Shopify 商店
      </button>
    </div>
  );
}
