import { AlertCircle, Bell, DollarSign, Eye, List, Loader2, MessageCircle, Package, Plus, TrendingUp, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { listingsApi, notificationsApi } from "../../lib/api";
import type { Listing, Notification } from "../../lib/types";
import { useAuth } from "../../lib/useAuth";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { BottomNav } from "../BottomNav";
import { Button } from "../ui/button";

export function FarmerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOnline = useOnlineStatus();

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const farmerName = user?.full_name?.split(" ")[0] ?? "Farmer";

  // Relative time helper
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  // Icon + colour config per notification type
  const activityMeta = (type: Notification["notification_type"]) => {
    switch (type) {
      case "new_message":
      case "inquiry":
        return { icon: <MessageCircle className="w-5 h-5 text-[#F5A623]" />, bg: "bg-[#F5A623]/10" };
      case "price_alert":
        return { icon: <TrendingUp className="w-5 h-5 text-[#4CAF50]" />, bg: "bg-[#4CAF50]/10" };
      case "new_listing":
        return { icon: <Package className="w-5 h-5 text-[#2D5016]" />, bg: "bg-[#2D5016]/10" };
      case "order_status":
        return { icon: <DollarSign className="w-5 h-5 text-[#4A90E2]" />, bg: "bg-[#4A90E2]/10" };
      default:
        return { icon: <Eye className="w-5 h-5 text-[#4A90E2]" />, bg: "bg-[#4A90E2]/10" };
    }
  };

  useEffect(() => {
    const fetchMyListings = async () => {
      setLoadingStats(true);
      try {
        // myListings() calls GET /listings/my-listings — JWT-scoped to this farmer only
        const data = await listingsApi.myListings();
        setMyListings(data);
      } catch {
        setMyListings([]);
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchActivity = async () => {
      setLoadingActivity(true);
      try {
        const data = await notificationsApi.list();
        setNotifications(data.slice(0, 5)); // show latest 5
      } catch {
        // Leave empty — no static fallback for notifications
        setNotifications([]);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchMyListings();
    fetchActivity();
  }, []);

  // Compute stats from the farmer's own listings
  const activeListings = myListings.filter(l => l.status === "active");
  // Views and inquiries count across ALL listing statuses
  const totalViews = myListings.reduce((sum, l) => sum + (l.views ?? 0), 0);
  const totalInquiries = myListings.reduce((sum, l) => sum + (l.inquiries ?? 0), 0);
  // Est. value = sum of (price_per_unit × quantity_available) across active listings
  const totalEarnings = activeListings.reduce(
    (sum, l) => sum + (l.price_per_unit ?? 0) * (l.quantity_available ?? 1),
    0
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-[#FFA726] text-[#2C2C2C] px-4 py-2 flex items-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Some features are limited.</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#2D5016] flex items-center justify-center text-white font-semibold text-lg">
              {farmerName[0]}
            </div>
            <div>
              <p className="text-sm text-[#757575]">{getGreeting()},</p>
              <h1 className="text-lg font-semibold text-[#2C2C2C]">{farmerName}</h1>
            </div>
          </div>
          <button className="relative p-2 hover:bg-[#F5F5F5] rounded-full transition-colors">
            <Bell className="w-6 h-6 text-[#2C2C2C]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF5350] rounded-full"></span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#757575]">
          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-[#4CAF50]" : "bg-[#757575]"}`}></span>
          <span>{user?.district ?? "Zimbabwe"}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-6 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          <div className="bg-white rounded-xl p-4 shadow-sm min-w-[140px]">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-[#2D5016]" />
              <span className="text-sm text-[#757575]">Active Listings</span>
            </div>
            <p className="text-2xl font-bold text-[#2C2C2C]">
              {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-[#2D5016]" /> : activeListings.length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm min-w-[140px]">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-[#4A90E2]" />
              <span className="text-sm text-[#757575]">Total Views</span>
            </div>
            <p className="text-2xl font-bold text-[#2C2C2C]">
              {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-[#4A90E2]" /> : totalViews.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm min-w-[140px]">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-5 h-5 text-[#F5A623]" />
              <span className="text-sm text-[#757575]">Inquiries</span>
            </div>
            <p className="text-2xl font-bold text-[#2C2C2C]">
              {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-[#F5A623]" /> : totalInquiries.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm min-w-[140px]">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-[#4CAF50]" />
              <span className="text-sm text-[#757575]">Est. Value</span>
            </div>
            <p className="text-2xl font-bold text-[#2C2C2C]">
              {loadingStats
                ? <Loader2 className="w-6 h-6 animate-spin text-[#4CAF50]" />
                : `USD ${totalEarnings > 0 ? totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}`}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <Button
          onClick={() => navigate("/farmer/list-produce")}
          className="w-full h-14 bg-[#2D5016] hover:bg-[#234010] text-white rounded-xl flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus className="w-6 h-6" />
          <span className="font-semibold">List New Produce</span>
        </Button>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <Button
            onClick={() => navigate("/farmer/my-listings")}
            variant="outline"
            className="h-12 border-2 border-[#E0E0E0] hover:border-[#2D5016] hover:bg-[#2D5016]/5"
          >
            <div className="flex flex-col items-center gap-1">
              <List className="w-5 h-5" />
              <span className="text-xs">Listings</span>
            </div>
          </Button>

          <Button
            onClick={() => navigate("/messages")}
            variant="outline"
            className="h-12 border-2 border-[#E0E0E0] hover:border-[#2D5016] hover:bg-[#2D5016]/5"
          >
            <div className="flex flex-col items-center gap-1">
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">Messages</span>
            </div>
          </Button>

          <Button
            onClick={() => navigate("/market-prices")}
            variant="outline"
            className="h-12 border-2 border-[#E0E0E0] hover:border-[#2D5016] hover:bg-[#2D5016]/5"
          >
            <div className="flex flex-col items-center gap-1">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs">Prices</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-[#2C2C2C] mb-3">Recent Activity</h2>
        {loadingActivity ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E0E0E0] animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#E0E0E0] rounded animate-pulse w-3/4" />
                  <div className="h-2 bg-[#E0E0E0] rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <Bell className="w-8 h-8 text-[#E0E0E0] mx-auto mb-2" />
            <p className="text-sm text-[#757575]">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const { icon, bg } = activityMeta(n.notification_type);
              return (
                <div key={n.id} className={`bg-white rounded-xl p-4 shadow-sm flex items-start gap-3 ${!n.is_read ? "border-l-4 border-[#2D5016]" : ""}`}>
                  <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2C2C2C]">{n.title}</p>
                    <p className="text-sm text-[#757575] mt-0.5 truncate">{n.message}</p>
                    <p className="text-xs text-[#9E9E9E] mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-[#2D5016] mt-1.5 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Market Insights */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-[#2C2C2C] mb-3">Market Insights</h2>
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-[#F5A623]/10 to-[#FF6B35]/10 rounded-xl p-4 border-l-4 border-[#F5A623]">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#F5A623] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#2C2C2C] mb-1">Trending Now</p>
                <p className="text-sm text-[#757575]">High demand for butternut squash in Harare markets</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#4CAF50]/10 to-[#7CB342]/10 rounded-xl p-4 border-l-4 border-[#4CAF50]">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-[#4CAF50] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#2C2C2C] mb-1">Price Alert</p>
                <p className="text-sm text-[#757575]">Onion prices up 20% this week - Good time to sell!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav userType="farmer" />
    </div>
  );
}
