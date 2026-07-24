import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiLogOut, FiMoon, FiSun } from "react-icons/fi";
import { supabase } from "../../services/supabase";

// ─── Brand PNG Icon Component ─────────────────────────────────────────────────
const BrandIcon = ({ src, alt, size = 24, className }: { src: string; alt: string; size?: number; className?: string }) => (
  <img src={src} alt={alt} width={size} height={size} style={{ objectFit: 'contain', display: 'block' }} className={className} />
);

// ─── Custom Home Icon (brand two-tone) ────────────────────────────────────────
const HomeIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="nb-brand-svg">
    {/* Roof */}
    <path d="M3 10.5L12 3l9 7.5" stroke="#313C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Walls */}
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1V9.5" stroke="#313C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Door */}
    <rect x="9.5" y="15" width="5" height="6" rx="0.5" stroke="#E45821" strokeWidth="1.8" />
  </svg>
);

// ─── Custom Search Icon with Colors ───────────────────────────────────────────
const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" className="nb-search-svg">
    <circle cx="11" cy="11" r="8" stroke="#313C5C" fill="none" strokeWidth="2.5" className="nb-search-circle" />
    <path d="M21 21l-4.35-4.35" stroke="#E45821" strokeWidth="2.5" strokeLinecap="round" className="nb-search-handle" />
  </svg>
);

// ─── Reels SVG Icon (brand-matching style) ────────────────────────────────────
const ReelsIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="nb-brand-svg">
    <rect x="2" y="2" width="20" height="20" rx="4" stroke="#313C5C" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" stroke="#E45821" strokeWidth="2" />
    <line x1="2" y1="7" x2="22" y2="7" stroke="#313C5C" strokeWidth="1.5" />
    <line x1="2" y1="17" x2="22" y2="17" stroke="#313C5C" strokeWidth="1.5" />
    <line x1="7" y1="2" x2="7" y2="7" stroke="#313C5C" strokeWidth="1.5" />
    <line x1="17" y1="2" x2="17" y2="7" stroke="#313C5C" strokeWidth="1.5" />
    <line x1="7" y1="17" x2="7" y2="22" stroke="#313C5C" strokeWidth="1.5" />
    <line x1="17" y1="17" x2="17" y2="22" stroke="#313C5C" strokeWidth="1.5" />
  </svg>
);

// ─── Notifications Bell SVG ───────────────────────────────────────────────────
const BellIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="nb-brand-svg">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#313C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#E45821" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="18" cy="5" r="3" fill="#E45821" />
  </svg>
);

// ─── Custom User Icon with Colors ─────────────────────────────────────────────
const UserIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="4" stroke="#313C5C" />
    <path d="M5 20c0-3.314 3.13-6 7-6s7 2.686 7 6" stroke="#E45821" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavUser { name: string; username: string }

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const CollapseIcon = () => (
  <svg width="16" height="16" fill="none" stroke="#E45821" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
    <path d="M9 3v18"></path>
    <path d="M14 9l-2 3 2 3"></path>
  </svg>
);

const ExpandIcon = () => (
  <svg width="16" height="16" fill="none" stroke="#E45821" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
    <path d="M15 3v18"></path>
    <path d="M10 15l2-3-2-3"></path>
  </svg>
);

