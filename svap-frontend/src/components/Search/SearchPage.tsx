import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiTrendingUp } from "react-icons/fi";
import { api } from "../../services/api";
import { categories } from "../Home-page/data/data";

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" stroke="#313C5C" fill="none" strokeWidth="2.5" />
    <path d="M21 21l-4.35-4.35" stroke="#E45821" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const TRENDING = ["iPhone", "PS5", "MacBook", "Nike", "Camera", "Gaming Chair", "Samsung", "Laptop"];
const RECENT_KEY = "sz_recent_searches";

const getRecent = (): string[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
};
interface Result {
  id: string;
  title: string;
  image: string;
  location: string;
  condition: string;
}

const SearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>(getRecent);
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced live search — fires 350ms after user stops typing
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.getProducts({ search: q });
        if (res.data) {
          setResults(
            res.data.slice(0, 20).map((p: any) => ({
              id: p.id,
              title: p.title,
              image: p.image_urls?.[0] || "https://placehold.co/80x80",
              location: p.profiles?.city || "Unknown",
              condition: p.condition || "",
            }))
          );
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const clearRecent = () => {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
  };

  const showResults = query.trim().length >= 2;

  return (
    <div className="sp-page">
      {/* Search bar */}
      <div className="sp-bar-wrap">
        <div className="sp-bar">
          <SearchIcon />
          <input
            autoFocus
            className="sp-input"
            placeholder="Search listings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          />
          {query && (
            <button className="sp-clear" onClick={() => setQuery("")} aria-label="Clear">
              <FiX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Live results */}
      {showResults && (
        <div className="sp-section">
          <h3 className="sp-section-title">
            {searching ? "Searching..." : `${results.length} result${results.length !== 1 ? "s" : ""} for "${query.trim()}"`}
          </h3>

          {searching && (
            <div className="sp-searching-row">
              {[1,2,3,4].map(i => (
                <div key={i} className="sp-skel-item">
                  <div className="sp-skel sp-skel-img" />
                  <div className="sp-skel-info">
                    <div className="sp-skel sp-skel-line" />
                    <div className="sp-skel sp-skel-line sp-skel-line--short" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!searching && results.length === 0 && (
            <div className="sp-no-results">
              <span>😕</span>
              <p>No listings found for "<strong>{query.trim()}</strong>"</p>
              <span className="sp-no-results-sub">Try a different keyword</span>
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="sp-results-list">
              {results.map((p) => (
                <div
                  key={p.id}
                  className="sp-result-item"
                  onClick={() => navigate(`/product/${p.id}`)}
                >
                  <img src={p.image} alt={p.title} className="sp-result-img" />
                  <div className="sp-result-info">
                    <p className="sp-result-title">{p.title}</p>
                    <div className="sp-result-meta">
                      {p.condition && <span className="sp-result-badge">{p.condition}</span>}
                      <span className="sp-result-loc">
                        <img src="/ICONS/Location.png" alt="" style={{ width: 10, height: 10, objectFit: 'contain', marginRight: 4, verticalAlign: 'middle' }} />
                        {p.location}
                      </span>
                    </div>
                  </div>
                  <span className="sp-result-arrow">›</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state — recent + trending + categories */}
      {!showResults && (
        <>
          {recent.length > 0 && (
            <div className="sp-section">
              <div className="sp-section-header">
                <h3 className="sp-section-title">
                  <img src="/ICONS/Time.png" alt="Time" style={{ width: 14, height: 14, objectFit: 'contain', verticalAlign: 'middle', marginRight: 6 }} />
                  Recent
                </h3>
                <button className="sp-clear-btn" onClick={clearRecent}>Clear all</button>
              </div>
              <div className="sp-chips">
                {recent.map((r) => (
                  <button key={r} className="sp-chip" onClick={() => { setQuery(r); }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="sp-section">
            <h3 className="sp-section-title"><FiTrendingUp size={14} /> Trending</h3>
            <div className="sp-chips">
              {TRENDING.map((t) => (
                <button key={t} className="sp-chip sp-chip--trend" onClick={() => { setQuery(t); }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

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
        .sp-page { min-height:100vh; background:var(--bg); padding:20px 16px 80px; box-sizing:border-box; font-family:'Poppins',sans-serif; }
        .sp-bar-wrap { display:flex; align-items:center; gap:10px; margin-bottom:24px; }
        .sp-bar { flex:1; display:flex; align-items:center; gap:10px; background:var(--card-bg); border:1.5px solid var(--border-light); border-radius:14px; padding:12px 16px; box-shadow:0 2px 12px rgba(0,0,0,0.06); }
        .sp-input { flex:1; border:none; outline:none; background:transparent; font-size:0.95rem; color:var(--text-dark); font-family:inherit; }
        .sp-input::placeholder { color:var(--text-muted); }
        .sp-clear { background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; align-items:center; padding:0; }
        .sp-clear:hover { color:var(--text-dark); }
        .sp-search-btn { background:#E45821; color:#fff; border:none; border-radius:12px; padding:12px 20px; font-size:0.88rem; font-weight:700; cursor:pointer; font-family:inherit; transition:background 0.2s; white-space:nowrap; }
        .sp-search-btn:hover { background:#c94d1c; }
        .sp-section { margin-bottom:28px; }
        .sp-section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .sp-section-title { display:flex; align-items:center; gap:6px; font-size:0.9rem; font-weight:700; color:var(--text-dark); margin:0 0 12px; }
        .sp-clear-btn { background:none; border:none; cursor:pointer; font-size:0.78rem; color:#E45821; font-family:inherit; font-weight:600; padding:0; }
        .sp-chips { display:flex; flex-wrap:wrap; gap:8px; }
        .sp-chip { background:var(--card-bg); border:1.5px solid var(--border-light); border-radius:999px; padding:7px 16px; font-size:0.82rem; color:var(--text-mid); cursor:pointer; font-family:inherit; transition:all 0.18s; }
        .sp-chip:hover { border-color:#E45821; color:#E45821; }
        .sp-chip--trend { background:rgba(228,88,33,0.1); border-color:#E45821; color:#E45821; }
        .sp-chip--trend:hover { background:#E45821; color:#fff; }

        /* Results */
        .sp-results-list { display:flex; flex-direction:column; gap:8px; }
        .sp-result-item { display:flex; align-items:center; gap:12px; background:var(--card-bg); border:1px solid var(--border-light); border-radius:12px; padding:10px 14px; cursor:pointer; transition:box-shadow 0.18s,transform 0.15s,border-color 0.18s; }
        .sp-result-item:hover { box-shadow:0 4px 16px rgba(0,0,0,0.1); transform:translateY(-1px); border-color:rgba(228,88,33,0.3); }
        .sp-result-img { width:52px; height:52px; border-radius:10px; object-fit:cover; flex-shrink:0; }
        .sp-result-info { flex:1; min-width:0; }
        .sp-result-title { font-size:0.88rem; font-weight:600; color:var(--text-dark); margin:0 0 5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sp-result-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .sp-result-badge { font-size:0.68rem; font-weight:600; background:rgba(228,88,33,0.1); color:#E45821; border:1px solid rgba(228,88,33,0.2); padding:1px 8px; border-radius:999px; }
        .sp-result-loc { display:flex; align-items:center; font-size:0.72rem; color:var(--text-muted); }
        .sp-result-arrow { font-size:1.3rem; color:var(--text-muted); flex-shrink:0; }

        /* No results */
        .sp-no-results { display:flex; flex-direction:column; align-items:center; gap:8px; padding:40px 20px; color:var(--text-muted); text-align:center; }
        .sp-no-results span { font-size:2rem; }
        .sp-no-results p { font-size:0.9rem; font-weight:600; color:var(--text-dark); margin:0; }
        .sp-no-results strong { color:#E45821; }
        .sp-no-results-sub { font-size:0.8rem; }

        /* Skeleton */
        @keyframes sp-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .sp-skel { background:linear-gradient(90deg,#f0f0f0 25%,#e4e4e4 50%,#f0f0f0 75%); background-size:400px 100%; animation:sp-shimmer 1.4s infinite linear; border-radius:8px; }
        html[data-theme='dark'] .sp-skel { background:linear-gradient(90deg,#1a1a1a 25%,#252525 50%,#1a1a1a 75%); background-size:400px 100%; }
        .sp-searching-row { display:flex; flex-direction:column; gap:8px; }
        .sp-skel-item { display:flex; align-items:center; gap:12px; padding:10px 14px; background:var(--card-bg); border:1px solid var(--border-light); border-radius:12px; }
        .sp-skel-img { width:52px; height:52px; border-radius:10px; flex-shrink:0; }
        .sp-skel-info { flex:1; display:flex; flex-direction:column; gap:8px; }
        .sp-skel-line { height:13px; width:100%; }
        .sp-skel-line--short { width:50%; height:10px; }

        /* Categories */
        .sp-cat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
        .sp-cat-card { position:relative; aspect-ratio:1; border-radius:12px; overflow:hidden; cursor:pointer; transition:transform 0.2s; }
        .sp-cat-card:hover { transform:scale(1.03); }
        .sp-cat-img { width:100%; height:100%; object-fit:cover; }
        .sp-cat-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.38); }
        .sp-cat-label { position:absolute; bottom:8px; left:0; right:0; text-align:center; color:#fff; font-size:0.75rem; font-weight:700; }
        @media (max-width:480px) { .sp-cat-grid{grid-template-columns:repeat(3,1fr);} }
      `}</style>
    </div>
  );
};

export default SearchPage;
