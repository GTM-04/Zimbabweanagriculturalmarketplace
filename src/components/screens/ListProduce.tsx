import { ArrowLeft, Calendar, Camera, CloudUpload, Loader2, TrendingUp, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { listingsApi, pricingApi, produceTypesApi } from "../../lib/api";
import { categories, zimbabweDistricts } from "../../lib/data";
import {
    getPendingListings,
    markListingSynced,
    removeSyncedListings,
    savePendingListing,
    type PendingListing
} from "../../lib/offlineStorage";
import type { MarketPrice } from "../../lib/types";
import { useAuth } from "../../lib/useAuth";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { AppShell } from "../layout/AppShell";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";

const units = ["kg", "tonnes", "bags", "crates", "heads", "trays", "birds"];

/**
 * Performs a real HTTP probe against the backend to confirm actual internet/server
 * reachability at the moment of submission — not just navigator.onLine which can
 * be stale (e.g. device is connected to a router with no WAN).
 * Resolves true = reachable, false = unreachable.
 */
async function probeConnectivity(): Promise<boolean> {
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), 4000); // 4 s timeout
  try {
    await fetch(`${apiBase}/listings/?page_size=1`, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timerId);
    return true;
  } catch {
    clearTimeout(timerId);
    return false;
  }
}

const specificProduce: Record<string, string[]> = {
  vegetables: ["Tomatoes", "Onions", "Butternut", "Cabbage", "Spinach", "Peppers", "Carrots", "Cucumbers"],
  fruits: ["Bananas", "Avocados", "Oranges", "Mangoes", "Apples"],
  grains: ["White Maize", "Yellow Maize", "Wheat", "Sorghum", "Millet"],
  livestock: ["Cattle", "Goats", "Sheep", "Pigs"],
  poultry: ["Chickens", "Eggs", "Ducks", "Turkeys"],
  dairy: ["Milk", "Cheese", "Yogurt", "Butter"],
};

// ── Local fallback price database (USD, Zimbabwe 2026 market prices) ─────────
// Prices sourced from Zimbabwe Farmers Union, FAO GIEWS, and local market data.
// Used when the API returns no data for a given produce type.
interface LocalPrice { min: number; avg: number; max: number; unit: string; }
const localPriceDB: Record<string, LocalPrice> = {
  // vegetables (USD/kg)
  "tomatoes":    { min: 0.30, avg: 0.50, max: 0.80,  unit: "kg"   },
  "onions":      { min: 0.40, avg: 0.65, max: 1.00,  unit: "kg"   },
  "butternut":   { min: 0.25, avg: 0.45, max: 0.70,  unit: "kg"   },
  "cabbage":     { min: 0.20, avg: 0.35, max: 0.60,  unit: "kg"   },
  "spinach":     { min: 0.25, avg: 0.40, max: 0.60,  unit: "kg"   },
  "peppers":     { min: 0.50, avg: 0.90, max: 1.50,  unit: "kg"   },
  "carrots":     { min: 0.30, avg: 0.50, max: 0.80,  unit: "kg"   },
  "cucumbers":   { min: 0.25, avg: 0.45, max: 0.70,  unit: "kg"   },
  // fruits (USD/kg)
  "bananas":     { min: 0.40, avg: 0.65, max: 1.00,  unit: "kg"   },
  "avocados":    { min: 0.50, avg: 0.90, max: 1.50,  unit: "kg"   },
  "oranges":     { min: 0.30, avg: 0.55, max: 0.90,  unit: "kg"   },
  "mangoes":     { min: 0.40, avg: 0.75, max: 1.20,  unit: "kg"   },
  "apples":      { min: 0.60, avg: 1.10, max: 1.80,  unit: "kg"   },
  // grains (USD/kg)
  "white maize": { min: 0.10, avg: 0.20, max: 0.30,  unit: "kg"   },
  "yellow maize":{ min: 0.10, avg: 0.18, max: 0.28,  unit: "kg"   },
  "wheat":       { min: 0.20, avg: 0.35, max: 0.50,  unit: "kg"   },
  "sorghum":     { min: 0.12, avg: 0.24, max: 0.35,  unit: "kg"   },
  "millet":      { min: 0.15, avg: 0.26, max: 0.40,  unit: "kg"   },
  // livestock (USD/head)
  "cattle":      { min: 350,  avg: 550,  max: 800,   unit: "head" },
  "goats":       { min: 60,   avg: 100,  max: 150,   unit: "head" },
  "sheep":       { min: 70,   avg: 120,  max: 180,   unit: "head" },
  "pigs":        { min: 100,  avg: 175,  max: 250,   unit: "head" },
  // poultry (USD/bird or tray)
  "chickens":    { min: 3.50, avg: 5.50, max: 8.00,  unit: "bird" },
  "eggs":        { min: 3.00, avg: 4.50, max: 6.00,  unit: "tray" },
  "ducks":       { min: 5.00, avg: 8.00, max: 12.00, unit: "bird" },
  "turkeys":     { min: 12.00,avg: 20.00,max: 30.00, unit: "bird" },
  // dairy (USD/litre or kg)
  "milk":        { min: 0.50, avg: 0.80, max: 1.20,  unit: "litre"},
  "cheese":      { min: 3.00, avg: 5.50, max: 8.00,  unit: "kg"   },
  "yogurt":      { min: 0.80, avg: 1.30, max: 2.00,  unit: "litre"},
  "butter":      { min: 2.50, avg: 4.00, max: 6.00,  unit: "kg"   },
};

