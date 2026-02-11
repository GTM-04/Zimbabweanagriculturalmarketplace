import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Search, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { BottomNav } from "../BottomNav";
import { marketPrices } from "../../lib/data";

export function MarketPrices() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPrices = marketPrices.filter(item =>
    item.produce.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-5 h-5 text-[#4CAF50]" />;
      case "down":
        return <TrendingDown className="w-5 h-5 text-[#EF5350]" />;
      default:
        return <Minus className="w-5 h-5 text-[#757575]" />;
    }
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-[#4CAF50]";
    if (change < 0) return "text-[#EF5350]";
    return "text-[#757575]";
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
            <p className="text-xs text-[#757575]">Last updated: 2 hours ago</p>
          </div>
          <button className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors">
            <RefreshCw className="w-5 h-5 text-[#2C2C2C]" />
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
        {filteredPrices.map((item) => (
          <div
            key={item.produce}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-[#2C2C2C] mb-1">{item.produce}</h3>
                  <p className="text-xs text-[#757575]">per {item.unit}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(item.trend)}
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-bold text-[#2D5016]">
                  ZWL {item.currentPrice}
                </span>
                <span className={`text-sm font-medium ${getTrendColor(item.change)}`}>
                  {item.change > 0 ? "+" : ""}{item.change}%
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E0E0E0]">
                <div>
                  <p className="text-xs text-[#757575]">Price Range</p>
                  <p className="text-sm font-medium text-[#2C2C2C]">
                    ZWL {item.min} - {item.max}
                  </p>
                </div>
                <button
                  onClick={() => {/* In real app, would show detailed trend */}}
                  className="text-sm text-[#4A90E2] font-medium hover:underline"
                >
                  View Trend →
                </button>
              </div>

              {/* Price indicator bar */}
              <div className="mt-3">
                <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2D5016] rounded-full transition-all"
                    style={{
                      width: `${((item.currentPrice - item.min) / (item.max - item.min)) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-[#757575]">Low</span>
                  <span className="text-xs text-[#757575]">High</span>
                </div>
              </div>
            </div>
          </div>
        ))}
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
