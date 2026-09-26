import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiLogOut, FiMoon, FiSun } from "react-icons/fi";
import { supabase } from "../../services/supabase";
import { useNotifications } from "../../context/NotificationContext";
import { api } from "../../services/api";
import { getAllRequests } from "../../hooks/useSwapRequests";

// ─── Brand PNG Icon Component ─────────────────────────────────────────────────
const BrandIcon = ({ src, alt, size = 24, className }: { src: string; alt: string; size?: number; className?: string }) => (
  <img src={src} alt={alt} width={size} height={size} style={{ objectFit: 'contain', display: 'block' }} className={className} />
);

// ─── Custom Home Icon ─────────────────────────────────────────────────────────
const SearchIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="nb-brand-svg">
    <circle cx="11" cy="11" r="8" stroke="currentColor" fill="none" strokeWidth="2.5" />
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// ─── Reels / PlayCircle Icon ─────────────────────────────────────────────────
const ReelsIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="nb-brand-svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path
      d="M10 8.5l6 3.5-6 3.5V8.5z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Notifications Bell SVG ───────────────────────────────────────────────────
const BellIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="nb-brand-svg">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Custom User Icon ─────────────────────────────────────────────────────────
const UserIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nb-brand-svg">
    <circle cx="12" cy="8" r="4" stroke="currentColor" />
    <path d="M5 20c0-3.314 3.13-6 7-6s7 2.686 7 6" stroke="currentColor" />
  </svg>
);

// ─── Custom Login Icon ────────────────────────────────────────────────────────
const LoginIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nb-brand-svg">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" />
    <polyline points="10 17 15 12 10 7" stroke="currentColor" strokeWidth="2.5" />
    <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2.5" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavUser { 
  id: string;
  name: string; 
  username: string;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const CollapseIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
    <path d="M9 3v18"></path>
    <path d="M14 9l-2 3 2 3"></path>
  </svg>
);

const ExpandIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
    <path d="M15 3v18"></path>
    <path d="M10 15l2-3-2-3"></path>
  </svg>
);

