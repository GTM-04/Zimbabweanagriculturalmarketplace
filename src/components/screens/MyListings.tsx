import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CloudUpload,
  Eye,
  Leaf,
  Loader2,
  MessageCircle,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Sprout,
  Trash2,
  WifiOff,
  X
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { listingsApi, getProduceFallbackImage, produceTypesApi, resolveImageUrl, selectPreferredImageEntry } from "../../lib/api";
import {
  getPendingListings,
  markListingSynced,
  removeSyncedListings,
  type PendingListing,
} from "../../lib/offlineStorage";
import type { Listing } from "../../lib/types";
import { BottomNav } from "../BottomNav";

const CACHE_KEY_PREFIX = "cached_my_listings_";

const TABS = [
  { key: "active" as const, label: "Active", accentClass: "ml-tab--accent-active" },
  { key: "sold" as const, label: "Sold", accentClass: "ml-tab--accent-sold" },
  { key: "expired" as const, label: "Expired", accentClass: "ml-tab--accent-expired" },
  { key: "pending" as const, label: "Pending", accentClass: "ml-tab--accent-pending" },
];

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    price_per_unit: "",
    quantity_available: "",
    unit: "",
    description: "",
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const cacheKey = currentUser?.id ? `${CACHE_KEY_PREFIX}${currentUser.id}` : null;

  /* ── Pending listings ── */
  const refreshPending = () => {
    setPendingListings(getPendingListings().filter((l) => !l.synced));
  };

  useEffect(() => { refreshPending(); }, []);

  const handleSyncAll = async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    const pending = getPendingListings().filter((l) => !l.synced);
    let successCount = 0;
    let failCount = 0;
    // Fetch produce types to resolve offline-saved listings
    let produceTypeMap: Record<string, number> = {};
    try {
      const types = await produceTypesApi.list();
      types.forEach((t) => {
        produceTypeMap[t.name.toLowerCase().trim()] = t.id;
      });
    } catch (err) {
      console.error('Failed to fetch produce types:', err);
    }

    for (const item of pending) {
      try {
        // If produce_type_id is 0 (offline saved), try to resolve from produce name
        let produceTypeId = item.data.produce_type_id;
        if (produceTypeId === 0 && item.data.produceName) {
          const resolved = produceTypeMap[item.data.produceName.toLowerCase().trim()];
          if (resolved) {
            produceTypeId = resolved;
          } else {
            throw new Error(
              `Cannot resolve produce type "${item.data.produceName}". Please list it again.`
            );
          }
        }

        // Extract only valid CreateListingRequest fields (exclude display metadata)
        const cleanData = {
          produce_type_id: produceTypeId,
          quantity_available: item.data.quantity_available,
          unit: item.data.unit,
          price_per_unit: item.data.price_per_unit,
          description: item.data.description,
          is_organic: item.data.is_organic,
          harvest_date: item.data.harvest_date,
        };

        await listingsApi.create(cleanData);
        markListingSynced(item.localId);
        successCount++;
      } catch (err) {
        console.error('Sync error:', err);
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

  const handleDiscardPending = (localId: string) => {
    const updated = getPendingListings().filter((l) => l.localId !== localId);
    localStorage.setItem("v2m_pending_listings", JSON.stringify(updated));
    refreshPending();
    toast.success("Pending listing removed");
  };

  /* ── Network awareness ── */
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); fetchListings(); refreshPending(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, [currentUser?.id]);

  const buildFallbackListings = (): Listing[] => [];

  const fetchListings = async () => {
    if (!currentUser?.id) { setError("User not authenticated. Please log in."); setLoading(false); return; }
    if (!navigator.onLine) {
      const cached = cacheKey ? localStorage.getItem(cacheKey) : null;
      if (cached) { setListings(JSON.parse(cached)); setUsingCache(true); setError(null); }
      else { setListings(buildFallbackListings()); setError(null); }
      setLoading(false);
      return;
    }
    try {
      setLoading(true); setError(null); setUsingCache(false);
      const data = await listingsApi.myListings();
      if (data && data.length > 0) {
        setListings(data);
        if (cacheKey) localStorage.setItem(cacheKey, JSON.stringify(data));
      } else {
        setListings(buildFallbackListings());
      }
    } catch (err: any) {
      const cached = cacheKey ? localStorage.getItem(cacheKey) : null;
      if (cached) { setListings(JSON.parse(cached)); setUsingCache(true); setError(null); }
      else { setListings(buildFallbackListings()); setError(null); }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchListings(); }, [currentUser?.id]);

  // When using fallback static data, we still want to show 0 if they have none
  const ownListings = listings.filter((l) => !l.farmer_id || String(l.farmer_id) === String(currentUser?.id));
  const filteredListings = ownListings
    .filter((l) => l.status === activeTab)
    .filter((l) =>
      searchQuery.trim() === "" ||
      l.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.produce_type?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  /* ── Status / delete / edit handlers ── */
  const handleStatusChange = async (listing: Listing, newStatus: "active" | "sold" | "expired") => {
    setActionLoadingId(listing.id);
    setOpenMenuId(null);
    try {
      const updated = await listingsApi.updateStatus(listing.id, newStatus);
      setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      if (cacheKey) { const fresh = listings.map((l) => (l.id === updated.id ? updated : l)); localStorage.setItem(cacheKey, JSON.stringify(fresh)); }
      toast.success("Listing updated", { description: `Marked as ${newStatus}.` });
    } catch (err: any) {
      toast.error("Update failed", { description: err?.message || "Please try again." });
    } finally { setActionLoadingId(null); }
  };

  const handleDelete = async (id: string) => {
    setActionLoadingId(id); setConfirmDeleteId(null);
    try {
      await listingsApi.delete(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      if (cacheKey) { const fresh = listings.filter((l) => l.id !== id); localStorage.setItem(cacheKey, JSON.stringify(fresh)); }
      toast.success("Listing deleted");
    } catch (err: any) {
      toast.error("Delete failed", { description: err?.message || "Please try again." });
    } finally { setActionLoadingId(null); }
  };

  const openEdit = (listing: Listing) => {
    setOpenMenuId(null);
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
      setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      if (cacheKey) { const fresh = listings.map((l) => (l.id === updated.id ? updated : l)); localStorage.setItem(cacheKey, JSON.stringify(fresh)); }
      toast.success("Listing updated");
      setEditListing(null);
    } catch (err: any) {
      toast.error("Save failed", { description: err?.message || "Please try again." });
    } finally { setEditSaving(false); }
  };

  const countByStatus = (status: string) => ownListings.filter((l) => l.status === status).length;

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1649251037465-72c9d378acb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";
  const getImageUrl = (images: Listing["images"], produceName?: string) => {
    const fallback = getProduceFallbackImage(produceName, FALLBACK_IMG);
    if (!images || images.length === 0) return fallback;
    const preferredImage = selectPreferredImageEntry(images);
    return resolveImageUrl(preferredImage, fallback);
  };
  const delayClasses = ["delay-100", "delay-150", "delay-200", "delay-300", "delay-400", "delay-500"];

  /* ── Render ── */
  return (
    <div className="ml-page">
      <BottomNav />

      {/* Offline */}
      {!isOnline && (
        <div className="ml-banner ml-banner--offline">
          <WifiOff size={15} className="ml-banner__icon" />
          <span>You're offline — showing cached listings.</span>
        </div>
      )}

      {/* Sync banner */}
      {isOnline && pendingListings.length > 0 && (
        <div className="ml-banner ml-banner--sync">
          <div className="ml-banner__left">
            <CloudUpload size={15} className="ml-banner__icon" />
            <span>{pendingListings.length} offline listing{pendingListings.length > 1 ? "s" : ""} waiting</span>
          </div>
          <button onClick={handleSyncAll} disabled={syncing} className="ml-banner__btn">
            {syncing ? <Loader2 size={14} className="fd-spin" /> : <CloudUpload size={14} />}
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        </div>
      )}

      {/* Cache notice */}
      {isOnline && usingCache && (
        <div className="ml-banner ml-banner--warn">
          <AlertCircle size={15} className="ml-banner__icon" />
          <span>Showing cached data.</span>
          <button onClick={fetchListings} className="ml-banner__retry">Retry</button>
        </div>
      )}

      {/* ═══ Header ═══ */}
      <header className="ml-header">
        <div className="ml-header__top">
          <button onClick={() => navigate("/farmer/dashboard")} className="ml-back">
            <ArrowLeft size={18} />
          </button>
          <div className="ml-header__title-wrap">
            <div className="ml-header__icon">
              <Sprout size={16} className="ml-header__icon-svg" />
            </div>
            <h1 className="ml-header__title">My Listings</h1>
          </div>
          <button onClick={() => navigate("/farmer/list-produce")} className="ml-new-btn">
            <Plus size={14} />
            <span>New</span>
          </button>
        </div>

        {/* Search */}
        <div className="ml-search-wrap">
          <Search size={16} className="ml-search-icon" />
          <input
            type="text"
            placeholder="Search your listings…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ml-search"
          />
        </div>

        {/* Tabs */}
        <div className="ml-tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = tab.key === "pending" ? pendingListings.length : countByStatus(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`ml-tab ${tab.accentClass} ${isActive ? "ml-tab--active" : ""}`}
              >
                <span>{tab.label}</span>
                <span className={`ml-tab__count ${isActive ? "ml-tab__count--active" : ""}`}>{count}</span>
                {isActive && <div className="ml-tab__indicator" />}
              </button>
            );
          })}
        </div>
      </header>

      {/* ═══ Pending Tab ═══ */}
      {activeTab === "pending" && (
        <section className="ml-content">
          <div className="ml-pending-head">
            <div>
              <h2 className="ml-pending-head__title">Offline – Pending Sync</h2>
              <p className="ml-pending-head__desc">
                {pendingListings.length === 0
                  ? "No pending listings. All synced!"
                  : `${pendingListings.length} listing${pendingListings.length > 1 ? "s" : ""} saved offline.`}
              </p>
            </div>
            {isOnline && pendingListings.length > 0 && (
              <button onClick={handleSyncAll} disabled={syncing} className="ml-sync-btn">
                {syncing ? <Loader2 size={14} className="fd-spin" /> : <CloudUpload size={14} />}
                {syncing ? "Syncing…" : "Sync All"}
              </button>
            )}
          </div>

          {!isOnline && pendingListings.length > 0 && (
            <div className="ml-inline-warn">
              <WifiOff size={15} className="ml-banner__icon" />
              <span>Connect to the internet to sync these listings.</span>
            </div>
          )}

          {pendingListings.length === 0 && (
            <div className="ml-empty">
              <div className="ml-empty__icon ml-empty__icon--success">
                <CheckCircle2 size={28} className="ml-empty__icon-svg ml-empty__icon-svg--success" />
              </div>
              <p className="ml-empty__title">All caught up!</p>
              <p className="ml-empty__desc">No offline listings waiting to sync.</p>
            </div>
          )}

          {pendingListings.map((item) => (
            <div key={item.localId} className="ml-card ml-card--pending animate-fade-in-up">
              <div className="ml-card__body">
                <div className="ml-card__top">
                  <div className="ml-card__info">
                    <span className="ml-badge ml-badge--pending">Pending Sync</span>
                    <h3 className="ml-card__name">{item.data.produceName || `Produce #${item.localId.slice(-4)}`}</h3>
                    <p className="ml-card__qty">{item.data.quantity_available} {item.data.unit}</p>
                  </div>
                  <button onClick={() => handleDiscardPending(item.localId)} className="ml-card__delete" title="Discard">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="ml-card__bottom">
                  <span className="ml-card__price">
                    USD {(Number(item.data.price_per_unit) * Number(item.data.quantity_available)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="ml-card__date">
                    {new Date(item.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ═══ Listing Cards ═══ */}
      {activeTab !== "pending" && (
        <section className="ml-content">
          {loading && (
            <div className="ml-loading">
              <Loader2 size={28} className="fd-spin" />
              <p>Loading your listings…</p>
            </div>
          )}

          {!loading && error && (
            <div className="ml-error">
              <AlertCircle size={36} className="ml-error__icon" />
              <p className="ml-error__text">{error}</p>
              <button onClick={fetchListings} className="ml-error__retry">Retry</button>
            </div>
          )}

          {!loading && !error && filteredListings.map((listing, i) => (
            <div
              key={listing.id}
              onClick={() => navigate(`/product/${listing.id}`)}
              className={`ml-card animate-fade-in-up ${delayClasses[i % delayClasses.length]}`}
            >
              {/* Image */}
              <div className="ml-card__img">
                <img
                  src={getImageUrl(listing.images, listing.produce_type?.name ?? listing.title)}
                  alt={listing.title || listing.produce_type?.name}
                  onError={(e) => { const el = e.currentTarget; if (!el.dataset.fallback) { el.dataset.fallback = "true"; el.src = getProduceFallbackImage(listing.produce_type?.name ?? listing.title, FALLBACK_IMG); } }}
                />
                <span className={`ml-badge ml-badge--status ml-badge--${listing.status}`}>{listing.status}</span>
              </div>

              {/* Content */}
              <div className="ml-card__body">
                <div className="ml-card__top">
                  <div className="ml-card__info">
                    <h3 className="ml-card__name">{listing.title || listing.produce_type?.name}</h3>
                    <p className="ml-card__qty">{listing.quantity_available} {listing.unit}</p>
                  </div>
                  {actionLoadingId === listing.id ? (
                    <div className="ml-card__menu-loader"><Loader2 size={18} className="fd-spin" /></div>
                  ) : (
                    <div className="ml-card__menu-wrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="ml-card__menu-btn"
                        onClick={() => setOpenMenuId(openMenuId === listing.id ? null : listing.id)}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openMenuId === listing.id && (
                        <>
                          <div className="ml-menu-backdrop" onClick={() => setOpenMenuId(null)} />
                          <div className="ml-menu">
                            <button className="ml-menu__item" onClick={() => { setOpenMenuId(null); navigate(`/product/${listing.id}`); }}>
                              <Eye size={15} /> View
                            </button>
                            <button className="ml-menu__item ml-menu__item--primary" onClick={() => openEdit(listing)}>
                              <Pencil size={15} /> Edit
                            </button>
                            {listing.status !== "active" && (
                              <button className="ml-menu__item ml-menu__item--success" onClick={() => handleStatusChange(listing, "active")}>
                                <CheckCircle2 size={15} /> Mark Active
                              </button>
                            )}
                            {listing.status !== "sold" && (
                              <button className="ml-menu__item" onClick={() => handleStatusChange(listing, "sold")}>
                                <CheckCircle2 size={15} /> Mark Sold
                              </button>
                            )}
                            {listing.status !== "expired" && (
                              <button className="ml-menu__item" onClick={() => handleStatusChange(listing, "expired")}>
                                <CheckCircle2 size={15} /> Mark Expired
                              </button>
                            )}
                            <div className="ml-menu__divider" />
                            <button className="ml-menu__item ml-menu__item--danger" onClick={() => { setOpenMenuId(null); setConfirmDeleteId(listing.id); }}>
                              <Trash2 size={15} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="ml-card__price">
                  USD {(Number(listing.price_per_unit) * Number(listing.quantity_available)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="ml-card__price-unit"> / {listing.quantity_available} {listing.unit}</span>
                </div>

                <div className="ml-card__stats">
                  <div className="ml-card__stat"><Eye size={14} /> {listing.views ?? 0}</div>
                  <div className="ml-card__stat"><MessageCircle size={14} /> {listing.inquiries ?? 0}</div>
                </div>
              </div>
            </div>
          ))}

          {!loading && !error && filteredListings.length === 0 && (
            <div className="ml-empty">
              <div className="ml-empty__icon">
                <Leaf size={28} className="ml-empty__icon-svg" />
              </div>
              {activeTab === "active" ? (
                <>
                  <p className="ml-empty__title">No produce listed yet</p>
                  <p className="ml-empty__desc">Start selling by creating your first listing.</p>
                  <button onClick={() => navigate("/farmer/list-produce")} className="ml-empty__cta">
                    <Plus size={16} /> Create Listing
                  </button>
                </>
              ) : (
                <>
                  <p className="ml-empty__title">No {activeTab} listings</p>
                  <p className="ml-empty__desc">Your {activeTab} listings will appear here.</p>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* FAB */}
      <button onClick={() => navigate("/farmer/list-produce")} className="ml-fab" aria-label="Add new listing">
        <Plus size={22} className="ml-fab__icon" />
      </button>

      {/* ═══ Delete Modal ═══ */}
      {confirmDeleteId && (
        <div className="ml-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="ml-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="ml-modal__icon ml-modal__icon--danger">
              <Trash2 size={24} className="ml-modal__icon-svg" />
            </div>
            <h3 className="ml-modal__title">Delete Listing?</h3>
            <p className="ml-modal__desc">This action cannot be undone. The listing will be permanently removed.</p>
            <div className="ml-modal__actions">
              <button className="ml-modal__btn ml-modal__btn--cancel" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="ml-modal__btn ml-modal__btn--danger" onClick={() => handleDelete(confirmDeleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Edit Modal ═══ */}
      {editListing && (
        <div className="ml-overlay" onClick={() => !editSaving && setEditListing(null)}>
          <div className="ml-modal ml-modal--edit animate-slide-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="ml-modal__header">
              <h2 className="ml-modal__header-title">Edit Listing</h2>
              <button onClick={() => setEditListing(null)} disabled={editSaving} className="ml-modal__close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="ml-edit-form">
              <div className="ml-edit-field">
                <label className="ml-edit-label">Title / Produce Name</label>
                <input className="ml-edit-input" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Tomatoes" />
              </div>

              <div className="ml-edit-row">
                <div className="ml-edit-field">
                  <label className="ml-edit-label">Quantity</label>
                  <input className="ml-edit-input" type="number" min={0} value={editForm.quantity_available} onChange={(e) => setEditForm((f) => ({ ...f, quantity_available: e.target.value }))} required />
                </div>
                <div className="ml-edit-field">
                  <label className="ml-edit-label">Unit</label>
                  <input className="ml-edit-input" value={editForm.unit} onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))} placeholder="kg" />
                </div>
              </div>

              <div className="ml-edit-field">
                <label className="ml-edit-label">Price per Unit (USD)</label>
                <input className="ml-edit-input" type="number" min={0} value={editForm.price_per_unit} onChange={(e) => setEditForm((f) => ({ ...f, price_per_unit: e.target.value }))} required />
              </div>

              <div className="ml-edit-field">
                <label className="ml-edit-label">Description</label>
                <textarea className="ml-edit-textarea" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Add details…" />
              </div>

              <div className="ml-modal__actions">
                <button type="button" className="ml-modal__btn ml-modal__btn--cancel" onClick={() => setEditListing(null)} disabled={editSaving}>Cancel</button>
                <button type="submit" className="ml-modal__btn ml-modal__btn--primary" disabled={editSaving}>
                  {editSaving ? <Loader2 size={16} className="fd-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
