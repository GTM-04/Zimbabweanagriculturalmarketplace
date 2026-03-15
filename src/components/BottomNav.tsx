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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--gray-200)] px-4 py-2 z-50">
      <div className="max-w-2xl mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 py-2 px-3 min-w-[60px] group"
            >
              <Icon
                className={`w-6 h-6 transition-colors ${
                  isActive
                    ? "text-[var(--primary-800)]"
                    : "text-[var(--gray-500)] group-hover:text-[var(--primary-800)]"
                }`}
              />
              <span
                className={`text-xs transition-colors ${
                  isActive
                    ? "text-[var(--primary-800)] font-medium"
                    : "text-[var(--gray-500)] group-hover:text-[var(--primary-800)]"
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
