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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E0E0E0] px-4 py-2 z-50">
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
                  isActive ? "text-[#2D5016]" : "text-[#757575] group-hover:text-[#2D5016]"
                }`}
              />
              <span
                className={`text-xs transition-colors ${
                  isActive ? "text-[#2D5016] font-medium" : "text-[#757575] group-hover:text-[#2D5016]"
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
