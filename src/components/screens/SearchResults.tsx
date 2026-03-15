import { ArrowLeft, Grid, Heart, List as ListIcon, Loader2, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { listingsApi, resolveImageUrl } from "../../lib/api";
import { getFarmerById, produceListings } from "../../lib/data";
import type { Listing } from "../../lib/types";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { AppShell } from "../layout/AppShell";

const fallbackImage = "https://images.unsplash.com/photo-1761370980657-22586ea44093?w=400";

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
    images: [fallbackImage],
    farmer_name: farmer?.name,
  };
}

export function SearchResults() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch listings
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const data = await listingsApi.list({ status: "active", page_size: 200 });
        if (data.length === 0) {
          setListings(produceListings.filter((l) => l.status === "active").map(fromStaticListing));
        } else {
          setListings(data);
        }
        setError("");
      } catch (err: any) {
        setListings(produceListings.filter((l) => l.status === "active").map(fromStaticListing));
        setError(err.message || "Using cached listings while server is unavailable");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const value = searchQuery.trim();
    if (value) {
      next.set("q", value);
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  }, [searchQuery, searchParams, setSearchParams]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((listing) => {
      const title = (listing.title || "").toLowerCase();
      const produceType = (listing.produce_type?.name || "").toLowerCase();
      const district = (listing.district || "").toLowerCase();
      const farmer = (listing.farmer_name || "").toLowerCase();
      const description = (listing.description || "").toLowerCase();
      return (
        title.includes(q) ||
        produceType.includes(q) ||
        district.includes(q) ||
        farmer.includes(q) ||
        description.includes(q)
      );
    });
  }, [listings, searchQuery]);

  return (
    <AppShell
      title="Search results"
      subtitle="Browse active listings that match your search"
      userTypeOverride="buyer"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[var(--gray-200)] z-10 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#2C2C2C]" />
          </button>
          
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--gray-500)]" />
            <input
              type="text"
              placeholder="Search for produce..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full h-10 pl-10 pr-4 bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-600)] focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--gray-50)] hover:bg-[var(--gray-100)] rounded-lg text-sm font-medium text-[var(--gray-800)] transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
            <span className="text-sm text-[var(--gray-600)]">
              {filteredListings.length} results
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[var(--gray-50)] rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-[var(--gray-100)]"
              }`}
            >
              <Grid className="w-4 h-4 text-[#2C2C2C]" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-[var(--gray-100)]"
              }`}
            >
              <ListIcon className="w-4 h-4 text-[#2C2C2C]" />
            </button>
          </div>
        </div>

        {/* Popular Searches */}
        {!searchQuery && (
          <div className="px-4 pb-3">
            <p className="text-sm text-[var(--gray-600)] mb-2">Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {["Maize", "Tomatoes", "Butternut", "Onions", "Eggs"].map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchQuery(term)}
                  className="px-3 py-1 bg-[var(--gray-50)] hover:bg-[var(--gray-100)] rounded-full text-xs sm:text-sm text-[var(--gray-800)] transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="p-4 space-y-4">
        {!isOnline && (
          <div className="mb-4 rounded-xl border border-[#FFD28A] bg-[#FFF6E6] px-4 py-3 text-xs text-[#7A4A00]">
            You are offline. Searching cached listings only.
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-[var(--primary-700)] animate-spin mb-3" />
            <p className="text-[var(--gray-600)]">Loading listings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-[var(--error-red)] mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[var(--primary-700)] text-sm font-medium hover:underline"
            >
              Try again
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  onClick={() => navigate(`/product/${listing.id}`)}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer border border-[var(--gray-100)]"
                >
                  <div className="relative aspect-[4/3] bg-[var(--gray-100)]">
                    <img
                      src={resolveImageUrl(listing.images?.[0], fallbackImage)}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement;
                        if (!el.dataset.fallback) {
                          el.dataset.fallback = 'true';
                          el.src = fallbackImage;
                        }
                      }}
                    />
                    {listing.is_organic && (
                      <div className="absolute top-2 left-2 badge badge-primary text-[9px] px-2 py-0.5">
                        Organic
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm"
                    >
                      <Heart className="w-4 h-4 text-[var(--gray-500)]" />
                    </button>
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-[var(--gray-900)] truncate mb-1 text-sm">
                      {listing.produce_type?.name || listing.title}
                    </h3>
                    <p className="text-[10px] text-[var(--gray-600)] mb-2">
                      {listing.quantity_available} {listing.unit} • {listing.district}
                    </p>

                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-base font-bold text-[var(--primary-800)]">
                        {(listing.currency || "USD")} {listing.price_per_unit}
                      </span>
                      <span className="text-[10px] text-[var(--gray-600)]">/{listing.unit}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-[var(--gray-600)]">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{listing.district}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  onClick={() => navigate(`/product/${listing.id}`)}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer border border-[var(--gray-100)]"
                >
                  <div className="flex gap-4 p-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-[var(--gray-100)] flex-shrink-0">
                      <img
                        src={resolveImageUrl(listing.images?.[0], fallbackImage)}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const el = e.currentTarget as HTMLImageElement;
                          if (!el.dataset.fallback) {
                            el.dataset.fallback = 'true';
                            el.src = fallbackImage;
                          }
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--gray-900)] truncate mb-1">
                        {listing.produce_type?.name || listing.title}
                      </h3>
                      <p className="text-sm text-[var(--gray-600)] mb-2">
                        {listing.quantity_available} {listing.unit} • {listing.district}
                      </p>

                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-xl font-bold text-[var(--primary-800)]">
                          {(listing.currency || "USD")} {listing.price_per_unit}
                        </span>
                        <span className="text-sm text-[var(--gray-600)]">/{listing.unit}</span>
                      </div>

                      {listing.is_organic && (
                        <span className="inline-block px-2 py-0.5 bg-[var(--success)] text-white text-xs font-medium rounded">
                          Organic
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                        className="p-2 hover:bg-[var(--gray-100)] rounded-full transition-colors self-start"
                    >
                        <Heart className="w-5 h-5 text-[var(--gray-500)]" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {filteredListings.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-[var(--gray-100)] flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-[var(--gray-500)]" />
            </div>
            <p className="text-[var(--gray-600)] mb-2">No results found for "{searchQuery}"</p>
            <p className="text-sm text-[var(--gray-600)]">Try different keywords or browse categories</p>
          </div>
        )}
      </div>

    </AppShell>
  );
}
