'use client';

import { useState } from 'react';

const SHOPIFY_API_KEY = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;

interface Props {
  sessionId: string;
}

export default function ShopifyConnectButton({ sessionId }: Props) {
  const [shopDomain, setShopDomain] = useState('testshoppilot.myshopify.com');
  const [error, setError] = useState('');

  const handleConnect = () => {
    if (!shopDomain.endsWith('.myshopify.com')) {
      setError('Please enter a valid Shopify store domain (e.g., yourstore.myshopify.com)');
      return;
    }

    // Normalize user input
    let shop = shopDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    if (!shop.endsWith('.myshopify.com')) {
      alert('Please enter a valid Shopify store domain (e.g., yourstore.myshopify.com)');
      return;
    }

    const clientId = SHOPIFY_API_KEY;
    const redirectUri = encodeURIComponent('https://shoppilot.app/api/shopify/callback');
    const scope = encodeURIComponent('write_products,write_themes,write_content');
    const state = `shoppilot-secure-state-${sessionId}`;

    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}&session_id=${sessionId}&grant_options[]=per-user`;

    window.location.href = authUrl;
  };

  return (
    <div className="w-full max-w-md mx-auto mt-12 text-center">
      <h2 className="text-xl font-semibold mb-4">🔗 Connect Your Shopify Store</h2>
      <input
        type="text"
        placeholder="yourstore.myshopify.com"
        value={shopDomain}
        onChange={(e) => setShopDomain(e.target.value.trim())}
        className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none"
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      <button
        onClick={handleConnect}
        className="mt-4 px-6 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition"
      >
        🚀 Connect to Shopify Store
      </button>
    </div>
  );
}