function getLocalPrice(produceName: string, district: string): import("../../lib/types").MarketPrice | null {
  const key = produceName.toLowerCase().trim();
  const entry = localPriceDB[key];
  if (!entry) return null;
  return {
    produce_type: produceName,
    district,
    price_min: entry.min,
    price_avg: entry.avg,
    price_max: entry.max,
    unit: entry.unit,
    currency: "USD",
    recorded_date: new Date().toISOString().split("T")[0],
  };
}

export function ListProduce() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const [demoOfflineMode, setDemoOfflineMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingItems, setPendingItems] = useState<PendingListing[]>([]);
  const [error, setError] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [marketPrice, setMarketPrice] = useState<MarketPrice | null>(null);
  const [marketPriceLoading, setMarketPriceLoading] = useState(false);
  const [marketPriceIsLive, setMarketPriceIsLive] = useState(false);
  // Map of produce name (lowercase) → backend numeric id, populated on mount
  const produceTypeMapRef = useRef<Record<string, number>>({});
  const [formData, setFormData] = useState({
    category: "",
    produce: "",
    variety: "",
    quantity: "",
    unit: "kg",
    price: "",
    negotiable: false,
    district: user?.district || "Harare",
    availableFrom: "",
    availableUntil: "",
    delivery: false,
    description: "",
    isOrganic: false,
  });

  // Refresh pending count whenever online status or component mounts
  useEffect(() => {
    const unsynced = getPendingListings().filter((l) => !l.synced);
    setPendingCount(unsynced.length);
    setPendingItems(unsynced);
  }, [isOnline]);

  // Fetch produce types from backend to build the name→id map
  // This is what fixes the "always Cabbage" bug – parseInt("Goats") was NaN || 1
  useEffect(() => {
    if (!isOnline) return;
    produceTypesApi.list().then((types) => {
      if (types.length === 0) return;
      const map: Record<string, number> = {};
      types.forEach((t) => {
        map[t.name.toLowerCase().trim()] = t.id;
      });
      produceTypeMapRef.current = map;
    });
  }, [isOnline]);

  // Fetch live market price; fall back to local DB when API has no data or is offline
  useEffect(() => {
    if (!formData.produce) {
      setMarketPrice(null);
      return;
    }

    // Immediately show local suggestion so the field is never blank
    const localFallback = getLocalPrice(formData.produce, formData.district);
    if (localFallback) {
      setMarketPrice(localFallback);
      setMarketPriceIsLive(false);
    }

    // Only bother hitting the API when online
    if (!isOnline) {
      setMarketPriceLoading(false);
      return;
    }

    const fetchMarketPrice = async () => {
      setMarketPriceLoading(true);
      try {
        const prices = await pricingApi.getMarketPrices({
          produce_type: formData.produce,
          district: formData.district,
        });
        // Prefer exact district+produce match, then any produce match, then local fallback
        const apiMatch =
          prices.find(
            (p) =>
              p.produce_type.toLowerCase() === formData.produce.toLowerCase() &&
              p.district.toLowerCase() === formData.district.toLowerCase()
          ) ||
          prices.find(
            (p) => p.produce_type.toLowerCase() === formData.produce.toLowerCase()
          ) ||
          (prices.length > 0 ? prices[0] : null);

        if (apiMatch) {
          setMarketPrice(apiMatch);
          setMarketPriceIsLive(true);
        } else {
          setMarketPrice(localFallback);
          setMarketPriceIsLive(false);
        }
      } catch {
        // API failed – keep showing local fallback (already set above)
        setMarketPriceIsLive(false);
      } finally {
        setMarketPriceLoading(false);
      }
    };
    fetchMarketPrice();
  }, [formData.produce, formData.district, isOnline]);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error("Authentication Required", {
        description: "Please login to list your produce"
      });
      navigate("/login");
    }
  }, [navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImages((prev) => {
        const newImages = [...prev];
        newImages[index] = file;
        return newImages;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // ── Live connectivity probe ───────────────────────────────────────────────
    // We probe the actual backend instead of trusting navigator.onLine (stale).
    // In demo mode, we simulate offline by returning false.
    setChecking(true);
    const liveOnline = demoOfflineMode ? false : await probeConnectivity();
    setChecking(false);
    setLoading(true);

    // ── Resolve the produce name to its backend numeric ID ───────────────────
    // We look up by lowercase name in the map fetched from /produce-types/.
    // This is the fix for the bug where parseInt("Goats") === NaN → 1 → Cabbage.
    const map = produceTypeMapRef.current;
    const resolvedId: number | null =
      map[formData.produce.toLowerCase().trim()] ??
      map[formData.produce.trim()] ??
      null;

    if (liveOnline && !resolvedId) {
      // Map not populated yet (network slow) — try one more fetch
      const fresh = await produceTypesApi.list();
      fresh.forEach((t) => { map[t.name.toLowerCase().trim()] = t.id; });
      produceTypeMapRef.current = map;
    }

    const produceTypeId: number =
      produceTypeMapRef.current[formData.produce.toLowerCase().trim()] ??
      produceTypeMapRef.current[formData.produce.trim()] ??
      0; // 0 signals an unresolved type below

    if (liveOnline && produceTypeId === 0) {
      setError(
        `Could not find produce type "${formData.produce}" in the system. ` +
        'Please check your connection and try again, or contact support.'
      );
      setLoading(false);
      return;
    }

    const listingPayload = {
      produce_type_id: liveOnline ? produceTypeId : 0, // 0 is fine for offline saves
      quantity_available: parseFloat(formData.quantity),
      unit: formData.unit,
      price_per_unit: parseFloat(formData.price),
      description:
        formData.description ||
        `${formData.produce} ${formData.variety ? `- ${formData.variety}` : ""}`.trim(),
      is_organic: formData.isOrganic,
      harvest_date: formData.availableFrom,
      // display metadata (not sent to API, used for offline display & sync)
      produceName: formData.produce,
      categoryName: formData.category,
      districtName: formData.district,
      deliveryAvailable: formData.delivery,
      negotiable: formData.negotiable,
    };

    // ── OFFLINE: save locally ────────────────────────────────────────────────
    if (!liveOnline) {
      savePendingListing(listingPayload);
      const unsynced = getPendingListings().filter((l) => !l.synced);
      setPendingCount(unsynced.length);
      setPendingItems(unsynced);
      toast.success("Saved locally!", {
        description:
          "No internet connection detected. Your listing has been saved on this device and will be published automatically when you're back online.",
        duration: 6000,
      });
      setLoading(false);
      setTimeout(() => navigate(-1), 600);
      return;
    }

    // ── ONLINE: submit to server ─────────────────────────────────────────────
    try {
      const listing = await listingsApi.create(listingPayload);

      if (uploadedImages.length > 0 && listing.id) {
        await listingsApi.uploadImages(listing.id, uploadedImages);
      }

      toast.success("Listing Published!", {
        description: "Your produce has been listed successfully on the marketplace.",
      });

      setTimeout(() => navigate("/farmer/my-listings"), 500);
    } catch (err: any) {
      const errorMsg = err.message || "Failed to create listing. Please try again.";
      setError(errorMsg);
      toast.error("Failed to Publish Listing", { description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Sync pending offline listings when back online
  const handleSync = async () => {
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
      // Continue anyway - we might be able to sync some listings
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
    const unsynced = getPendingListings().filter((l) => !l.synced);
    setPendingCount(unsynced.length);
    setPendingItems(unsynced);

    if (successCount > 0) {
      toast.success(
        `Synced ${successCount} listing${successCount > 1 ? "s" : ""}!`,
        { description: failCount > 0 ? `${failCount} failed – will retry later.` : undefined }
      );
    } else if (failCount > 0) {
      toast.error("Sync failed", { description: "Could not sync listings. Please try again." });
    }
    setSyncing(false);
  };

  return (
    <AppShell
      title="List produce"
      subtitle="Create a new listing with offline-friendly syncing"
      userTypeOverride="farmer"
    >
      {/* Offline Banner */}
      {(!isOnline || demoOfflineMode) && (
        <div className="offline-banner flex items-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>
            {demoOfflineMode ? "[DEMO MODE] " : ""}You're offline. Listings will be saved locally and synced when online.
          </span>
        </div>
      )}

      {/* Pending Sync Banner */}
      {isOnline && pendingCount > 0 && (
        <div className="bg-[var(--primary-800)] text-white px-4 py-3 text-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span>
              {pendingCount} offline listing{pendingCount > 1 ? "s" : ""} waiting to sync
            </span>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 bg-white text-[var(--primary-800)] font-semibold px-3 py-1 rounded-full hover:bg-[var(--gray-50)] transition-colors disabled:opacity-60"
            >
              {syncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5" />
              )}
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
          </div>

          <div className="max-h-28 overflow-y-auto rounded-md bg-white/15 px-2 py-1.5 text-xs">
            {pendingItems.map((item) => (
              <div key={item.localId} className="flex items-center justify-between py-1">
                <span className="truncate pr-2">
                  {item.data.produceName || "Produce listing"} • {item.data.quantity_available} {item.data.unit}
                </span>
                <span className="opacity-80">
                  {new Date(item.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[var(--gray-200)] px-4 py-4 flex items-center justify-between gap-3 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[var(--gray-100)] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--gray-800)]" />
          </button>
          <h1
            className="text-[var(--gray-900)]"
            style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 800 }}
          >
            List Your Produce
          </h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--primary-800)] border border-[var(--primary-900)] rounded-lg">
          <span className="text-xs text-white font-medium">Offline Mode</span>
          <Switch
            checked={demoOfflineMode}
            onCheckedChange={setDemoOfflineMode}
            className="data-[state=checked]:bg-white"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 max-w-2xl mx-auto pb-24">
        {/* Error Alert */}
        {error && (
          <div className="mb-4">
            <Alert variant="destructive">
              <p className="text-sm">{error}</p>
            </Alert>
          </div>
        )}

        {/* Section 1: Produce Details */}
        <div className="card bg-white mb-4">
          <h2 className="text-base font-semibold text-[var(--gray-900)] mb-4">Produce Details</h2>

          {/* Category */}
          <div className="mb-4">
            <Label htmlFor="category">Category *</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id, produce: "" })}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    formData.category === cat.id
                      ? "border-[var(--primary-700)] bg-[var(--primary-50)] shadow-sm"
                      : "border-[var(--gray-200)] hover:border-[var(--primary-200)] bg-white"
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-xs font-medium text-[var(--gray-900)]">{cat.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Specific Produce */}
          {formData.category && (
            <div className="mb-4">
              <Label htmlFor="produce">Produce Type *</Label>
              <select
                id="produce"
                value={formData.produce}
                onChange={(e) => setFormData({ ...formData, produce: e.target.value })}
                required
                className="mt-2 w-full h-12 px-4 bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-600)] focus:border-transparent"
              >
                <option value="">Select produce</option>
                {specificProduce[formData.category]?.map((prod) => (
                  <option key={prod} value={prod}>{prod}</option>
                ))}
              </select>
            </div>
          )}

          {/* Variety */}
          <div className="mb-4">
            <Label htmlFor="variety">Variety/Grade</Label>
            <Input
              id="variety"
              type="text"
              placeholder="e.g., SC403, Roma, Hass"
              value={formData.variety}
              onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
              className="mt-2"
            />
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <Label htmlFor="quantity">Quantity Available *</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                className="flex-1"
              />
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-28 h-12 px-3 bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-600)] focus:border-transparent"
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Pricing */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-4">Pricing</h2>

          <div className="mb-4">
            <Label htmlFor="price">Your Price per Unit (USD) *</Label>
            <Input
              id="price"
              type="number"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              className="mt-2"
            />

            {/* Market price hint */}
            {marketPriceLoading && (
              <p className="text-xs text-[#757575] mt-1 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Fetching live market price...
              </p>
            )}
            {!marketPriceLoading && marketPrice && (
              <div className="mt-2 p-3 bg-[var(--primary-50)] border border-[var(--primary-200)] rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[var(--primary-800)] flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-xs font-semibold text-[var(--primary-800)]">
                          USD {marketPrice.price_min.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}–{marketPrice.price_max.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{marketPrice.unit}
                        </p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          marketPriceIsLive
                            ? "bg-[var(--success)] text-white"
                            : "bg-[#FFA726] text-[#2C2C2C]"
                        }`}>
                          {marketPriceIsLive ? "Live" : "Estimated"}
                        </span>
                      </div>
                      <p className="text-xs text-[#757575]">
                        Avg: USD {marketPrice.price_avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{marketPrice.unit}
                        {marketPrice.district ? ` · ${marketPrice.district}` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, price: String(marketPrice.price_avg) })
                    }
                    className="text-xs font-medium text-white bg-[var(--accent-500)] hover:bg-[var(--accent-600)] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
                  >
                    Use avg
                  </button>
                </div>
              </div>
            )}
            {!marketPriceLoading && !marketPrice && formData.produce && (
              <p className="text-xs text-[#757575] mt-1">No market price data available for this produce.</p>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="negotiable"
              checked={formData.negotiable}
              onChange={(e) => setFormData({ ...formData, negotiable: e.target.checked })}
              className="w-4 h-4 text-[var(--primary-800)] rounded focus:ring-[var(--primary-800)]"
            />
            <Label htmlFor="negotiable" className="cursor-pointer">Price is negotiable</Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isOrganic"
              checked={formData.isOrganic}
              onChange={(e) => setFormData({ ...formData, isOrganic: e.target.checked })}
              className="w-4 h-4 text-[var(--primary-800)] rounded focus:ring-[var(--primary-800)]"
            />
            <Label htmlFor="isOrganic" className="cursor-pointer">Organic produce</Label>
          </div>
        </div>

        {/* Section 3: Photos */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-4">Photos</h2>
          
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-[var(--gray-50)] border-2 border-dashed border-[var(--gray-200)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--primary-700)] transition-colors relative group"
              >
                {uploadedImages[i] ? (
                  <img
                    src={URL.createObjectURL(uploadedImages[i])}
                    alt={`Upload ${i + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-[var(--gray-500)] group-hover:text-[var(--primary-700)]" />
                    <span className="text-xs text-[var(--gray-500)] mt-1 group-hover:text-[var(--primary-700)]">Add Photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, i)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--gray-600)] mt-2">Add up to 5 photos. First photo will be the cover.</p>
        </div>

        {/* Section 4: Location & Availability */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-4">Location & Availability</h2>

          <div className="mb-4">
            <Label htmlFor="district">District *</Label>
            <select
              id="district"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              required
              className="mt-2 w-full h-12 px-4 bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-600)] focus:border-transparent"
            >
              {zimbabweDistricts.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <Label htmlFor="availableFrom">Available From *</Label>
              <div className="relative mt-2">
                <Input
                  id="availableFrom"
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                  required
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575] pointer-events-none" />
              </div>
            </div>

            <div>
              <Label htmlFor="availableUntil">Available Until *</Label>
              <div className="relative mt-2">
                <Input
                  id="availableUntil"
                  type="date"
                  value={formData.availableUntil}
                  onChange={(e) => setFormData({ ...formData, availableUntil: e.target.value })}
                  required
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575] pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="delivery"
              checked={formData.delivery}
              onChange={(e) => setFormData({ ...formData, delivery: e.target.checked })}
              className="w-4 h-4 text-[var(--primary-800)] rounded focus:ring-[var(--primary-800)]"
            />
            <Label htmlFor="delivery" className="cursor-pointer">Delivery available</Label>
          </div>
        </div>

        {/* Section 5: Description */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-4">Description</h2>

          <Textarea
            placeholder="Tell buyers about your produce quality, organic status, farming methods, etc."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="resize-none"
            maxLength={500}
          />
          <p className="text-xs text-[var(--gray-600)] mt-1 text-right">{formData.description.length}/500</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={loading}
            className="flex-1 h-12 border-2 border-[var(--gray-200)] hover:bg-[var(--gray-50)]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={checking || loading || !formData.category || !formData.produce || !formData.quantity || !formData.price}
            className="flex-1 h-12 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white disabled:opacity-50"
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking connection...
              </>
            ) : loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isOnline ? "Publishing..." : "Saving locally..."}
              </>
            ) : !isOnline ? (
              <>
                <WifiOff className="w-4 h-4 mr-2" />
                Save Offline
              </>
            ) : (
              "Publish Listing"
            )}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
