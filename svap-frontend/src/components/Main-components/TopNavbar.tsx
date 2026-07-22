import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, X, Moon, Sun } from "lucide-react";

export default function TopNavbar() {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.getAttribute("data-theme") === "dark"
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isFullScreen =
    location.pathname === "/reels" ||
    location.pathname.startsWith("/reel-upload") ||
    location.pathname.startsWith("/create-reel");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isFullScreen) return null;

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("sz_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("sz_theme", "light");
    }
  };

  const openSearch = () => navigate("/search");

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <>
      <div className={`tnb-wrap${scrolled ? " tnb-wrap--scrolled" : ""}`}>
        <div className="tnb-inner">
          {/* Logo */}
          {!searchOpen && (
            <Link to="/">
              <img src="/Logo.png" alt="SVAP logo" className="tnb-logo" />
            </Link>
          )}
          {!searchOpen && <div className="tnb-spacer" />}

          {/* Search */}
          {searchOpen ? (
            <div className="tnb-search-box">
              <Search size={16} className="tnb-search-icon" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                placeholder="Search SVAP..."
                className="tnb-search-input"
                autoFocus
              />
              <button aria-label="Close search" onClick={closeSearch} className="tnb-icon-btn">
                <X size={16} />
              </button>
            </div>
          ) : (
            <button aria-label="Search" onClick={openSearch} className="tnb-icon-btn">
              <Search size={18} />
            </button>
          )}

          {/* Notifications */}
          {!searchOpen && (
            <button
              aria-label="Notifications"
              className="tnb-icon-btn"
              onClick={() => navigate("/notifications")}
            >
              <Bell size={18} />
            </button>
          )}

          {/* Dark / Light mode toggle */}
          {!searchOpen && (
            <button
              aria-label="Toggle theme"
              className="tnb-icon-btn tnb-theme-btn"
              onClick={toggleTheme}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}
        </div>
      </div>

      <style>{`
        /* Hidden on desktop — sidebar Navbar handles theme there */
        .tnb-wrap { display: none; }

        @media (max-width: 800px) {
          .tnb-wrap {
            display: block;
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 50;
            padding: 10px 12px 8px;
            background: var(--navbar-bg);
            border-bottom: 1px solid var(--border-light);
            box-shadow: 0 2px 10px rgba(0,0,0,0.06);
            transition: background 0.3s, box-shadow 0.3s;
          }

          .tnb-wrap--scrolled {
            background: linear-gradient(180deg, rgba(228,88,33,0.28) 0%, rgba(30,20,16,0.60) 100%);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom-color: rgba(255,255,255,0.08);
            box-shadow: 0 4px 24px rgba(0,0,0,0.28);
          }

          html[data-theme='dark'] .tnb-wrap {
            background: #0A0A0A;
            box-shadow: 0 2px 10px rgba(0,0,0,0.4);
          }

          .tnb-inner {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 10px;
            border-radius: 16px;
            transition: background 0.3s, border-color 0.3s;
          }

          .tnb-wrap--scrolled .tnb-inner {
            background: transparent;
            border-color: rgba(255,255,255,0.12);
          }

          html[data-theme='dark'] .tnb-inner {
            border-color: rgba(255,255,255,0.08);
          }

          .tnb-logo {
            height: 24px;
            width: auto;
            flex-shrink: 0;
            object-fit: contain;
            display: block;
          }

          .tnb-spacer { flex: 1; }

          /* Icon buttons */
          .tnb-icon-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px; height: 36px;
            flex-shrink: 0;
            border-radius: 50%;
            border: 1px solid var(--border-light);
            background: transparent;
            color: var(--text-dark);
            cursor: pointer;
            transition: background 0.15s, color 0.15s, border-color 0.15s;
          }
          .tnb-icon-btn:hover {
            background: var(--bg-section);
            border-color: #E45821;
            color: #E45821;
          }

          .tnb-wrap--scrolled .tnb-icon-btn {
            border-color: rgba(255,255,255,0.22);
            color: #ffffff;
          }
          .tnb-wrap--scrolled .tnb-icon-btn:hover {
            background: rgba(255,255,255,0.12);
            border-color: rgba(255,255,255,0.4);
          }

          /* Theme button — slight accent */
          .tnb-theme-btn {
            border-color: rgba(228,88,33,0.25);
            color: #000;
          }
          html[data-theme='dark'] .tnb-theme-btn {
            color: #ffffff;
            border-color: rgba(251,191,36,0.3);
          }

          /* Search box */
          .tnb-search-box {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            border-radius: 12px;
            border: 1px solid var(--border-light);
            background: var(--bg-section);
            padding: 6px 10px;
          }
          .tnb-wrap--scrolled .tnb-search-box {
            border-color: rgba(255,255,255,0.20);
            background: rgba(255,255,255,0.10);
          }

          .tnb-search-icon { color: var(--text-muted); flex-shrink: 0; }
          .tnb-wrap--scrolled .tnb-search-icon { color: rgba(255,255,255,0.7); }

          .tnb-search-input {
            flex: 1;
            min-width: 0;
            background: transparent;
            border: none;
            outline: none;
            font-size: 0.875rem;
            color: var(--text-dark);
            font-family: 'Poppins', sans-serif;
          }
          .tnb-search-input::placeholder { color: var(--text-muted); }
          .tnb-wrap--scrolled .tnb-search-input { color: #ffffff; }
          .tnb-wrap--scrolled .tnb-search-input::placeholder { color: rgba(255,255,255,0.4); }
        }
      `}</style>
    </>
  );
}
