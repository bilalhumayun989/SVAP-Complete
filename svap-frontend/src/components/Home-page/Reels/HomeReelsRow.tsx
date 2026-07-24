import { useEffect, useRef, useState } from "react";
import { FiPlay, FiHeart, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";

interface HomeReel {
  id: string;
  user: string;
  title: string;
  product: string;
  thumbnail: string;
}

interface ProductRow {
  id: string;
  title?: string | null;
  image_urls?: string[] | null;
  video_url?: string | null;
  created_at?: string | null;
  reel_uploaded_at?: string | null;
  profiles?: {
    name?: string | null;
    username?: string | null;
    full_name?: string | null;
  } | null;
}

const HomeReelsRow = () => {
  const navigate = useNavigate();
  const rowRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [reels, setReels] = useState<HomeReel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const loadReels = async () => {
      try {
        const response = await api.getProducts();
        if (ignore) return;
        if (response.error) { setReels([]); return; }
        setReels(
          ((response.data || []) as ProductRow[])
            .filter((product) => Boolean(product.video_url))
            .sort((a, b) => {
              const aTime = new Date(a.reel_uploaded_at || a.created_at || 0).getTime();
              const bTime = new Date(b.reel_uploaded_at || b.created_at || 0).getTime();
              return bTime - aTime;
            })
            .slice(0, 8)
            .map((product) => ({
              id: product.id,
              user: product.profiles?.username || product.profiles?.name || product.profiles?.full_name || "svap_user",
              title: product.title || "Product reel",
              product: product.title || "Product",
              thumbnail: product.image_urls?.[0] || "https://placehold.co/360x560?text=SVAP",
            }))
        );
      } catch (error) {
        console.error("Failed to load home reels:", error);
        if (!ignore) setReels([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadReels();
    return () => { ignore = true; };
  }, []);

  const scrollNext = () => {
    rowRef.current?.scrollBy({
      left: 260,
      behavior: "smooth",
    });
  };

  const scrollPrev = () => {
    rowRef.current?.scrollBy({
      left: -260,
      behavior: "smooth",
    });
  };

  if (!loading && reels.length === 0) return null;

  return (
    <>
      <div className="hreels-section">
        <div className="hreels-header">
          <h2 className="hreels-title">Reels</h2>
          <button className="hreels-viewall" onClick={() => navigate("/reels")}>See All</button>
        </div>
        <div style={{ overflow: "visible" }}>
          <div
            className="hreels-wrap"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <div className="hreels-row" ref={rowRef}>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="hreel-card">
                      <div className="hreel-thumb-wrap hreel-skeleton-wrap">
                        <div className="hreel-skeleton" />
                      </div>
                      <div className="hreel-skeleton-info">
                        <div className="hreel-skeleton hreel-skeleton-line hreel-skeleton-line--xs" />
                        <div className="hreel-skeleton hreel-skeleton-line" />
                      </div>
                    </div>
                  ))
                : reels.map((r) => (
                    <div
                      key={r.id}
                      className="hreel-card"
                      onClick={() => navigate(`/reels?reel=${encodeURIComponent(r.id)}`)}
                    >
                      <div className="hreel-thumb-wrap">
                        <img src={r.thumbnail} alt={r.title} className="hreel-thumb" />
                        <div className="hreel-overlay" />
                        <div className="hreel-play">
                          <FiPlay size={18} fill="#fff" color="#fff" />
                        </div>
                        <span className="hreel-user-overlay">@{r.user}</span>
                        <div className="hreel-likes">
                          <FiHeart size={11} fill="#E45821" color="#E45821" />
                          <span>0</span>
                        </div>
                      </div>
                      <div className="hreel-info">
                        <span className="hreel-user">@{r.user}</span>
                        <span className="hreel-name">{r.product}</span>
                      </div>
                    </div>
                  ))
              }
            </div>
            <button
              className={`hreels-arrow hreels-arrow-prev ${hovered ? "hreels-arrow-show" : ""}`}
              onClick={scrollPrev}
              aria-label="Previous"
            >
              <FiChevronLeft />
            </button>
            <button
              className={`hreels-arrow hreels-arrow-next ${hovered ? "hreels-arrow-show" : ""}`}
              onClick={scrollNext}
              aria-label="Next"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .hreels-section {
          background: var(--bg);
          padding: 16px 0px 12px 0px;
        }

        .hreels-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px 10px;
        }

        .hreels-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--text-dark);
          margin: 0;
          letter-spacing: -0.01em;
        }

        .hreels-viewall {
          background: none;
          border: none;
          color: #E45821;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          padding: 0;
        }

        .hreels-wrap {
          position: relative;
          padding: 0 0 0 16px;
        }

        .hreels-row {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          overflow-y: visible;
          padding: 16px 0px 12px 0px;
          scrollbar-width: none;
          align-items: flex-start;
        }
        .hreels-row::-webkit-scrollbar { display: none; }

        .hreels-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(20, 20, 20, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          font-size: 1.25rem;
          cursor: pointer;
          opacity: 0;
          pointer-events: none;
          transition: 0.25s;
        }

        .hreels-arrow-prev {
          left: 20px;
        }

        .hreels-arrow-next {
          right: 20px;
        }

        .hreels-arrow-show {
          opacity: 1;
          pointer-events: auto;
        }

        .hreels-arrow:hover {
          transform: translateY(-50%) scale(1.08);
          background: rgba(255, 255, 255, 0.15);
        }

        .hreel-card {
          flex-shrink: 0;
          width: 180px;
          cursor: pointer;
          transition: transform 0.18s;
          transform-origin: bottom center;
        }
        .hreel-card:hover { transform: scale(1.02); }

        .hreel-thumb-wrap {
          position: relative;
          width: 180px;
          height: 280px;
          border-radius: 12px;
          overflow: hidden;
          background: var(--bg-alt);
        }

        .hreel-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hreel-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%);
        }

        .hreel-play {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(6px);
          border: 1.5px solid rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hreel-likes {
          position: absolute;
          bottom: 10px;
          left: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          font-family: 'Poppins', sans-serif;
        }

        .hreel-user-overlay {
          display: none;
          position: absolute;
          bottom: 30px;
          left: 10px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #ffffff;
          font-family: 'Poppins', sans-serif;
          z-index: 2;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        }

        .hreel-info {
          margin-top: 7px;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .hreel-user {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
        }

        .hreel-name {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-dark);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: 'Poppins', sans-serif;
        }

        @media (max-width: 767px) {
          .hreels-section { padding: 14px 0 10px; }
          .hreels-header { padding: 0 16px 10px; }
          .hreels-title { font-size: 1.15rem; font-weight: 800; }
          .hreels-viewall { font-size: 0.85rem; font-weight: 700; }
          .hreels-wrap { padding: 0 0 0 16px; }
          .hreels-row { gap: 12px; padding: 8px 16px 8px 0; }
          .hreel-card { width: 160px; }
          .hreel-thumb-wrap { width: 160px; height: 240px; border-radius: 16px; }
          .hreel-overlay { background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.10) 50%, transparent 100%); }
          .hreel-info { display: none; }
          .hreel-user-overlay { display: block; }
          .hreel-likes { bottom: 10px; left: 10px; font-size: 0.78rem; }
          .hreel-play { width: 42px; height: 42px; }
        }

        /* ── Skeleton ── */
        @keyframes hreel-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .hreel-skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 400px 100%;
          animation: hreel-shimmer 1.4s infinite linear;
          border-radius: 12px;
        }
        html[data-theme='dark'] .hreel-skeleton {
          background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
          background-size: 400px 100%;
        }
        .hreel-skeleton-wrap { background: transparent !important; }
        .hreel-skeleton-wrap .hreel-skeleton {
          width: 100%;
          height: 100%;
          border-radius: 12px;
        }
        .hreel-skeleton-info {
          margin-top: 7px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .hreel-skeleton-line { height: 11px; width: 100%; }
        .hreel-skeleton-line--xs { height: 9px; width: 60%; }
      `}</style>
    </>
  );
};

export default HomeReelsRow;
