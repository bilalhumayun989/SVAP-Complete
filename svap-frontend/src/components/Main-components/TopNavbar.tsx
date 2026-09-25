import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, Settings } from "lucide-react";
import SettingsDrawer from "../Profile/SettingsDrawer";

export default function TopNavbar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("sz_theme");
    if (savedTheme !== null) {
      return savedTheme === "dark";
    }
    return (
      document.documentElement.getAttribute("data-theme") === "dark" ||
      document.documentElement.classList.contains("dark")
    );
  });

  const navigate = useNavigate();
  const location = useLocation();

  const isProfilePage = location.pathname === "/profile";
  const isRequestsPage = location.pathname === "/requests";
  const isListProductPage = location.pathname === "/list-product";
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/forgot-password";

  const isFullScreen =
    location.pathname === "/reels" ||
    location.pathname.startsWith("/reel-upload") ||
    location.pathname.startsWith("/create-reel");

  // Timer ref to handle scroll stop detection robustly
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Background blur toggle
      setIsScrolled(currentScrollY > 10);

      // Path check direct inside event handler for accuracy
      if (location.pathname === "/") {
        // Page ke bilkul top par humesha dikhayen
        if (currentScrollY <= 10) {
          setIsVisible(true);
          if (scrollTimer.current) clearTimeout(scrollTimer.current);
          return;
        }

        // Jab scroll ho raha ho to hide kar do
        setIsVisible(false);

        // Purana timer clear karke naya timer lagayein (180ms delay)
        if (scrollTimer.current) {
          clearTimeout(scrollTimer.current);
        }

        // Jaise hi 180ms tak scroll event rukega, navbar neechay aa jayegi
        scrollTimer.current = setTimeout(() => {
          setIsVisible(true);
        }, 180);
      } else {
        // Dusre sabhi pages par visible rakhein
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, [location.pathname]);

  // Dynamic theme syncing
  useEffect(() => {
    const syncTheme = () => {
      const savedTheme = localStorage.getItem("sz_theme");
      if (savedTheme !== null) {
        setIsDark(savedTheme === "dark");
      } else {
        setIsDark(
          document.documentElement.getAttribute("data-theme") === "dark" ||
            document.documentElement.classList.contains("dark")
        );
      }
    };

    window.addEventListener("storage", syncTheme);
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => {
      window.removeEventListener("storage", syncTheme);
      observer.disconnect();
    };
  }, []);

  if (isFullScreen || isRequestsPage || isListProductPage || isAuthPage) return null;

  return (
    <>
      <header
        className={`md:hidden w-full fixed top-0 left-0 right-0 z-40 px-4 py-4 flex items-center justify-between transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        } ${
          isDark
            ? isScrolled
              ? "bg-[#0A0A0A]/90 backdrop-blur-md"
              : "bg-[#0A0A0A]"
            : isScrolled
            ? "bg-white/90 backdrop-blur-md"
            : "bg-white"
        }`}
      >
        {/* BRAND LOGO */}
        <Link to="/" className="flex items-center select-none">
          <img
            src="/Logo.png"
            alt="SVAP logo"
            className="h-7 w-auto object-contain transition-opacity duration-200 active:opacity-80"
          />
        </Link>

        {/* ACTION ICONS (NOTIFICATIONS, SEARCH, SETTINGS) */}
        <div className="flex items-center gap-2.5">
          {/* NOTIFICATION BUTTON */}
          <button
            onClick={() => navigate("/notifications")}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
              isDark
                ? "bg-[#1A1A1A] border border-white/10 text-white hover:bg-[#262626]"
                : "bg-[#F3F3F5] border border-black/10 text-gray-900 hover:bg-[#E5E5EA]"
            }`}
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          {/* SEARCH BUTTON */}
          <button
            onClick={() => navigate("/search")}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
              isDark
                ? "bg-[#1A1A1A] border border-white/10 text-white hover:bg-[#262626]"
                : "bg-[#F3F3F5] border border-black/10 text-gray-900 hover:bg-[#E5E5EA]"
            }`}
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          {/* SETTINGS ICON (Only on Profile Page) */}
          {isProfilePage && (
            <button
              onClick={() => setSettingsOpen(true)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
                isDark
                  ? "bg-[#1A1A1A] border border-white/10 text-white hover:bg-[#262626]"
                  : "bg-[#F3F3F5] border border-black/10 text-gray-900 hover:bg-[#E5E5EA]"
              }`}
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Settings Drawer (Only on /profile) */}
      {isProfilePage && (
        <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}