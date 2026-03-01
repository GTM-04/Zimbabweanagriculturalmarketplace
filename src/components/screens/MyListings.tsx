import { AlertCircle, ArrowLeft, Eye, Filter, Loader2, MessageCircle, MoreVertical, Plus, Search, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { listingsApi, resolveImageUrl } from "../../lib/api";
import type { Listing } from "../../lib/types";
import { BottomNav } from "../BottomNav";
import { Button } from "../ui/button";

const CACHE_KEY_PREFIX = "cached_my_listings_";

export function MyListings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"active" | "sold" | "expired">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [usingCache, setUsingCache] = useState(false);

  // Get logged-in user from localStorage
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const cacheKey = currentUser?.id ? `${CACHE_KEY_PREFIX}${currentUser.id}` : null;

  // React to network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Re-fetch from server when connection is restored
      fetchListings();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [currentUser?.id]);

  const fetchListings = async () => {
    if (!currentUser?.id) {
      setError("User not authenticated. Please log in.");
      setLoading(false);
      return;
    }

    // If offline, load from cache immediately
    if (!navigator.onLine) {
      const cached = cacheKey ? localStorage.getItem(cacheKey) : null;
      if (cached) {
        setListings(JSON.parse(cached));
        setUsingCache(true);
        setError(null);
      } else {
        setError("You're offline and no cached listings are available.");
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUsingCache(false);
      const data = await listingsApi.list({ farmer_id: currentUser.id });
      setListings(data);
      // Persist to cache for offline use
      if (cacheKey) {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (err: any) {
      console.error("Failed to fetch listings:", err);
      // Fall back to cached data if the network call fails
      const cached = cacheKey ? localStorage.getItem(cacheKey) : null;
      if (cached) {
        setListings(JSON.parse(cached));
        setUsingCache(true);
        setError(null);
      } else {
        setError(err.message || "Failed to load listings. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [currentUser?.id]);

  const filteredListings = listings
    .filter(l => l.status === activeTab)
    .filter(l =>
      searchQuery.trim() === "" ||
      l.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.produce_type?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const countByStatus = (status: string) => listings.filter(l => l.status === status).length;

  const FALLBACK_IMG =
    "https://images.unsplash.com/photo-1649251037465-72c9d378acb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

  const getImageUrl = (images: string[]) => {
    return resolveImageUrl(images?.[0], FALLBACK_IMG);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-[#FFA726] text-[#2C2C2C] px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Showing cached listings.</span>
        </div>
      )}

      {/* Cached data notice (online but using stale cache due to API error) */}
      {isOnline && usingCache && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-700 px-4 py-2 flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Showing cached data. Pull to refresh.</span>
          </div>
          <button
            onClick={fetchListings}
            className="text-xs font-semibold underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#E0E0E0] z-10 shadow-sm">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/farmer/dashboard")}
            className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#2C2C2C]" />
          </button>
          <h1 className="text-xl font-semibold text-[#2C2C2C] flex-1">My Listings</h1>
          <button className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors">
            <Filter className="w-5 h-5 text-[#2C2C2C]" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E0E0E0]">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "active"
                ? "text-[#2D5016]"
                : "text-[#757575] hover:text-[#2C2C2C]"
            }`}
          >
            Active ({countByStatus("active")})
            {activeTab === "active" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D5016]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("sold")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "sold"
                ? "text-[#2D5016]"
                : "text-[#757575] hover:text-[#2C2C2C]"
            }`}
          >
            Sold ({countByStatus("sold")})
            {activeTab === "sold" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D5016]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("expired")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "expired"
                ? "text-[#2D5016]"
                : "text-[#757575] hover:text-[#2C2C2C]"
            }`}
          >
            Expired ({countByStatus("expired")})
            {activeTab === "expired" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D5016]"></div>
            )}
          </button>
        </div>
      </div>

      {/* Listings */}
      <div className="p-4 space-y-3">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-[#2D5016] animate-spin" />
            <p className="text-[#757575] text-sm">Loading listings...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-red-500 font-medium">{error}</p>
            <Button
              onClick={fetchListings}
              variant="outline"
              className="border-[#2D5016] text-[#2D5016]"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Listing cards */}
        {!loading && !error && filteredListings.map((listing) => (
          <div
            key={listing.id}
            onClick={() => navigate(`/product/${listing.id}`)}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex gap-4 p-4">
              {/* Image */}
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-[#F5F5F5] flex-shrink-0">
                <img
                  src={getImageUrl(listing.images)}
                  alt={listing.title || listing.produce_type?.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#2C2C2C] truncate">
                      {listing.title || listing.produce_type?.name}
                    </h3>
                    <p className="text-sm text-[#757575]">
                      {listing.quantity_available} {listing.unit}
                    </p>
                  </div>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 hover:bg-[#F5F5F5] rounded-full transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-[#757575]" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-[#2D5016]">
                    {listing.currency || "ZWL"} {listing.price_per_unit}
                  </span>
                  <span className="text-sm text-[#757575]">per {listing.unit}</span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-[#757575]">
                    <Eye className="w-4 h-4" />
                    <span>{listing.views ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#757575]">
                    <MessageCircle className="w-4 h-4" />
                    <span>{listing.inquiries ?? 0}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-auto capitalize ${
                    listing.status === "active"
                      ? "bg-[#4CAF50]/10 text-[#4CAF50]"
                      : listing.status === "sold"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {listing.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {!loading && !error && filteredListings.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-[#757575]" />
            </div>
            {activeTab === "active" ? (
              <>
                <p className="text-[#757575] mb-4">You haven't listed any produce yet</p>
                <Button
                  onClick={() => navigate("/farmer/list-produce")}
                  className="bg-[#2D5016] hover:bg-[#234010] text-white"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Listing
                </Button>
              </>
            ) : (
              <p className="text-[#757575]">No {activeTab} listings found</p>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate("/farmer/list-produce")}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[#2D5016] hover:bg-[#234010] text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomNav userType="farmer" />
    </div>
  );
}

function Package(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}
