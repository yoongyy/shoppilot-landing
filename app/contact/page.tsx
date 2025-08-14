'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to send message');

      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong');
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 flex flex-col items-center p-6">
      
      {/* Header - same as home page */}
      <header className="w-full max-w-3xl text-center py-12">
        <h1 className="text-4xl font-bold mb-4">🛍️ ShopPilot</h1>
        <p className="text-lg text-gray-600">Create your Shopify store instantly!</p>
      </header>

      {/* Contact form section */}
      <section className="w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-2">Contact Us</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Name</label>
            <input
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Message</label>
            <textarea
              className="w-full border border-gray-300 rounded-xl px-4 py-3 h-36 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder="How can we help?"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-2xl shadow hover:bg-blue-700 transition disabled:opacity-60"
          >
            {status === 'loading' ? 'Sending…' : 'Send Message'}
          </button>

          {status === 'success' && (
            <div className="text-green-600 text-sm space-y-2">
    <p>✅ Thanks! Your message has been sent.</p>
            <Link
            href="/"
            className="text-blue-600 underline"
            >
            ← Back to Home
            </Link>
  </div>
          )}
          {status === 'error' && (
            <p className="text-red-600 text-sm">❌ Error: {errorMsg}</p>
          )}
        </form>
      </section>

      {/* Footer - same as home page */}
      <footer className="mt-16 text-center text-gray-400 text-sm space-y-2">
        <p>© 2025 ShopPilot</p>
      </footer>
    </main>
  );
}
