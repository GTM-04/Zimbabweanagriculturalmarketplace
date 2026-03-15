import { AlertCircle, Bell, DollarSign, Eye, List, Loader2, MessageCircle, Package, Plus, TrendingUp, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { listingsApi, notificationsApi } from "../../lib/api";
import { getPendingListings } from "../../lib/offlineStorage";
import type { Listing, Notification } from "../../lib/types";
import { useAuth } from "../../lib/useAuth";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { AppShell } from "../layout/AppShell";
import { Button } from "../ui/button";

export function FarmerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOnline = useOnlineStatus();

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);

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
        return { icon: <TrendingUp className="w-5 h-5 text-[var(--success)]" />, bg: "bg-[var(--success-bg)]" };
      case "new_listing":
        return { icon: <Package className="w-5 h-5 text-[var(--primary-800)]" />, bg: "bg-[var(--primary-50)]" };
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

  // Check for any locally saved offline listings so the farmer can see
  // at a glance what is still waiting to sync.
  useEffect(() => {
    try {
      const pending = getPendingListings().filter((l) => !l.synced);
      setPendingOfflineCount(pending.length);
    } catch {
      setPendingOfflineCount(0);
    }
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
    <AppShell
      title="Farmer dashboard"
      subtitle="Track your listings, activity, and market insights"
      userTypeOverride="farmer"
    >
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner flex items-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Some features are limited.</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl bg-white shadow-sm border border-[var(--gray-100)] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--primary-700)] flex items-center justify-center text-white font-semibold text-lg">
            {farmerName[0]}
          </div>
          <div>
            <p className="text-xs text-[var(--gray-500)]">{getGreeting()},</p>
            <h1
              className="text-[var(--gray-900)]"
              style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 800 }}
            >
              {farmerName}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--gray-600)]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-[var(--success)]" : "bg-[var(--gray-400)]"
                }`}
              />
              <span>{user?.district ?? "Zimbabwe"}</span>
            </div>
          </div>
        </div>
        <button className="relative p-2 rounded-full bg-[var(--gray-100)] hover:bg-[var(--gray-200)] transition-colors">
          <Bell className="w-5 h-5 text-[var(--gray-800)]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--error-red)] rounded-full" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--primary-50)] text-[var(--primary-700)]">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-xs text-[var(--gray-600)]">Active Listings</span>
            </div>
            <p className="text-2xl font-bold text-[var(--gray-900)]">
              {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-[var(--primary-700)]" /> : activeListings.length}
            </p>
          </div>

          <div className="card bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--accent-50)] text-[var(--accent-600)]">
                <Eye className="w-4 h-4" />
              </div>
              <span className="text-xs text-[var(--gray-600)]">Total Views</span>
            </div>
            <p className="text-2xl font-bold text-[var(--gray-900)]">
              {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-600)]" /> : totalViews.toLocaleString()}
            </p>
          </div>

          <div className="card bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--accent-50)] text-[var(--accent-700)]">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-xs text-[var(--gray-600)]">Inquiries</span>
            </div>
            <p className="text-2xl font-bold text-[var(--gray-900)]">
              {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-700)]" /> : totalInquiries.toLocaleString()}
            </p>
          </div>

          <div className="card bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--success-bg)] text-[var(--success)]">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-xs text-[var(--gray-600)]">Est. Value</span>
            </div>
            <p className="text-xl font-bold text-[var(--gray-900)]">
              {loadingStats
                ? <Loader2 className="w-6 h-6 animate-spin text-[var(--success)]" />
                : `$${
                    totalEarnings > 0
                      ? totalEarnings.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })
                      : "—"
                  }`}
            </p>
          </div>
        </div>
      </div>

      {/* Offline sync summary for pending listings */}
      {pendingOfflineCount > 0 && (
        <div className="mb-4">
            <div className="rounded-xl border border-[#FFE082] bg-[#FFF8E1] px-3 py-2 text-xs text-[#7A4A00] flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">
                {pendingOfflineCount} offline listing{pendingOfflineCount > 1 ? "s" : ""} waiting to sync
              </span>
              <button
                type="button"
                onClick={() => navigate("/farmer/list-produce")}
                className="text-[11px] font-semibold text-[var(--primary-800)] hover:underline whitespace-nowrap"
              >
                View queue
              </button>
            </div>
            <p>
              These were saved while you were offline. Go to “List Produce” to review and sync them when you have
              a stable connection.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6">
        <Button
          onClick={() => navigate("/farmer/list-produce")}
          className="w-full h-14 rounded-xl bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus className="w-6 h-6" />
          <span className="font-semibold">List New Produce</span>
        </Button>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <Button
            onClick={() => navigate("/farmer/my-listings")}
            variant="outline"
            className="h-12 border border-[var(--gray-200)] rounded-xl hover:border-[var(--primary-700)] hover:bg-[var(--primary-50)]"
          >
            <div className="flex flex-col items-center gap-1">
              <List className="w-5 h-5" />
              <span className="text-xs">Listings</span>
            </div>
          </Button>

          <Button
            onClick={() => navigate("/messages")}
            variant="outline"
            className="h-12 border border-[var(--gray-200)] rounded-xl hover:border-[var(--primary-700)] hover:bg-[var(--primary-50)]"
          >
            <div className="flex flex-col items-center gap-1">
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">Messages</span>
            </div>
          </Button>

          <Button
            onClick={() => navigate("/market-prices")}
            variant="outline"
            className="h-12 border border-[var(--gray-200)] rounded-xl hover:border-[var(--primary-700)] hover:bg-[var(--primary-50)]"
          >
            <div className="flex flex-col items-center gap-1">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs">Prices</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-3">Recent Activity</h2>
        {loadingActivity ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--gray-200)] animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#E0E0E0] rounded animate-pulse w-3/4" />
                  <div className="h-2 bg-[#E0E0E0] rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <Bell className="w-8 h-8 text-[var(--gray-200)] mx-auto mb-2" />
            <p className="text-sm text-[var(--gray-600)]">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const { icon, bg } = activityMeta(n.notification_type);
              return (
                <div
                  key={n.id}
                  className={`bg-white rounded-xl p-4 shadow-sm flex items-start gap-3 ${
                    !n.is_read ? "border-l-4 border-l-[var(--primary-700)]" : ""
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--gray-900)]">{n.title}</p>
                    <p className="text-sm text-[var(--gray-600)] mt-0.5 truncate">{n.message}</p>
                    <p className="text-xs text-[var(--gray-400)] mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-[var(--primary-700)] mt-1.5 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Market Insights */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-3">Market Insights</h2>
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-[var(--accent-50)] to-[var(--accent-100)] rounded-xl p-4 border-l-4 border-[var(--accent-500)]">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--accent-600)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[var(--gray-900)] mb-1">Trending Now</p>
                <p className="text-sm text-[var(--gray-600)]">High demand for butternut squash in Harare markets</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[var(--success)]/10 to-[var(--primary-700)]/10 rounded-xl p-4 border-l-4 border-[var(--success)]">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[var(--gray-900)] mb-1">Price Alert</p>
                <p className="text-sm text-[var(--gray-600)]">Onion prices up 20% this week - Good time to sell!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
