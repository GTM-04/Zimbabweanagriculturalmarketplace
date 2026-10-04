import { Bell, Heart, Loader2, MapPin, Search, ShoppingBag, TrendingUp, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { getProduceFallbackImage, listingsApi, pricingApi, resolveImageUrl, selectPreferredImageEntry } from "../../lib/api";
import { categories, getFarmerById, produceListings } from "../../lib/data";
import type { Listing, PriceTrend } from "../../lib/types";
import { useAuth } from "../../lib/useAuth";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { BottomNav } from "../BottomNav";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1761370980657-22586ea44093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";

const staticImageMap: Record<string, string> = {
  "maize-field-zimbabwe": "https://images.unsplash.com/photo-1649251037465-72c9d378acb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  "african-agriculture-technology": "https://images.unsplash.com/photo-1627829380497-49c37b769ea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  "tomatoes-harvest": "https://images.unsplash.com/photo-1700064165267-8fa68ef07167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  "butternut-squash": "https://images.unsplash.com/photo-1695590293008-50388acdd7fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  "african-food-market": "https://images.unsplash.com/photo-1761370980657-22586ea44093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
};

interface NormalizedListing {
  id: string; title: string; quantity: number; unit: string; price: number;
  currency: string; district: string; imageUrl: string; isOrganic: boolean;
  farmerName?: string; category: string; isFromApi: boolean;
}

/** Maps a produce-type name to one of the static category slugs. */
function resolveCategory(produceName?: string): string {
  if (!produceName) return "other";
  const name = produceName.toLowerCase();
  if (["maize", "wheat", "sorghum", "millet", "barley", "rice", "groundnuts"].some(k => name.includes(k))) return "grains";
  if (["tomato", "onion", "cabbage", "spinach", "butternut", "squash", "pepper", "carrot", "cucumber", "potato", "sweet potato", "pumpkin", "lettuce", "bean", "pea"].some(k => name.includes(k))) return "vegetables";
  if (["banana", "avocado", "mango", "apple", "orange", "lemon", "pawpaw", "guava", "strawberry", "grape"].some(k => name.includes(k))) return "fruits";
  if (["cattle", "beef", "cow", "goat", "pig", "sheep", "lamb"].some(k => name.includes(k))) return "livestock";
  if (["chicken", "egg", "broiler", "layer", "duck", "turkey", "poultry"].some(k => name.includes(k))) return "poultry";
  if (["milk", "dairy", "cheese", "butter", "cream", "yoghurt"].some(k => name.includes(k))) return "dairy";
  return "other";
}

function fromApiListing(l: Listing): NormalizedListing {
  const produceName = l.produce_type?.name ?? l.title;
  const preferredImg = selectPreferredImageEntry(l.images);
  const fallback = getProduceFallbackImage(produceName, FALLBACK_IMAGE);
  return { id: l.id, title: produceName, quantity: l.quantity_available, unit: l.unit, price: l.price_per_unit, currency: "USD", district: l.district, imageUrl: resolveImageUrl(preferredImg, fallback), isOrganic: !!l.is_organic, farmerName: l.farmer_name, category: resolveCategory(produceName), isFromApi: true };
}

function fromStaticListing(l: (typeof produceListings)[0]): NormalizedListing {
  const farmer = getFarmerById(l.farmerId);
  return { id: l.id, title: l.produceName, quantity: l.quantity, unit: l.unit, price: l.pricePerUnit, currency: "USD", district: l.district, imageUrl: staticImageMap[l.images[0]] ?? FALLBACK_IMAGE, isOrganic: false, farmerName: farmer?.name, category: l.category, isFromApi: false };
}

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

  useEffect(() => {
    const fetchListings = async () => {
      setLoadingListings(true);
      if (!navigator.onLine) {
        setUsingFallback(true);
        setLoadingListings(false);
        return;
      }
      try { const data = await listingsApi.list({ status: "active" }); setApiListings(data); setUsingFallback(false); }
      catch { setUsingFallback(true); }
      finally { setLoadingListings(false); }
    };
    fetchListings();
  }, []);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoadingTrends(true);
      try { const trends = await pricingApi.getPriceTrends({ days: trendWindow, district: user?.district, limit: 6 }); setPriceTrends(trends); }
      catch { setPriceTrends([]); }
      finally { setLoadingTrends(false); }
    };
    fetchTrends();
  }, [trendWindow, user?.district]);

  const allListings: NormalizedListing[] = useMemo(() => {
    if (usingFallback) return produceListings.filter((l) => l.status === "active").map(fromStaticListing);
    return apiListings.map(fromApiListing);
  }, [apiListings, usingFallback]);

  const filteredListings = useMemo(() => allListings.filter((l) => {
    const matchCat = selectedCategory === "all" || l.category === selectedCategory || l.category.includes(selectedCategory);
    const q = searchQuery.toLowerCase();
    const matchQ = !q || l.title.toLowerCase().includes(q) || l.district.toLowerCase().includes(q) || (l.farmerName ?? "").toLowerCase().includes(q);
    return matchCat && matchQ;
  }), [allListings, selectedCategory, searchQuery]);

  const topTrendItems = useMemo(() => [...priceTrends].sort((a, b) => Math.abs(b.price_change_percent) - Math.abs(a.price_change_percent)).slice(0, 3), [priceTrends]);
  const delayClasses = ["delay-100", "delay-150", "delay-200", "delay-300", "delay-400", "delay-500"];

  return (
    <div className="bd-page">
      <BottomNav />
      {!isOnline && (<div className="bd-banner bd-banner--offline"><WifiOff size={15} /><span>Offline — showing cached content.</span></div>)}
      {isOnline && usingFallback && !loadingListings && (<div className="bd-banner bd-banner--warn"><span>⚠️ Could not reach server — showing offline listings.</span></div>)}

      {/* Header */}
      <header className="bd-header">
        <div className="bd-header__top">
          <div className="bd-header__left">
            <div className="bd-header__icon"><ShoppingBag className="bd-header__icon-svg" /></div>
            <div>
              <h1 className="bd-header__title">Browse Produce</h1>
              <div className="bd-header__location"><MapPin size={12} /><span>{user?.district ?? "Zimbabwe"}</span></div>
            </div>
          </div>
          <button aria-label="Notifications" className="bd-notif-btn">
            <Bell size={20} />
            <span className="bd-notif-dot" />
          </button>
        </div>

        <div className="bd-search-wrap">
          <Search size={16} className="bd-search-icon" />
          <input type="text" placeholder="Search produce, district, farmer…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bd-search" />
        </div>

        <div className="bd-chips">
          {[{ id: "all", name: "All", icon: "🛒" }, ...categories].map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
              className={`mp-chip ${selectedCategory === cat.id ? "mp-chip--active" : ""}`}>
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Listings */}
      <div className="bd-content">
        <div className="bd-section-head">
          <h2 className="bd-section-title">
            {searchQuery ? `"${searchQuery}"` : selectedCategory === "all" ? "Fresh from the Farm" : categories.find((c) => c.id === selectedCategory)?.name ?? "Listings"}
          </h2>
          <button onClick={() => navigate(searchQuery.trim() ? `/buyer/search?q=${encodeURIComponent(searchQuery.trim())}` : "/buyer/search")} className="bd-view-all">View All →</button>
        </div>

        {loadingListings ? (
          <div className="bd-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bd-card bd-card--skeleton">
                <div className="bd-card__img shimmer" />
                <div className="bd-card__body">
                  <div className="shimmer skeleton-line skeleton-line--lg" />
                  <div className="shimmer skeleton-line skeleton-line--md" />
                  <div className="shimmer skeleton-line skeleton-line--sm" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bd-empty">
            <span className="bd-empty__emoji">🌱</span>
            <p className="bd-empty__title">No listings found</p>
            <p className="bd-empty__desc">Try adjusting your search or filters</p>
            {searchQuery && <button onClick={() => setSearchQuery("")} className="bd-empty__clear">Clear search</button>}
          </div>
        ) : (
          <>
            <p className="bd-count">{filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""}</p>
            <div className="bd-grid">
              {filteredListings.slice(0, 20).map((listing, i) => (
                <div
                  key={listing.id}
                  onClick={() => navigate(`/product/${listing.id}`)}
                  className={`bd-card animate-fade-in-up ${delayClasses[i % delayClasses.length]}`}
                >
                  <div className="bd-card__img-wrap">
                    <img src={listing.imageUrl} alt={listing.title} onError={(e) => { const el = e.currentTarget as HTMLImageElement; if (!el.dataset.fallback) { el.dataset.fallback = 'true'; el.src = getProduceFallbackImage(listing.title, FALLBACK_IMAGE); } }} />
                    {listing.isOrganic && <span className="bd-badge bd-badge--organic">Organic</span>}
                    {listing.quantity < 100 && <span className="bd-badge bd-badge--limited">Limited</span>}
                    <button onClick={(e) => e.stopPropagation()} className="bd-save-btn" aria-label="Save"><Heart size={14} /></button>
                  </div>
                  <div className="bd-card__body">
                    <h3 className="bd-card__name">{listing.title}</h3>
                    <p className="bd-card__qty">{listing.quantity} {listing.unit} available</p>
                    <div className="bd-card__price flex flex-col">
                      <span>${(listing.price * listing.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-xs text-[#757575] font-normal mt-0.5">
                        ${(listing.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{listing.unit}
                      </span>
                    </div>
                    {listing.farmerName && (
                      <div className="bd-card__farmer">
                        <div className="bd-card__farmer-avatar">{listing.farmerName[0]}</div>
                        <span>{listing.farmerName}</span>
                      </div>
                    )}
                    <div className="bd-card__loc"><MapPin size={12} /><span>{listing.district}</span></div>
                  </div>
                </div>
              ))}
            </div>
            {filteredListings.length > 20 && (
              <button onClick={() => navigate(searchQuery.trim() ? `/buyer/search?q=${encodeURIComponent(searchQuery.trim())}` : "/buyer/search")} className="bd-more-btn">
                View {filteredListings.length - 20} more listings →
              </button>
            )}
          </>
        )}
      </div>

      {/* Market Insights */}
      <div className="bd-content bd-content--flush">
        <h2 className="bd-section-title bd-section-title--spaced">Market Insights</h2>
        <div className="bd-insights">
          <div className="bd-insights__head">
            <div className="bd-insights__left"><TrendingUp size={16} /><span>Price Trends</span></div>
            <div className="bd-trend-toggle">
              {([7, 30] as const).map((w) => (
                <button key={w} onClick={() => setTrendWindow(w)} className={`bd-trend-toggle__btn ${trendWindow === w ? "bd-trend-toggle__btn--active" : ""}`}>{w}D</button>
              ))}
            </div>
          </div>

          {loadingTrends ? (
            <div className="bd-insights__loading"><Loader2 size={16} className="fd-spin" /><span>Loading trends…</span></div>
          ) : topTrendItems.length === 0 ? (
            <p className="bd-insights__empty">No live trend data. Use Market Prices for current averages.</p>
          ) : (
            <div className="bd-trends-list">
              {topTrendItems.map((trend) => {
                const change = trend.price_change_percent;
                const isUp = change > 0;
                const bar = Math.min(100, Math.max(10, Math.abs(change) * 4));
                const barBucket = Math.min(100, Math.max(10, Math.round(bar / 10) * 10));
                return (
                  <div key={`${trend.produce_type}-${trend.district}`} className="bd-trend-item">
                    <div className="bd-trend-item__top">
                      <span className="bd-trend-item__name">{trend.produce_type}</span>
                      <span className={`bd-trend-item__change ${isUp ? "bd-trend-item__change--up" : "bd-trend-item__change--down"}`}>
                        {isUp ? "+" : ""}{change.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bd-trend-item__bar">
                      <div
                        className={`bd-trend-item__fill bd-trend-item__fill--${isUp ? "up" : "down"} bd-bar-${barBucket}`}
                      />
                    </div>
                    <p className="bd-trend-item__meta">{trend.district} · Avg USD {trend.average_price.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={() => navigate("/market-prices")} className="bd-insights__link">View all prices →</button>
        </div>
      </div>
    </div>
  );
}
