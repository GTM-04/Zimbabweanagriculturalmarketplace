import React, { useEffect, useState } from "react";
import {
    ArrowLeftRight,
    BarChart3,
    Home,
    LayoutGrid,
    Leaf,
    MessageCircle,
    Search,
    TrendingUp,
    User,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../lib/useAuth";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, switchMode } = useAuth();

  const userType = user?.user_type ?? "farmer";
  const displayName = user?.full_name ?? "User";
  const locationLabel = user?.district ?? "Zimbabwe";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSwitchMode = async () => {
    const newMode = userType === "farmer" ? "buyer" : "farmer";
    try {
      await switchMode(newMode);
      toast.success(`Switched to ${newMode === "farmer" ? "Farmer" : "Buyer"} mode`, {
        description: newMode === "farmer"
          ? "You can now list produce and manage your farm."
          : "Browse and purchase fresh produce from farmers.",
      });
      navigate(newMode === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard");
    } catch {
      toast.error("Failed to switch mode. Please try again.");
    }
  };

  const farmerNav = [
    { path: "/farmer/dashboard", icon: Home, label: "Home" },
    { path: "/farmer/my-listings", icon: LayoutGrid, label: "My Listings" },
    { path: "/market-prices", icon: TrendingUp, label: "Market Prices" },
    { path: "/messages", icon: MessageCircle, label: "Messages" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const buyerNav = [
    { path: "/buyer/dashboard", icon: Home, label: "Browse" },
    { path: "/buyer/search", icon: Search, label: "Search" },
    { path: "/market-prices", icon: BarChart3, label: "Market Prices" },
    { path: "/messages", icon: MessageCircle, label: "Messages" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const navItems = userType === "farmer" ? farmerNav : buyerNav;
  const isFarmer = userType === "farmer";

  // ── Mobile sidebar state ──────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar  = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  const handleNav = (path: string) => {
    navigate(path);
    closeSidebar();          // auto-close on navigation (mobile)
  };

  // Close sidebar whenever the route changes (browser back/forward)
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  return (
    <>
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside
        className={`agri-sidebar${sidebarOpen ? " agri-sidebar--open" : ""}`}
        aria-label="Primary Navigation"
        role="navigation"
      >
        {/* Close button — only visible on mobile */}
        <button
          className="agri-sidebar__close"
          onClick={closeSidebar}
          aria-label="Close navigation"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* ── Brand ── */}
        <div className="agri-sidebar__brand">
          <div className="agri-sidebar__logo">
            <Leaf className="agri-sidebar__logo-icon" strokeWidth={2} />
          </div>
          <div className="agri-sidebar__brand-text">
            <p className="agri-sidebar__brand-name">Village to Market</p>
            <p className="agri-sidebar__brand-mode">{isFarmer ? "Farmer" : "Buyer"} Mode</p>
          </div>
        </div>

        {/* ── Mode Switcher ── */}
        <div className="agri-sidebar__switch-wrap">
          <button
            onClick={handleSwitchMode}
            className={`agri-sidebar__switch ${isFarmer ? "agri-sidebar__switch--to-buyer" : "agri-sidebar__switch--to-farmer"}`}
          >
            <ArrowLeftRight className="agri-sidebar__switch-icon" strokeWidth={2.2} />
            <span>Switch to {isFarmer ? "Buyer" : "Farmer"}</span>
          </button>
        </div>

        {/* ── Nav Links ── */}
        <nav className="agri-sidebar__nav" aria-label="Navigation">
          <p className="agri-sidebar__section-label">Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                aria-current={isActive ? "page" : undefined}
                className={`agri-sidebar__item ${isActive ? "agri-sidebar__item--active" : ""}`}
              >
                <div className={`agri-sidebar__item-icon ${isActive ? "agri-sidebar__item-icon--active" : ""}`}>
                  <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className="agri-sidebar__item-svg" />
                </div>
                <span className="agri-sidebar__item-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="agri-sidebar__footer">
          <div className="agri-sidebar__user-avatar" aria-hidden="true">
            {initials || "U"}
          </div>
          <div className="agri-sidebar__user-meta">
            <span className="agri-sidebar__user-name">{displayName}</span>
            <span className="agri-sidebar__user-location">{locationLabel}</span>
          </div>
        </div>
      </aside>

      {/* ── Mobile Overlay (backdrop) ─────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="agri-sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Hamburger FAB (hidden when sidebar is open) ──────────── */}
      {!sidebarOpen && (
        <button
          className="sidebar-toggle-btn"
          onClick={openSidebar}
          aria-label="Open navigation menu"
          aria-expanded={false}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}
    </>
  );
}
