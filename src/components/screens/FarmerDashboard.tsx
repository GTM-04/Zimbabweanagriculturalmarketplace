import {
    AlertCircle,
    ArrowRight,
    BarChart3,
    Bell,
    DollarSign,
    Eye,
    Leaf,
    List,
    Loader2,
    MessageCircle,
    Package,
    Plus,
    Share2,
    Sprout,
    Sun,
    Sunrise,
    Sunset,
    TrendingUp,
    WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { listingsApi, notificationsApi } from "../../lib/api";
import type { Listing, Notification } from "../../lib/types";
import { useAuth } from "../../lib/useAuth";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { BottomNav } from "../BottomNav";

export function FarmerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOnline = useOnlineStatus();

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const farmerName = user?.full_name?.split(" ")[0] ?? "Farmer";
  const fullName = user?.full_name ?? farmerName;
  const initials = fullName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  /* ── helpers ── */
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const activityMeta = (type: Notification["notification_type"]) => {
    switch (type) {
      case "new_message":
      case "inquiry":
        return { icon: <MessageCircle className="fd-icon-sm" />, tone: "messages" };
      case "price_alert":
        return { icon: <TrendingUp className="fd-icon-sm" />, tone: "analytics" };
      case "new_listing":
        return { icon: <Package className="fd-icon-sm" />, tone: "listings" };
      case "order_status":
        return { icon: <DollarSign className="fd-icon-sm" />, tone: "primary" };
      default:
        return { icon: <Eye className="fd-icon-sm" />, tone: "neutral" };
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return { text: "Good morning", Icon: Sunrise };
    if (h < 18) return { text: "Good afternoon", Icon: Sun };
    return { text: "Good evening", Icon: Sunset };
  };
  const greeting = getGreeting();
  const GreetIcon = greeting.Icon;

  /* ── data ── */
  useEffect(() => {
    const fetchMyListings = async () => {
      setLoadingStats(true);
      try {
        const data = await listingsApi.myListings();
        setMyListings(data ?? []);
      } catch {
        setMyListings([]);
      } finally {
        setLoadingStats(false);
      }
    };
    const fetchActivity = async () => {
      setLoadingActivity(true);
      try { setNotifications((await notificationsApi.list()).slice(0, 5)); }
      catch { setNotifications([]); }
      finally { setLoadingActivity(false); }
    };
    fetchMyListings();
    fetchActivity();
  }, []);

  const ownListings = myListings.filter(l => !l.farmer_id || String(l.farmer_id) === String(user?.id));
  const activeListings = ownListings.filter((l) => l.status === "active");
  const totalViews = ownListings.reduce((s, l) => s + (l.views ?? 0), 0);
  const totalInquiries = ownListings.reduce((s, l) => s + (l.inquiries ?? 0), 0);
  const totalEarnings = activeListings.reduce(
    (s, l) => s + (l.price_per_unit ?? 0) * (l.quantity_available ?? 1), 0,
  );

  const stats = [
    { label: "Active Listings", value: loadingStats ? null : activeListings.length, icon: Package, tone: "listings" },
    { label: "Total Views", value: loadingStats ? null : totalViews.toLocaleString(), icon: Eye, tone: "analytics" },
    { label: "Inquiries", value: loadingStats ? null : totalInquiries.toLocaleString(), icon: MessageCircle, tone: "messages" },
    {
      label: "Est. Value",
      value: loadingStats ? null : totalEarnings > 0
        ? `$${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : "$0",
      icon: DollarSign, tone: "primary",
    },
  ];

  const quickActions = [
    { label: "List Produce", icon: Plus, path: "/farmer/list-produce", tone: "primary" },
    { label: "My Listings", icon: List, path: "/farmer/my-listings", tone: "listings" },
    { label: "Messages", icon: MessageCircle, path: "/messages", tone: "messages" },
    { label: "Market Prices", icon: BarChart3, path: "/market-prices", tone: "analytics" },
  ];

  const insights = [
    { icon: AlertCircle, title: "Trending Now", desc: "High demand for butternut squash in Harare markets", tone: "messages" },
    { icon: TrendingUp, title: "Price Alert", desc: "Onion prices up 20% this week — Good time to sell!", tone: "listings" },
  ];

  const delayClasses = ["delay-100", "delay-150", "delay-200", "delay-300", "delay-400", "delay-500"];

  /* ── render ── */
  return (
    <div className="fd-page">
      <BottomNav />

      {/* offline */}
      {!isOnline && (
        <div className="fd-offline">
          <WifiOff size={16} className="fd-banner-icon" />
          <span>You're offline — some features are limited.</span>
        </div>
      )}

      {/* ═══ Hero Header ═══ */}
      <header className="fd-hero">
        {/* ambient deco */}
        <div className="fd-hero__orb fd-hero__orb--1" />
        <div className="fd-hero__orb fd-hero__orb--2" />
        <div className="fd-hero__pattern" />

        <div className="fd-hero__inner">
          <div className="fd-hero__row">
            <div className="fd-hero__user">
              <div className="fd-avatar">
                <span>{initials}</span>
                <div className={`fd-avatar__status ${isOnline ? "fd-avatar__status--online" : ""}`} />
              </div>
              <div className="fd-hero__greeting">
                <div className="fd-hero__greeting-line">
                  <GreetIcon size={14} className="fd-hero__greeting-icon" />
                  <span className="fd-hero__greeting-text">{greeting.text}</span>
                </div>
                <h1 className="fd-hero__name">{farmerName}</h1>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/farmer/${user?.username || user?.phone_number}`;
                  if (navigator.share) {
                    navigator.share({ title: 'My Farmer Profile', url });
                  } else {
                    navigator.clipboard.writeText(url);
                    alert("Profile link copied to clipboard!");
                  }
                }}
                className="fd-hero__bell"
                aria-label="Share Profile"
              >
                <Share2 size={20} />
              </button>
              
              <button
                onClick={() => navigate("/profile")}
                className="fd-hero__bell"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {notifications.some((n) => !n.is_read) && <span className="fd-hero__bell-dot" />}
              </button>
            </div>
          </div>

          {/* location tag */}
          <div className="fd-hero__location">
            <Sprout size={12} />
            <span>{user?.district ?? "Zimbabwe"} · Farmer Mode</span>
          </div>
        </div>
      </header>

      {/* ═══ Stat Cards ═══ */}
      <section className="fd-stats" aria-label="Farm statistics">
        <div className="fd-stats__grid">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`fd-stat fd-stat--${stat.tone} animate-fade-in-up ${delayClasses[i % delayClasses.length]}`}
              >
                <div className="fd-stat__top">
                  <div className={`fd-stat__icon fd-stat__icon--${stat.tone}`}>
                    <Icon size={18} strokeWidth={1.8} />
                  </div>
                  <span className="fd-stat__label">{stat.label}</span>
                </div>
                <div className="fd-stat__value">
                  {stat.value === null ? (
                    <Loader2 className={`fd-spin fd-stat__loader fd-stat__loader--${stat.tone}`} />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className={`fd-stat__bar fd-stat__bar--${stat.tone}`} />
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ Quick Actions ═══ */}
      <section className="fd-section" aria-label="Quick actions">
        <h2 className="fd-section__title">Quick Actions</h2>
        <div className="fd-actions__grid">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="fd-action"
              >
                <div className={`fd-action__icon fd-action__icon--${action.tone}`}>
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <span className="fd-action__label">{action.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══ Market Insights ═══ */}
      <section className="fd-section" aria-label="Market insights">
        <div className="fd-section__header">
          <h2 className="fd-section__title">Market Insights</h2>
          <button onClick={() => navigate("/market-prices")} className="fd-section__link">
            View all <ArrowRight size={14} />
          </button>
        </div>
        <div className="fd-insights">
          {insights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={`fd-insight fd-insight--${item.tone}`}>
                <div className={`fd-insight__icon fd-insight__icon--${item.tone}`}>
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <div className="fd-insight__body">
                  <span className="fd-insight__title">{item.title}</span>
                  <p className="fd-insight__desc">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ Recent Activity ═══ */}
      <section className="fd-section fd-section--last" aria-label="Recent activity">
        <div className="fd-section__header">
          <h2 className="fd-section__title">Recent Activity</h2>
          <button className="fd-section__link">
            View all <ArrowRight size={14} />
          </button>
        </div>

        {loadingActivity ? (
          <div className="fd-activity-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="fd-activity fd-activity--skeleton">
                <div className="fd-activity__icon-wrap shimmer" />
                <div className="fd-activity__body">
                  <div className="shimmer skeleton-line skeleton-line--lg" />
                  <div className="shimmer skeleton-line skeleton-line--sm-short" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="fd-empty">
            <div className="fd-empty__icon">
              <Leaf size={28} className="fd-empty__icon-svg" />
            </div>
            <p className="fd-empty__title">No activity yet</p>
            <p className="fd-empty__desc">Your notifications and updates will appear here.</p>
          </div>
        ) : (
          <div className="fd-activity-list">
              {notifications.map((n, i) => {
                const { icon, tone } = activityMeta(n.notification_type);
              return (
                <div
                  key={n.id}
                    className={`fd-activity animate-fade-in-up ${!n.is_read ? "fd-activity--unread" : ""} ${delayClasses[i % delayClasses.length]}`}
                >
                    <div className={`fd-activity__icon-wrap fd-activity__icon-wrap--${tone}`}>
                    {icon}
                  </div>
                  <div className="fd-activity__body">
                    <span className="fd-activity__title">{n.title}</span>
                    <p className="fd-activity__msg">{n.message}</p>
                    <span className="fd-activity__time">{timeAgo(n.created_at)}</span>
                  </div>
                  {!n.is_read && <div className="fd-activity__dot" />}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
