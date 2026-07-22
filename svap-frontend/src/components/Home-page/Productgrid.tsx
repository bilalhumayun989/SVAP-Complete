import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./Productcard";
import { api } from "../../services/api";

const PAGE_SIZE = 12;

const ProductGrid = () => {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
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
      <section className="pg-section">
        <div className="pg-inner">

          {/* Header */}
          <div className="pg-header">
            <h2 className="pg-title">Latest Listings</h2>
            <button className="pg-viewall" onClick={() => navigate('/all-listings')}>View All</button>
          </div>

          {/* Grid */}
          <div className="pg-grid">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="pg-loadmore-wrap">
              <button
                className="pg-loadmore-btn"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                <span className="pg-loadmore-text">Load More</span>
              
              </button>
            </div>
          )}

        </div>
      </section>

      <style>{`
        .pg-section {
          width: 100%;
          background: var(--bg);
          box-sizing: border-box;
        }

        html[data-theme='dark'] .pg-section {
          background: #0a0a0a;
        }

        .pg-inner {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          padding: 20px 16px 32px;
          box-sizing: border-box;
        }

        .pg-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          flex-shrink: 0;
        }
        .pg-title {
          color: var(--text-dark);
          font-size: clamp(1.3rem, 2vw, 1.9rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0;
        }


        .pg-viewall {
          color: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 8px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: black;
          border: 1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(12px);
        }

        .pg-viewall:hover {
          transform: translateY(-1px);
        }

        html[data-theme='dark'] .pg-viewall {
          background: #fff;
          color: #000;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        html[data-theme='dark'] .pg-viewall:hover {
          background: #f5f5f5;
        }

        .pg-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        /* ── Load More ── */
        .pg-loadmore-wrap {
          display: flex;
          justify-content: center;
          margin-top: 32px;
    
        }

        .pg-loadmore-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px 48px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s ease;
          /* glassmorphism */
          background: #000;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 4px 24px rgba(0,0,0,0.30),
                      inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .pg-loadmore-btn:hover {
          background: #000;
          border-color: rgba(255,255,255,0.22);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.40),
                      inset 0 1px 0 rgba(255,255,255,0.10);
        }
        .pg-loadmore-btn:active {
          transform: translateY(0px);
        }

        .pg-loadmore-text {
          color: #fff;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
          .pg-loadmore-text:hover {
          color: #fff;
          }


        .pg-loadmore-count {
          color: rgba(0,0,0,0.40);
          font-size: 0.75rem;
          font-weight: 400;
        }

        html[data-theme='dark'] .pg-loadmore-btn {
          background: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 24px rgba(0,0,0,0.50),
                      inset 0 1px 0 rgba(255,255,255,0.10);
        }
        html[data-theme='dark'] .pg-loadmore-btn:hover {
          background: #f5f5f5;
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0,0,0,0.60),
                      inset 0 1px 0 rgba(255,255,255,0.12);
        }

        html[data-theme='dark'] .pg-loadmore-text {
          color: #000;
        }
        html[data-theme='dark'] .pg-loadmore-count {
          color: rgba(0, 0, 0, 0.6);
        }

        /* ─── MEDIA QUERIES ─── */

        @media (min-width: 2400px) {
          .pg-inner { padding: 24px 20px 40px; }
          .pg-grid  { gap: 18px; grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1920px) and (max-width: 2399px) {
          .pg-inner { padding: 22px 18px 36px; }
          .pg-grid  { gap: 16px; grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1600px) and (max-width: 1919px) {
          .pg-inner { padding: 20px 16px 34px; }
          .pg-grid  { gap: 14px; grid-template-columns: repeat(3, 1fr); }
        }
        
        /* ──────────────────────────────────────
           TABLET/MEDIUM SCREENS (780px-1300px)
        ────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1300px) {
          .pg-inner { padding: 18px 14px 26px; }
          .pg-grid  { grid-template-columns: repeat(2, 1fr); gap: 11px; }
          .pg-title { font-size: clamp(1.2rem, 1.8vw, 1.6rem); }
          .pg-viewall { font-size: 0.8rem; padding: 7px 16px; }
        }
        
        @media (min-width: 1025px) and (max-width: 1599px) {
          .pg-grid  { grid-template-columns: repeat(3, 1fr); gap: 12px; }
        }
        @media (max-width: 1024px) {
          .pg-inner { padding: 20px 14px 28px; }
          .pg-grid  { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }
        @media (max-width: 600px) {
          .pg-inner { padding: 16px 12px 20px; }
          .pg-grid  { grid-template-columns: 1fr; gap: 10px; }
          .pg-loadmore-btn { padding: 11px 28px; }
        }
      `}</style>
    </>
  );
};

export default ProductGrid;
