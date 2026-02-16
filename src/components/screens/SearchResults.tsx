import { ArrowLeft, Grid, Heart, List as ListIcon, Loader2, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { listingsApi } from "../../lib/api";
import type { Listing } from "../../lib/types";
import { BottomNav } from "../BottomNav";

export function SearchResults() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
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
        const data = await listingsApi.list({ status: "active" });
        setListings(data);
      } catch (err: any) {
        setError(err.message || "Failed to load listings");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.produce_type.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#E0E0E0] z-10 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#2C2C2C]" />
          </button>
          
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
            <input
              type="text"
              placeholder="Search for produce..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full h-10 pl-10 pr-4 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F5] hover:bg-[#E0E0E0] rounded-lg text-sm font-medium text-[#2C2C2C] transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
            <span className="text-sm text-[#757575]">
              {filteredListings.length} results
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[#F5F5F5] rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-[#E0E0E0]"
              }`}
            >
              <Grid className="w-4 h-4 text-[#2C2C2C]" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-[#E0E0E0]"
              }`}
            >
              <ListIcon className="w-4 h-4 text-[#2C2C2C]" />
            </button>
          </div>
        </div>

        {/* Popular Searches */}
        {!searchQuery && (
          <div className="px-4 pb-3">
            <p className="text-sm text-[#757575] mb-2">Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {["Maize", "Tomatoes", "Butternut", "Onions", "Eggs"].map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchQuery(term)}
                  className="px-3 py-1 bg-[#F5F5F5] hover:bg-[#E0E0E0] rounded-full text-sm text-[#2C2C2C] transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-[#2D5016] animate-spin mb-3" />
            <p className="text-[#757575]">Loading listings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-[#EF5350] mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[#2D5016] text-sm font-medium hover:underline"
            >
              Try again
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  onClick={() => navigate(`/product/${listing.id}`)}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="relative aspect-[4/3] bg-[#F5F5F5]">
                    <img
                      src={listing.images[0] || "https://images.unsplash.com/photo-1761370980657-22586ea44093?w=400"}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    {listing.is_organic && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-[#4CAF50] text-white text-xs font-medium rounded">
                        Organic
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm"
                    >
                      <Heart className="w-4 h-4 text-[#757575]" />
                    </button>
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-[#2C2C2C] truncate mb-1">
                      {listing.produce_type.name}
                    </h3>
                    <p className="text-xs text-[#757575] mb-2">
                      {listing.quantity_available} {listing.unit}
                    </p>

                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-lg font-bold text-[#2D5016]">
                        {listing.currency} {listing.price_per_unit}
                      </span>
                      <span className="text-xs text-[#757575]">/{listing.unit}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-[#757575]">
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
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex gap-4 p-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-[#F5F5F5] flex-shrink-0">
                      <img
                        src={listing.images[0] || "https://images.unsplash.com/photo-1761370980657-22586ea44093?w=400"}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#2C2C2C] truncate mb-1">
                        {listing.produce_type.name}
                      </h3>
                      <p className="text-sm text-[#757575] mb-2">
                        {listing.quantity_available} {listing.unit} • {listing.district}
                      </p>

                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-xl font-bold text-[#2D5016]">
                          {listing.currency} {listing.price_per_unit}
                        </span>
                        <span className="text-sm text-[#757575]">/{listing.unit}</span>
                      </div>

                      {listing.is_organic && (
                        <span className="inline-block px-2 py-0.5 bg-[#4CAF50] text-white text-xs font-medium rounded">
                          Organic
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors self-start"
                    >
                      <Heart className="w-5 h-5 text-[#757575]" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {filteredListings.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-[#757575]" />
            </div>
            <p className="text-[#757575] mb-2">No results found for "{searchQuery}"</p>
            <p className="text-sm text-[#757575]">Try different keywords or browse categories</p>
          </div>
        )}
      </div>

      <BottomNav userType="buyer" />
    </div>
  );
}
