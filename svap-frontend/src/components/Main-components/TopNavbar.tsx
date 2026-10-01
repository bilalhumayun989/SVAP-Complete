import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, Settings } from "lucide-react";
import SettingsDrawer from "../Profile/SettingsDrawer";
import { supabase } from "../../services/supabase"; // Ensure path matches your project structure

export default function TopNavbar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [user, setUser] = useState<any>(null);

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

  const lastScrollY = useRef(0);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync auth state
  useEffect(() => {
    const syncUser = () => {
      const raw = localStorage.getItem("sz_user");
      setUser(raw ? JSON.parse(raw) : null);
    };
    syncUser();
    window.addEventListener("sz_auth_change", syncUser);
    return () => window.removeEventListener("sz_auth_change", syncUser);
  }, []);

  // Fetch Unread Notifications Count from public.notifications table
  const fetchUnreadCount = async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (err) {
      console.error("[TopNavbar] Failed to fetch unread notifications count:", err);
      setUnreadCount(0);
    }
  };

  // Realtime subscription & Custom Event Listeners
  useEffect(() => {
    if (!user?.id) return;

    fetchUnreadCount();

    // Supabase Realtime Listener for Instant Updates
    const channel = supabase
      .channel(`realtime:topnav:notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    // Custom window event listener for manual trigger
    const handleNotificationSync = () => fetchUnreadCount();
    window.addEventListener("sz_notifications_change", handleNotificationSync);

    const handleVisibilityChange = () => {
      if (!document.hidden) fetchUnreadCount();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("sz_notifications_change", handleNotificationSync);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.id]);

  // Scroll visibility management
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Blur/border toggle
      setIsScrolled(currentScrollY > 10);

      if (location.pathname === "/") {
        // Top par hamesha visible
        if (currentScrollY <= 15) {
          setIsVisible(true);
          if (scrollTimer.current) clearTimeout(scrollTimer.current);
          lastScrollY.current = currentScrollY;
          return;
        }

        // 1. Ulta (upar) scroll karne par instantly show karo
        if (currentScrollY < lastScrollY.current - 3) {
          setIsVisible(true);
        } 
        // 2. Neeche scroll karne par hide karo
        else if (currentScrollY > lastScrollY.current + 3) {
          setIsVisible(false);
        }

        // 3. Jaha par scroll roko, waha 150ms baad automatic neechay aa jaye
        if (scrollTimer.current) {
          clearTimeout(scrollTimer.current);
        }
        scrollTimer.current = setTimeout(() => {
          setIsVisible(true);
        }, 150);

      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
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
        className={`md:hidden w-full fixed top-0 left-0 right-0 z-40 px-4 py-2.5 flex items-center justify-between transition-all duration-300 ease-in-out border-b ${
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        } ${
          isDark
            ? isScrolled
              ? "bg-[#0A0A0A]/90 backdrop-blur-md border-white/10"
              : "bg-[#0A0A0A] border-transparent"
            : isScrolled
            ? "bg-white/90 backdrop-blur-md border-black/5"
            : "bg-white border-transparent"
        }`}
      >
        {/* BRAND LOGO */}
        <Link to="/" className="flex items-center select-none">
          <img
            src="/Logo.png"
            alt="SVAP logo"
            className="h-6 w-auto object-contain transition-opacity duration-200 active:opacity-80"
          />
        </Link>

        {/* ACTION ICONS */}
        <div className="flex items-center gap-2">
          {/* NOTIFICATION BUTTON WITH BADGE */}
          <button
            onClick={() => navigate("/notifications")}
            className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
              isDark
                ? "bg-[#1A1A1A] border border-white/10 text-white hover:bg-[#262626]"
                : "bg-[#F3F3F5] border border-black/10 text-gray-900 hover:bg-[#E5E5EA]"
            }`}
            aria-label="Notifications"
          >
            <Bell size={17} />

            {/* Dynamic Notification Badge Number */}
            {unreadCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#D9501E] rounded-full border-2 ${
                  isDark ? "border-[#0A0A0A]" : "border-white"
                } shadow-sm animate-in zoom-in duration-200`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* SEARCH BUTTON */}
          <button
            onClick={() => navigate("/search")}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
              isDark
                ? "bg-[#1A1A1A] border border-white/10 text-white hover:bg-[#262626]"
                : "bg-[#F3F3F5] border border-black/10 text-gray-900 hover:bg-[#E5E5EA]"
            }`}
            aria-label="Search"
          >
            <Search size={17} />
          </button>

          {/* SETTINGS ICON (Only on Profile Page) */}
          {isProfilePage && (
            <button
              onClick={() => setSettingsOpen(true)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
                isDark
                  ? "bg-[#1A1A1A] border border-white/10 text-white hover:bg-[#262626]"
                  : "bg-[#F3F3F5] border border-black/10 text-gray-900 hover:bg-[#E5E5EA]"
              }`}
              aria-label="Settings"
            >
              <Settings size={17} />
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