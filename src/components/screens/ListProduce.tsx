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
    savePendingListing
} from "../../lib/offlineStorage";
import type { MarketPrice } from "../../lib/types";
import { useAuth } from "../../lib/useAuth";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

const units = ["kg", "tonnes", "bags", "crates", "heads", "trays", "birds"];

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
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [marketPrice, setMarketPrice] = useState<MarketPrice | null>(null);
  const [marketPriceLoading, setMarketPriceLoading] = useState(false);
  const [marketPriceIsLive, setMarketPriceIsLive] = useState(false);
  // Map of produce name (lowercase) → backend numeric id, populated on mount
  const produceTypeMapRef = useRef<Record<string, number>>({});
  const [produceTypeMapReady, setProduceTypeMapReady] = useState(false);
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
    setPendingCount(getPendingListings().filter((l) => !l.synced).length);
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
      setProduceTypeMapReady(true);
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
    setLoading(true);

    // ── Resolve the produce name to its backend numeric ID ───────────────────
    // We look up by lowercase name in the map fetched from /produce-types/.
    // This is the fix for the bug where parseInt("Goats") === NaN → 1 → Cabbage.
    const map = produceTypeMapRef.current;
    const resolvedId: number | null =
      map[formData.produce.toLowerCase().trim()] ??
      map[formData.produce.trim()] ??
      null;

    if (isOnline && !resolvedId) {
      // Map not populated yet (network slow) — try one more fetch
      const fresh = await produceTypesApi.list();
      fresh.forEach((t) => { map[t.name.toLowerCase().trim()] = t.id; });
      produceTypeMapRef.current = map;
    }

    const produceTypeId: number =
      produceTypeMapRef.current[formData.produce.toLowerCase().trim()] ??
      produceTypeMapRef.current[formData.produce.trim()] ??
      0; // 0 signals an unresolved type below

    if (isOnline && produceTypeId === 0) {
      setError(
        `Could not find produce type "${formData.produce}" in the system. ` +
        'Please check your connection and try again, or contact support.'
      );
      setLoading(false);
      return;
    }

    const listingPayload = {
      produce_type_id: isOnline ? produceTypeId : 0, // 0 is fine for offline saves
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
    if (!isOnline) {
      savePendingListing(listingPayload);
      setPendingCount((c) => c + 1);
      toast.success("Listing saved locally!", {
        description:
          "Your listing has been saved on this device and will be synced when you go online.",
        duration: 5000,
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

      toast.success("Listing Created!", {
        description: "Your produce has been listed successfully",
      });

      setTimeout(() => navigate("/farmer/my-listings"), 500);
    } catch (err: any) {
      const errorMsg = err.message || "Failed to create listing. Please try again.";
      setError(errorMsg);
      toast.error("Failed to Create Listing", { description: errorMsg });
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
    setPendingCount(getPendingListings().filter((l) => !l.synced).length);

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
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-[#FFA726] text-[#2C2C2C] px-4 py-2 flex items-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>
            You're offline. Listings will be saved locally and synced when online.
          </span>
        </div>
      )}

      {/* Pending Sync Banner */}
      {isOnline && pendingCount > 0 && (
        <div className="bg-[#2D5016] text-white px-4 py-2 flex items-center justify-between gap-2 text-sm">
          <span>
            {pendingCount} offline listing{pendingCount > 1 ? "s" : ""} waiting to sync
          </span>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 bg-white text-[#2D5016] font-semibold px-3 py-1 rounded-full hover:bg-[#F5F5F5] transition-colors disabled:opacity-60"
          >
            {syncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CloudUpload className="w-3.5 h-3.5" />
            )}
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#E0E0E0] px-4 py-4 flex items-center gap-3 z-10 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#2C2C2C]" />
        </button>
        <h1 className="text-xl font-semibold text-[#2C2C2C]">List Your Produce</h1>
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
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">Produce Details</h2>

          {/* Category */}
          <div className="mb-4">
            <Label htmlFor="category">Category *</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id, produce: "" })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.category === cat.id
                      ? "border-[#2D5016] bg-[#2D5016]/5"
                      : "border-[#E0E0E0] hover:border-[#2D5016]/30"
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-xs font-medium text-[#2C2C2C]">{cat.name}</div>
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
                className="mt-2 w-full h-12 px-4 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-transparent"
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
                className="w-28 h-12 px-3 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-transparent"
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
          <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">Pricing</h2>

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
              <div className="mt-2 p-3 bg-[#2D5016]/5 border border-[#2D5016]/20 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#2D5016] flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-xs font-semibold text-[#2D5016]">
                          {marketPrice.currency ?? "ZWL"} {marketPrice.price_min.toLocaleString()}–{marketPrice.price_max.toLocaleString()}/{marketPrice.unit}
                        </p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          marketPriceIsLive
                            ? "bg-[#4CAF50] text-white"
                            : "bg-[#FFA726] text-[#2C2C2C]"
                        }`}>
                          {marketPriceIsLive ? "Live" : "Estimated"}
                        </span>
                      </div>
                      <p className="text-xs text-[#757575]">
                        Avg: {marketPrice.currency ?? "ZWL"} {marketPrice.price_avg.toLocaleString()}/{marketPrice.unit}
                        {marketPrice.district ? ` · ${marketPrice.district}` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, price: String(marketPrice.price_avg) })
                    }
                    className="text-xs font-medium text-white bg-[#2D5016] hover:bg-[#234010] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
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
              className="w-4 h-4 text-[#2D5016] rounded focus:ring-[#2D5016]"
            />
            <Label htmlFor="negotiable" className="cursor-pointer">Price is negotiable</Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isOrganic"
              checked={formData.isOrganic}
              onChange={(e) => setFormData({ ...formData, isOrganic: e.target.checked })}
              className="w-4 h-4 text-[#2D5016] rounded focus:ring-[#2D5016]"
            />
            <Label htmlFor="isOrganic" className="cursor-pointer">Organic produce</Label>
          </div>
        </div>

        {/* Section 3: Photos */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">Photos</h2>
          
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-[#F5F5F5] border-2 border-dashed border-[#E0E0E0] flex flex-col items-center justify-center cursor-pointer hover:border-[#2D5016] transition-colors relative group"
              >
                {uploadedImages[i] ? (
                  <img
                    src={URL.createObjectURL(uploadedImages[i])}
                    alt={`Upload ${i + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-[#757575] group-hover:text-[#2D5016]" />
                    <span className="text-xs text-[#757575] mt-1 group-hover:text-[#2D5016]">Add Photo</span>
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
          <p className="text-xs text-[#757575] mt-2">Add up to 5 photos. First photo will be the cover.</p>
        </div>

        {/* Section 4: Location & Availability */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">Location & Availability</h2>

          <div className="mb-4">
            <Label htmlFor="district">District *</Label>
            <select
              id="district"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              required
              className="mt-2 w-full h-12 px-4 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-transparent"
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
              className="w-4 h-4 text-[#2D5016] rounded focus:ring-[#2D5016]"
            />
            <Label htmlFor="delivery" className="cursor-pointer">Delivery available</Label>
          </div>
        </div>

        {/* Section 5: Description */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">Description</h2>

          <Textarea
            placeholder="Tell buyers about your produce quality, organic status, farming methods, etc."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="resize-none"
            maxLength={500}
          />
          <p className="text-xs text-[#757575] mt-1 text-right">{formData.description.length}/500</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={loading}
            className="flex-1 h-12 border-2 border-[#E0E0E0] hover:bg-[#F5F5F5]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.category || !formData.produce || !formData.quantity || !formData.price}
            className="flex-1 h-12 bg-[#2D5016] hover:bg-[#234010] text-white disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isOnline ? "Publishing..." : "Saving..."}
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
    </div>
  );
}
