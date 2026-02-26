import { ArrowLeft, Camera, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { categories, zimbabweDistricts } from "../../lib/data";
import { useAuth } from "../../lib/useAuth";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function FarmerRegistration() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "+263 ",
    district: "",
    ward: "",
    farmSize: "",
    primaryCrops: [] as string[],
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    // Validate phone number format
    const cleanPhone = formData.phone.replace(/\s/g, "");
    if (!cleanPhone.startsWith("+263") || cleanPhone.length < 12) {
      setError("Please enter a valid Zimbabwe phone number");
      return;
    }

    try {
      await register({
        full_name: formData.fullName,
        phone_number: cleanPhone,
        password: formData.password,
        user_type: "farmer",
        district: formData.district,
        ward: formData.ward || "Ward 1",
      });

      // Show success message
      toast.success("Registration successful!", {
        description: "Welcome to Kufara marketplace"
      });
      
      // Navigate to farmer dashboard on success
      setTimeout(() => navigate("/farmer/dashboard"), 500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || "Registration failed. Please try again.";
      setError(errorMsg);
      toast.error("Registration Failed", {
        description: errorMsg
      });
    }
  };

  const toggleCrop = (crop: string) => {
    setFormData(prev => ({
      ...prev,
      primaryCrops: prev.primaryCrops.includes(crop)
        ? prev.primaryCrops.filter(c => c !== crop)
        : [...prev.primaryCrops, crop],
    }));
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
        <h1 className="text-xl font-semibold text-[#2C2C2C]">Farmer Registration</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 max-w-2xl mx-auto pb-24">
        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert variant="destructive">
              <p className="text-sm">{error}</p>
            </Alert>
          </div>
        )}

        {/* Profile Photo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-[#F5F5F5] border-2 border-dashed border-[#E0E0E0] flex items-center justify-center mb-3 relative group cursor-pointer hover:border-[#2D5016] transition-colors">
            <Camera className="w-8 h-8 text-[#757575] group-hover:text-[#2D5016]" />
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <p className="text-sm text-[#757575]">Upload Profile Photo</p>
        </div>

        {/* Full Name */}
        <div className="mb-6">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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

        {/* District */}
        <div className="mb-6">
          <Label htmlFor="district">Location/District *</Label>
          <select
            id="district"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            required
            className="mt-2 w-full h-12 px-4 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-transparent"
          >
            <option value="">Select your district</option>
            {zimbabweDistricts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        {/* Ward */}
        <div className="mb-6">
          <Label htmlFor="ward">Ward (Optional)</Label>
          <Input
            id="ward"
            type="text"
            placeholder="e.g., Ward 5"
            value={formData.ward}
            onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
            className="mt-2"
          />
        </div>

        {/* Farm Size */}
        <div className="mb-6">
          <Label htmlFor="farmSize">Farm Size (Optional)</Label>
          <Input
            id="farmSize"
            type="text"
            placeholder="e.g., 5 hectares"
            value={formData.farmSize}
            onChange={(e) => setFormData({ ...formData, farmSize: e.target.value })}
            className="mt-2"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <Label htmlFor="password">Password *</Label>
          <div className="relative mt-2">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757575] hover:text-[#2C2C2C]"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-[#757575] mt-1">At least 8 characters</p>
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <div className="relative mt-2">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757575] hover:text-[#2C2C2C]"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Primary Crops */}
        <div className="mb-6">
          <Label>Primary Crops *</Label>
          <p className="text-sm text-[#757575] mb-3">Select all that apply</p>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCrop(category.name)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.primaryCrops.includes(category.name)
                    ? "border-[#2D5016] bg-[#2D5016]/5"
                    : "border-[#E0E0E0] hover:border-[#2D5016]/30"
                }`}
              >
                <div className="text-2xl mb-1">{category.icon}</div>
                <div className="text-sm font-medium text-[#2C2C2C]">{category.name}</div>
              </button>
            ))}
          </div>
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
            <span className="text-[#2D5016] font-medium">Terms & Conditions</span> and{" "}
            <span className="text-[#2D5016] font-medium">Privacy Policy</span>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={
            !formData.terms || 
            !formData.fullName || 
            !formData.phone || 
            !formData.district || 
            !formData.password || 
            !formData.confirmPassword || 
            formData.primaryCrops.length === 0 ||
            loading
          }
          className="w-full h-12 bg-[#2D5016] hover:bg-[#234010] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#757575]">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[#2D5016] font-medium hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
