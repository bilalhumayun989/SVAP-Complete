import React from "react";
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
  { label: "Reels", path: "/reels", icon: Film  },
  { label: "Upload", path: "/create", icon: Plus },
  { label: "Svaps", path: "/requests", icon: Repeat2 },
  { label: "Profile", path: "/profile", icon: User },
];

const ACCENT = "#313C5C";

export default function MobileNavbr() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 flex justify-center px-3 pb-3 sm:px-5 sm:pb-5 pointer-events-none z-50">
      <nav
        className="pointer-events-auto flex items-center gap-1 sm:gap-3 px-2 py-2 sm:px-4 sm:py-3.5 rounded-full border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(228,88,33,0.28) 0%, rgba(30,20,16,0.55) 100%)",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-full transition-all duration-300 ease-out overflow-hidden ${
                isActive
                  ? "px-4 py-2.5 sm:px-6 sm:py-3.5"
                  : "p-2.5 sm:p-3.5"
              }`}
              style={{
                backgroundColor: isActive ? ACCENT : "transparent",
                boxShadow: isActive
                  ? "0 4px 14px rgba(228,88,33,0.45)"
                  : "none",
              }}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={20}
                strokeWidth={2}
                className={`sm:w-6 sm:h-6 ${
                  isActive
                    ? "text-white shrink-0"
                    : "text-white/70 shrink-0"
                }`}
              />

              <span
                className={`text-white text-sm sm:text-base font-medium whitespace-nowrap transition-all duration-300 ease-out ${
                  isActive
                    ? "max-w-[80px] sm:max-w-[100px] opacity-100 ml-0.5"
                    : "max-w-0 opacity-0"
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