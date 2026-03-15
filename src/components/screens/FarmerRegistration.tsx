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
    farmSizeValue: "",
    farmSizeUnit: "hectares",
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
        description: `Welcome to Village to Marketplace, ${formData.fullName}! Ready to list your produce and connect with buyers.`
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

  const getPasswordStrength = (pwd: string): "weak" | "fair" | "strong" | null => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].reduce(
      (acc, re) => (re.test(pwd) ? acc + 1 : acc),
      0
    );
    score += variety >= 3 ? 2 : variety >= 2 ? 1 : 0;
    if (score <= 1) return "weak";
    if (score <= 3) return "fair";
    return "strong";
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[var(--gray-200)] px-4 py-4 flex items-center gap-3 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-[var(--gray-100)] rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--gray-800)]" />
        </button>
        <h1
          className="text-xl font-semibold text-[var(--gray-900)]"
          style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
        >
          Farmer Registration
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 max-w-2xl mx-auto pb-24 space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-8">
            <Alert variant="destructive">
              <p className="text-sm">{error}</p>
            </Alert>
          </div>
        )}

        {/* Profile Photo */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-24 h-24 rounded-full bg-[var(--gray-50)] border-2 border-dashed border-[var(--gray-200)] flex items-center justify-center relative group cursor-pointer hover:border-[var(--primary-700)] transition-colors">
            <Camera className="w-8 h-8 text-[var(--gray-500)] group-hover:text-[var(--primary-700)]" />
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <p className="text-sm text-[var(--gray-600)]">Upload Profile Photo</p>
        </div>

        {/* Full Name */}
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            className="mt-3"
          />
        </div>

        {/* Phone Number */}
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+263 77 123 4567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            className="mt-3"
          />
          <p className="text-xs text-[var(--gray-600)] mt-1">Include Zimbabwe country code +263</p>
        </div>

        {/* District */}
        <div className="mb-6">
          <Label htmlFor="district">Location/District *</Label>
          <select
            id="district"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            required
            className="mt-2 w-full h-12 px-4 bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-600)] focus:border-transparent"
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
          <div className="mt-2 grid grid-cols-[minmax(0,1fr),auto] gap-2">
            <Input
              id="farmSize"
              type="number"
              min="0"
              step="0.1"
              placeholder="10.5"
              value={formData.farmSizeValue}
              onChange={(e) => setFormData({ ...formData, farmSizeValue: e.target.value })}
            />
            <select
              value={formData.farmSizeUnit}
              onChange={(e) => setFormData({ ...formData, farmSizeUnit: e.target.value })}
              className="h-12 px-3 bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-600)] focus:border-transparent text-sm"
            >
              <option value="hectares">Hectares</option>
              <option value="acres">Acres</option>
            </select>
          </div>
          <p className="text-xs text-[var(--gray-600)] mt-1">e.g., 5 hectares or 12 acres</p>
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
          <p className="text-xs text-[var(--gray-600)] mt-1">At least 8 characters</p>
          {passwordStrength && (
            <>
              <div className="mt-2 h-1.5 rounded-full bg-[var(--gray-200)] overflow-hidden">
                <div
                  className={
                    "h-full rounded-full transition-all " +
                    (passwordStrength === "weak"
                      ? "w-1/3 bg-[var(--error-red)]"
                      : passwordStrength === "fair"
                      ? "w-2/3 bg-[var(--accent-500)]"
                      : "w-full bg-[var(--success)]")
                  }
                />
              </div>
              <p
                className={
                  "mt-1 text-xs font-semibold " +
                  (passwordStrength === "weak"
                    ? "text-[var(--error-red)]"
                    : passwordStrength === "fair"
                    ? "text-[var(--accent-500)]"
                    : "text-[var(--success)]")
                }
              >
                {passwordStrength === "weak"
                  ? "Weak password"
                  : passwordStrength === "fair"
                  ? "Fair password"
                  : "Strong password"}
              </p>
            </>
          )}
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
          <p className="text-sm text-[var(--gray-600)] mb-3">Select all that apply</p>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCrop(category.name)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.primaryCrops.includes(category.name)
                    ? "border-[var(--primary-700)] bg-[var(--primary-50)]"
                    : "border-[var(--gray-200)] hover:border-[var(--primary-200)]"
                }`}
              >
                <div className="text-2xl mb-1">{category.icon}</div>
                <div className="text-sm font-medium text-[var(--gray-900)]">{category.name}</div>
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
          <label htmlFor="terms" className="text-sm text-[var(--gray-600)] leading-relaxed cursor-pointer">
            I agree to the{" "}
            <span className="text-[var(--primary-800)] font-medium">Terms & Conditions</span> and{" "}
            <span className="text-[var(--primary-800)] font-medium">Privacy Policy</span>
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
          className="w-full h-12 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
          <p className="text-sm text-[var(--gray-600)]">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[var(--primary-800)] font-medium hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
