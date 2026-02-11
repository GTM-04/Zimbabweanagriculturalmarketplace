import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { zimbabweDistricts } from "../../lib/data";

const buyerTypes = [
  "Individual",
  "Restaurant",
  "Retailer",
  "Wholesaler",
  "Institution",
];

export function BuyerRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: "",
    phone: "+263 ",
    buyerType: "",
    district: "",
    terms: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/buyer/dashboard");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#E0E0E0] px-4 py-4 flex items-center gap-3 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#2C2C2C]" />
        </button>
        <h1 className="text-xl font-semibold text-[#2C2C2C]">Buyer Registration</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 max-w-2xl mx-auto pb-24">
        {/* Profile Photo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-[#F5F5F5] border-2 border-dashed border-[#E0E0E0] flex items-center justify-center mb-3 relative group cursor-pointer hover:border-[#4A90E2] transition-colors">
            <Camera className="w-8 h-8 text-[#757575] group-hover:text-[#4A90E2]" />
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <p className="text-sm text-[#757575]">Upload Profile Photo</p>
        </div>

        {/* Business/Full Name */}
        <div className="mb-6">
          <Label htmlFor="businessName">Business Name / Full Name *</Label>
          <Input
            id="businessName"
            type="text"
            placeholder="Enter your name or business name"
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            required
            className="mt-2"
          />
        </div>

        {/* Phone Number */}
        <div className="mb-6">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+263 77 123 4567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            className="mt-2"
          />
          <p className="text-xs text-[#757575] mt-1">Include Zimbabwe country code +263</p>
        </div>

        {/* Buyer Type */}
        <div className="mb-6">
          <Label htmlFor="buyerType">Buyer Type *</Label>
          <select
            id="buyerType"
            value={formData.buyerType}
            onChange={(e) => setFormData({ ...formData, buyerType: e.target.value })}
            required
            className="mt-2 w-full h-12 px-4 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
          >
            <option value="">Select buyer type</option>
            {buyerTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div className="mb-6">
          <Label htmlFor="district">Location/District *</Label>
          <select
            id="district"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            required
            className="mt-2 w-full h-12 px-4 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
          >
            <option value="">Select your district</option>
            {zimbabweDistricts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        {/* Terms & Conditions */}
        <div className="mb-8 flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={formData.terms}
            onCheckedChange={(checked) => setFormData({ ...formData, terms: checked as boolean })}
          />
          <label htmlFor="terms" className="text-sm text-[#757575] leading-relaxed cursor-pointer">
            I agree to the{" "}
            <span className="text-[#4A90E2] font-medium">Terms & Conditions</span> and{" "}
            <span className="text-[#4A90E2] font-medium">Privacy Policy</span>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!formData.terms || !formData.businessName || !formData.phone || !formData.buyerType || !formData.district}
          className="w-full h-12 bg-[#4A90E2] hover:bg-[#3A7BC2] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Account
        </Button>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#757575]">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[#4A90E2] font-medium hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
