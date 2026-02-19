import { ArrowLeft, Loader2, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { pricingApi } from "../../lib/api";
import type { MarketPrice } from "../../lib/types";
import { BottomNav } from "../BottomNav";

export function MarketPrices() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchPrices = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await pricingApi.getMarketPrices();
      setPrices(data);
      setLastUpdated(new Date());
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load market prices");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const filteredPrices = prices.filter(item =>
    item.produce_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTimeSinceUpdate = () => {
    const minutes = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
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
            <p className="text-xs text-[#757575]">Last updated: {getTimeSinceUpdate()}</p>
          </div>
          <button 
            onClick={() => fetchPrices(true)}
            disabled={refreshing}
            className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-[#2C2C2C] ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
            <input
              type="text"
              placeholder="Search produce..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Price Cards */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-[#2D5016] animate-spin mb-3" />
            <p className="text-[#757575]">Loading market prices...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-[#EF5350] mb-2">{error}</p>
            <button
              onClick={() => fetchPrices()}
              className="text-[#2D5016] text-sm font-medium hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredPrices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#757575]">No market prices found</p>
          </div>
        ) : (
          filteredPrices.map((item) => (
            <div
              key={`${item.produce_type}-${item.district}`}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#2C2C2C] mb-1">{item.produce_type}</h3>
                    <p className="text-xs text-[#757575]">{item.district} • per {item.unit}</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-[#2D5016]">
                    {item.price_avg.toFixed(2)}
                  </span>
                  <span className="text-sm text-[#757575]">ZWL</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E0E0E0]">
                  <div>
                    <p className="text-xs text-[#757575]">Price Range</p>
                    <p className="text-sm font-medium text-[#2C2C2C]">
                      ZWL {item.price_min.toFixed(2)} - {item.price_max.toFixed(2)}
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
          ))
        )}
      </div>

      {/* Market Summary */}
      <div className="px-4 pb-6">
        <div className="bg-gradient-to-br from-[#2D5016] to-[#7CB342] rounded-xl p-6 text-white">
          <h3 className="font-semibold mb-2">This Week's Summary</h3>
          <p className="text-sm text-white/90 mb-4">
            Most produce prices are stable. Onions and White Maize showing strong growth.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/80 mb-1">Trending Up</p>
              <p className="text-lg font-bold">5 items</p>
            </div>
            <div>
              <p className="text-xs text-white/80 mb-1">Trending Down</p>
              <p className="text-lg font-bold">2 items</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav userType="farmer" />
    </div>
  );
}
