import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiTrendingUp } from "react-icons/fi";
import { products } from "../Home-page/data/product";
import { categories } from "../Home-page/data/data";

// ─── Custom Search Icon with Colors ───────────────────────────────────────────
const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" stroke="#313C5C" fill="none" strokeWidth="2.5" />
    <path d="M21 21l-4.35-4.35" stroke="#E45821" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const TRENDING = ["iPhone 15 Pro", "PS5", "MacBook Air", "Nike Air Max", "Canon Camera", "Gaming Chair"];
const RECENT_KEY = "sz_recent_searches";

const getRecent = (): string[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
};
const saveRecent = (q: string) => {
  const prev = getRecent().filter((r) => r !== q).slice(0, 7);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev]));
};

const SearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>(getRecent);

  const filtered = query.trim().length > 1
    ? products.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20)
    : [];

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    saveRecent(q.trim());
    setRecent(getRecent());
    navigate(`/all-listings?q=${encodeURIComponent(q.trim())}`);
  };

  const clearRecent = () => {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
  };

  return (
    <div className="sp-page">
      {/* Search bar */}
      <div className="sp-bar-wrap">
        <div className="sp-bar">
          <SearchIcon />
          <input
            autoFocus
            className="sp-input"
            placeholder="Search products, categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
          />
          {query && (
            <button className="sp-clear" onClick={() => setQuery("")} aria-label="Clear">
              <FiX size={16} />
            </button>
          )}
        </div>
        {query && (
          <button className="sp-search-btn" onClick={() => handleSearch(query)}>
            Search
          </button>
        )}
      </div>

      {/* Live results */}
      {filtered.length > 0 && (
        <div className="sp-section">
          <h3 className="sp-section-title">Results</h3>
          <div className="sp-results-list">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="sp-result-item"
                onClick={() => navigate(`/product/${p.id}`)}
              >
                <img src={p.image} alt={p.title} className="sp-result-img" />
                <div className="sp-result-info">
                  <p className="sp-result-title">{p.title}</p>
                  <span className="sp-result-loc"><img src="/ICONS/Location.png" alt="Loc" className="icon-filter-dark" style={{ width: 10, height: 10, objectFit: 'contain', verticalAlign: 'middle', marginRight: 6 }} /> {p.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!query && (
        <>
          {/* Recent searches */}
          {recent.length > 0 && (
            <div className="sp-section">
              <div className="sp-section-header">
                <h3 className="sp-section-title"><img src="/ICONS/Time.png" alt="Time" className="icon-filter-dark" style={{ width: 14, height: 14, objectFit: 'contain', verticalAlign: 'middle', marginRight: 8 }} /> Recent</h3>
                <button className="sp-clear-btn" onClick={clearRecent}>Clear all</button>
              </div>
              <div className="sp-chips">
                {recent.map((r) => (
                  <button key={r} className="sp-chip" onClick={() => { setQuery(r); handleSearch(r); }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending */}
          <div className="sp-section">
            <h3 className="sp-section-title"><FiTrendingUp size={14} /> Trending</h3>
            <div className="sp-chips">
              {TRENDING.map((t) => (
                <button key={t} className="sp-chip sp-chip--trend" onClick={() => { setQuery(t); handleSearch(t); }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="sp-section">
            <h3 className="sp-section-title">Browse Categories</h3>
            <div className="sp-cat-grid">
              {categories.map((cat) => (
                <div
                  key={cat.label}
                  className="sp-cat-card"
                  onClick={() => navigate(`/category/${cat.label.toLowerCase()}`)}
                >
                  <img src={cat.image} alt={cat.label} className="sp-cat-img" />
                  <div className="sp-cat-overlay" />
                  <span className="sp-cat-label">{cat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        .sp-page {
          min-height: 100vh;
          background: var(--bg);
          padding: 20px 16px 80px;
          box-sizing: border-box;
          font-family: 'Poppins', sans-serif;
        }

        .sp-bar-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        .sp-bar {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--card-bg);
          border: 1.5px solid var(--border-light);
          border-radius: 14px;
          padding: 12px 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        .sp-bar-icon { color: var(--text-muted); flex-shrink: 0; font-size: 1.1rem; }

        .sp-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.95rem;
          color: var(--text-dark);
          font-family: inherit;
        }
        .sp-input::placeholder { color: var(--text-muted); }

        .sp-clear {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          padding: 0;
        }
        .sp-clear:hover { color: var(--text-dark); }

        .sp-search-btn {
          background: var(--btn-swap);
          color: var(--text-on-orange);
          border: none;
          border-radius: 12px;
          padding: 12px 20px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .sp-search-btn:hover { background: #c94d1c; }

        .sp-section { margin-bottom: 28px; }

        .sp-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .sp-section-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-dark);
          margin: 0 0 12px;
        }

        .sp-clear-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.78rem;
          color: var(--btn-swap);
          font-family: inherit;
          font-weight: 600;
          padding: 0;
        }

        .sp-chips { display: flex; flex-wrap: wrap; gap: 8px; }

        .sp-chip {
          background: var(--card-bg);
          border: 1.5px solid var(--border-light);
          border-radius: 999px;
          padding: 7px 16px;
          font-size: 0.82rem;
          color: var(--text-mid);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.18s;
        }
        .sp-chip:hover { border-color: var(--btn-swap); color: var(--btn-swap); }

        .sp-chip--trend {
          background: rgba(228, 88, 33, 0.1);
          border-color: var(--btn-swap);
          color: var(--btn-swap);
        }
        .sp-chip--trend:hover { background: var(--btn-swap); color: var(--text-on-orange); }

        /* Results list */
        .sp-results-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sp-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 10px 14px;
          cursor: pointer;
          transition: box-shadow 0.18s, transform 0.18s;
        }
        .sp-result-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); transform: translateY(-1px); }

        .sp-result-img {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .sp-result-info { flex: 1; min-width: 0; }
        .sp-result-title {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-dark);
          margin: 0 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sp-result-loc {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        /* Category grid */
        .sp-cat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .sp-cat-card {
          position: relative;
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .sp-cat-card:hover { transform: scale(1.03); }

        .sp-cat-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sp-cat-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.38);
        }

        .sp-cat-label {
          position: absolute;
          bottom: 8px;
          left: 0;
          right: 0;
          text-align: center;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
        }

        @media (max-width: 480px) {
          .sp-cat-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  );
};

export default SearchPage;
