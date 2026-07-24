import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";
import { FiChevronDown, FiFilter } from "react-icons/fi";
import ProductCard from "../Home-page/Productcard";
import type { Product } from "../Home-page/data/product";

const CategoryPage = () => {
  const { name } = useParams<{ name: string }>();
  const categoryName =
    name && name !== "all"
      ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
      : "Electronics";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const userId = (() => { try { return JSON.parse(localStorage.getItem("sz_user") || "{}").id; } catch { return null; } })();

        const [response, savedRes] = await Promise.all([
          api.getProductsByCategory(categoryName),
          userId ? api.getSavedProductIds(userId) : Promise.resolve({ data: [] }),
        ]);

        if (response.error) throw new Error(response.error);
        if (response.data) {
          const mapped: Product[] = response.data.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description || "",
            image: p.image_urls?.[0] || "https://placehold.co/600x400?text=No+Image",
            price: p.price ? `Rs ${Number(p.price).toLocaleString()}` : "Price on request",
            location: p.profiles?.city || "Unknown",
            views: p.saved_count || 0,
            condition: p.condition || "",
            category: p.category || categoryName,
            swapFor: p.swap_for || "",
            swapForImage: p.image_urls?.[1] || "",
            user: {
              name: p.profiles?.username || p.profiles?.full_name || "Unknown",
              email: p.profiles?.email || "",
              avatar: p.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${p.profiles?.username || "U"}&background=random`,
            },
          }));
          setProducts(mapped);
        } else {
          setProducts([]);
        }
        if (savedRes.data) setSavedIds(new Set(savedRes.data));
      } catch (err) {
        console.error("Failed to fetch category products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    window.scrollTo(0, 0);
  }, [categoryName]);

  return (
    <div className="catpage">
      <div className="catpage-bg" />
      <div className="catpage-inner">
        {/* Header & Filters */}
        <div className="catpage-header">
          <div>
            <h1 className="catpage-title">{categoryName}</h1>
            <p className="catpage-subtitle">
              {loading ? "Loading..." : `${products.length} item${products.length !== 1 ? "s" : ""} found`}
            </p>
          </div>

          <div className="catpage-actions">
            <div className="relative">
              <button
                className="catpage-action-btn"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <FiFilter size={16} />
                <span>Filter</span>
              </button>
              {filterOpen && (
                <div className="absolute top-12 right-0 w-64 backdrop-blur-2xl border rounded-xl p-4 shadow-2xl z-20" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
                  <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-dark)' }}>Filter By</h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs uppercase mb-1 block" style={{ color: 'var(--text-muted)' }}>
                        Condition
                      </label>

                      <select
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none appearance-none transition-all duration-300"
                        style={{ background: 'var(--bg-alt)', borderColor: 'var(--border-light)', border: '1px solid', color: 'var(--text-dark)' }}
                      >
                        <option className="bg-white text-black" value="all">
                          Any Condition
                        </option>
                        <option className="bg-white text-black" value="new">
                          Brand New
                        </option>
                        <option className="bg-white text-black" value="used">
                          Used / Like New
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs uppercase mb-1 block" style={{ color: 'var(--text-muted)' }}>
                        City
                      </label>

                      <select
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none appearance-none transition-all duration-300"
                        style={{ background: 'var(--bg-alt)', borderColor: 'var(--border-light)', border: '1px solid', color: 'var(--text-dark)' }}
                      >
                        <option className="bg-white text-black" value="all">
                          All Pakistan
                        </option>
                        <option className="bg-white text-black" value="karachi">
                          Karachi
                        </option>
                        <option className="bg-white text-black" value="lahore">
                          Lahore
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                className="catpage-action-btn"
                onClick={() => setSortOpen(!sortOpen)}
              >
                <span>Sort</span>
                <FiChevronDown size={16} />
              </button>
              {sortOpen && (
                <div className="absolute top-12 right-0 w-52 backdrop-blur-2xl border rounded-2xl p-2 shadow-lg z-20" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
                  {["Recommended", "Newest First", "Price: Low to High", "Price: High to Low"].map((s) => (
                    <button
                      key={s}
                      className="catpage-dropdown-item"
                      onClick={() => setSortOpen(false)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="catpage-state">
            <div className="catpage-spinner" />
            <p>Loading {categoryName} listings…</p>
          </div>
        ) : products.length > 0 ? (
          <div className="catpage-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} initialSaved={savedIds.has(product.id)} />
            ))}
          </div>
        ) : (
          <div className="catpage-state">
            <div className="catpage-nodata-icon">📭</div>
            <h3 className="catpage-nodata-title">No listings in {categoryName}</h3>
            <p className="catpage-nodata-sub">
              Be the first to list something in this category!
            </p>
          </div>
        )}
      </div>

      <style>{`
        .catpage {
          min-height: 100vh;
          padding: 20px 20px 60px;
          position: relative;
          background: var(--bg);
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
          color: var(--text-dark);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .catpage-bg {
          position: fixed;
          inset: 0;
          background: var(--bg);
          z-index: 0;
        }

        .catpage-inner {
          position: relative;
          z-index: 1;
          max-width: 2400px;
          margin: 0 auto;
        }

        .catpage-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .catpage-title {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          color: var(--text-dark);
          margin: 0 0 4px;
          line-height: 1.1;
        }

        .catpage-subtitle {
          font-size: 0.95rem;
          color: var(--text-muted);
          margin: 0;
        }

        .catpage-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .catpage-action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: var(--bg-alt);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          color: var(--text-dark);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .catpage-action-btn:hover {
          border-color: #E45821;
          background: var(--bg-section);
        }

        .catpage-dropdown-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          color: var(--text-dark);
          font-size: 0.84rem;
          border-radius: 8px;
          background: none;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .catpage-dropdown-item:hover {
          background: var(--bg-alt);
        }

        .catpage-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (min-width: 2400px) {
          .catpage-grid { grid-template-columns: repeat(5, 1fr); gap: 20px; }
          .catpage-inner { padding: 0 20px; }
        }
        @media (max-width: 1280px) {
          .catpage-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 1024px) {
          .catpage-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .catpage-grid { grid-template-columns: 1fr; }
          .catpage-header { flex-direction: column; align-items: flex-start; }
          .catpage-actions { width: 100%; justify-content: space-between; }
        }

        /* ── Loading & Empty State ── */
        .catpage-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          color: var(--text-muted);
          text-align: center;
          gap: 12px;
        }
        .catpage-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-light);
          border-top-color: #E45821;
          border-radius: 50%;
          animation: catpage-spin 0.7s linear infinite;
        }
        @keyframes catpage-spin {
          to { transform: rotate(360deg); }
        }
        .catpage-nodata-icon {
          font-size: 3rem;
          line-height: 1;
        }
        .catpage-nodata-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-dark);
          margin: 0;
        }
        .catpage-nodata-sub {
          font-size: 0.95rem;
          color: var(--text-muted);
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default CategoryPage;
