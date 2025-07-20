'use client';

import { useState, useEffect, Suspense } from 'react';
import ThemeSelector from '@/components/ThemeSelector';
import { useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

function PageContent() {
  const searchParams = useSearchParams();
  const shop = searchParams?.get('shop') || '';
  const sessionId = searchParams?.get('session_id') || '';

  const [prompt, setPrompt] = useState('');
  const [themes, setThemes] = useState<any[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<any>(null);

  useEffect(() => {
    fetch('/api/theme')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setThemes(data);
          setSelectedTheme(data[0]);
        } else {
          console.error("Themes API did not return an array", data);
          setThemes([]);
        }
      });
  }, []);

  useEffect(() => {
    if (themes.length > 0 && !selectedTheme) {
      setSelectedTheme(themes[0]);
    }
  }, [themes, selectedTheme]);

  const handleConnect = () => {
    if (!selectedTheme) return alert('Please select a theme.');

    const clientId = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;
    const redirectUri = encodeURIComponent('https://shoppilot.app/api/shopify/callback');
    const scope = encodeURIComponent('write_products,write_themes,write_content');
    let realSessionId = sessionId || uuidv4(); // generate if not present
    const stateObj = {
      sessionId: realSessionId,
      themeId: selectedTheme._id,
    };
    const state = encodeURIComponent(JSON.stringify(stateObj));

    const shopName = prompt.trim().toLowerCase();

    if (!shopName || shopName.includes('.') || shopName.includes(' ')) {
      alert('Please enter a valid store name (e.g., shoppilot)');
      return;
    }

    const shop = `${shopName}.myshopify.com`;

    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}&grant_options[]=per-user`;
    window.location.href = authUrl;
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 flex flex-col items-center p-6">
      <header className="w-full max-w-3xl text-center py-12">
        <h1 className="text-4xl font-bold mb-4">🛍️ ShopPilot</h1>
        <p className="text-lg text-gray-600">Create your Shopify store instantly!</p>
      </header>

      <section className="w-full max-w-xl flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2">🎨 Select A Theme</h3>
        <ThemeSelector selectedTheme={selectedTheme} onThemeSelect={setSelectedTheme} />
        </section>

        <section className="w-full max-w-xl mt-10 text-center">
        <div className="w-full">
          <div className="flex rounded-xl overflow-hidden border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-blue-400">
            <span className="px-3 py-3 bg-gray-100 text-gray-500 text-sm select-none">
              https://
            </span>
            <input
              type="text"
              placeholder="your-store-name"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 px-4 py-3 focus:outline-none"
            />
            <span className="px-3 py-3 bg-gray-100 text-gray-500 text-sm select-none">
              .myshopify.com
            </span>
          </div>
        </div>


        <button
          onClick={handleConnect}
          className="mt-6 px-6 py-3 bg-green-600 text-white rounded-2xl shadow hover:bg-green-700 transition"
        >
          🚀 Connect Shopify
        </button>
      </section>

      <footer className="mt-16 text-center text-gray-400 text-sm">
        <p>© 2025 ShopPilot</p>
      </footer>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>🔄 Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
