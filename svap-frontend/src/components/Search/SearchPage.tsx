import { useState, useEffect } from "react";
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

  // Fetch Active Products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        // SIRF ACTIVE STATUS WALI PRODUCTS FETCH HONGI
        let query = supabase
          .from("products")
          .select("*")
          .eq("status", "active");

        // Category filter
        if (selectedCategory !== "All") {
          query = query.ilike("category", `%${selectedCategory}%`);
        }

        // Search Query filter
        if (searchQuery.trim()) {
          query = query.or(
            `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`
          );
        }

        // Sorting
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
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-6 pb-20 px-4">
      {/* TOP BAR: BACK & SEARCH INPUT & FILTER BUTTON */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center shrink-0 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, brands..."
            className="w-full bg-[#181818] border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#D9501E] transition-colors"
          />
        </form>

        <button
          onClick={() => setIsFilterOpen(true)}
          className="w-10 h-10 rounded-full bg-[#D9501E] text-white flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-lg"
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
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${isActive
                  ? "bg-[#D9501E] text-white"
                  : "bg-[#181818] border border-white/10 text-white/70 hover:bg-[#222]"
                }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* POSTS HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white">Posts</h2>
        <span className="text-xs text-white/50">
          {products.length} items • <span className="text-[#D9501E] capitalize">Sort: {sortBy}</span>
        </span>
      </div>

      {/* PRODUCTS GRID */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 bg-[#1A1A1A] animate-pulse rounded-2xl border border-white/5" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-white/50 text-sm">
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
                className="relative bg-[#141414] border border-white/10 rounded-2xl overflow-hidden group cursor-pointer active:scale-98 transition-all"
              >
                <div className="relative aspect-4/5 w-full bg-[#1F1F1F] overflow-hidden">
                  <img
                    src={imgUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80">
                    <Bookmark size={13} />
                  </button>
                </div>

                <div className="p-2.5">
                  <h3 className="text-xs font-semibold text-white truncate">{item.title}</h3>
                  <p className="text-[11px] text-white/60 capitalize mt-0.5">{item.condition || "Like New"}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FILTER BOTTOM SHEET MODAL */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#141414] border-t border-white/10 rounded-t-3xl p-5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Sort by</h3>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-8 h-8 rounded-full bg-[#222] text-white/70 flex items-center justify-center"
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
                  <span className="text-sm font-medium text-white/90">{option.label}</span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${sortBy === option.value ? "border-[#D9501E]" : "border-white/30"
                      }`}
                  >
                    {sortBy === option.value && <div className="w-2.5 h-2.5 rounded-full bg-[#D9501E]" />}
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