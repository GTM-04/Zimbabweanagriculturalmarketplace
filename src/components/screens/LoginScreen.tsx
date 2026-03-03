import { ArrowLeft, CheckCircle2, Copy, Eye, EyeOff, Loader2, Sprout, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { authApi } from "../../lib/api";
import { useAuth } from "../../lib/useAuth";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function LoginScreen() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const isOnline = useOnlineStatus();
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [formData, setFormData] = useState({
    phone: "+263 ",
    password: "",
    remember: false,
  });

  // ── Forgot-password state ─────────────────────────────────────────────────
  // step: null = closed | "request" = enter phone | "token" = show token | "confirm" = enter new pwd
  type FpStep = null | "request" | "token" | "confirm";
  const [fpStep, setFpStep] = useState<FpStep>(null);
  const [fpPhone, setFpPhone] = useState("+263 ");
  const [fpToken, setFpToken] = useState(""); // token returned by backend
  const [fpTokenInput, setFpTokenInput] = useState(""); // token typed by user in confirm step
  const [fpNewPwd, setFpNewPwd] = useState("");
  const [fpShowPwd, setFpShowPwd] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");
  const [fpCountdown, setFpCountdown] = useState(0);
  const [fpCopied, setFpCopied] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss countdown for the token display step
  useEffect(() => {
    if (fpStep === "token" && fpCountdown > 0) {
      countdownRef.current = setInterval(() => {
        setFpCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownRef.current!);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [fpStep]);

  const closeFp = () => {
    setFpStep(null);
    setFpPhone("+263 ");
    setFpToken("");
    setFpTokenInput("");
    setFpNewPwd("");
    setFpError("");
    setFpCountdown(0);
    setFpCopied(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const handleFpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError("");
    const clean = fpPhone.replace(/\s/g, "");
    if (!clean.startsWith("+263") || clean.length < 12) {
      setFpError("Please enter a valid Zimbabwe phone number");
      return;
    }
    setFpLoading(true);
    try {
      const res = await authApi.passwordResetRequest(clean);
      if (res.reset_token) {
        setFpToken(res.reset_token);
        // Pre-fill the confirm step input so the user never needs to copy manually
        setFpTokenInput(res.reset_token);
        setFpCountdown(res.display_for_seconds ?? 30);

        // Show the code as a toast so it's impossible to miss
        toast.info("Reset code generated", {
          description: "Your reset code is shown below. Copy it before it disappears.",
          duration: (res.display_for_seconds ?? 30) * 1000,
        });

        setFpStep("token");
      } else {
        // Phone not registered — show a neutral message, go to confirm
        toast.info("If that number is registered, a code has been generated.");
        setFpStep("confirm");
      }
    } catch (err: any) {
      setFpError(err.message || "Request failed. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(fpToken);
      setFpCopied(true);
      setTimeout(() => setFpCopied(false), 2000);
    } catch {
      // clipboard not available — user can select manually
    }
  };

  const handleFpConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError("");
    if (!fpTokenInput.trim()) { setFpError("Please enter the reset token"); return; }
    if (fpNewPwd.length < 6) { setFpError("Password must be at least 6 characters"); return; }
    setFpLoading(true);
    try {
      const res = await authApi.passwordResetConfirm(fpTokenInput.trim(), fpNewPwd);
      toast.success("Password updated!", {
        description: `Welcome back, ${res.user?.full_name ?? ""}. You are now signed in.`,
      });
      closeFp();
      // Navigate to the correct dashboard
      setTimeout(() => {
        if (res.user?.user_type === "farmer") navigate("/farmer/dashboard");
        else navigate("/buyer/dashboard");
      }, 400);
    } catch (err: any) {
      setFpError(err.message || "Invalid or expired token. Please request a new one.");
    } finally {
      setFpLoading(false);
    }
  };

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
      if (!isOnline) {
        toast.success(`Welcome, ${user.full_name}!`, {
          description: "Signed in offline. Some features are limited while offline.",
        });
      } else {
        toast.success(`Welcome to Village to Marketplace, ${user.full_name}!`, {
          description: user.user_type === "farmer"
            ? "Ready to list your produce and connect with buyers."
            : "Browse fresh produce from local farmers.",
        });
      }

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
        <div className="bg-[#FFA726] text-[#2C2C2C] px-4 py-3 flex items-start gap-3 text-sm font-medium">
          <WifiOff className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">You are offline</p>
            <p className="text-xs font-normal mt-0.5">
              If you've signed in before on this device, you can still log in using your cached account.
            </p>
          </div>
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
                onCheckedChange={(checked: boolean | "indeterminate") => setFormData({ ...formData, remember: checked as boolean })}
              />
              <label htmlFor="remember" className="text-sm text-[#757575] cursor-pointer">
                Remember Me
              </label>
            </div>
            <button
              type="button"
              onClick={() => setFpStep("request")}
              className="text-sm text-[#2D5016] font-medium hover:underline"
            >
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
            ) : !isOnline ? (
              <>
                <WifiOff className="w-4 h-4 mr-2" />
                Sign In Offline
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

      {/* ── Forgot Password Modal ─────────────────────────────────────────── */}
      {fpStep !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) closeFp(); }}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 shadow-xl">

            {/* Step 1 — Enter phone */}
            {fpStep === "request" && (
              <form onSubmit={handleFpRequest}>
                <h2 className="text-lg font-bold text-[#2C2C2C] mb-1">Reset Password</h2>
                <p className="text-sm text-[#757575] mb-5">
                  Enter your registered phone number and we'll generate a reset code.
                </p>
                {fpError && (
                  <Alert variant="destructive" className="mb-4">
                    <p className="text-sm">{fpError}</p>
                  </Alert>
                )}
                <Label htmlFor="fp-phone">Phone Number</Label>
                <Input
                  id="fp-phone"
                  type="tel"
                  className="mt-2 mb-5"
                  value={fpPhone}
                  onChange={(e) => setFpPhone(e.target.value)}
                  placeholder="+263 77 123 4567"
                />
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={closeFp}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={fpLoading}
                    className="flex-1 bg-[#2D5016] hover:bg-[#234010] text-white"
                  >
                    {fpLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : "Get Reset Code"}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2 — Show token */}
            {fpStep === "token" && (
              <div>
                <h2 className="text-lg font-bold text-[#2C2C2C] mb-1">Your Reset Code</h2>
                <p className="text-sm text-[#757575] mb-4">
                  Your code is shown below and has been auto-filled in the next step.
                  It expires in 15 minutes.
                  {fpCountdown > 0 && (
                    <span className="ml-1 text-[#FFA726] font-semibold">({fpCountdown}s remaining)</span>
                  )}
                </p>

                {/* Prominent code box */}
                <div className="bg-[#2D5016]/5 border-2 border-[#2D5016]/30 rounded-xl px-4 py-4 mb-2">
                  <p className="text-xs text-[#757575] mb-2 font-medium uppercase tracking-wide">Reset Token</p>
                  <code className="block text-xs break-all text-[#2C2C2C] select-all font-mono leading-relaxed">
                    {fpToken}
                  </code>
                </div>

                {/* Copy row */}
                <div className="flex items-center justify-end mb-5">
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="flex items-center gap-1.5 text-sm text-[#2D5016] font-medium hover:underline"
                  >
                    {fpCopied
                      ? <><CheckCircle2 className="w-4 h-4" /> Copied!</>
                      : <><Copy className="w-4 h-4" /> Copy code</>}
                  </button>
                </div>

                <Button
                  className="w-full bg-[#2D5016] hover:bg-[#234010] text-white"
                  onClick={() => setFpStep("confirm")}
                >
                  Continue — Set New Password
                </Button>
              </div>
            )}

            {/* Step 3 — Enter token + new password */}
            {fpStep === "confirm" && (
              <form onSubmit={handleFpConfirm}>
                <h2 className="text-lg font-bold text-[#2C2C2C] mb-1">Set New Password</h2>
                <p className="text-sm text-[#757575] mb-5">
                  Paste your reset code and choose a new password.
                </p>
                {fpError && (
                  <Alert variant="destructive" className="mb-4">
                    <p className="text-sm">{fpError}</p>
                  </Alert>
                )}
                <Label htmlFor="fp-token">Reset Code</Label>
                <Input
                  id="fp-token"
                  className="mt-2 mb-1 font-mono text-xs"
                  value={fpTokenInput}
                  onChange={(e) => setFpTokenInput(e.target.value)}
                  placeholder="Paste reset code here"
                />
                {fpToken && fpTokenInput === fpToken && (
                  <p className="text-xs text-[#4CAF50] mb-4 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Code pre-filled from previous step
                  </p>
                )}
                {(!fpToken || fpTokenInput !== fpToken) && <div className="mb-4" />}
                <Label htmlFor="fp-newpwd">New Password</Label>
                <div className="relative mt-2 mb-5">
                  <Input
                    id="fp-newpwd"
                    type={fpShowPwd ? "text" : "password"}
                    className="pr-12"
                    value={fpNewPwd}
                    onChange={(e) => setFpNewPwd(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setFpShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757575] hover:text-[#2C2C2C]"
                  >
                    {fpShowPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setFpStep("request"); setFpError(""); }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={fpLoading}
                    className="flex-1 bg-[#2D5016] hover:bg-[#234010] text-white"
                  >
                    {fpLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Update Password"}
                  </Button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
