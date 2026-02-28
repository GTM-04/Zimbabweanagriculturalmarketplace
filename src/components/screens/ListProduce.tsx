import { ArrowLeft, Calendar, Camera, Loader2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { listingsApi, pricingApi } from "../../lib/api";
import { categories, zimbabweDistricts } from "../../lib/data";
import type { MarketPrice } from "../../lib/types";
import { useAuth } from "../../lib/useAuth";
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

export function ListProduce() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [marketPrice, setMarketPrice] = useState<MarketPrice | null>(null);
  const [marketPriceLoading, setMarketPriceLoading] = useState(false);
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

  // Fetch live market price when produce or district changes
  useEffect(() => {
    if (!formData.produce) {
      setMarketPrice(null);
      return;
    }
    const fetchMarketPrice = async () => {
      setMarketPriceLoading(true);
      try {
        const prices = await pricingApi.getMarketPrices({
          produce_type: formData.produce,
          district: formData.district,
        });
        // Use exact match first, then fall back to any result for that produce
        const match =
          prices.find(
            (p) =>
              p.produce_type.toLowerCase() === formData.produce.toLowerCase() &&
              p.district.toLowerCase() === formData.district.toLowerCase()
          ) ||
          prices.find(
            (p) => p.produce_type.toLowerCase() === formData.produce.toLowerCase()
          ) ||
          prices[0] ||
          null;
        setMarketPrice(match);
      } catch {
        setMarketPrice(null);
      } finally {
        setMarketPriceLoading(false);
      }
    };
    fetchMarketPrice();
  }, [formData.produce, formData.district]);

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

    try {
      // Create listing
      const listing = await listingsApi.create({
        produce_type_id: parseInt(formData.produce) || 1, // Map produce name to ID
        quantity_available: parseFloat(formData.quantity),
        unit: formData.unit,
        price_per_unit: parseFloat(formData.price),
        description: formData.description || `${formData.produce} ${formData.variety ? `- ${formData.variety}` : ''}`.trim(),
        is_organic: formData.isOrganic,
        harvest_date: formData.availableFrom,
      });

      // Upload images if any
      if (uploadedImages.length > 0 && listing.id) {
        await listingsApi.uploadImages(listing.id, uploadedImages);
      }

      // Show success message
      toast.success("Listing Created!", {
        description: "Your produce has been listed successfully"
      });

      // Navigate to my listings
      setTimeout(() => navigate("/farmer/my-listings"), 500);
    } catch (err: any) {
      const errorMsg = err.message || "Failed to create listing. Please try again.";
      setError(errorMsg);
      toast.error("Failed to Create Listing", {
        description: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
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
            <Label htmlFor="price">Your Price per Unit (ZWL) *</Label>
            <Input
              id="price"
              type="number"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              className="mt-2"
            />

            {/* Live market price hint */}
            {marketPriceLoading && (
              <p className="text-xs text-[#757575] mt-1 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Fetching market price...
              </p>
            )}
            {!marketPriceLoading && marketPrice && (
              <div className="mt-2 p-3 bg-[#2D5016]/5 border border-[#2D5016]/20 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#2D5016] flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#2D5016]">
                        Market range: {marketPrice.currency ?? "ZWL"} {marketPrice.price_min}–{marketPrice.price_max}/{marketPrice.unit}
                      </p>
                      <p className="text-xs text-[#757575]">
                        Avg: {marketPrice.currency ?? "ZWL"} {marketPrice.price_avg}/{marketPrice.unit}
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
                Publishing...
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
