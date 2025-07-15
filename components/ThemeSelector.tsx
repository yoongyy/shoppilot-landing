"use client";

import { useEffect, useState } from "react";

interface Theme {
  _id: string;
  name: string;
  price: number | string;
  previewImage: string;
  category?: string;
  previewUrl?: string;
}

const categories = ["All", "Free", "Paid", "Fashion", "Electronics", "Minimal", "Premium"];
const PAGE_SIZE = 6;

export default function ThemeSelector({
  onThemeSelect,
  selectedTheme,
}: {
  onThemeSelect: (theme: Theme) => void;
  selectedTheme: Theme | null;
}) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [filteredThemes, setFilteredThemes] = useState<Theme[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetch("/api/theme")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Normalize price to number
          const normalized = data.map((t: Theme) => ({
            ...t,
            price: typeof t.price === "string" ? parseFloat(t.price) : t.price,
            category: t.category?.toLowerCase() || "uncategorized",
          }));
          setThemes(normalized);
          setFilteredThemes(normalized);
        }
      });
  }, []);

  useEffect(() => {
    let filtered = themes;
    
    const isFree = activeCategory.toLowerCase() === "free";
    const isPaid = activeCategory.toLowerCase() === "paid";
    const isSpecificCategory = !["all", "free", "paid"].includes(activeCategory.toLowerCase());
  
    filtered = themes.filter((t) => {
      const matchesFree = isFree && Number(t.price) === 0;
      const matchesPaid = isPaid && Number(t.price) > 0;
      const matchesCategory =
        isSpecificCategory && t.category === activeCategory.toLowerCase();
      const showAll = activeCategory.toLowerCase() === "all";
  
      return showAll || matchesFree || matchesPaid || matchesCategory;
    });
  
    setFilteredThemes(filtered);
    setVisibleCount(PAGE_SIZE); // reset pagination
  }, [activeCategory, themes]);
  

  const visibleThemes = filteredThemes.slice(0, visibleCount);

  return (
    <section className="w-full max-w-5xl mt-8">
      <h2 className="text-xl font-semibold mb-4">🎨 Select A Theme</h2>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-3 py-1 rounded-full border text-sm transition ${
              activeCategory.toLowerCase() === cat.toLowerCase()
                ? "bg-blue-600 text-white"
                : "bg-white border-gray-300 hover:bg-gray-100"
            }`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {visibleThemes.map((theme) => {
          const isSelected = selectedTheme?._id === theme._id;
          return (
            <div
              key={theme._id}
              onClick={() => onThemeSelect(theme)}
              className={`border rounded-xl p-4 cursor-pointer transition shadow-sm relative group hover:shadow-md ${
                isSelected
                  ? "border-blue-600 ring-2 ring-blue-400"
                  : "border-gray-300 hover:border-blue-300"
              }`}
            >
              <img
                src={theme.previewImage}
                alt={theme.name}
                className="rounded mb-2 w-full h-36 object-cover"
              />
              <h4 className="font-semibold text-sm">{theme.name}</h4>
              <p
                className={`text-sm mt-1 ${
                  Number(theme.price) > 0 ? "text-gray-700" : "text-green-600"
                }`}
              >
                {Number(theme.price) > 0 ? `$${theme.price}` : "Free"}
              </p>
              {theme.previewUrl && (
                <a
                  href={theme.previewUrl}
                  target="_blank"
                  className="text-xs text-blue-500 mt-2 block underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  🔍 Preview Theme
                </a>
              )}
              {isSelected && (
                <div className="text-xs text-blue-500 mt-1 font-semibold">
                  ✅ Selected
                </div>
              )}
            </div>
          );
        })}
      </div>

      {visibleCount < filteredThemes.length && (
        <div className="text-center mt-6">
          <button
            onClick={() => setVisibleCount(visibleCount + PAGE_SIZE)}
            className="px-6 py-2 bg-gray-100 text-sm rounded-xl border hover:bg-gray-200"
          >
            Load More
          </button>
        </div>
      )}
    </section>
  );
}