// ─── NAV ITEMS (top section) ──────────────────────────────────────────────────
const TOP_NAV = [
  { icon: <HomeIcon size={24} />, label: "Home", route: "/" },
  { icon: <SearchIcon />, label: "Search", route: "/search" },
  { icon: <ReelsIcon size={24} />, label: "Reels", route: "/reels" },
  { icon: <BellIcon size={24} />, label: "Notifications", route: "/notifications" },
  { icon: <BrandIcon src="/ICONS/Category.png" alt="Create" size={24} className="nb-nav-img" />, label: "Create", route: "/create" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<NavUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("sz_theme");
    return saved === "dark";
  });

  // Sync auth
  useEffect(() => {
    const sync = () => {
      const raw = localStorage.getItem("sz_user");
      setUser(raw ? JSON.parse(raw) : null);
    };
    sync();
    window.addEventListener("sz_auth_change", sync);
    return () => window.removeEventListener("sz_auth_change", sync);
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("sz_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("sz_theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const getUserDisplayName = () => {
    const name = typeof user?.name === "string" ? user.name.trim() : "";
    return name ? name.split(/\s+/)[0] : "Profile";
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".nb-profile-wrap")) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("sz_user");
    setProfileOpen(false);
    window.dispatchEvent(new Event("sz_auth_change"));
    navigate("/");
  };

  const isActive = (route: string) => {
    if (route === "/") {
      return (
        location.pathname === "/" ||
        location.pathname.startsWith("/product") ||
        location.pathname.startsWith("/category") ||
        location.pathname.startsWith("/all-listings")
      );
    }
    return location.pathname.startsWith(route);
  };

  const renderDropdown = () => (
    <div className="nb-dropdown">
      {user ? (
        <>
          <div className="nb-dropdown-user">
            <UserIcon size={32} />
            <div>
              <p className="nb-dropdown-name">{user.name}</p>
              <p className="nb-dropdown-un">{user.username}</p>
            </div>
          </div>
          <div className="nb-dropdown-divider" />
          <Link to="/profile" onClick={() => setProfileOpen(false)} className="nb-dropdown-item">
            <UserIcon size={16} /> My Profile
          </Link>
          <Link to="/orders" onClick={() => setProfileOpen(false)} className="nb-dropdown-item">
            <img src="/ICONS/SVAP.png" alt="Svap" style={{ width: 18, height: 18, objectFit: 'contain', filter: 'var(--icon-filter)' }} /> Svaps
          </Link>
          <Link to="/list-product" onClick={() => setProfileOpen(false)} className="nb-dropdown-item">
            <img src="/ICONS/Listing.png" alt="List" style={{ width: 18, height: 18, objectFit: 'contain', filter: 'var(--icon-filter)' }} /> List a Product
          </Link>
          <Link to="/requests" onClick={() => setProfileOpen(false)} className="nb-dropdown-item">
            <img src="/ICONS/Return.png" alt="Requests" style={{ width: 18, height: 18, objectFit: 'contain', filter: 'var(--icon-filter)' }} /> Requests
          </Link>
          <div className="nb-dropdown-divider" />
          <button className="nb-dropdown-item" onClick={toggleDarkMode}>
            {isDarkMode ? <FiSun size={14} /> : <FiMoon size={14} />}
            {isDarkMode ? " Light Mode" : " Dark Mode"}
          </button>
          <div className="nb-dropdown-divider" />
          <button className="nb-dropdown-item nb-dropdown-item--logout" onClick={handleLogout}>
            <FiLogOut size={14} /> Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" onClick={() => setProfileOpen(false)} className="nb-dropdown-item">
            <UserIcon size={14} /> Login
          </Link>
          <Link to="/signup" onClick={() => setProfileOpen(false)} className="nb-dropdown-item">
            <img src="/ICONS/Profile.png" alt="Signup" style={{ width: 14, height: 14, objectFit: 'contain', filter: 'var(--icon-filter)' }} /> Create Account
          </Link>
          <div className="nb-dropdown-divider" />
          <button className="nb-dropdown-item" onClick={toggleDarkMode}>
            {isDarkMode ? <FiSun size={14} /> : <FiMoon size={14} />}
            {isDarkMode ? " Light Mode" : " Dark Mode"}
          </button>
        </>
      )}
    </div>
  );

  // Hide sidebar on full-screen pages (reels)
  if (location.pathname === "/reels") return null;

  return (
    <>
      <style>{`
        :root {
          --sidebar-width: ${isCollapsed ? '80px' : '240px'};
        }
      `}</style>
      {/* ── Left Sidebar ── */}
      <nav className={`nb-sidebar ${isCollapsed ? "nb-sidebar--collapsed" : ""}`}>

        {/* Logo & Toggle */}
        <div className="nb-logo-header">
          <Link to="/" className="nb-logo" aria-label="SVAP Home">
            <img src="/Logo.png" alt="SVAP Logo" className="nb-logo-img" />
          </Link>
          <button
            className="nb-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand navbar" : "Collapse navbar"}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
          </button>
        </div>

        {/* Top nav items */}
        <div className="nb-top-items">
          {TOP_NAV.map((item) => (
            <Link
              key={item.route}
              to={item.route}
              className={`nb-item ${isActive(item.route) ? "nb-item--active" : ""}`}
              aria-label={item.label}
            >
              <span className="nb-icon">{item.icon}</span>
              <span className="nb-label">{item.label}</span>
              <span className="nb-tooltip">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Bottom section */}
        <div className="nb-bottom">
          {/* Svap / Requests */}
          {/* <Link
            to="/requests"
            className={`nb-item ${isActive("/requests") ? "nb-item--active" : ""}`}
            aria-label="Requests"
          >
            <span className="nb-icon"><HiOutlineArrowsRightLeft size={24} /></span>
            <span className="nb-label">Requests</span>
            <span className="nb-tooltip">Requests</span>
          </Link> */}

          {/* Profile with dropdown */}
          <div className="nb-profile-wrap">
            <button
              className={`nb-item nb-item--btn ${isActive("/profile") ? "nb-item--active" : ""}`}
              onClick={() => setProfileOpen((p) => !p)}
              aria-label="Profile"
            >
              <span className="nb-icon">
                <UserIcon size={24} />
              </span>
              <span className="nb-label">{getUserDisplayName()}</span>
              <span className="nb-tooltip">{typeof user?.name === "string" && user.name.trim() ? user.name : "Profile"}</span>
            </button>

            {/* Profile dropdown */}
            {profileOpen && renderDropdown()}
          </div>

          {/* Login shortcut if not logged in */}
          {!user && (
            <Link to="/login" className="nb-login-btn" aria-label="Login">
              <UserIcon size={20} />
              <span className="nb-label">Login</span>
              <span className="nb-tooltip">Login</span>
            </Link>
          )}
        </div>
      </nav>



      <style>{`
        /* ══════════════════════════════════════════
           SIDEBAR — desktop
        ══════════════════════════════════════════ */
        .nb-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 240px;
          background: var(--navbar-bg);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 20px 12px 24px;
          box-sizing: border-box;
          z-index: 100;
          font-family: 'Poppins', sans-serif;
          transition: width 0.3s ease;
        }

        /* Logo */
        .nb-logo {
          display: flex;
          align-items: center;
          padding: 8px 2px 28px;
          text-decoration: none;
        }
        .nb-logo-img {
          height: 35px;
          width: auto;
          object-fit: contain;
        }

        /* Logo header with toggle */
        .nb-logo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
          margin-bottom: 12px;
        }

        /* Toggle button */
        .nb-toggle-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          margin-bottom: 18px;
          background: var(--card-bg);
          border: 1px solid #313C5C;
          border-radius: 10px;
          color: var(--text-dark);
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          padding: 0;
        }
        .nb-toggle-btn:hover {
          background: var(--bg-section);
          color: var(--text-dark);
        }

        /* Nav groups */
        .nb-top-items {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nb-bottom {
          display: flex;
          flex-direction: column;
          gap: 2px;
          border-top: 1px solid #f0f0f0;
          padding-top: 12px;
        }

        /* Collapsed sidebar state */
        .nb-sidebar--collapsed {
          width: 80px;
          align-items: center;
          padding: 16px 8px 24px;
        }

        .nb-sidebar--collapsed .nb-logo-header {
          flex-direction: column;
          gap: 0;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
          margin-bottom: 12px;
        }

        .nb-sidebar--collapsed .nb-logo {
          padding: 8px 0 12px;
        }

        .nb-sidebar--collapsed .nb-logo-img {
          height: 40px;
        }

        .nb-sidebar--collapsed .nb-toggle-btn {
          width: 32px;
          height: 32px;
          font-size: 0.9rem;
        }

        .nb-sidebar--collapsed .nb-label {
          display: none;
        }

        .nb-sidebar--collapsed .nb-item {
          justify-content: center;
          padding: 12px;
          gap: 0;
        }

        .nb-sidebar--collapsed .nb-item:hover .nb-tooltip {
          display: block;
        }

        .nb-sidebar--collapsed .nb-tooltip {
          display: none;
        }

        .nb-sidebar--collapsed .nb-login-btn {
          justify-content: center;
          padding: 12px;
          gap: 0;
        }

        .nb-sidebar--collapsed .nb-login-btn .nb-label {
          display: none;
        }

        .nb-sidebar--collapsed .nb-login-btn:hover .nb-tooltip {
          display: block;
        }

        .nb-sidebar--collapsed .nb-dropdown {
          left: calc(100% + 8px);
          bottom: 0;
        }

        /* Nav item */
        .nb-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 12px;
          border-radius: 12px;
          color: var(--text-dark);
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          position: relative;
          white-space: nowrap;
          overflow: hidden;
        }
        .nb-item:hover { background: var(--bg-section); color: var(--text-dark); }
        .nb-item--active {
          background: rgba(228, 88, 33, 0.1);
          color: #E45821;
          font-weight: 700;
        }
        .nb-item--active .nb-icon { color: #E45821; }

        .nb-item--btn {
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          font-family: inherit;
        }

        .nb-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          color: inherit;
        }

        .nb-label {
          font-size: 0.92rem;
          font-weight: 500;
        }

        /* Tooltip (hidden on full-width sidebar, shown on narrow) */
        .nb-tooltip {
          display: none;
          position: absolute;
          left: calc(100% + 14px);
          top: 50%;
          transform: translateY(-50%);
          background: #111;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 8px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 200;
        }
        .nb-tooltip::before {
          content: '';
          position: absolute;
          left: -5px;
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: #111;
          border-left: none;
        }

        /* Login button */
        .nb-login-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 12px;
          border-radius: 12px;
          color: #E45821;
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          border: 1.5px solid rgba(228,88,33,0.2);
          background: rgba(228,88,33,0.04);
          transition: background 0.15s;
          position: relative;
        }
        .nb-login-btn:hover { background: rgba(228,88,33,0.1); }

        /* Profile dropdown */
        .nb-profile-wrap { position: relative; }

        .nb-dropdown {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 0;
          width: 220px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          overflow: hidden;
          z-index: 200;
          animation: dropUp 0.18s ease;
        }

        @keyframes dropUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .nb-dropdown-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
        }

        .nb-dropdown-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-dark);
          margin: 0;
        }

        .nb-dropdown-un {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin: 0;
        }

        .nb-dropdown-divider {
          height: 1px;
          background: var(--border);
          margin: 4px 0;
        }

        .nb-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-dark);
          text-decoration: none;
          transition: background 0.15s;
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          font-family: inherit;
        }
        .nb-dropdown-item:hover { background: var(--bg-section); color: var(--text-dark); }
        .nb-dropdown-item--logout { color: #f87171; }
        .nb-dropdown-item--logout:hover { background: rgba(228, 88, 33, 0.1); color: #e45821; }


        /* ══════════════════════════════════════════
           MOBILE — hide sidebar
        ══════════════════════════════════════════ */
        @media (max-width: 768px) {
          .nb-sidebar { display: none; }
        }

        /* ══════════════════════════════════════════
           DARK MODE
        ══════════════════════════════════════════ */
        /* ── Brand PNG icon filter for dark mode ── */
        :root {
          --icon-filter: none;
        }
        html[data-theme='dark'] {
          --icon-filter: var(--filter-orange);
        }

        /* Nav PNG icons: orange in dark mode, white on hover/active */
        .nb-nav-img {
          filter: var(--icon-filter);
          transition: filter 0.2s;
        }
        html[data-theme='dark'] .nb-item--active .nb-nav-img {
          filter: var(--filter-white) !important;
        }
        html[data-theme='dark'] .nb-item:hover .nb-nav-img {
          filter: var(--filter-white) !important;
        }

        /* Brand SVG icons in dark mode: orange by default, white on hover, orange on active */
        html[data-theme='dark'] .nb-brand-svg path,
        html[data-theme='dark'] .nb-brand-svg circle,
        html[data-theme='dark'] .nb-brand-svg line,
        html[data-theme='dark'] .nb-brand-svg rect {
          stroke: #E45821;
        }
        html[data-theme='dark'] .nb-brand-svg circle[fill='#E45821'] {
          fill: #E45821;
          stroke: none;
        }
        /* Active: keep orange */
        html[data-theme='dark'] .nb-item--active .nb-brand-svg path,
        html[data-theme='dark'] .nb-item--active .nb-brand-svg circle,
        html[data-theme='dark'] .nb-item--active .nb-brand-svg line,
        html[data-theme='dark'] .nb-item--active .nb-brand-svg rect {
          stroke: #E45821;
        }
        html[data-theme='dark'] .nb-item--active .nb-brand-svg circle[fill='#E45821'] {
          fill: #E45821;
          stroke: none;
        }
        /* Hover: turn white */
        html[data-theme='dark'] .nb-item:hover .nb-brand-svg path,
        html[data-theme='dark'] .nb-item:hover .nb-brand-svg circle,
        html[data-theme='dark'] .nb-item:hover .nb-brand-svg line,
        html[data-theme='dark'] .nb-item:hover .nb-brand-svg rect {
          stroke: #ffffff;
        }
        html[data-theme='dark'] .nb-item:hover .nb-brand-svg circle[fill='#E45821'] {
          fill: #ffffff;
          stroke: none;
        }

        /* Search icon dark mode: orange by default, white on hover */
        html[data-theme='dark'] .nb-search-circle {
          stroke: #E45821;
          transition: stroke 0.2s;
        }
        html[data-theme='dark'] .nb-search-handle {
          stroke: #E45821;
          transition: stroke 0.2s;
        }
        html[data-theme='dark'] .nb-item:hover .nb-search-circle,
        html[data-theme='dark'] .nb-item--active .nb-search-circle {
          stroke: #ffffff;
        }
        html[data-theme='dark'] .nb-item:hover .nb-search-handle,
        html[data-theme='dark'] .nb-item--active .nb-search-handle {
          stroke: #ffffff;
        }

        /* Dropdown PNG icons: orange by default, white on hover */
        html[data-theme='dark'] .nb-dropdown-item img {
          filter: var(--filter-orange);
          transition: filter 0.2s;
        }
        html[data-theme='dark'] .nb-dropdown-item:hover img {
          filter: var(--filter-white) !important;
        }

        html[data-theme='dark'] .nb-sidebar {
          background: var(--navbar-bg);
          border-right-color: var(--border);
        }

        html[data-theme='dark'] .nb-logo-header {
          border-bottom-color: var(--border);
        }

        html[data-theme='dark'] .nb-bottom {
          border-top-color: var(--border);
        }

        html[data-theme='dark'] .nb-item {
          color: var(--text-dark);
        }

        html[data-theme='dark'] .nb-item:hover {
          background: var(--bg-section);
          color: var(--text-dark);
        }

        html[data-theme='dark'] .nb-item--active {
          background: rgba(228, 88, 33, 0.15);
          color: #E45821;
        }

        html[data-theme='dark'] .nb-item--active .nb-icon {
          color: #E45821;
        }

        html[data-theme='dark'] .nb-icon {
          color: inherit;
        }

        html[data-theme='dark'] .nb-toggle-btn {
          background: var(--card-bg);
          border-color: var(--border);
          color: var(--text-dark);
        }

        html[data-theme='dark'] .nb-login-btn {
          color: #E45821;
          border-color: rgba(228, 88, 33, 0.2);
          background: rgba(228, 88, 33, 0.08);
        }

        html[data-theme='dark'] .nb-login-btn:hover {
          background: rgba(228, 88, 33, 0.15);
        }

        html[data-theme='dark'] .nb-dropdown {
          background: var(--card-bg);
          border-color: var(--border);
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }

        html[data-theme='dark'] .nb-dropdown-item {
          color: var(--text-dark);
        }

        html[data-theme='dark'] .nb-dropdown-item:hover {
          background: var(--bg-section);
        }
      `}</style>
    </>
  );
};

export default Navbar;
