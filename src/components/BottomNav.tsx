import { Home, List, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

interface BottomNavProps {
  userType: "farmer" | "buyer";
}

export function BottomNav({ userType }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const farmerNav = [
    { path: "/farmer/dashboard", icon: Home, label: "Home" },
    { path: "/farmer/my-listings", icon: List, label: "Listings" },
    { path: "/messages", icon: MessageCircle, label: "Messages" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const buyerNav = [
    { path: "/buyer/dashboard", icon: Home, label: "Browse" },
    { path: "/buyer/search", icon: List, label: "Search" },
    { path: "/messages", icon: MessageCircle, label: "Messages" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const navItems = userType === "farmer" ? farmerNav : buyerNav;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--gray-200)] z-50 pb-safe">
      <div className="max-w-2xl mx-auto flex items-center justify-around px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className="relative flex flex-col items-center gap-1 py-2.5 px-4 min-w-[64px] group"
            >
              {/* Active pill indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[var(--primary-700)]" />
              )}
              <Icon
                className={`w-5 h-5 transition-all duration-150 ${
                  isActive
                    ? "text-[var(--primary-800)] scale-110"
                    : "text-[var(--gray-400)] group-hover:text-[var(--primary-700)]"
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive
                    ? "text-[var(--primary-800)]"
                    : "text-[var(--gray-400)] group-hover:text-[var(--primary-700)]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
