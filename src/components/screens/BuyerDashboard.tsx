import { Bell, Heart, Loader2, MapPin, Search, TrendingUp, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { listingsApi, pricingApi, resolveImageUrl } from "../../lib/api";
import { categories, getFarmerById, produceListings } from "../../lib/data";
import type { Listing, PriceTrend } from "../../lib/types";
import { useAuth } from "../../lib/useAuth";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { BottomNav } from "../BottomNav";

// ── image helpers ────────────────────────────────────────────────────────────
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1761370980657-22586ea44093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";

const staticImageMap: Record<string, string> = {
  "maize-field-zimbabwe":
    "https://images.unsplash.com/photo-1649251037465-72c9d378acb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWl6ZSUyMGNvcm4lMjBmaWVsZCUyMGhhcnZlc3R8ZW58MXx8fHwxNzcwNzY5Nzg0fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "african-agriculture-technology":
    "https://images.unsplash.com/photo-1627829380497-49c37b769ea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwbWFuJTIwZmFybWVyJTIwY3JvcHN8ZW58MXx8fHwxNzcwNzY2MDcxfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "tomatoes-harvest":
    "https://images.unsplash.com/photo-1700064165267-8fa68ef07167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHRvbWF0b2VzJTIwcHJvZHVjZXxlbnwxfHx8fDE3NzA3MDk4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "butternut-squash":
    "https://images.unsplash.com/photo-1695590293008-50388acdd7fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXR0ZXJudXQlMjBzcXVhc2glMjB2ZWdldGFibGVzfGVufDF8fHx8MTc3MDc2OTc4NHww&ixlib=rb-4.1.0&q=80&w=1080",
  "african-food-market":
    "https://images.unsplash.com/photo-1761370980657-22586ea44093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwbWFya2V0JTIwZnJlc2glMjBwcm9kdWNlfGVufDF8fHx8MTc3MDc2OTc5MXww&ixlib=rb-4.1.0&q=80&w=1080",
};

// ── normalised listing shape used for rendering ──────────────────────────────
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

// ── component ────────────────────────────────────────────────────────────────
export function BuyerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOnline = useOnlineStatus();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiListings, setApiListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [trendWindow, setTrendWindow] = useState<7 | 30>(7);
  const [priceTrends, setPriceTrends] = useState<PriceTrend[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);

  // Fetch real listings from backend; fall back to static demo data on failure
  useEffect(() => {
    const fetchListings = async () => {
      setLoadingListings(true);
      try {
        const data = await listingsApi.list({ status: "active" });
        setApiListings(data);
        setUsingFallback(false);
      } catch {
        setUsingFallback(true);
      } finally {
        setLoadingListings(false);
      }
    };
    fetchListings();
  }, []);

  useEffect(() => {
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

    fetchTrends();
  }, [trendWindow, user?.district]);

  // Normalise whichever source we have into one list
  const allListings: NormalizedListing[] = useMemo(() => {
    if (usingFallback || apiListings.length === 0) {
      return produceListings.filter((l) => l.status === "active").map(fromStaticListing);
    }
    return apiListings.map(fromApiListing);
  }, [apiListings, usingFallback]);

  // Apply category + full-text search across title, district and farmer name
  const filteredListings = useMemo(() => {
    return allListings.filter((l) => {
      const matchesCategory =
        selectedCategory === "all" ||
        l.category === selectedCategory ||
        l.category.includes(selectedCategory);
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.district.toLowerCase().includes(q) ||
        (l.farmerName ?? "").toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [allListings, selectedCategory, searchQuery]);

  const topTrendItems = useMemo(() => {
    return [...priceTrends]
      .sort(
        (a, b) =>
          Math.abs(b.price_change_percent) - Math.abs(a.price_change_percent)
      )
      .slice(0, 3);
  }, [priceTrends]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-[#FFA726] text-[#2C2C2C] px-4 py-2 flex items-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>You're offline. Showing cached content.</span>
        </div>
      )}

      {/* Server unreachable notice */}
      {isOnline && usingFallback && !loadingListings && (
        <div className="bg-[#FFF8E1] border-b border-[#FFE082] px-4 py-2 text-xs text-[#856404]">
          ⚠️ Could not reach server — showing demo listings.
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-[#2C2C2C]">Browse Produce</h1>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4 text-[#757575]" />
              <span className="text-sm text-[#757575]">{user?.district ?? "Zimbabwe"}</span>
            </div>
          </div>
          <button className="relative p-2 hover:bg-[#F5F5F5] rounded-full transition-colors">
            <Bell className="w-6 h-6 text-[#2C2C2C]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF5350] rounded-full" />
          </button>
        </div>

        {/* Search Bar – live filter, no navigation redirect */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
          <input
            type="text"
            placeholder="Search produce, district, farmer…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-4 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="bg-white border-b border-[#E0E0E0] px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-[#2D5016] text-white"
                : "bg-[#F5F5F5] text-[#757575] hover:bg-[#E0E0E0]"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? "bg-[#2D5016] text-white"
                  : "bg-[#F5F5F5] text-[#757575] hover:bg-[#E0E0E0]"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[#2C2C2C]">
            {searchQuery
              ? `Results for "${searchQuery}"`
              : selectedCategory === "all"
              ? "Fresh from the Farm"
              : categories.find((c) => c.id === selectedCategory)?.name ?? "Listings"}
          </h2>
          <button
            onClick={() =>
              navigate(
                searchQuery.trim()
                  ? `/buyer/search?q=${encodeURIComponent(searchQuery.trim())}`
                  : "/buyer/search"
              )
            }
            className="text-sm text-[#4A90E2] font-medium hover:underline"
          >
            View All
          </button>
        </div>

        {loadingListings ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-[#2D5016] animate-spin mb-3" />
            <p className="text-[#757575]">Loading listings…</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-5xl mb-4">🌱</div>
            <p className="text-[#757575] text-center">No listings found.</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-2 text-sm text-[#4A90E2] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-[#757575] mb-3">
              {filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""}
              {usingFallback ? " (demo data)" : ""}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {filteredListings.slice(0, 20).map((listing) => (
                <div
                  key={listing.id}
                  onClick={() => navigate(`/product/${listing.id}`)}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-[#F5F5F5]">
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                    />
                    {listing.isOrganic && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#4CAF50] text-white text-[10px] font-semibold rounded">
                        Organic
                      </div>
                    )}
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
                    >
                      <Heart className="w-4 h-4 text-[#757575]" />
                    </button>
                    {listing.quantity < 100 && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-[#FFA726]/90 rounded text-[10px] text-white font-medium">
                        Limited Stock
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-semibold text-[#2C2C2C] truncate mb-1">
                      {listing.title}
                    </h3>
                    <p className="text-xs text-[#757575] mb-2">
                      {listing.quantity} {listing.unit} available
                    </p>

                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-lg font-bold text-[#2D5016]">
                        USD {(listing.price * listing.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-[#757575]">per {listing.quantity} {listing.unit}</span>
                    </div>

                    {listing.farmerName && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-[#E0E0E0] flex items-center justify-center text-xs font-semibold text-[#757575]">
                          {listing.farmerName[0]}
                        </div>
                        <span className="text-xs text-[#757575] truncate flex-1">
                          {listing.farmerName}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs text-[#757575]">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{listing.district}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredListings.length > 20 && (
              <button
                onClick={() =>
                  navigate(
                    searchQuery.trim()
                      ? `/buyer/search?q=${encodeURIComponent(searchQuery.trim())}`
                      : "/buyer/search"
                  )
                }
                className="w-full mt-4 py-3 rounded-xl border-2 border-[#2D5016] text-[#2D5016] text-sm font-semibold hover:bg-[#2D5016]/5 transition-colors"
              >
                View {filteredListings.length - 20} more listings →
              </button>
            )}
          </>
        )}
      </div>

      {/* Market Insights */}
      <div className="px-4 pb-6">
        <h2 className="text-lg font-semibold text-[#2C2C2C] mb-3">Market Insights</h2>
        <div className="rounded-xl border border-[#DDE7F6] bg-gradient-to-r from-[#EEF5FF] to-[#F3FAF4] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#3D7EDB]" />
              <p className="font-medium text-[#2C2C2C]">Price Trends</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white p-1">
              <button
                onClick={() => setTrendWindow(7)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  trendWindow === 7
                    ? "bg-[#2D5016] text-white"
                    : "text-[#757575] hover:bg-[#F1F1F1]"
                }`}
              >
                7D
              </button>
              <button
                onClick={() => setTrendWindow(30)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  trendWindow === 30
                    ? "bg-[#2D5016] text-white"
                    : "text-[#757575] hover:bg-[#F1F1F1]"
                }`}
              >
                30D
              </button>
            </div>
          </div>

          {loadingTrends ? (
            <div className="flex items-center gap-2 py-2 text-sm text-[#5E6A78]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading trend signals...</span>
            </div>
          ) : topTrendItems.length === 0 ? (
            <p className="text-sm text-[#5E6A78]">
              No live trend data yet. Use Market Prices for current averages.
            </p>
          ) : (
            <div className="space-y-2">
              {topTrendItems.map((trend) => {
                const change = trend.price_change_percent;
                const isUp = change > 0;
                const bar = Math.min(100, Math.max(10, Math.abs(change) * 4));
                return (
                  <div key={`${trend.produce_type}-${trend.district}`} className="rounded-lg bg-white p-2.5">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-[#2C2C2C]">{trend.produce_type}</span>
                      <span className={`${isUp ? "text-[#2D5016]" : "text-[#D14343]"} font-semibold`}>
                        {isUp ? "+" : ""}
                        {change.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mb-1 h-2 overflow-hidden rounded-full bg-[#E9EEF4]">
                      <div
                        className={`h-full rounded-full ${isUp ? "bg-[#3B9A5A]" : "bg-[#E06767]"}`}
                        style={{ width: `${bar}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#657180]">{trend.district} • Avg USD {trend.average_price.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => navigate("/market-prices")}
            className="mt-3 text-sm font-medium text-[#3D7EDB] hover:underline"
          >
            View all prices →
          </button>
        </div>
      </div>

      <BottomNav userType="buyer" />
    </div>
  );
}
