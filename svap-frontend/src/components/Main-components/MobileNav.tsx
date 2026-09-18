import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Film, Plus, Repeat2, User } from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
    strokeWidth?: number;
  }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/", icon: Home },
  { label: "Reels", path: "/reels", icon: Film },
  { label: "", path: "/list-product", icon: Plus },
  { label: "Svaps", path: "/requests", icon: Repeat2 },
  { label: "Profile", path: "/profile", icon: User },
];

const BRAND_ACCENT = "#D9501E";

export default function MobileNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

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
    <div className="md:hidden fixed bottom-0 left-0 right-0 flex justify-center px-3 pb-3 sm:px-5 sm:pb-5 pointer-events-none z-50">
      <nav
        className={`pointer-events-auto flex items-center justify-between w-full max-w-md px-2 py-2 rounded-full transition-all duration-300 backdrop-blur-xl ${
          isDark
            ? "bg-[#121212]/90 border border-white/10 shadow-[0_10px_38px_rgba(0,0,0,0.8)]"
            : "bg-white/90 border border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
        }`}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isMiddle = item.path === "/list-product";

          const activeItemClass = isActive
            ? isDark
              ? "bg-white/15 border border-white/20 shadow-sm"
              : "bg-black/5 border border-black/10 shadow-sm"
            : "bg-transparent border-transparent";

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-1.5 px-2 rounded-full transition-all duration-300 ease-out ${activeItemClass}`}
              aria-label={item.label || "Navigation Item"}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={`flex items-center justify-center transition-all duration-300 ${
                  isMiddle ? "w-10 h-10 rounded-full" : "w-8 h-8"
                }`}
                style={{
                  backgroundColor: isMiddle ? BRAND_ACCENT : "transparent",
                  boxShadow: isMiddle ? `0 4px 14px ${BRAND_ACCENT}80` : "none",
                }}
              >
                <Icon
                  size={isMiddle ? 24 : 20}
                  strokeWidth={isMiddle || isActive ? 2.5 : 2}
                  className={`transition-colors duration-200 ${
                    isMiddle
                      ? "text-white"
                      : isActive
                      ? "text-[#D9501E]"
                      : isDark
                      ? "text-white/70"
                      : "text-gray-700 hover:text-black"
                  }`}
                />
              </div>

              {item.label && (
                <span
                  className={`text-[10px] sm:text-xs transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? "text-[#D9501E] font-semibold"
                      : isDark
                      ? "text-white/70 font-medium"
                      : "text-gray-700 font-medium"
                  }`}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}