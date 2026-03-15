import { Bell, Heart, Loader2, MapPin, Search, TrendingUp, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { listingsApi, pricingApi, resolveImageUrl } from "../../lib/api";
import { categories, getFarmerById, produceListings } from "../../lib/data";
import type { Listing, PriceTrend } from "../../lib/types";
import { useAuth } from "../../lib/useAuth";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { AppShell } from "../layout/AppShell";

// Image helpers
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1761370980657-22586ea44093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";

const staticImageMap: Record<string, string> = {
  "maize-field-zimbabwe":
    "https://images.unsplash.com/photo-1649251037465-72c9d378acb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  "african-agriculture-technology":
    "https://images.unsplash.com/photo-1627829380497-49c37b769ea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  "tomatoes-harvest":
    "https://images.unsplash.com/photo-1700064165267-8fa68ef07167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  "butternut-squash":
    "https://images.unsplash.com/photo-1695590293008-50388acdd7fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  "african-food-market":
    "https://images.unsplash.com/photo-1761370980657-22586ea44093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
};

// Normalised listing shape
interface NormalizedListing {
  id: string;
  title: string;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
  district: string;
  imageUrl: string;
  isOrganic: boolean;
  farmerName?: string;
  category: string;
  isFromApi: boolean;
}

function fromApiListing(l: Listing): NormalizedListing {
  return {
    id: l.id,
    title: l.produce_type?.name ?? l.title,
    quantity: l.quantity_available,
    unit: l.unit,
    price: l.price_per_unit,
    currency: "USD",
    district: l.district,
    imageUrl: resolveImageUrl(l.images?.[0], FALLBACK_IMAGE),
    isOrganic: !!l.is_organic,
    farmerName: l.farmer_name,
    category: l.produce_type?.name?.toLowerCase() ?? "other",
    isFromApi: true,
  };
}

function fromStaticListing(l: (typeof produceListings)[0]): NormalizedListing {
  const farmer = getFarmerById(l.farmerId);
  return {
    id: l.id,
    title: l.produceName,
    quantity: l.quantity,
    unit: l.unit,
    price: l.pricePerUnit,
    currency: "USD",
    district: l.district,
    imageUrl: staticImageMap[l.images[0]] ?? FALLBACK_IMAGE,
    isOrganic: false,
    farmerName: farmer?.name,
    category: l.category,
    isFromApi: false,
  };
}

export function BuyerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOnline = useOnlineStatus();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiListings, setApiListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [trendWindow, setTrendWindow] = useState<7 | 30>(7);
  const [priceTrends, setPriceTrends] = useState<PriceTrend[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);

  // Fetch listings and trends
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoadingListings(true);
        const data = await listingsApi.list({ status: "active", page_size: 40 });
        if (!data || data.length === 0) {
          setApiListings([]);
          setUsingFallback(true);
        } else {
          setApiListings(data);
          setUsingFallback(false);
        }
      } catch {
        setApiListings([]);
        setUsingFallback(true);
      } finally {
        setLoadingListings(false);
      }
    };

    const fetchTrends = async () => {
      setLoadingTrends(true);
      try {
        const trends = await pricingApi.getPriceTrends({
          days: trendWindow,
          district: user?.district,
          limit: 6,
        });
        setPriceTrends(trends);
      } catch {
        setPriceTrends([]);
      } finally {
        setLoadingTrends(false);
      }
    };

    fetchListings();
    fetchTrends();
  }, [trendWindow, user?.district]);

  // Normalise listings
  const allListings: NormalizedListing[] = useMemo(() => {
    if (usingFallback || apiListings.length === 0) {
      return produceListings
        .filter((l) => l.status === "active")
        .map(fromStaticListing);
    }
    return apiListings.map(fromApiListing);
  }, [apiListings, usingFallback]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allListings.filter((l) => {
      const matchesCategory =
        selectedCategory === "all" || l.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      const haystack = `${l.title} ${l.district} ${l.farmerName ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allListings, selectedCategory, searchQuery]);

  const topTrendItems = useMemo(() => priceTrends.slice(0, 3), [priceTrends]);

  return (
    <AppShell
      title="Buyer dashboard"
      subtitle="Discover fresh produce and watch real-time price trends"
      userTypeOverride="buyer"
    >
      {/* Offline banner */}
      {!isOnline && (
        <div className="offline-banner flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Showing cached listings only.</span>
        </div>
      )}

      {/* Header summary */}
      <div className="rounded-2xl bg-white shadow-sm border border-[var(--gray-100)] p-4 mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--gray-500)] mb-0.5">Welcome back,</p>
          <h1
            className="text-lg font-bold text-[var(--gray-900)]"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
          >
            {user?.full_name || "Buyer"}
          </h1>
          {user?.district && (
            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[var(--gray-500)]">
              <MapPin className="w-3 h-3" />
              <span>{user.district}</span>
            </div>
          )}
        </div>
        <button className="relative rounded-full p-2.5 bg-[var(--gray-100)] hover:bg-[var(--gray-200)] transition-colors">
          <Bell className="h-5 w-5 text-[var(--gray-800)]" />
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-500)] text-[10px] text-white font-bold">
            3
          </span>
        </button>
      </div>

      {/* Search & category filters */}
      <div className="mb-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gray-500)]" />
          <input
            type="text"
            placeholder="Search by produce, farmer, or district"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 rounded-lg border border-[var(--gray-200)] bg-[var(--gray-50)] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-600)] focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 whitespace-nowrap rounded-full text-xs font-medium border transition-colors ${
              selectedCategory === "all"
                ? "bg-[var(--primary-800)] text-white border-[var(--primary-800)]"
                : "bg-white text-[var(--gray-700)] border-[var(--gray-200)] hover:bg-[var(--gray-50)]"
            }`}
          >
            All produce
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 whitespace-nowrap rounded-full text-xs font-medium border transition-colors ${
                selectedCategory === cat.id
                  ? "bg-[var(--primary-800)] text-white border-[var(--primary-800)]"
                  : "bg-white text-[var(--gray-700)] border-[var(--gray-200)] hover:bg-[var(--gray-50)]"
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Listings */}
      <div className="pb-4">
        {loadingListings ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--primary-700)]" />
            <p className="text-sm text-[var(--gray-600)]">Loading listings…</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <p className="py-6 text-sm text-[var(--gray-600)]">
            No listings match your filters. Try adjusting the search or category.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {filteredListings.slice(0, 12).map((listing) => (
              <button
                key={listing.id}
                onClick={() => navigate(`/product/${listing.id}`)}
                className="rounded-2xl bg-white shadow-sm border border-[var(--gray-100)] overflow-hidden text-left hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[4/3] bg-[var(--gray-100)]">
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      el.src = FALLBACK_IMAGE;
                    }}
                  />
                  {listing.isOrganic && (
                    <span className="absolute top-2 left-2 rounded-full bg-[var(--success)] px-2 py-0.5 text-[10px] font-medium text-white">
                      Organic
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm"
                  >
                    <Heart className="h-4 w-4 text-[var(--gray-600)]" />
                  </button>
                </div>
                <div className="p-3 space-y-1">
                  <p className="truncate text-sm font-semibold text-[var(--gray-900)]">
                    {listing.title}
                  </p>
                  <p className="text-[11px] text-[var(--gray-600)] flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{listing.district}</span>
                  </p>
                  <p className="text-sm font-bold text-[var(--primary-800)]">
                    {listing.currency} {listing.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    <span className="ml-1 text-xs font-normal text-[var(--gray-600)]">/ {listing.unit}</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Market insights */}
      <div className="pb-6">
        <h2 className="mb-2 text-lg font-semibold text-[var(--gray-900)]">Market insights</h2>
        <div className="rounded-xl border border-[var(--gray-200)] bg-gradient-to-r from-[var(--primary-50)] to-[var(--gray-50)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--info)]" />
              <p className="font-medium text-[var(--gray-900)]">Price trends</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white p-1">
              <button
                onClick={() => setTrendWindow(7)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  trendWindow === 7
                    ? "bg-[var(--primary-800)] text-white"
                    : "text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                }`}
              >
                7D
              </button>
              <button
                onClick={() => setTrendWindow(30)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  trendWindow === 30
                    ? "bg-[var(--primary-800)] text-white"
                    : "text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                }`}
              >
                30D
              </button>
            </div>
          </div>

          {loadingTrends ? (
            <div className="flex items-center gap-2 py-2 text-sm text-[var(--gray-600)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading trend signals…</span>
            </div>
          ) : topTrendItems.length === 0 ? (
            <p className="text-sm text-[var(--gray-600)]">
              No live trend data yet. Use Market Prices for current averages.
            </p>
          ) : (
            <div className="space-y-2">
              {topTrendItems.map((trend) => {
                const change = trend.price_change_percent;
                const isUp = change > 0;
                const bar = Math.min(100, Math.max(10, Math.abs(change) * 4));
                return (
                  <div
                    key={`${trend.produce_type}-${trend.district}`}
                    className="rounded-lg bg-white p-2.5"
                  >
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-[var(--gray-900)]">{trend.produce_type}</span>
                      <span
                        className={`${isUp ? "text-[var(--success)]" : "text-[var(--error)]"} font-semibold`}
                      >
                        {isUp ? "+" : ""}
                        {change.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mb-1 h-2 overflow-hidden rounded-full bg-[var(--gray-200)]">
                      <div
                        className={`h-full ${isUp ? "bg-[var(--success)]" : "bg-[var(--error)]"}`}
                        style={{ width: `${bar}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => navigate("/market-prices")}
            className="mt-3 text-sm font-medium text-[var(--info)] hover:underline"
          >
            View all prices →
          </button>
        </div>
      </div>
    </AppShell>
  );
}
