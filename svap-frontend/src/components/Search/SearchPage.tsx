import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, SlidersHorizontal, Bookmark, X } from "lucide-react";
import { supabase } from "../../services/supabase";

interface Product {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  image_urls: string[] | null;
  saved_count: number;
  created_at: string;
  city: string | null;
  status: string;
}

const CATEGORIES = [
  "All",
  "Clothing",
  "Shoes",
  "Accessories",
  "Electronics",
  "Mobiles",
  "Home & Living",
  "Books",
  "Sports",
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "a-z" | "top-rated">("newest");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Dynamic Theme State Sync
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("sz_theme");
    if (savedTheme !== null) {
      return savedTheme === "dark";
    }
    return (
      document.documentElement.getAttribute("data-theme") === "dark" ||
      document.documentElement.classList.contains("dark")
    );
  });

  useEffect(() => {
    const syncTheme = () => {
      const savedTheme = localStorage.getItem("sz_theme");
      if (savedTheme !== null) {
        setIsDark(savedTheme === "dark");
      } else {
        setIsDark(
          document.documentElement.getAttribute("data-theme") === "dark" ||
            document.documentElement.classList.contains("dark")
        );
      }
    };

    window.addEventListener("storage", syncTheme);
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => {
      window.removeEventListener("storage", syncTheme);
      observer.disconnect();
    };
  }, []);

  // Fetch Active Products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let query = supabase
          .from("products")
          .select("*")
          .eq("status", "active");

        if (selectedCategory !== "All") {
          query = query.ilike("category", `%${selectedCategory}%`);
        }

        if (searchQuery.trim()) {
          query = query.or(
            `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`
          );
        }

        if (sortBy === "newest") {
          query = query.order("created_at", { ascending: false });
        } else if (sortBy === "a-z") {
          query = query.order("title", { ascending: true });
        } else if (sortBy === "top-rated") {
          query = query.order("saved_count", { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error("Error fetching search products:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [searchQuery, selectedCategory, sortBy]);

  // Update URL search query
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div
      className={`min-h-screen pt-6 pb-20 px-4 transition-colors duration-300 ${
        isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F8F9FA] text-gray-900"
      }`}
    >
      {/* TOP BAR: BACK & SEARCH INPUT & FILTER BUTTON */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-all ${
            isDark
              ? "bg-[#1A1A1A] border border-white/10 text-white hover:bg-[#262626]"
              : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-100 shadow-xs"
          }`}
          aria-label="Go Back"
        >
          <ArrowLeft size={18} />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search
            size={18}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
              isDark ? "text-white/40" : "text-gray-400"
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, brands..."
            className={`w-full rounded-full pl-10 pr-4 py-2.5 text-sm transition-colors focus:outline-none focus:border-[#D9501E] ${
              isDark
                ? "bg-[#181818] border border-white/10 text-white placeholder-white/40"
                : "bg-white border border-gray-200 text-gray-900 placeholder-gray-400 shadow-xs"
            }`}
          />
        </form>

        <button
          onClick={() => setIsFilterOpen(true)}
          className="w-10 h-10 rounded-full bg-[#D9501E] text-white flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-md hover:bg-[#c24419]"
          aria-label="Filter Options"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* HORIZONTAL SCROLLABLE CATEGORIES */}
      <div className="categories-scroll flex items-center gap-2 overflow-x-auto my-5 pb-1">
        <style>{`
          .categories-scroll::-webkit-scrollbar {
            display: none;
          }
          .categories-scroll {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#D9501E] text-white shadow-xs"
                  : isDark
                  ? "bg-[#181818] border border-white/10 text-white/70 hover:bg-[#222]"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 shadow-2xs"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* POSTS HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
          Posts
        </h2>
        <span className={`text-xs ${isDark ? "text-white/50" : "text-gray-500"}`}>
          {products.length} items • <span className="text-[#D9501E] capitalize">Sort: {sortBy}</span>
        </span>
      </div>

      {/* PRODUCTS GRID */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-52 animate-pulse rounded-2xl ${
                isDark
                  ? "bg-[#1A1A1A] border border-white/5"
                  : "bg-gray-200 border border-gray-100"
              }`}
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className={`text-center py-16 text-sm ${isDark ? "text-white/50" : "text-gray-500"}`}>
          No active items found.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((item) => {
            const imgUrl = item.image_urls?.[0] || "/placeholder.png";
            return (
              <div
                key={item.id}
                onClick={() => navigate(`/product/${item.id}`)}
                className={`relative border rounded-2xl overflow-hidden group cursor-pointer active:scale-98 transition-all ${
                  isDark
                    ? "bg-[#141414] border-white/10"
                    : "bg-white border-gray-200 shadow-xs hover:shadow-md"
                }`}
              >
                <div
                  className={`relative aspect-4/5 w-full overflow-hidden ${
                    isDark ? "bg-[#1F1F1F]" : "bg-gray-100"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Bookmark size={13} />
                  </button>
                </div>

                <div className="p-2.5">
                  <h3
                    className={`text-xs font-semibold truncate ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`text-[11px] capitalize mt-0.5 ${
                      isDark ? "text-white/60" : "text-gray-500"
                    }`}
                  >
                    {item.condition || "Like New"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FILTER BOTTOM SHEET MODAL */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-md border-t rounded-t-3xl p-5 animate-in slide-in-from-bottom duration-200 ${
              isDark
                ? "bg-[#141414] border-white/10 text-white"
                : "bg-white border-gray-200 text-gray-900 shadow-2xl"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Sort by</h3>
              <button
                onClick={() => setIsFilterOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isDark
                    ? "bg-[#222] text-white/70 hover:bg-[#333]"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: "Newest", value: "newest" },
                { label: "A–Z", value: "a-z" },
                { label: "Top Rated", value: "top-rated" },
              ].map((option) => (
                <label
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value as any);
                    setIsFilterOpen(false);
                  }}
                  className="flex items-center justify-between py-2 cursor-pointer"
                >
                  <span
                    className={`text-sm font-medium ${
                      isDark ? "text-white/90" : "text-gray-800"
                    }`}
                  >
                    {option.label}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      sortBy === option.value
                        ? "border-[#D9501E]"
                        : isDark
                        ? "border-white/30"
                        : "border-gray-300"
                    }`}
                  >
                    {sortBy === option.value && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#D9501E]" />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}