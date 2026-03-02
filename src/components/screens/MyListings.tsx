import { AlertCircle, ArrowLeft, CheckCircle2, CloudUpload, Eye, Filter, Loader2, MessageCircle, MoreVertical, Pencil, Plus, Search, Trash2, WifiOff } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { listingsApi, resolveImageUrl } from "../../lib/api";
import {
    getPendingListings,
    markListingSynced,
    removeSyncedListings,
    type PendingListing,
} from "../../lib/offlineStorage";
import type { Listing } from "../../lib/types";
import { BottomNav } from "../BottomNav";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

const CACHE_KEY_PREFIX = "cached_my_listings_";

export function MyListings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"active" | "sold" | "expired" | "pending">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [usingCache, setUsingCache] = useState(false);
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);
  const [syncing, setSyncing] = useState(false);
  // id of listing pending delete confirmation; null = no confirm open
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // id of listing currently being acted on (status change or delete)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  // listing open in edit modal
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    price_per_unit: "",
    quantity_available: "",
    unit: "",
    description: "",
  });

  // Get logged-in user from localStorage
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const cacheKey = currentUser?.id ? `${CACHE_KEY_PREFIX}${currentUser.id}` : null;

  // Load pending listings from localStorage
  const refreshPending = () => {
    setPendingListings(getPendingListings().filter((l) => !l.synced));
  };

  useEffect(() => {
    refreshPending();
  }, []);

  // Sync all pending listings to server
  const handleSyncAll = async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    const pending = getPendingListings().filter((l) => !l.synced);
    let successCount = 0;
    let failCount = 0;
    for (const item of pending) {
      try {
        await listingsApi.create(item.data);
        markListingSynced(item.localId);
        successCount++;
      } catch {
        failCount++;
      }
    }
    removeSyncedListings();
    refreshPending();
    if (successCount > 0) {
      toast.success(`Synced ${successCount} listing${successCount > 1 ? "s" : ""}!`, {
        description: failCount > 0 ? `${failCount} could not sync – will retry later.` : "All offline listings are now live.",
      });
      fetchListings();
      if (activeTab === "pending") setActiveTab("active");
    } else if (failCount > 0) {
      toast.error("Sync failed", { description: "Could not reach the server. Please try again." });
    }
    setSyncing(false);
  };

  // Discard a single pending listing
  const handleDiscardPending = (localId: string) => {
    const updated = getPendingListings().filter((l) => l.localId !== localId);
    localStorage.setItem("v2m_pending_listings", JSON.stringify(updated));
    refreshPending();
    toast.success("Pending listing removed");
  };

  // React to network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Re-fetch from server when connection is restored
      fetchListings();
      refreshPending();
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
      // Use the dedicated farmer endpoint — JWT proves ownership server-side
      const data = await listingsApi.myListings();
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

  // /my-listings already scopes to the current farmer server-side;
  // this client-side guard is a safety net for stale cache from a previous session.
  const ownListings = listings.filter(
    l => !l.farmer_id || l.farmer_id === currentUser?.id
  );

  const filteredListings = ownListings
    .filter(l => l.status === activeTab)
    .filter(l =>
      searchQuery.trim() === "" ||
      l.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.produce_type?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleStatusChange = async (
    listing: Listing,
    newStatus: 'active' | 'sold' | 'expired'
  ) => {
    setActionLoadingId(listing.id);
    try {
      const updated = await listingsApi.updateStatus(listing.id, newStatus);
      setListings(prev => prev.map(l => l.id === updated.id ? updated : l));
      // Update cache
      if (cacheKey) {
        const fresh = listings.map(l => l.id === updated.id ? updated : l);
        localStorage.setItem(cacheKey, JSON.stringify(fresh));
      }
      toast.success("Listing updated", {
        description: `Marked as ${newStatus}.`,
      });
    } catch (err: any) {
      toast.error("Update failed", { description: err?.message || "Please try again." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    setConfirmDeleteId(null);
    try {
      await listingsApi.delete(id);
      setListings(prev => prev.filter(l => l.id !== id));
      if (cacheKey) {
        const fresh = listings.filter(l => l.id !== id);
        localStorage.setItem(cacheKey, JSON.stringify(fresh));
      }
      toast.success("Listing deleted");
    } catch (err: any) {
      toast.error("Delete failed", { description: err?.message || "Please try again." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openEdit = (listing: Listing) => {
    setEditListing(listing);
    setEditForm({
      title: listing.title || listing.produce_type?.name || "",
      price_per_unit: String(listing.price_per_unit ?? ""),
      quantity_available: String(listing.quantity_available ?? ""),
      unit: listing.unit || "",
      description: (listing as any).description || "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editListing) return;
    setEditSaving(true);
    try {
      const patch: Partial<Listing> = {
        price_per_unit: Number(editForm.price_per_unit),
        quantity_available: Number(editForm.quantity_available),
        unit: editForm.unit.trim(),
      };
      if (editForm.title.trim()) patch.title = editForm.title.trim();
      if (editForm.description.trim()) (patch as any).description = editForm.description.trim();
      const updated = await listingsApi.update(editListing.id, patch);
      setListings(prev => prev.map(l => l.id === updated.id ? updated : l));
      if (cacheKey) {
        const fresh = listings.map(l => l.id === updated.id ? updated : l);
        localStorage.setItem(cacheKey, JSON.stringify(fresh));
      }
      toast.success("Listing updated");
      setEditListing(null);
    } catch (err: any) {
      toast.error("Save failed", { description: err?.message || "Please try again." });
    } finally {
      setEditSaving(false);
    }
  };

  const countByStatus = (status: string) => ownListings.filter(l => l.status === status).length;

  const FALLBACK_IMG =
    "https://images.unsplash.com/photo-1649251037465-72c9d378acb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

  const getImageUrl = (images: Listing["images"]) =>
    resolveImageUrl(images?.[0], FALLBACK_IMG);

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-[#FFA726] text-[#2C2C2C] px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Showing cached listings.</span>
        </div>
      )}

      {/* Pending Sync Banner – shows when online and there are pending offline listings */}
      {isOnline && pendingListings.length > 0 && (
        <div className="bg-[#2D5016] text-white px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <CloudUpload className="w-4 h-4 flex-shrink-0" />
            <span>
              {pendingListings.length} offline listing{pendingListings.length > 1 ? "s" : ""} waiting to sync
            </span>
          </div>
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-1.5 bg-white text-[#2D5016] font-semibold text-xs px-3 py-1.5 rounded-full hover:bg-[#F5F5F5] transition-colors disabled:opacity-60 flex-shrink-0"
          >
            {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
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
        <div className="flex border-b border-[#E0E0E0] overflow-x-auto">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 min-w-[80px] px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
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
            className={`flex-1 min-w-[70px] px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
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
            className={`flex-1 min-w-[80px] px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
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
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 min-w-[80px] px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === "pending"
                ? "text-[#E65100]"
                : "text-[#757575] hover:text-[#2C2C2C]"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              Pending
              {pendingListings.length > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-[#E65100] text-white">
                  {pendingListings.length}
                </span>
              )}
            </span>
            {activeTab === "pending" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E65100]"></div>
            )}
          </button>
        </div>
      </div>

      {/* Pending Sync Tab Content */}
      {activeTab === "pending" && (
        <div className="p-4 space-y-3">
          {/* Section header */}
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-base font-semibold text-[#2C2C2C]">Offline – Pending Sync</h2>
              <p className="text-xs text-[#757575] mt-0.5">
                {pendingListings.length === 0
                  ? "No pending listings. All synced!"
                  : `${pendingListings.length} listing${pendingListings.length > 1 ? "s" : ""} saved offline, waiting to be uploaded.`}
              </p>
            </div>
            {isOnline && pendingListings.length > 0 && (
              <button
                onClick={handleSyncAll}
                disabled={syncing}
                className="flex items-center gap-1.5 bg-[#2D5016] text-white font-semibold text-xs px-3 py-2 rounded-full hover:bg-[#234010] transition-colors disabled:opacity-60"
              >
                {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                {syncing ? "Syncing…" : "Sync All"}
              </button>
            )}
          </div>

          {!isOnline && pendingListings.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              <span>You're offline. Connect to the internet to sync these listings.</span>
            </div>
          )}

          {pendingListings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#4CAF50]" />
              </div>
              <p className="text-[#2C2C2C] font-medium">All caught up!</p>
              <p className="text-sm text-[#757575] mt-1">No offline listings waiting to sync.</p>
            </div>
          )}

          {pendingListings.map((item) => (
            <div key={item.localId} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Pending Sync
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#2C2C2C] truncate">
                      {item.data.produceName || `Produce #${item.localId.slice(-4)}`}
                    </h3>
                    <p className="text-sm text-[#757575]">
                      {item.data.quantity_available} {item.data.unit}
                      {item.data.districtName ? ` · ${item.data.districtName}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDiscardPending(item.localId)}
                    className="p-1.5 hover:bg-red-50 rounded-full text-[#9E9E9E] hover:text-red-500 transition-colors flex-shrink-0"
                    title="Discard this pending listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[#2D5016]">
                    USD {Number(item.data.price_per_unit).toFixed(2)} / {item.data.unit}
                  </span>
                  <span className="text-xs text-[#9E9E9E]">
                    Saved {new Date(item.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {item.data.categoryName && (
                  <p className="text-xs text-[#757575] mt-1">
                    Category: {item.data.categoryName}
                    {item.data.deliveryAvailable ? " · Delivery available" : ""}
                    {item.data.negotiable ? " · Negotiable" : ""}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Listings */}
      {activeTab !== "pending" && (
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
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    if (!el.dataset.fallback) {
                      el.dataset.fallback = 'true';
                      el.src = FALLBACK_IMG;
                    }
                  }}
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
                  {actionLoadingId === listing.id ? (
                    <div className="p-1">
                      <Loader2 className="w-5 h-5 text-[#757575] animate-spin" />
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 hover:bg-[#F5F5F5] rounded-full transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-[#757575]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/product/${listing.id}`)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" /> View Listing
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEdit(listing)}
                          className="gap-2 text-[#2D5016]"
                        >
                          <Pencil className="w-4 h-4" /> Edit Listing
                        </DropdownMenuItem>
                        {listing.status !== "active" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(listing, "active")}
                            className="gap-2 text-[#4CAF50]"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Mark as Active
                          </DropdownMenuItem>
                        )}
                        {listing.status !== "sold" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(listing, "sold")}
                            className="gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Mark as Sold
                          </DropdownMenuItem>
                        )}
                        {listing.status !== "expired" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(listing, "expired")}
                            className="gap-2 text-[#757575]"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Mark as Expired
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setConfirmDeleteId(listing.id)}
                          className="gap-2 text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-[#2D5016]">
                    {listing.currency || "ZWL"} {Number(listing.price_per_unit).toLocaleString()}
                  </span>
                  <span className="text-sm text-[#757575]">
                    per {listing.quantity_available} {listing.unit}
                  </span>
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
      )} {/* end activeTab !== "pending" */}

      {/* Floating Action Button */}
      <button
        onClick={() => navigate("/farmer/list-produce")}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[#2D5016] hover:bg-[#234010] text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Delete confirmation overlay */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-[#2C2C2C] text-center mb-2">Delete Listing?</h3>
            <p className="text-sm text-[#757575] text-center mb-6">
              This listing will be permanently removed and cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={() => handleDelete(confirmDeleteId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit listing modal */}
      {editListing && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
          onClick={() => !editSaving && setEditListing(null)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#E0E0E0]">
              <h2 className="text-lg font-semibold text-[#2C2C2C]">Edit Listing</h2>
              <button
                onClick={() => setEditListing(null)}
                disabled={editSaving}
                className="p-1 hover:bg-[#F5F5F5] rounded-full"
              >
                <Trash2 className="w-4 h-4 text-[#757575] rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <Label htmlFor="edit-title">Title / Produce Name</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Tomatoes"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-qty">Quantity</Label>
                  <Input
                    id="edit-qty"
                    type="number"
                    min={0}
                    value={editForm.quantity_available}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(f => ({ ...f, quantity_available: e.target.value }))}
                    placeholder="0"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-unit">Unit</Label>
                  <Input
                    id="edit-unit"
                    value={editForm.unit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(f => ({ ...f, unit: e.target.value }))}
                    placeholder="kg"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-price">Total Price (ZWL)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min={0}
                  value={editForm.price_per_unit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(f => ({ ...f, price_per_unit: e.target.value }))}
                  placeholder="0.00"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea
                  id="edit-desc"
                  value={editForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Add details about quality, harvest date, etc."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditListing(null)}
                  disabled={editSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#2D5016] hover:bg-[#234010] text-white"
                  disabled={editSaving}
                >
                  {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
