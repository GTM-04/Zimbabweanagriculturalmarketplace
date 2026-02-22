import { ArrowLeft, Eye, EyeOff, Loader2, Sprout, WifiOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../../lib/useAuth";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function LoginScreen() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [formData, setFormData] = useState({
    phone: "+263 ",
    password: "",
    remember: false,
  });
  const isOnline = navigator.onLine;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    // Validate phone number format
    const cleanPhone = formData.phone.replace(/\s/g, "");
    if (!cleanPhone.startsWith("+263") || cleanPhone.length < 12) {
      setLocalError("Please enter a valid Zimbabwe phone number");
      return;
    }

    try {
      const user = await login({
        phone_number: cleanPhone,
        password: formData.password,
      });

      // Show success message
      toast.success("Login successful!", {
        description: `Welcome back, ${user.full_name}`
      });

      // Navigate based on user type
      setTimeout(() => {
        if (user.user_type === "farmer") {
          navigate("/farmer/dashboard");
        } else {
          navigate("/buyer/dashboard");
        }
      }, 500);
    } catch (err: any) {
      const errorMsg = err.message || "Login failed. Please check your credentials.";
      setLocalError(errorMsg);
      toast.error("Login Failed", {
        description: errorMsg
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="bg-[#FFA726] text-[#2C2C2C] px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Limited functionality.</span>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#2C2C2C]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-[#2D5016] rounded-full flex items-center justify-center">
            <Sprout className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[#2C2C2C] mb-2">Welcome Back</h1>
        <p className="text-base text-[#757575] mb-8">Sign in to continue</p>

        {/* Error Alert */}
        {(localError || error) && (
          <div className="w-full max-w-md mb-4">
            <Alert variant="destructive">
              <p className="text-sm">{localError || error}</p>
            </Alert>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          {/* Phone Number */}
          <div className="mb-6">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+263 77 123 4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className="mt-2"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
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
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={formData.remember}
                onCheckedChange={(checked) => setFormData({ ...formData, remember: checked as boolean })}
              />
              <label htmlFor="remember" className="text-sm text-[#757575] cursor-pointer">
                Remember Me
              </label>
            </div>
            <button type="button" className="text-sm text-[#2D5016] font-medium hover:underline">
              Forgot Password?
            </button>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            disabled={!formData.phone || !formData.password || loading}
            className="w-full h-12 bg-[#2D5016] hover:bg-[#234010] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#757575]">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/user-type")}
                className="text-[#2D5016] font-medium hover:underline"
              >
                Register
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
