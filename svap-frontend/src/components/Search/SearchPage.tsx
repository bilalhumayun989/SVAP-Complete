import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, SlidersHorizontal, Bookmark } from "lucide-react";
import { supabase } from "../../services/supabase";
import { api } from "../../services/api";

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
  estimated_value: number | null;
}

const CATEGORIES = [
  "All",
  "Clothing",
  "Shoes",
  "Accessories",
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
  const [sortBy, setSortBy] = useState<"newest" | "low-high" | "high-low">("newest");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [savedProductIds, setSavedProductIds] = useState<Set<string>>(new Set());
  const [savingProductId, setSavingProductId] = useState<string | null>(null);

  const userId = (() => {
    try { return JSON.parse(localStorage.getItem("sz_user") || "{}").id || null; }
    catch { return null; }
  })();

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setSavedProductIds(new Set());
      return;
    }

    api.getSavedProductIds(userId)
      .then((result) => {
        if (result?.error) throw new Error(result.error);
        if (!cancelled) setSavedProductIds(new Set(result?.data || []));
      })
      .catch((error) => console.error("Failed to load saved products:", error));

    return () => { cancelled = true; };
  }, [userId]);

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

  // Fetch Active Products from Supabase using estimated_value
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

        // Sorting based on DB schema
        if (sortBy === "newest") {
          query = query.order("created_at", { ascending: false });
        } else if (sortBy === "low-high") {
          query = query.order("estimated_value", { ascending: true, nullsFirst: false });
        } else if (sortBy === "high-low") {
          query = query.order("estimated_value", { ascending: false, nullsFirst: false });
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

  const handleSaveToggle = async (event: React.MouseEvent<HTMLButtonElement>, productId: string) => {
    event.stopPropagation();
    if (!userId) {
      navigate("/login");
      return;
    }
    if (savingProductId === productId) return;

    const wasSaved = savedProductIds.has(productId);
    setSavingProductId(productId);
    try {
      const result = wasSaved
        ? await api.unsaveProduct(userId, productId)
        : await api.saveProduct(userId, productId);
      if (result?.error) throw new Error(result.error);

      setSavedProductIds((current) => {
        const next = new Set(current);
        if (wasSaved) next.delete(productId);
        else next.add(productId);
        return next;
      });
    } catch (error) {
      console.error("Failed to update saved product:", error);
    } finally {
      setSavingProductId(null);
    }
  };

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
          .categories-scroll::-webkit-scrollbar { display: none; }
          .categories-scroll { -ms-overflow-style: none; scrollbar-width: none; }
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
                    type="button"
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors disabled:opacity-60"
                    onClick={(e) => handleSaveToggle(e, item.id)}
                    disabled={savingProductId === item.id}
                    aria-label={savedProductIds.has(item.id) ? "Remove from saved" : "Save product"}
                    aria-pressed={savedProductIds.has(item.id)}
                  >
                    <Bookmark size={13} fill={savedProductIds.has(item.id) ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="p-2.5">
                  <h3 className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                    {item.title}
                  </h3>
                  <p className={`text-[11px] capitalize mt-0.5 ${isDark ? "text-white/60" : "text-gray-500"}`}>
                    {item.condition || "Like New"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FILTER BOTTOM SHEET MODAL (SAME AS IMAGE) */}
      {isFilterOpen && (
        <div 
          onClick={() => setIsFilterOpen(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#181818] text-white rounded-t-[28px] pt-7 pb-10 px-6 shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            {/* Title */}
            <h3 className="text-base font-bold text-white mb-6 tracking-wide">
              Sort by
            </h3>

            {/* Options List */}
            <div className="space-y-6">
              {[
                { label: "Newest", value: "newest" },
                { label: "Low → High", value: "low-high" },
                { label: "High → Low", value: "high-low" },
              ].map((option) => {
                const isSelected = sortBy === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value as any);
                      setIsFilterOpen(false);
                    }}
                    className="w-full flex items-center gap-5 text-left group focus:outline-none"
                  >
                    {/* Custom Image-like Radio Button */}
                    <div
                      className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "border-[#E85222]"
                          : "border-white/40 group-hover:border-white/70"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#E85222]" />
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={`text-[14px] font-medium tracking-wide ${
                        isSelected ? "text-white" : "text-white/80 group-hover:text-white"
                      }`}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}