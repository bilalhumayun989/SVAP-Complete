import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { categories } from "../Home-page/data/data";
import { FiX } from "react-icons/fi";

// ─── Custom Search Icon with Colors ───────────────────────────────────────────
const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" stroke="#313C5C" fill="none" strokeWidth="2.5" />
    <path d="M21 21l-4.35-4.35" stroke="#E45821" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const AllCategoriesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = searchTerm.trim()
    ? categories.filter(cat =>
      cat.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : categories;

  return (
    <>
      <div className="allcat-root">
        <div className="allcat-inner">

          {/* Header with Search on Right */}
          <div className="allcat-header-wrap">
            <div className="allcat-header">
              <h1 className="allcat-title">All Categories</h1>
              <p className="allcat-sub">Browse everything available to svap</p>
            </div>

            {/* Search Bar - Right Side */}
            <div className="allcat-search-wrap">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="allcat-search-input"
              />
              {searchTerm && (
                <button
                  className="allcat-search-clear"
                  onClick={() => setSearchTerm("")}
                >
                  <FiX size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="allcat-grid">
            {filteredCategories.map((item) => (
              <div
                key={item.label}
                className="allcat-card"
                onClick={() => navigate(`/category/${item.label.toLowerCase()}`)}
              >
                <img src={item.image} alt={item.label} className="allcat-img" loading="lazy" />
                <div className="allcat-overlay" />
                <div className="allcat-shimmer" />
                <div className="allcat-label-wrap">
                  <span className="allcat-label">{item.label}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="allcat-no-results">
              <p>No categories found matching "{searchTerm}"</p>
            </div>
          )}

        </div>
      </div>

      <style>{`
        .allcat-root {
          min-height: 100vh;
          background: var(--bg);
          padding: 20px 20px 60px;
          box-sizing: border-box;
        }

        .allcat-inner {
          max-width: 2400px;
          margin: 0 auto;
        }

        /* Header */
        .allcat-header {
          margin-bottom: 24px;
        }
       .allcat-title {
  color: var(--text-dark);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 6px;
  line-height: 1.1;
}

.allcat-sub {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0;
}
        

        /* Search Bar */
        .allcat-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 28px;
          width: 100%;
          max-width: 400px;
        }

        .allcat-search-wrap svg {
          position: absolute;
          left: 14px;
          pointer-events: none;
          flex-shrink: 0;
        }

        .allcat-search-input {
          width: 100%;
          padding: 12px 14px 12px 44px;
          border: 1.5px solid #e0e0e0;
          border-radius: 12px;
          font-size: 0.9rem;
          font-family: inherit;
          background: #f9f9f9;
          color: #000;
          outline: none;
          transition: all 0.2s;
        }

        .allcat-search-input:focus {
          border-color: #E45821;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(228, 88, 33, 0.1);
        }

        .allcat-search-input::placeholder {
          color: #999;
        }

        .allcat-search-clear {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: #999;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .allcat-search-clear:hover {
          color: #E45821;
        }

        /* Grid */
        .allcat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        /* Card */
        .allcat-card {
          position: relative;
          overflow: hidden;
          border-radius: 14px;
          cursor: pointer;
          aspect-ratio: 4 / 3;
          background: rgba(255,255,255,0.04);
          border: 1px solid #e0e0e0;
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .allcat-card:hover {
          transform: scale(1.02);
          border-color: #E45821;
          box-shadow: 0 4px 16px rgba(228, 88, 33, 0.15);
        }

        .allcat-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .allcat-card:hover .allcat-img { transform: scale(1.06); }

        .allcat-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.38);
          transition: background 0.3s;
        }
        .allcat-card:hover .allcat-overlay { background: rgba(0,0,0,0.22); }

        .allcat-shimmer {
          position: absolute;
          inset: 0;
          opacity: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 50%);
          transition: opacity 0.3s;
        }
        .allcat-card:hover .allcat-shimmer { opacity: 1; }

        .allcat-label-wrap {
          position: absolute;
          inset-inline: 0;
          bottom: 0;
          padding: 48px 16px 18px;
          background: linear-gradient(to top, rgba(0,0,0,0.88), transparent);
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .allcat-label {
          color: #fff;
          font-size: clamp(0.9rem, 1.1vw, 1.1rem);
          font-weight: 700;
          letter-spacing: 0.01em;
          text-align: center;
        }
          .allcat-header-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.allcat-header {
  margin-bottom: 0;
  flex: 1;
}

.allcat-search-wrap {
  width: 100%;
  max-width: 400px;
  margin-bottom: 0;
  flex-shrink: 0;
}

        /* No Results */
        .allcat-no-results {
          text-align: center;
          padding: 60px 20px;
          color: #666;
          font-size: 1rem;
        }

        /* Responsive */
        @media (min-width: 2400px) {
          .allcat-grid { grid-template-columns: repeat(5, 1fr); gap: 20px; }
        }
        @media (max-width: 1280px) {
          .allcat-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .allcat-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .allcat-title { font-size: clamp(1.5rem, 5vw, 2rem); }
          .allcat-search-wrap { max-width: 100%; }
        }
        @media (max-width: 480px) {
          .allcat-root { padding: 14px 14px 40px; }
          .allcat-grid { gap: 10px; }
        }
      `}</style>
    </>
  );
};

export default AllCategoriesPage;
