import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Camera, MapPin, Calendar } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { categories, zimbabweDistricts } from "../../lib/data";

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
  const [formData, setFormData] = useState({
    category: "",
    produce: "",
    variety: "",
    quantity: "",
    unit: "kg",
    price: "",
    negotiable: false,
    district: "Harare",
    availableFrom: "",
    availableUntil: "",
    delivery: false,
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, would save listing
    navigate("/farmer/my-listings");
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
            <p className="text-xs text-[#757575] mt-1">Market price range: ZWL 150-200/kg</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="negotiable"
              checked={formData.negotiable}
              onChange={(e) => setFormData({ ...formData, negotiable: e.target.checked })}
              className="w-4 h-4 text-[#2D5016] rounded focus:ring-[#2D5016]"
            />
            <Label htmlFor="negotiable" className="cursor-pointer">Price is negotiable</Label>
          </div>
        </div>

        {/* Section 3: Photos */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">Photos</h2>
          
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-[#F5F5F5] border-2 border-dashed border-[#E0E0E0] flex flex-col items-center justify-center cursor-pointer hover:border-[#2D5016] transition-colors relative group"
              >
                <Camera className="w-8 h-8 text-[#757575] group-hover:text-[#2D5016]" />
                <span className="text-xs text-[#757575] mt-1 group-hover:text-[#2D5016]">Add Photo</span>
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
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
            className="flex-1 h-12 border-2 border-[#E0E0E0] hover:bg-[#F5F5F5]"
          >
            Save as Draft
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 bg-[#2D5016] hover:bg-[#234010] text-white"
          >
            Publish Listing
          </Button>
        </div>
      </form>
    </div>
  );
}