// ─── NAV ITEMS (top section) ──────────────────────────────────────────────────
const TOP_NAV = [
  { icon: <BrandIcon src="/home.png" alt="Home" size={24} className="nb-req-icon" />, label: "Home", route: "/" },
  { icon: <SearchIcon size={24} />, label: "Search", route: "/search" },
  { icon: <ReelsIcon size={24} />, label: "Reels", route: "/reels" },
  { icon: <BellIcon size={24} />, label: "Notifications", route: "/notifications" },
  { icon: <BrandIcon src="/request.png" alt="Requests" size={24} className="nb-req-icon" />, label: "Requests", route: "/requests" },
  { icon: <BrandIcon src="/ICONS/Category.png" alt="Create" size={24} className="nb-req-icon" />, label: "Create", route: "/list-product" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const [user, setUser] = useState<NavUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
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

  // Fetch request count
  const fetchRequestCount = async () => {
    if (!user?.id) {
      setRequestCount(0);
      return;
    }
    
    try {
      const [allRequests, ordersResponse] = await Promise.all([
        getAllRequests(user.id),
        api.getOrders(user.id),
      ]);
      const checkoutOrders = Array.isArray(ordersResponse)
        ? ordersResponse.filter((order: any) => order.swap_request_id)
        : [];
      const checkoutRequestIds = new Set(
        checkoutOrders.map((order: any) => order.swap_request_id)
      );
      const currentUserCheckoutRequestIds = new Set(
        checkoutOrders
          .filter((order: any) => order.from_user_id === user.id)
          .map((order: any) => order.swap_request_id)
      );
      const isCheckoutRequest = (request: { id: string; status: string }) =>
        checkoutRequestIds.has(request.id) || ["accepted", "completed"].includes(request.status);
      const incoming = allRequests.filter(
        request => request.direction === "received" && !isCheckoutRequest(request)
      );
      const outgoing = allRequests.filter(
        request => request.direction === "sent" && !isCheckoutRequest(request)
      );
      const checkout = allRequests.filter(
        request => isCheckoutRequest(request) && !currentUserCheckoutRequestIds.has(request.id)
      );

      setRequestCount(incoming.length + outgoing.length + checkout.length);
    } catch (error) {
      console.error('[Navbar] Failed to fetch request count:', error);
      setRequestCount(0);
    }
  };

  useEffect(() => {
    fetchRequestCount();
  }, [user?.id]);

  useEffect(() => {
    const handleRequestsChange = () => fetchRequestCount();
    window.addEventListener("sz_requests_change", handleRequestsChange);
    
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchRequestCount();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    const interval = setInterval(fetchRequestCount, 30000);

    return () => {
      window.removeEventListener("sz_requests_change", handleRequestsChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [user?.id]);

  useEffect(() => {
    const timer = setTimeout(fetchRequestCount, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("sz_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("sz_theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const getUserDisplayName = () => {
    const name = typeof user?.name === "string" ? user.name.trim() : "";
    return name ? name.split(/\s+/)[0] : "Profile";
  };

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
            <img src="/request.png" alt="Svap" className="nb-req-icon" style={{ width: 18, height: 18, objectFit: 'contain' }} /> Svaps
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
            <LoginIcon size={14} /> Login
          </Link>
          <Link to="/signup" onClick={() => setProfileOpen(false)} className="nb-dropdown-item">
            <img src="/ICONS/Profile.png" alt="Signup" className="nb-req-icon" style={{ width: 14, height: 14, objectFit: 'contain' }} /> Create Account
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

  if (location.pathname === "/reels") return null;

  return (
    <>
      <style>{`
        :root {
          --sidebar-width: ${isCollapsed ? '80px' : '240px'};
        }
      `}</style>
      <nav className={`nb-sidebar ${isCollapsed ? "nb-sidebar--collapsed" : ""}`}>
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

        <div className="nb-top-items">
          {TOP_NAV.map((item) => (
            <Link
              key={item.route}
              to={item.route}
              onClick={(e) => {
                const protectedRoutes = ['/notifications', '/requests', '/list-product'];
                if (!user && protectedRoutes.includes(item.route)) {
                  e.preventDefault();
                  navigate('/login', { state: { returnUrl: item.route } });
                }
              }}
              className={`nb-item ${isActive(item.route) ? "nb-item--active" : ""}`}
              aria-label={item.label}
            >
              <span className="nb-icon" style={{ position: 'relative' }}>
                {item.icon}
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="nb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
                {item.label === 'Requests' && requestCount > 0 && (
                  <span className="nb-badge nb-badge--requests">{requestCount > 9 ? '9+' : requestCount}</span>
                )}
              </span>
              <span className="nb-label">{item.label}</span>
              <span className="nb-tooltip">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="nb-bottom">
          <div className="nb-profile-wrap">
            <button
              className={`nb-item nb-item--btn ${isActive("/profile") ? "nb-item--active" : ""}`}
              onClick={() => {
                if (!user) {
                  navigate('/login', { state: { returnUrl: '/profile' } });
                } else {
                  setProfileOpen((p) => !p);
                }
              }}
              aria-label="Profile"
            >
              <span className="nb-icon">
                <UserIcon size={24} />
              </span>
              <span className="nb-label">{getUserDisplayName()}</span>
              <span className="nb-tooltip">{typeof user?.name === "string" && user.name.trim() ? user.name : "Profile"}</span>
            </button>
            {profileOpen && renderDropdown()}
          </div>

          {!user && (
            <Link to="/login" className="nb-login-btn" aria-label="Login">
              <LoginIcon size={20} />
              <span className="nb-label">Login</span>
              <span className="nb-tooltip">Login</span>
            </Link>
          )}
        </div>
      </nav>

      <style>{`
        /* SIDEBAR BASICS */
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

        .nb-logo { display: flex; align-items: center; padding: 8px 2px 28px; text-decoration: none; }
        .nb-logo-img { height: 35px; width: auto; object-fit: contain; }

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

        .nb-toggle-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          margin-bottom: 18px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-dark);
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }
        .nb-toggle-btn:hover { background: var(--bg-section); color: var(--text-dark); }

        .nb-top-items { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .nb-bottom { display: flex; flex-direction: column; gap: 2px; border-top: 1px solid #f0f0f0; padding-top: 12px; }

        /* COLLAPSED SIDEBAR */
        .nb-sidebar--collapsed { width: 80px; align-items: center; padding: 16px 8px 24px; }
        .nb-sidebar--collapsed .nb-logo-header { flex-direction: column; gap: 0; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; margin-bottom: 12px; }
        .nb-sidebar--collapsed .nb-logo { padding: 8px 0 12px; }
        .nb-sidebar--collapsed .nb-logo-img { height: 40px; }
        .nb-sidebar--collapsed .nb-toggle-btn { width: 32px; height: 32px; font-size: 0.9rem; }
        .nb-sidebar--collapsed .nb-label { display: none; }
        .nb-sidebar--collapsed .nb-item { justify-content: center; padding: 12px; gap: 0; }
        .nb-sidebar--collapsed .nb-item:hover .nb-tooltip { display: block; }
        .nb-sidebar--collapsed .nb-tooltip { display: none; }
        .nb-sidebar--collapsed .nb-login-btn { justify-content: center; padding: 12px; gap: 0; }
        .nb-sidebar--collapsed .nb-login-btn .nb-label { display: none; }
        .nb-sidebar--collapsed .nb-login-btn:hover .nb-tooltip { display: block; }
        .nb-sidebar--collapsed .nb-dropdown { left: calc(100% + 8px); bottom: 0; }

        /* NAV ITEM */
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
        .nb-item--active { background: rgba(228, 88, 33, 0.1); color: #E45821; font-weight: 700; }
        .nb-item--active .nb-icon { color: #E45821; }

        .nb-item--btn { background: none; border: none; width: 100%; text-align: left; font-family: inherit; }

        .nb-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          color: currentColor;
        }

        /* BADGES */
        .nb-badge {
          position: absolute;
          top: -6px;
          right: -8px;
          min-width: 18px;
          height: 18px;
          background: #E45821;
          color: #fff;
          font-size: 0.65rem;
          font-weight: 700;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          box-shadow: 0 2px 6px rgba(228,88,33,0.4);
          border: 2px solid var(--navbar-bg);
          z-index: 10;
        }
        .nb-badge--requests { background: #313C5C; box-shadow: 0 2px 6px rgba(49,60,92,0.4); }

        .nb-label { font-size: 0.92rem; font-weight: 500; }

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

        /* PROFILE DROPDOWN */
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
        .nb-dropdown-user { display: flex; align-items: center; gap: 10px; padding: 14px 16px; }
        .nb-dropdown-name { font-size: 0.88rem; font-weight: 700; color: var(--text-dark); margin: 0; }
        .nb-dropdown-un { font-size: 0.72rem; color: var(--text-muted); margin: 0; }
        .nb-dropdown-divider { height: 1px; background: var(--border); margin: 4px 0; }
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

        @media (max-width: 768px) {
          .nb-sidebar { display: none; }
        }

        /* ══════════════════════════════════════════
           PNG & SVG ICONS (LIGHT & DARK MODE STYLES)
        ══════════════════════════════════════════ */
        .nb-req-icon {
          filter: brightness(0);
          transition: filter 0.2s;
        }

        /* DARK MODE STYLES FOR ALL SVG AND PNG ICONS */
        html[data-theme='dark'] .nb-sidebar {
          background: var(--navbar-bg);
          border-right-color: var(--border);
        }
        html[data-theme='dark'] .nb-logo-header { border-bottom-color: var(--border); }
        html[data-theme='dark'] .nb-bottom { border-top-color: var(--border); }
        html[data-theme='dark'] .nb-item { color: #ffffff; }
        html[data-theme='dark'] .nb-item:hover { background: var(--bg-section); color: #ffffff; }
        html[data-theme='dark'] .nb-item--active { background: rgba(255, 255, 255, 0.1); color: #ffffff; }

        /* Turn all SVG elements pure white in dark mode */
        html[data-theme='dark'] .nb-brand-svg {
          color: #ffffff !important;
        }
        html[data-theme='dark'] .nb-brand-svg path,
        html[data-theme='dark'] .nb-brand-svg circle,
        html[data-theme='dark'] .nb-brand-svg line,
        html[data-theme='dark'] .nb-brand-svg rect {
          stroke: #ffffff !important;
        }
        html[data-theme='dark'] .nb-brand-svg circle[fill="currentColor"],
        html[data-theme='dark'] .nb-brand-svg path[fill="currentColor"] {
          fill: #ffffff !important;
        }

        /* Turn all PNG Icons pure white in dark mode */
        html[data-theme='dark'] .nb-req-icon {
          filter: brightness(0) invert(1) !important;
        }

        html[data-theme='dark'] .nb-toggle-btn {
          background: var(--card-bg);
          border-color: var(--border);
          color: #ffffff;
        }

        html[data-theme='dark'] .nb-login-btn {
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }

        html[data-theme='dark'] .nb-dropdown {
          background: var(--card-bg);
          border-color: var(--border);
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }
        html[data-theme='dark'] .nb-dropdown-item { color: #ffffff; }
        html[data-theme='dark'] .nb-dropdown-item:hover { background: var(--bg-section); }
      `}</style>
    </>
  );
};

export default Navbar;