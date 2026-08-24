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
  { label: "Upload", path: "/list-product", icon: Plus },
  { label: "Svaps", path: "/requests", icon: Repeat2 },
  { label: "Profile", path: "/profile", icon: User },
];

const ACCENT = "#D9501E";

export default function MobileNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Reads localStorage first to prevent reverting on refresh
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

  // Listen to external theme toggles (e.g., from TopNavbar)
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
        className={`pointer-events-auto flex items-center justify-between w-full max-w-md px-3 py-1 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl border transition-colors duration-300 ${
          isDark
            ? "bg-[#0A0A0A] border-[#D9501E]"
            : "bg-white/90 border-gray-200 shadow-lg"
        }`}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isMiddle = item.path === "/list-product";

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-1 px-1 rounded-2xl transition-all duration-300 ease-out"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={`flex items-center justify-center transition-all duration-300 ${
                  isMiddle
                    ? "w-10 h-10 rounded-full shadow-lg"
                    : "w-8 h-8 rounded-xl"
                }`}
                style={{
                  backgroundColor: isMiddle
                    ? ACCENT
                    : isActive
                    ? "#D9501E"
                    : "transparent",
                  boxShadow: isMiddle
                    ? "0 4px 14px rgba(217, 80, 30, 0.5)"
                    : "none",
                }}
              >
                <Icon
                  size={isMiddle ? 22 : 20}
                  strokeWidth={isMiddle || isActive ? 2.5 : 2}
                  className={`transition-colors duration-200 ${
                    isMiddle || isActive
                      ? "text-white"
                      : isDark
                      ? "text-white/70"
                      : "text-gray-600"
                  }`}
                />
              </div>

              <span
                className={`text-[10px] sm:text-xs transition-colors duration-200 whitespace-nowrap ${
                  isMiddle || isActive
                    ? isDark
                      ? "text-white font-semibold"
                      : "text-[#D9501E] font-semibold"
                    : isDark
                    ? "text-white/70 font-normal"
                    : "text-gray-500 font-normal"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}