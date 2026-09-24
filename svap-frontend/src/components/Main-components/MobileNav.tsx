import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, PlayCircle, Plus, User } from "lucide-react";
import { api } from "../../services/api";
import { getAllRequests } from "../../hooks/useSwapRequests";

// Local Request Image Icon Wrapper
const LocalRequestIcon = ({
  size = 24,
  isActive = false,
  isDark = true,
}: {
  size?: number;
  isActive?: boolean;
  isDark?: boolean;
}) => {
  const getFilterStyle = () => {
    if (isActive) {
      // Tint image to #D9501E Accent Color
      return "invert(42%) sepia(85%) saturate(1425%) hue-rotate(346deg) brightness(92%) contrast(92%)";
    }
    // Light Mode = Black, Dark Mode = White
    return isDark ? "invert(0)" : "invert(1)";
  };

  return (
    <img
      src="/request.png" // Local path in /public/request.png
      alt="Requests"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        filter: getFilterStyle(),
        transition: "filter 200ms ease-in-out",
        objectFit: "contain",
      }}
    />
  );
};

interface NavItem {
  path: string;
  icon?: React.ComponentType<{
    size?: number;
    className?: string;
    strokeWidth?: number;
  }>;
  isCustomImage?: boolean;
  badgeCount?: number;
}

const BRAND_ACCENT = "#D9501E";

export default function MobileNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<any>(null);
  const [requestCount, setRequestCount] = useState(0);

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
      console.error('[MobileNav] Failed to fetch request count:', error);
      setRequestCount(0);
    }
  };

  useEffect(() => {
    fetchRequestCount();
  }, [user?.id]);

  useEffect(() => {
    const handleRequestsChange = () => {
      fetchRequestCount();
    };

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
  }, []);

  const NAV_ITEMS: NavItem[] = [
    { path: "/", icon: Home },
    { path: "/reels", icon: PlayCircle },
    { path: "/list-product", icon: Plus },
    { path: "/requests", isCustomImage: true, badgeCount: requestCount },
    { path: "/profile", icon: User },
  ];

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

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none z-50">
      <nav
        className={`pointer-events-auto flex items-center justify-between w-full max-w-md px-3 py-3.5 rounded-full transition-all duration-300 backdrop-blur-2xl ${
          isDark
            ? "bg-[#18181b]/90 border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.85)]"
            : "bg-white/95 border border-black/10 shadow-[0_12px_35px_rgba(0,0,0,0.15)]"
        }`}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isMiddle = item.path === "/list-product";

          const activeItemClass =
            isActive && !isMiddle
              ? isDark
                ? "bg-white/15 border border-white/20 shadow-md"
                : "bg-black/10 border border-black/15 shadow-sm"
              : "bg-transparent border-transparent";

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex items-center justify-center py-2 px-3 rounded-full transition-all duration-300 ease-out ${activeItemClass}`}
              aria-label={item.path.replace("/", "") || "Home"}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={`flex items-center justify-center transition-all duration-300 ${
                  isMiddle ? "w-12 h-12 rounded-full" : "w-8 h-8"
                }`}
                style={{
                  backgroundColor: isMiddle ? BRAND_ACCENT : "transparent",
                  boxShadow: isMiddle ? `0 4px 20px ${BRAND_ACCENT}99` : "none",
                }}
              >
                {item.isCustomImage ? (
                  <LocalRequestIcon
                    size={24}
                    isActive={isActive}
                    isDark={isDark}
                  />
                ) : (
                  Icon && (
                    <Icon
                      size={isMiddle ? 28 : 24}
                      strokeWidth={isMiddle || isActive ? 2.3 : 1.8}
                      className={`transition-colors duration-200 ${
                        isMiddle
                          ? "text-white"
                          : isActive
                          ? "text-[#D9501E]"
                          : isDark
                          ? "text-white/80"
                          : "text-gray-700 hover:text-black"
                      }`}
                    />
                  )
                )}
              </div>

              {/* Notification Badge */}
              {item.badgeCount && item.badgeCount > 0 ? (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full border-2 border-[#18181b] shadow-sm">
                  {item.badgeCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}