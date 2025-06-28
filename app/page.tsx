export default function Page() {
  return (
    <main className="min-h-screen bg-white text-gray-900 flex flex-col items-center p-6">
      <header className="w-full max-w-3xl text-center py-12">
        <h1 className="text-4xl font-bold mb-4">🛍️ ShopPilot</h1>
        <p className="text-lg text-gray-600">一句话生成你的 AI 电商商店</p>
      </header>

      <section className="w-full max-w-xl flex flex-col items-center">
        <input
          type="text"
          placeholder="我想卖猫咪周边..."
          className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring focus:border-blue-300"
        />
        <button className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-2xl shadow hover:bg-blue-700 transition">
          🚀 生成我的商店
        </button>
      </section>

      <section className="w-full max-w-3xl mt-12 text-center">
        <h2 className="text-xl font-semibold mb-4">✨ 示例商店展示</h2>
        <div className="border rounded-xl p-6 shadow-sm bg-gray-50">
          <img
            src="https://via.placeholder.com/600x300?text=AI+Store+Preview"
            alt="生成示例"
            className="rounded-xl mx-auto"
          />
          <p className="mt-2 text-sm text-gray-500">你的 AI 商店将在几秒内自动生成...</p>
        </div>
      </section>

      <footer className="mt-16 text-center text-gray-400 text-sm">
        <p>© 2025 ShopPilot.app · AI驱动 · 一句话开店 · contact@shoppilot.app</p>
      </footer>
    </main>
  );
}
