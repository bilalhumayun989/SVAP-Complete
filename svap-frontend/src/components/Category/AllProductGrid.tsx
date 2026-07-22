import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../Home-page/Productcard";
import { api } from "../../services/api";
import { FiChevronDown, FiFilter } from "react-icons/fi";

const PAGE_SIZE = 20;

const AllProductGrid = () => {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortLabel, setSortLabel] = useState("Newest First");
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.getProducts();
        if (response.error) throw new Error(response.error);
        
        if (response.data) {
          const mappedProducts = response.data.map((p: any) => ({
            id: p.id,
            user: {
              name: p.profiles?.username || p.profiles?.full_name || "Unknown",
              email: p.profiles?.email || "",
              avatar: p.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${p.profiles?.username || 'U'}&background=random`,
            },
            image: p.image_urls?.[0] || "https://placehold.co/600x400?text=No+Image",
            title: p.title,
            description: p.description || "",
            location: p.profiles?.city || "Unknown",
            views: p.saved_count || 0,
            condition: p.condition || "",
            swapFor: p.swap_for || "",
            swapForImage: p.image_urls?.[1] || "",
          }));
          setProducts(mappedProducts);
        }
      } catch (err: any) {
        console.error("Error fetching products:", err.message);
      }
    };
    fetchProducts();
  }, []);

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  return (
    <>
      <div className="apg-root">
        <div className="apg-inner">

          {/* Header */}
          <div className="apg-header">
            <div>
              <h1 className="apg-title">All Listings</h1>
              <p className="apg-sub">{products.length} items available</p>
            </div>

            {/* Actions */}
            <div className="apg-actions">
              {/* Filter */}
              <div className="relative">
                <button className="apg-btn" onClick={() => setFilterOpen(!filterOpen)}>
                  <FiFilter size={15} />
                  <span>Filter</span>
                </button>
                {filterOpen && (
                  <div className="apg-dropdown" style={{ width: 220 }}>
                    <p className="apg-drop-title">Filter By</p>
                    <div className="apg-drop-group">
                      <label className="apg-drop-label">Condition</label>
                      <select className="apg-select">
                        <option value="all">Any Condition</option>
                        <option value="new">Brand New</option>
                        <option value="likenew">Like New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                      </select>
                    </div>
                    <div className="apg-drop-group">
                      <label className="apg-drop-label">City</label>
                      <select className="apg-select">
                        <option value="all">All Pakistan</option>
                        <option value="karachi">Karachi</option>
                        <option value="lahore">Lahore</option>
                        <option value="islamabad">Islamabad</option>
                        <option value="rawalpindi">Rawalpindi</option>
                        <option value="faisalabad">Faisalabad</option>
                        <option value="multan">Multan</option>
                        <option value="peshawar">Peshawar</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort */}
              <div className="relative">
                <button className="apg-btn" onClick={() => setSortOpen(!sortOpen)}>
                  <span>Sort: {sortLabel}</span>
                  <FiChevronDown size={15} className={sortOpen ? "rotate-180" : ""} style={{ transition: "transform 0.2s" }} />
                </button>
                {sortOpen && (
                  <div className="apg-dropdown" style={{ width: 190 }}>
                    {["Newest First", "Most Viewed", "Price: Low to High", "Price: High to Low"].map((s) => (
                      <button
                        key={s}
                        className="apg-drop-item"
                        onClick={() => { setSortLabel(s); setSortOpen(false); }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Back */}
              <button className="apg-btn apg-back" onClick={() => navigate(-1)}>
                ← Back
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="apg-grid">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="apg-loadmore-wrap">
              <button
                className="apg-loadmore-btn"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Load More
                <span className="apg-loadmore-count">
                  {visibleCount} / {products.length}
                </span>
              </button>
            </div>
          )}

          {!hasMore && (
            <p className="apg-end-msg">You've seen all {products.length} listings</p>
          )}

        </div>
      </div>

      <style>{`
        .apg-root {
          min-height: 100vh;
          background: var(--bg);
          padding: 20px 20px 60px;
          box-sizing: border-box;
          border-top: 8px solid var(--bg-section);
          color: var(--text-dark);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .apg-inner {
          max-width: 2400px;
          margin: 0 auto;
        }

        /* ── Header ── */
        .apg-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 28px;
        }
        .apg-title {
          color: var(--text-dark);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 4px;
          line-height: 1.1;
        }
        .apg-sub {
          color: var(--text-muted);
          font-size: 0.95rem;
          margin: 0;
        }

        /* Actions row */
        .apg-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .apg-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          background: var(--bg-alt);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          color: var(--text-dark);
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .apg-btn:hover {
          background: var(--bg-section);
          border-color: var(--border);
          transform: translateY(-1px);
        }
        .apg-back {
          color: var(--text-dark);
        }

        /* Dropdowns */
        .apg-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 12px;
          z-index: 30;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }
        html[data-theme='dark'] .apg-dropdown {
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .apg-drop-title {
          color: var(--text-dark);
          font-size: 0.8rem;
          font-weight: 700;
          margin: 0 0 10px 4px;
        }
        .apg-drop-group {
          margin-bottom: 10px;
        }
        .apg-drop-label {
          display: block;
          color: var(--text-muted);
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 5px;
        }
        .apg-select {
          width: 100%;
          background: var(--bg-alt);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 8px 12px;
          color: var(--text-dark);
          font-size: 0.83rem;
          outline: none;
          appearance: none;
          cursor: pointer;
        }
        .apg-select:focus {
          border-color: #E45821;
          box-shadow: 0 0 0 3px rgba(228, 88, 33, 0.1);
        }
        .apg-drop-item {
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
        .apg-drop-item:hover {
          background: var(--bg-alt);
        }

        /* ── Grid ── */
        .apg-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        /* ── Load More ── */
        .apg-loadmore-wrap {
          display: flex;
          justify-content: center;
          margin-top: 36px;
        }
        .apg-loadmore-btn {
          display: flex;
          align-items: center;
          padding: 14px 52px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s ease;
          background: #000;
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 4px 24px rgba(0,0,0,0.15);
          color: #fff;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .apg-loadmore-btn:hover {
          transform: translateY(-2px);
        }
       .apg-loadmore-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 2px;
}

        html[data-theme='dark'] .apg-loadmore-btn {
          background: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 24px rgba(0,0,0,0.5);
          color: #000;
        }
        html[data-theme='dark'] .apg-loadmore-btn:hover {
          background: #f5f5f5;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }
        html[data-theme='dark'] .apg-loadmore-count {
          color: rgba(0, 0, 0, 0.6);
        }

        .apg-end-msg {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-top: 36px;
        }

        /* ── Responsive ── */
        @media (min-width: 2400px) {
          .apg-grid { grid-template-columns: repeat(3, 1fr); gap: 18px; }
        }
        
        /* ──────────────────────────────────────
           TABLET/MEDIUM SCREENS (780px-1300px)
        ────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1300px) {
          .apg-root { padding: 16px 16px 50px; }
          .apg-grid { grid-template-columns: repeat(2, 1fr); gap: 11px; }
          .apg-title { font-size: clamp(1.6rem, 3vw, 2.2rem); }
          .apg-header { gap: 14px; margin-bottom: 22px; }
          .apg-actions { gap: 8px; }
          .apg-btn { padding: 8px 14px; font-size: 0.8rem; }
          .apg-btn span { font-size: 0.75rem; }
          .apg-dropdown { width: 180px; padding: 10px; }
        }
        
        @media (max-width: 1280px) {
          .apg-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 1024px) {
          .apg-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }
        @media (max-width: 600px) {
          .apg-root { padding: 14px 14px 40px; }
          .apg-grid { grid-template-columns: 1fr; gap: 10px; }
          .apg-header { flex-direction: column; align-items: flex-start; }
          .apg-actions { width: 100%; }
          .apg-title { font-size: clamp(1.5rem, 5vw, 2rem); }
        }
      `}</style>
    </>
  );
};

export default AllProductGrid;
