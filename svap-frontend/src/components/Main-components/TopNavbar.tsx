import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Search, Bell, Moon, Sun, SlidersHorizontal, Settings } from "lucide-react";
import SettingsDrawer from "../Profile/SettingsDrawer";

export default function TopNavbar() {
  const [query, setQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(
    () => {
      const savedTheme = localStorage.getItem("sz_theme");
      if (savedTheme !== null) return savedTheme === "dark";
      return document.documentElement.getAttribute("data-theme") === "dark" || document.documentElement.classList.contains("dark");
    }
  );

  const navigate = useNavigate();
  const location = useLocation();
  const isProfilePage = location.pathname === "/profile";
  const isSearchPage = location.pathname === "/search";
  const isRequestsPage = location.pathname === "/requests";
  const isProductPage = location.pathname.startsWith("/product/");
  const isListProductPage = location.pathname === "/list-product";

  const isFullScreen =
    location.pathname === "/reels" ||
    location.pathname.startsWith("/reel-upload") ||
    location.pathname.startsWith("/create-reel");

  // Scroll handler to hide search bar on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isFullScreen || isRequestsPage || isListProductPage) return null;

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("sz_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("sz_theme", "light");
    }
  };

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  return (
    <>
      <header
        className={`md:hidden w-full fixed top-0 left-0 right-0 z-40 px-4 pt-3 pb-3 flex flex-col gap-3 transition-all duration-300  ${
          isDark
            ? "bg-[#0A0A0A] text-white border-white/10"
            : "bg-white text-gray-900 border-gray-200"
        }`}
      >
        {/* TOP ROW: BRAND LOGO & ACTION ICONS */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center select-none">
            <img src="/Logo.png" alt="SVAP logo" className="h-7 w-auto object-contain" />
          </Link>

          <div className="flex items-center gap-2.5">
            {/* NOTIFICATION BUTTON */}
            <button
              onClick={() => navigate("/notifications")}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 active:scale-95 ${
                isDark
                  ? "bg-[#1A1A1A] hover:bg-[#262626] border-white/10 text-white/90"
                  : "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700"
              }`}
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>

            {/* THEME TOGGLE / SETTINGS ICON */}
            {!isProfilePage ? (
              <button
                onClick={toggleTheme}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 active:scale-95 ${
                  isDark
                    ? "bg-[#1A1A1A] hover:bg-[#262626] border-white/10"
                    : "bg-gray-100 hover:bg-gray-200 border-gray-200"
                }`}
                aria-label="Toggle Theme"
              >
                {isDark ? (
                  <Sun size={18} className="text-amber-400" />
                ) : (
                  <Moon size={18} className="text-indigo-600" />
                )}
              </button>
            ) : (
              <button
                onClick={() => setSettingsOpen(true)}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 active:scale-95 ${
                  isDark
                    ? "bg-[#1A1A1A] hover:bg-[#262626] border-white/10 text-white/90"
                    : "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700"
                }`}
                aria-label="Settings"
              >
                <Settings size={18} />
              </button>
            )}
          </div>
        </div>

        {/* SEARCH BAR WITH SMOOTH SCROLL HIDE */}
        {!isProfilePage && !isProductPage && <div
          className={`grid transition-all duration-300 ease-in-out mt-1 ${
            scrolled ? "grid-rows-[0fr] opacity-0 pointer-events-none mt-0" : "grid-rows-[1fr] opacity-100"
          }`}
        >
          <div className="overflow-hidden">
            <div className="relative flex items-center w-full">
              {isSearchPage && (
                <button
                  onClick={() => navigate(-1)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border mr-2 transition-all active:scale-95 ${
                    isDark
                      ? "border-white/10 bg-[#1A1A1A] text-white/90 hover:bg-[#262626]"
                      : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  aria-label="Go back"
                >
                  <ArrowLeft size={18} />
                </button>
              )}

              <div
                className={`relative flex min-w-0 flex-1 items-center border rounded-full px-3.5 py-2 focus-within:border-[#D9501E] transition-all duration-200 ${
                  isDark
                    ? "bg-[#181818] border-white/10 text-white"
                    : "bg-gray-100 border-gray-200 text-gray-900"
                }`}
              >
                <Search size={18} className="text-[#D9501E] shrink-0 mr-2.5" />

                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  placeholder="Search Items To Svap..."
                  className={`w-full bg-transparent text-sm focus:outline-none ${
                    isDark ? "placeholder-white/40 text-white" : "placeholder-gray-400 text-gray-900"
                  }`}
                />

                <button
                  onClick={() => navigate("/search")}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border shrink-0 transition-all duration-200 active:scale-95 ml-2 ${
                    isDark
                      ? "bg-[#242424] hover:bg-[#2d2d2d] text-white/80 border-white/5"
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-xs"
                  }`}
                >
                  <SlidersHorizontal size={13} className={isDark ? "text-white/70" : "text-gray-500"} />
                  <span>Filter</span>
                </button>
              </div>
            </div>
          </div>
        </div>}
      </header>

      {/* Settings Drawer (Only on /profile) */}
      {isProfilePage && (
        <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}