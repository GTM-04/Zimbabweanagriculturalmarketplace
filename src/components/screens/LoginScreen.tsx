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
    <div className="auth-layout">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="offline-banner flex items-start justify-center gap-3 text-sm font-medium">
          <WifiOff className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">You are offline</p>
            <p className="text-xs font-normal mt-0.5">
              If you've signed in before on this device, you can still log in using your cached account.
            </p>
          </div>
        </div>
      )}

      {/* Left marketing / brand panel */}
      <div className="auth-panel-left animate-fade-in-up">
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <span className="badge badge-accent hidden sm:inline-flex items-center gap-2">
            <span className="text-xs">ZIMBABWE'S FARM MARKETPLACE</span>
          </span>
        </div>

        <div className="space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/25 text-[11px] font-semibold uppercase tracking-[0.16em]">
            <span className="text-sm">🏆</span>
            <span>Zimbabwe's #1 farm-to-market platform</span>
          </div>

          <h1 className="text-white" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            Connect Directly.
            <br />
            <span style={{ color: "var(--accent-500)" }}>Sell Fair.</span>
            <br />
            Grow Together.
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-white/90" style={{ fontFamily: "var(--font-body)" }}>
            From Village to Market connects rural farmers with urban buyers using offline-first technology,
            transparent pricing, and instant messaging.
          </p>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="stat-card bg-white/5 rounded-xl border border-white/10">
              <div className="stat-number text-[1.8rem]" style={{ backgroundImage: "var(--gradient-primary)" }}>24k+</div>
              <div className="stat-label text-[11px] tracking-wide uppercase text-white/80">Farmers</div>
            </div>
            <div className="stat-card bg-white/5 rounded-xl border border-white/10">
              <div className="stat-number text-[1.8rem]" style={{ backgroundImage: "var(--gradient-accent)" }}>3.8k</div>
              <div className="stat-label text-[11px] tracking-wide uppercase text-white/80">Buyers</div>
            </div>
            <div className="stat-card bg-white/5 rounded-xl border border-white/10">
              <div className="stat-number text-[1.8rem]" style={{ backgroundImage: "linear-gradient(135deg,#14B8A6,#38BDF8)" }}>$2.8M</div>
              <div className="stat-label text-[11px] tracking-wide uppercase text-white/80">Trade Volume</div>
            </div>
          </div>
        </div>

        <div className="mt-10 hidden lg:block">
          <div className="flex items-center gap-4 text-xs text-white/85">
            <div className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
              <span>Offline-first &amp; low data usage</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-500)]" />
              <span>Built for all 10 provinces</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right auth form panel */}
      <div className="auth-panel-right animate-scale-fade-in">
        <div className="w-full max-w-md">
          {/* Logo + heading */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[var(--primary-700)] flex items-center justify-center text-white shadow-md">
              <Sprout className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gray-500)] uppercase">From Village to Market</p>
              <p className="text-sm text-[var(--gray-600)]">Connect farms to buyers in Zimbabwe</p>
            </div>
          </div>

          <h2 className="mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.8rem", fontWeight: 800, color: "var(--gray-900)" }}>
            Welcome back
          </h2>
          <p className="mb-6 text-sm text-[var(--gray-600)]">Login to continue to your marketplace dashboard.</p>

          {/* Error Alert */}
          {(localError || error) && (
            <div className="mb-4">
              <Alert variant="destructive">
                <p className="text-sm">{localError || error}</p>
              </Alert>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Number */}
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="mt-2 flex items-stretch rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] focus-within:ring-2 focus-within:ring-[var(--primary-500)] focus-within:border-transparent overflow-hidden">
                <div className="px-3 sm:px-4 flex items-center gap-1 border-r border-[var(--gray-200)] bg-white text-sm text-[var(--gray-700)]">
                  <span className="text-base">🇿🇼</span>
                  <span className="hidden sm:inline text-xs font-medium text-[var(--gray-500)]">+263</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="77 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:outline-none px-3 sm:px-4 h-12 text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="pr-12 h-12 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] focus-visible:ring-2 focus-visible:ring-[var(--primary-500)] focus-visible:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-500)] hover:text-[var(--primary-700)]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, remember: !formData.remember })}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <Checkbox
                  id="remember"
                  checked={formData.remember}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setFormData({ ...formData, remember: checked as boolean })
                  }
                  className="w-4 h-4 border-2 border-[var(--gray-300)] data-[state=checked]:bg-[var(--primary-700)] data-[state=checked]:border-[var(--primary-700)]"
                />
                <span className="text-xs sm:text-sm text-[var(--gray-700)] font-medium">
                  Remember me
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFpStep("request")}
                className="text-xs sm:text-sm font-medium text-[var(--primary-700)] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={!formData.phone || !formData.password || loading}
              className="w-full h-12 rounded-xl bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : !isOnline ? (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>Sign in offline</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 pt-1">
              <div className="h-px flex-1 bg-[var(--gray-200)]" />
              <span className="text-[10px] font-medium tracking-[0.18em] text-[var(--gray-500)] uppercase">Or continue with</span>
              <div className="h-px flex-1 bg-[var(--gray-200)]" />
            </div>

            {/* Social icons (UI only) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex-1 h-11 rounded-xl border-2 border-[var(--gray-200)] bg-white flex items-center justify-center text-sm text-[var(--gray-700)] hover:border-[var(--primary-700)] hover:bg-[var(--gray-50)] shadow-sm hover:shadow-md transition-all"
              >
                <span className="text-base mr-2">🔐</span>
                <span>Google</span>
              </button>
              <button
                type="button"
                className="flex-1 h-11 rounded-xl border-2 border-[var(--gray-200)] bg-white flex items-center justify-center text-sm text-[var(--gray-700)] hover:border-[var(--primary-700)] hover:bg-[var(--gray-50)] shadow-sm hover:shadow-md transition-all"
              >
                <span className="text-base mr-2">💬</span>
                <span>WhatsApp</span>
              </button>
            </div>

            {/* Register Link */}
            <div className="pt-2 text-center text-xs sm:text-sm text-[var(--gray-600)]">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/user-type")}
                className="font-semibold text-[var(--primary-700)] hover:underline"
              >
                Sign up as Farmer or Buyer
              </button>
            </div>
          </form>
        </div>
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
                <h2 className="text-lg font-bold text-[var(--gray-900)] mb-1">Reset Password</h2>
                <p className="text-sm text-[var(--gray-600)] mb-5">
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
                    className="flex-1 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white"
                  >
                    {fpLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : "Get Reset Code"}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2 — Show token */}
            {fpStep === "token" && (
              <div>
                <h2 className="text-lg font-bold text-[var(--gray-900)] mb-1">Your Reset Code</h2>
                <p className="text-sm text-[var(--gray-600)] mb-4">
                  Your code is shown below and has been auto-filled in the next step.
                  It expires in 15 minutes.
                  {fpCountdown > 0 && (
                    <span className="ml-1 text-[var(--accent-500)] font-semibold">({fpCountdown}s remaining)</span>
                  )}
                </p>

                {/* Prominent code box */}
                <div className="bg-[var(--primary-50)] border-2 border-[var(--primary-200)] rounded-xl px-4 py-4 mb-2">
                  <p className="text-xs text-[var(--gray-600)] mb-2 font-medium uppercase tracking-wide">Reset Token</p>
                  <code className="block text-xs break-all text-[var(--gray-900)] select-all font-mono leading-relaxed">
                    {fpToken}
                  </code>
                </div>

                {/* Copy row */}
                <div className="flex items-center justify-end mb-5">
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="flex items-center gap-1.5 text-sm text-[var(--primary-800)] font-medium hover:underline"
                  >
                    {fpCopied
                      ? <><CheckCircle2 className="w-4 h-4" /> Copied!</>
                      : <><Copy className="w-4 h-4" /> Copy code</>}
                  </button>
                </div>

                <Button
                  className="w-full bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white"
                  onClick={() => setFpStep("confirm")}
                >
                  Continue — Set New Password
                </Button>
              </div>
            )}

            {/* Step 3 — Enter token + new password */}
            {fpStep === "confirm" && (
              <form onSubmit={handleFpConfirm}>
                <h2 className="text-lg font-bold text-[var(--gray-900)] mb-1">Set New Password</h2>
                <p className="text-sm text-[var(--gray-600)] mb-5">
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
                  <p className="text-xs text-[var(--success)] mb-4 flex items-center gap-1">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-500)] hover:text-[var(--gray-800)]"
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
                    className="flex-1 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white"
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
