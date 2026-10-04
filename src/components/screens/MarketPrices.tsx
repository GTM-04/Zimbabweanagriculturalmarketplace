import {
    ArrowDownRight, ArrowLeft, ArrowUpRight, BarChart3, Flame, Info, Leaf,
    Loader2, Minus, RefreshCw, Search, Tag, TrendingDown, TrendingUp, WifiOff,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { pricingApi } from "../../lib/api";
import type { MarketPrice } from "../../lib/types";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { BottomNav } from "../BottomNav";

type PriceWithMeta = MarketPrice & { _change?: number; _trend?: string; category?: string };

const PRICE_RANGES: Record<string, { label: string; icon: string; produces: Array<{ name: string; min: number; max: number; unit: string; district: string }> }> = {
  vegetables: { label: "Vegetables", icon: "🥬", produces: [
    { name: "Tomatoes", min: 0.30, max: 0.80, unit: "kg", district: "Harare" },
    { name: "Red Onions", min: 0.40, max: 1.00, unit: "kg", district: "Bulawayo" },
    { name: "Butternut", min: 0.25, max: 0.70, unit: "kg", district: "Masvingo" },
    { name: "Potatoes", min: 0.35, max: 0.90, unit: "kg", district: "Nyanga" },
    { name: "Cabbage", min: 0.20, max: 0.60, unit: "head", district: "Harare" },
    { name: "Sweet Potatoes", min: 0.30, max: 0.80, unit: "kg", district: "Mutare" },
    { name: "Green Peppers", min: 0.50, max: 1.50, unit: "kg", district: "Gweru" },
    { name: "Leafy Greens", min: 0.15, max: 0.50, unit: "bunch", district: "Harare" },
  ]},
  fruits: { label: "Fruits", icon: "🍎", produces: [
    { name: "Avocados", min: 0.50, max: 1.50, unit: "kg", district: "Mutare" },
    { name: "Bananas", min: 0.40, max: 1.00, unit: "kg", district: "Chipinge" },
    { name: "Mangoes", min: 0.40, max: 1.20, unit: "kg", district: "Mazowe" },
    { name: "Oranges", min: 0.30, max: 0.90, unit: "kg", district: "Manicaland" },
    { name: "Pawpaw", min: 0.30, max: 0.80, unit: "kg", district: "Harare" },
  ]},
  grains: { label: "Grains", icon: "🌾", produces: [
    { name: "White Maize", min: 0.10, max: 0.30, unit: "kg", district: "National" },
    { name: "Sorghum", min: 0.12, max: 0.35, unit: "kg", district: "Masvingo" },
    { name: "Millet", min: 0.15, max: 0.40, unit: "kg", district: "Gweru" },
    { name: "Wheat", min: 0.20, max: 0.50, unit: "kg", district: "Harare" },
    { name: "Groundnuts", min: 0.50, max: 1.20, unit: "kg", district: "Mashonaland" },
  ]},
  livestock: { label: "Livestock", icon: "🐄", produces: [
    { name: "Cattle", min: 350, max: 800, unit: "head", district: "Harare" },
    { name: "Goats", min: 60, max: 150, unit: "head", district: "Masvingo" },
    { name: "Sheep", min: 70, max: 180, unit: "head", district: "Gweru" },
    { name: "Pigs", min: 100, max: 250, unit: "head", district: "Harare" },
  ]},
  poultry: { label: "Poultry", icon: "🐔", produces: [
    { name: "Broilers", min: 3.50, max: 8.00, unit: "bird", district: "Harare" },
    { name: "Layers", min: 4.00, max: 10.00, unit: "bird", district: "Bulawayo" },
    { name: "Eggs (Tray 30)", min: 3.00, max: 6.00, unit: "tray", district: "Harare" },
    { name: "Ducks", min: 5.00, max: 12.00, unit: "bird", district: "Mutare" },
    { name: "Guinea Fowl", min: 4.00, max: 9.00, unit: "bird", district: "Masvingo" },
  ]},
  dairy: { label: "Dairy", icon: "🥛", produces: [
    { name: "Fresh Milk", min: 0.50, max: 1.20, unit: "litre", district: "Harare" },
    { name: "Yoghurt", min: 0.80, max: 2.00, unit: "litre", district: "Bulawayo" },
    { name: "Sour Milk", min: 0.40, max: 1.00, unit: "litre", district: "National" },
    { name: "Cheese", min: 3.00, max: 8.00, unit: "kg", district: "Harare" },
    { name: "Butter", min: 2.50, max: 6.00, unit: "kg", district: "Gweru" },
  ]},
};

function r2(n: number) { return Math.round(n * 100) / 100; }

function generateLocalPrices(): PriceWithMeta[] {
  const today = new Date().toISOString().split("T")[0];
  const result: PriceWithMeta[] = [];
  for (const [catId, cat] of Object.entries(PRICE_RANGES)) {
    for (const p of cat.produces) {
      const spread = p.max - p.min;
      const min = r2(p.min + Math.random() * spread * 0.12);
      const max = r2(p.max - Math.random() * spread * 0.12);
      const avg = r2(min + Math.random() * (max - min));
      const mid = (min + max) / 2;
      const trend: "up" | "down" | "stable" = avg > mid * 1.04 ? "up" : avg < mid * 0.96 ? "down" : "stable";
      const change = trend === "up" ? Math.round(Math.random() * 15 + 1) : trend === "down" ? -Math.round(Math.random() * 10 + 1) : 0;
      result.push({ produce_type: p.name, district: p.district, price_min: min, price_avg: avg, price_max: max, unit: p.unit, currency: "USD", recorded_date: today, category: catId, _change: change, _trend: trend });
    }
  }
  return result;
}

const SEASONAL_TIPS = [
  { icon: "🌧️", text: "Post-rainy season: expect maize and legume prices to ease as the harvest arrives." },
  { icon: "🥬", text: "Leafy greens are in peak supply — buy or sell now before dry-season heat." },
  { icon: "🐄", text: "Cattle prices firm up as water sources recede in semi-arid regions." },
  { icon: "🍊", text: "Citrus season begins: watch for price drops as Manicaland harvests peak." },
  { icon: "🌽", text: "White maize: GMB prices historically support farm-gate floors through June." },
];

function deriveTrend(p: PriceWithMeta): "up" | "down" | "stable" {
  if (p._trend) return p._trend as "up" | "down" | "stable";
  const mid = (p.price_min + p.price_max) / 2;
  if (p.price_avg > mid * 1.03) return "up";
  if (p.price_avg < mid * 0.97) return "down";
  return "stable";
}

function getTrendInsight(item: PriceWithMeta): string {
  const trend = deriveTrend(item);
  const name = item.produce_type.toLowerCase();
  const insights: Record<string, [string, string, string]> = {
    "tomatoes": ["High restaurant & export demand", "Peak-season surplus from Masvingo", "Steady urban demand"],
    "red onions": ["Low carryover stocks", "Good rains boosted yields", "Supply and demand balanced"],
    "butternut": ["Winter demand building early", "Bumper crop in Mashonaland", "Processing demand steady"],
    "potatoes": ["Cold-storage draw-down", "New-season Nyanga crop", "Stable highland supply"],
    "white maize": ["GMB purchasing boosting prices", "Post-harvest surplus", "Price near support level"],
    "cattle": ["Festive demand building", "Farmers destocking for dry season", "Auction prices steady"],
    "broilers": ["Day-old chick shortage", "Improved feed availability", "Commercial demand steady"],
  };
  const e = insights[name];
  if (e) return trend === "up" ? e[0] : trend === "down" ? e[1] : e[2];
  return trend === "up" ? "Demand exceeding supply" : trend === "down" ? "Supply surplus in markets" : "Prices in equilibrium";
}

function fmtPrice(n: number) { return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export function MarketPrices() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [prices, setPrices] = useState<PriceWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchPrices = async (isRefresh = false) => {
    const freshLocal = generateLocalPrices();
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await pricingApi.getMarketPrices();
      if (!data || data.length === 0) { setPrices(freshLocal); setUsingFallback(true); }
      else { setPrices(data as PriceWithMeta[]); setUsingFallback(false); }
      setLastUpdated(new Date());
    } catch { setPrices(freshLocal); setUsingFallback(true); setLastUpdated(new Date()); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchPrices(); }, []);

  const districts = useMemo(() => { const s = new Set(prices.map(p => p.district).filter(Boolean)); return ["All", ...Array.from(s).sort()]; }, [prices]);

  const filteredPrices = useMemo(() => prices.filter(item => {
    const ms = item.produce_type.toLowerCase().includes(searchQuery.toLowerCase());
    const md = selectedDistrict === "All" || item.district === selectedDistrict;
    const mc = selectedCategory === "All" || item.category === selectedCategory;
    return ms && md && mc;
  }), [prices, searchQuery, selectedDistrict, selectedCategory]);

  const trendingUp = filteredPrices.filter(p => deriveTrend(p) === "up").length;
  const trendingDown = filteredPrices.filter(p => deriveTrend(p) === "down").length;
  const trendingStable = filteredPrices.filter(p => deriveTrend(p) === "stable").length;

  const topGainers = useMemo(() => [...filteredPrices].filter(p => deriveTrend(p) === "up" && (p._change ?? 0) > 0).sort((a, b) => (b._change ?? 0) - (a._change ?? 0)).slice(0, 4), [filteredPrices]);
  const topLosers = useMemo(() => [...filteredPrices].filter(p => deriveTrend(p) === "down" && (p._change ?? 0) < 0).sort((a, b) => (a._change ?? 0) - (b._change ?? 0)).slice(0, 3), [filteredPrices]);
  const bestValue = useMemo(() => [...filteredPrices].filter(p => p.price_max > p.price_min).map(p => ({ ...p, _pctFromLow: (p.price_avg - p.price_min) / (p.price_max - p.price_min) })).filter(p => p._pctFromLow <= 0.30).sort((a, b) => a._pctFromLow - b._pctFromLow).slice(0, 3), [filteredPrices]);
  const activeTip = useMemo(() => SEASONAL_TIPS[new Date().getDate() % SEASONAL_TIPS.length], []);
  const delayClasses = ["delay-100", "delay-150", "delay-200", "delay-300", "delay-400", "delay-500"];
  const pulseTotal = Math.max(filteredPrices.length, 1);
  const toPulseBucket = (value: number, total: number) =>
    Math.min(100, Math.max(10, Math.round((value / total) * 10) * 10));
  const toPercentBucket = (value: number) => Math.min(100, Math.max(0, Math.round(value / 10) * 10));
  const upBucket = toPulseBucket(trendingUp, pulseTotal);
  const stableBucket = toPulseBucket(trendingStable, pulseTotal);
  const downBucket = toPulseBucket(trendingDown, pulseTotal);

  const getTimeSinceUpdate = () => { const m = Math.floor((Date.now() - lastUpdated.getTime()) / 60000); if (m < 1) return "Just now"; if (m < 60) return `${m} min ago`; return `${Math.floor(m / 60)}h ago`; };

  const categories = [{ id: "All", label: "All", icon: "🛒" }, ...Object.entries(PRICE_RANGES).map(([id, c]) => ({ id, label: c.label, icon: c.icon }))];

  return (
    <div className="mp-page">
      <BottomNav />
      {!isOnline && (<div className="mp-banner mp-banner--offline"><WifiOff size={15} /><span>Offline — showing estimated prices.</span></div>)}


      {/* Header */}
      <header className="mp-header">
        <div className="mp-header__top">
          <button onClick={() => navigate(-1)} className="mp-back"><ArrowLeft size={18} /></button>
          <div className="mp-header__title-wrap">
            <div className="mp-header__icon"><BarChart3 size={16} className="mp-header__icon-svg" /></div>
            <div>
              <h1 className="mp-header__title">Market Prices</h1>
              <p className="mp-header__sub">{usingFallback ? "Estimated data" : `Updated ${getTimeSinceUpdate()}`}</p>
            </div>
          </div>
          <button onClick={() => fetchPrices(true)} disabled={refreshing || !isOnline} className="mp-refresh">
            <RefreshCw size={16} className={refreshing ? "fd-spin" : ""} />
          </button>
        </div>

        <div className="mp-search-wrap">
          <Search size={16} className="mp-search-icon" />
          <input type="text" placeholder="Search produce…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="mp-search" />
        </div>

        <div className="mp-chips">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSelectedDistrict("All"); }}
              className={`mp-chip ${selectedCategory === cat.id ? "mp-chip--active" : ""}`}>
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>

        {districts.length > 2 && (
          <div className="mp-chips mp-chips--district">
            {districts.map(d => (
              <button key={d} onClick={() => setSelectedDistrict(d)}
                className={`mp-chip ${selectedDistrict === d ? "mp-chip--district-active" : ""}`}>{d}</button>
            ))}
          </div>
        )}
      </header>

      {/* Loading */}
      {loading && (<div className="mp-loading"><Loader2 size={32} className="fd-spin" /><p>Loading market prices…</p></div>)}

      {!loading && filteredPrices.length > 0 && (
        <div className="mp-content">
          {/* Market Pulse */}
          <div className="mp-pulse">
            <div className="mp-pulse__head">
              <div><h2 className="mp-pulse__title"><TrendingUp size={16} /> Market Pulse</h2>
                <p className="mp-pulse__sub">{filteredPrices.length} items tracked{selectedCategory !== "All" ? ` · ${PRICE_RANGES[selectedCategory]?.label}` : ""}</p></div>
              <span className={`mp-pulse__badge ${usingFallback ? "mp-pulse__badge--est" : ""}`}>{usingFallback ? "Estimated" : "Live"}</span>
            </div>
            <div className="mp-pulse__bar">
              {trendingUp > 0 && <div className={`mp-pulse__seg mp-pulse__seg--up mp-bar-${upBucket}`} />}
              {trendingStable > 0 && <div className={`mp-pulse__seg mp-pulse__seg--stable mp-bar-${stableBucket}`} />}
              {trendingDown > 0 && <div className={`mp-pulse__seg mp-pulse__seg--down mp-bar-${downBucket}`} />}
            </div>
            <div className="mp-pulse__legend">
              <span className="mp-pulse__leg mp-pulse__leg--up"><ArrowUpRight size={14} />{trendingUp} Rising</span>
              <span className="mp-pulse__leg"><Minus size={14} />{trendingStable} Stable</span>
              <span className="mp-pulse__leg mp-pulse__leg--down"><ArrowDownRight size={14} />{trendingDown} Falling</span>
            </div>
          </div>

          {/* Hot Gainers */}
          {topGainers.length > 0 && (
            <div className="mp-section">
              <div className="mp-section__head"><Flame size={16} className="mp-icon-warning" /><h2>Hot Right Now</h2><span>Biggest gainers</span></div>
              <div className="mp-scroll-row">
                {topGainers.map(item => (
                  <div key={item.produce_type} className="mp-gainer">
                    <p className="mp-gainer__name">{item.produce_type}</p>
                    <p className="mp-gainer__price">${fmtPrice(item.price_avg)}</p>
                    <div className="mp-gainer__change"><ArrowUpRight size={12} /> +{item._change}%</div>
                    <p className="mp-gainer__meta">per {item.unit} · {item.district}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Drops */}
          {topLosers.length > 0 && (
            <div className="mp-section">
              <div className="mp-section__head"><TrendingDown size={16} className="mp-icon-error" /><h2>Price Drops</h2><span>Best deals</span></div>
              <div className="mp-scroll-row">
                {topLosers.map(item => (
                  <div key={item.produce_type} className="mp-loser">
                    <p className="mp-gainer__name">{item.produce_type}</p>
                    <p className="mp-loser__price">${fmtPrice(item.price_avg)}</p>
                    <div className="mp-loser__change"><ArrowDownRight size={12} /> {item._change}%</div>
                    <p className="mp-gainer__meta">per {item.unit} · {item.district}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Value */}
          {bestValue.length > 0 && (
            <div className="mp-value">
              <div className="mp-value__head"><Tag size={16} /><h2>Best Value Buys</h2></div>
              <p className="mp-value__sub">Priced near seasonal low — good buying opportunity</p>
              {bestValue.map(item => {
                const pct = Math.round(((item.price_avg - item.price_min) / (item.price_max - item.price_min)) * 100);
                return (
                  <div key={item.produce_type} className="mp-value__item">
                    <div><p className="mp-value__name">{item.produce_type}</p><p className="mp-value__detail">{pct}% above seasonal low · {item.district}</p></div>
                    <div className="mp-value__right"><p className="mp-value__price">${fmtPrice(item.price_avg)}</p><p className="mp-value__unit">/{item.unit}</p></div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Seasonal Tip */}
          <div className="mp-tip">
            <span className="mp-tip__icon">{activeTip.icon}</span>
            <div><p className="mp-tip__label">Seasonal Insight</p><p className="mp-tip__text">{activeTip.text}</p></div>
          </div>

          {/* Price Cards */}
          {filteredPrices.map((item, i) => {
            const trend = deriveTrend(item);
            const range = item.price_max - item.price_min;
            const pct = range > 0 ? Math.round(((item.price_avg - item.price_min) / range) * 100) : 50;
            const pctBucket = toPercentBucket(pct);
            return (
              <div key={`${item.produce_type}-${item.district}`} className={`mp-card animate-fade-in-up ${delayClasses[i % delayClasses.length]}`}>
                <div className="mp-card__top">
                  <div><h3 className="mp-card__name">{item.produce_type}</h3><p className="mp-card__district">{item.district !== "National" ? item.district : "National avg"} · per {item.unit}</p></div>
                  <span className={`mp-trend mp-trend--${trend}`}>
                    {trend === "up" ? <><ArrowUpRight size={12} /> +{item._change}%</> : trend === "down" ? <><ArrowDownRight size={12} /> {item._change}%</> : <><Minus size={12} /> Stable</>}
                  </span>
                </div>
                <div className="mp-card__price">${fmtPrice(item.price_avg)} <span>{item.currency ?? "USD"}</span></div>
                <div className="mp-card__range">
                  <div className="mp-card__range-labels"><span>${fmtPrice(item.price_min)}</span><span>${fmtPrice(item.price_max)}</span></div>
                  <div className="mp-card__range-track">
                    <div className={`mp-card__range-fill mp-bar-${pctBucket}`} />
                    <div className={`mp-card__range-dot mp-dot-${pctBucket}`} />
                  </div>
                </div>
                <div className="mp-card__insight"><Info size={13} /><p>{getTrendInsight(item)}</p></div>
              </div>
            );
          })}

          {/* Weekly Summary */}
          <div className="mp-summary">
            <h3 className="mp-summary__title">This Week's Summary</h3>
            <p className="mp-summary__desc">{trendingUp > trendingDown ? `Markets mostly rising — ${trendingUp} items trending up.` : trendingDown > trendingUp ? `Some price softening — ${trendingDown} items down.` : "Most prices are stable this week."}</p>
            <div className="mp-summary__grid">
              <div className="mp-summary__stat"><p className="mp-summary__stat-label">Rising</p><p className="mp-summary__stat-value">{trendingUp}</p></div>
              <div className="mp-summary__stat"><p className="mp-summary__stat-label">Stable</p><p className="mp-summary__stat-value">{trendingStable}</p></div>
              <div className="mp-summary__stat"><p className="mp-summary__stat-label">Falling</p><p className="mp-summary__stat-value">{trendingDown}</p></div>
            </div>
            {usingFallback && <p className="mp-summary__note">* Based on estimated local data.</p>}
          </div>
        </div>
      )}

      {!loading && filteredPrices.length === 0 && (
        <div className="mp-empty">
          <Leaf size={32} className="mp-empty__icon" />
          <p>No prices found</p>
          {searchQuery && <button onClick={() => setSearchQuery("")} className="mp-empty__clear">Clear search</button>}
        </div>
      )}
    </div>
  );
}
