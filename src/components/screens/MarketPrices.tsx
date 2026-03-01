import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Loader2,
  Minus,
  RefreshCw,
  Search,
  WifiOff,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { pricingApi } from "../../lib/api";
import { marketPrices as staticMarketPrices } from "../../lib/data";
import type { MarketPrice } from "../../lib/types";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { BottomNav } from "../BottomNav";

// ── local fallback: convert static data to MarketPrice shape ─────────────────
const LOCAL_PRICES: MarketPrice[] = staticMarketPrices.map((p) => ({
  produce_type: p.produce,
  district: "National",
  price_min: p.min,
  price_avg: p.currentPrice,
  price_max: p.max,
  unit: p.unit,
  currency: "ZWL",
  recorded_date: new Date().toISOString().split("T")[0],
  // attach trend metadata via extra fields (we read these below)
  _change: p.change,
  _trend: p.trend,
} as MarketPrice & { _change: number; _trend: string }));

type PriceWithMeta = MarketPrice & { _change?: number; _trend?: string };

// Derive trend from price position within range when not explicitly provided
function deriveTrend(p: PriceWithMeta): "up" | "down" | "stable" {
  if (p._trend) return p._trend as "up" | "down" | "stable";
  const mid = (p.price_min + p.price_max) / 2;
  if (p.price_avg > mid * 1.03) return "up";
  if (p.price_avg < mid * 0.97) return "down";
  return "stable";
}

function TrendBadge({ trend, change }: { trend: "up" | "down" | "stable"; change?: number }) {
  if (trend === "up") return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#2D5016]">
      <ArrowUpRight className="w-3 h-3" />
      {change != null ? `+${change}%` : "Up"}
    </span>
  );
  if (trend === "down") return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFEBEE] text-[#EF5350]">
      <ArrowDownRight className="w-3 h-3" />
      {change != null ? `${change}%` : "Down"}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F5F5F5] text-[#757575]">
      <Minus className="w-3 h-3" />
      Stable
    </span>
  );
}

