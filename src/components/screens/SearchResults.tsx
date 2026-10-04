import { ArrowLeft, Heart, MapPin, Search, WifiOff, ArrowUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getProduceFallbackImage, listingsApi, resolveImageUrl, selectPreferredImageEntry } from "../../lib/api";
import { getFarmerById, produceListings } from "../../lib/data";
import type { Listing } from "../../lib/types";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { BottomNav } from "../BottomNav";

const GENERIC_FALLBACK = "https://images.unsplash.com/photo-1761370980657-22586ea44093?w=400";

function fromStaticListing(item: (typeof produceListings)[number]): Listing {
  const farmer = getFarmerById(item.farmerId);
  return {
    id: item.id,
    title: item.produceName,
    produce_type: { id: 0, name: item.produceName },
    quantity_available: item.quantity,
    unit: item.unit,
    price_per_unit: item.pricePerUnit,
    currency: item.currency,
    district: item.district,
    status: "active",
    is_organic: false,
    description: item.description,
    images: [GENERIC_FALLBACK],
    farmer_name: farmer?.name,
  };
}

const POPULAR_SEARCHES = ["Maize", "Tomatoes", "Butternut", "Onions", "Eggs"];

export function SearchResults() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        if (!navigator.onLine) {
          setListings(produceListings.filter((l) => l.status === "active").map(fromStaticListing));
          return;
        }
        const data = await listingsApi.list({ status: "active", page_size: 100 });
        setListings(data);
      } catch {
        setListings(produceListings.filter((l) => l.status === "active").map(fromStaticListing));
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const value = searchQuery.trim();
    if (value) next.set("q", value);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  }, [searchQuery, searchParams, setSearchParams]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = listings;
    if (q) {
      result = listings.filter((l) =>
        (l.title || "").toLowerCase().includes(q) ||
        (l.produce_type?.name || "").toLowerCase().includes(q) ||
        (l.district || "").toLowerCase().includes(q) ||
        (l.farmer_name || "").toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q)
      );
    }
    
    return result.sort((a, b) => {
      const dateA = new Date(a.created_at || "1970-01-01").getTime();
      const dateB = new Date(b.created_at || "1970-01-01").getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [listings, searchQuery, sortOrder]);

  const delayClasses = ["delay-100", "delay-150", "delay-200", "delay-300", "delay-400", "delay-500"];

  return (
    <div className="bd-page">
      <BottomNav />
      {!isOnline && (<div className="bd-banner bd-banner--offline"><WifiOff size={15} /><span>Offline — searching cached listings only.</span></div>)}

      {/* Header */}
      <header className="bd-header">
        <div className="bd-header__top">
          <div className="bd-header__left">
            <button onClick={() => navigate(-1)} className="mp-back"><ArrowLeft size={18} /></button>
            <div className="bd-header__icon"><Search className="bd-header__icon-svg" /></div>
            <div>
              <h1 className="bd-header__title">Search</h1>
              <div className="bd-header__location"><MapPin size={12} /><span>Zimbabwe</span></div>
            </div>
          </div>
        </div>

        <div className="bd-search-wrap">
          <Search size={16} className="bd-search-icon" />
          <input
            type="text"
            placeholder="Search produce..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="bd-search"
          />
        </div>

        {/* Popular searches */}
        {!searchQuery && (
          <div className="bd-chips" style={{ paddingBottom: '14px' }}>
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="mp-chip"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Results */}
      <div className="bd-content">
        <div className="bd-section-head">
          <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
            <h2 className="bd-section-title">
              {searchQuery ? `Results for "${searchQuery}"` : "All Listings"}
            </h2>
            <span className="text-xs font-medium text-muted">
              {loading ? "..." : `${filteredListings.length} results`}
            </span>
          </div>
          
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <ArrowUpDown size={14} className="text-muted" />
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
              style={{
                background: "var(--input-background)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--foreground)",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {loading ? (
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
        ) : filteredListings.length === 0 && searchQuery ? (
          <div className="bd-empty">
            <span className="bd-empty__emoji">🔍</span>
            <p className="bd-empty__title">No results for "{searchQuery}"</p>
            <p className="bd-empty__desc">Try different keywords or browse categories</p>
            <button
              onClick={() => setSearchQuery("")}
              className="bd-empty__clear"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="bd-grid">
            {filteredListings.map((listing, i) => (
              <div
                key={listing.id}
                onClick={() => navigate(`/product/${listing.id}`)}
                className={`bd-card animate-fade-in-up ${delayClasses[i % delayClasses.length]}`}
              >
                <div className="bd-card__img-wrap">
                  <img
                    src={resolveImageUrl(
                      selectPreferredImageEntry(listing.images),
                      getProduceFallbackImage(listing.produce_type?.name ?? listing.title, GENERIC_FALLBACK)
                    )}
                    alt={listing.title}
                    onError={(e) => { const el = e.currentTarget as HTMLImageElement; if (!el.dataset.fallback) { el.dataset.fallback = "true"; el.src = getProduceFallbackImage(listing.produce_type?.name ?? listing.title, GENERIC_FALLBACK); } }}
                  />
                  {listing.is_organic && <span className="bd-badge bd-badge--organic">Organic</span>}
                  {listing.quantity_available < 100 && <span className="bd-badge bd-badge--limited">Limited</span>}
                  <button onClick={(e) => e.stopPropagation()} className="bd-save-btn" aria-label="Save"><Heart size={14} /></button>
                </div>
                <div className="bd-card__body">
                  <h3 className="bd-card__name">{listing.produce_type?.name || listing.title}</h3>
                  <p className="bd-card__qty">{listing.quantity_available} {listing.unit} available</p>
                  <div className="bd-card__price flex flex-col">
                    <span>${(listing.price_per_unit * listing.quantity_available).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-xs text-[#757575] font-normal mt-0.5">
                      ${(listing.price_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{listing.unit}
                    </span>
                  </div>
                  {listing.farmer_name && (
                    <div className="bd-card__farmer">
                      <div className="bd-card__farmer-avatar">{listing.farmer_name[0]}</div>
                      <span>{listing.farmer_name}</span>
                    </div>
                  )}
                  <div className="bd-card__loc"><MapPin size={12} /><span>{listing.district}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