export function MarketPrices() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [prices, setPrices] = useState<PriceWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchPrices = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await pricingApi.getMarketPrices();
      setPrices(data as PriceWithMeta[]);
      setUsingFallback(false);
      setLastUpdated(new Date());
    } catch (err: any) {
      // Fall back to static local data so the page is never empty
      setPrices(LOCAL_PRICES as PriceWithMeta[]);
      setUsingFallback(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  // Available districts from loaded data
  const districts = useMemo(() => {
    const set = new Set(prices.map((p) => p.district).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [prices]);

  const filteredPrices = useMemo(() => {
    return prices.filter((item) => {
      const matchesSearch = item.produce_type
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesDistrict =
        selectedDistrict === "All" || item.district === selectedDistrict;
      return matchesSearch && matchesDistrict;
    });
  }, [prices, searchQuery, selectedDistrict]);

  // Summary counts
  const trendingUp = filteredPrices.filter((p) => deriveTrend(p) === "up").length;
  const trendingDown = filteredPrices.filter((p) => deriveTrend(p) === "down").length;
  const trendingStable = filteredPrices.filter((p) => deriveTrend(p) === "stable").length;

  const getTimeSinceUpdate = () => {
    const minutes = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-[#FFA726] text-[#2C2C2C] px-4 py-2 flex items-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>You're offline — showing estimated prices.</span>
        </div>
      )}
      {isOnline && usingFallback && !loading && (
        <div className="bg-[#FFF8E1] border-b border-[#FFE082] px-4 py-2 text-xs text-[#856404]">
          ⚠️ Could not reach server — showing estimated prices.
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#E0E0E0] z-10 shadow-sm">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#2C2C2C]" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-[#2C2C2C]">Market Prices</h1>
            <p className="text-xs text-[#757575]">
              {usingFallback ? "Estimated data" : `Updated ${getTimeSinceUpdate()}`}
            </p>
          </div>
          <button
            onClick={() => fetchPrices(true)}
            disabled={refreshing || !isOnline}
            className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-5 h-5 text-[#2C2C2C] ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
            <input
              type="text"
              placeholder="Search produce…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-transparent"
            />
          </div>
        </div>

        {/* District filter – only show when we have multi-district data */}
        {districts.length > 2 && (
          <div className="px-4 pb-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {districts.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDistrict(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedDistrict === d
                      ? "bg-[#2D5016] text-white"
                      : "bg-[#F5F5F5] text-[#757575] hover:bg-[#E0E0E0]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Price Cards */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-[#2D5016] animate-spin mb-3" />
            <p className="text-[#757575]">Loading market prices…</p>
          </div>
        ) : filteredPrices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#757575]">No prices found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-2 text-sm text-[#2D5016] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredPrices.map((item) => {
            const trend = deriveTrend(item);
            const change = item._change;
            return (
              <div
                key={`${item.produce_type}-${item.district}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  {/* Title row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#2C2C2C] mb-0.5">{item.produce_type}</h3>
                      <p className="text-xs text-[#757575]">
                        {item.district !== "National" ? item.district : "National avg"} • per {item.unit}
                      </p>
                    </div>
                    <TrendBadge trend={trend} change={change} />
                  </div>

                  {/* Avg price */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-[#2D5016]">
                      {item.price_avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm text-[#757575]">{item.currency ?? "ZWL"}</span>
                  </div>

                  {/* Range bar */}
                  {(() => {
                    const range = item.price_max - item.price_min;
                    const pct = range > 0
                      ? Math.round(((item.price_avg - item.price_min) / range) * 100)
                      : 50;
                    return (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-[#757575] mb-1">
                          <span>ZWL {item.price_min.toLocaleString()}</span>
                          <span>ZWL {item.price_max.toLocaleString()}</span>
                        </div>
                        <div className="relative h-1.5 bg-[#E0E0E0] rounded-full">
                          <div
                            className="absolute inset-y-0 left-0 bg-[#2D5016] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#2D5016] border-2 border-white shadow"
                            style={{ left: `calc(${pct}% - 6px)` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#E0E0E0]">
                    <div>
                      <p className="text-xs text-[#757575]">Price Range</p>
                      <p className="text-sm font-medium text-[#2C2C2C]">
                        ZWL {item.price_min.toLocaleString()} – {item.price_max.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#757575]">Recorded</p>
                      <p className="text-sm font-medium text-[#2C2C2C]">
                        {new Date(item.recorded_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Market Summary */}
      {!loading && filteredPrices.length > 0 && (
        <div className="px-4 pb-6">
          <div className="bg-gradient-to-br from-[#2D5016] to-[#7CB342] rounded-xl p-6 text-white">
            <h3 className="font-semibold mb-1">This Week's Summary</h3>
            <p className="text-sm text-white/80 mb-4">
              {trendingUp > trendingDown
                ? `Markets mostly rising — ${trendingUp} item${trendingUp !== 1 ? "s" : ""} trending up.`
                : trendingDown > trendingUp
                ? `Some price softening — ${trendingDown} item${trendingDown !== 1 ? "s" : ""} trending down.`
                : "Most produce prices are stable this week."}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/15 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">Trending Up</p>
                <p className="text-xl font-bold">{trendingUp}</p>
              </div>
              <div className="bg-white/15 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">Stable</p>
                <p className="text-xl font-bold">{trendingStable}</p>
              </div>
              <div className="bg-white/15 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">Trending Down</p>
                <p className="text-xl font-bold">{trendingDown}</p>
              </div>
            </div>
            {usingFallback && (
              <p className="text-xs text-white/60 mt-3">
                * Based on estimated local data. Connect online for live prices.
              </p>
            )}
          </div>
        </div>
      )}

      <BottomNav userType="farmer" />
    </div>
  );
}
