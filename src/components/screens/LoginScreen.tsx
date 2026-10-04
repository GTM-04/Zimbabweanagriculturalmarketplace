import { ArrowLeft, CheckCircle2, Copy, Eye, EyeOff, Leaf, Loader2, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { authApi } from "../../lib/api";
import { useAuth } from "../../lib/useAuth";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
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
    phone: "",
    password: "",
    remember: false,
  });

  type FpStep = null | "request" | "token" | "confirm";
  const [fpStep, setFpStep] = useState<FpStep>(null);
  const [fpPhone, setFpPhone] = useState("+263 ");
  const [fpToken, setFpToken] = useState("");
  const [fpTokenInput, setFpTokenInput] = useState("");
  const [fpNewPwd, setFpNewPwd] = useState("");
  const [fpShowPwd, setFpShowPwd] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");
  const [fpCountdown, setFpCountdown] = useState(0);
  const [fpCopied, setFpCopied] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (fpStep === "token" && fpCountdown > 0) {
      countdownRef.current = setInterval(() => {
        setFpCountdown((c) => {
          if (c <= 1) { clearInterval(countdownRef.current!); return 0; }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [fpStep]);

  const closeFp = () => {
    setFpStep(null); setFpPhone("+263 "); setFpToken(""); setFpTokenInput("");
    setFpNewPwd(""); setFpError(""); setFpCountdown(0); setFpCopied(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const handleFpRequest = async (e: React.FormEvent) => {
    e.preventDefault(); setFpError("");
    const clean = fpPhone.replace(/\s/g, "");
    if (!clean.startsWith("+263") || clean.length < 12) { setFpError("Please enter a valid Zimbabwe phone number"); return; }
    setFpLoading(true);
    try {
      const res = await authApi.passwordResetRequest(clean);
      if (res.reset_token) {
        setFpToken(res.reset_token); setFpTokenInput(res.reset_token);
        setFpCountdown(res.display_for_seconds ?? 30);
        toast.info("Reset code generated", { description: "Your reset code is shown below. Copy it before it disappears.", duration: (res.display_for_seconds ?? 30) * 1000 });
        setFpStep("token");
      } else {
        toast.info("If that number is registered, a code has been generated.");
        setFpStep("confirm");
      }
    } catch (err: any) { setFpError(err.message || "Request failed. Please try again."); }
    finally { setFpLoading(false); }
  };

  const handleCopyToken = async () => {
    try { await navigator.clipboard.writeText(fpToken); setFpCopied(true); setTimeout(() => setFpCopied(false), 2000); } catch { }
  };

  const handleFpConfirm = async (e: React.FormEvent) => {
    e.preventDefault(); setFpError("");
    if (!fpTokenInput.trim()) { setFpError("Please enter the reset token"); return; }
    if (fpNewPwd.length < 6) { setFpError("Password must be at least 6 characters"); return; }
    setFpLoading(true);
    try {
      const res = await authApi.passwordResetConfirm(fpTokenInput.trim(), fpNewPwd);
      toast.success("Password updated!", { description: `Welcome back, ${res.user?.full_name ?? ""}. You are now signed in.` });
      closeFp();
      const dashboard = res.user?.user_type === "buyer" ? "/buyer/dashboard" : "/farmer/dashboard";
      setTimeout(() => navigate(dashboard), 400);
    } catch (err: any) { setFpError(err.message || "Invalid or expired token. Please request a new one."); }
    finally { setFpLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLocalError("");
    const cleanPhone = "+263" + formData.phone.replace(/\s/g, "");
    if (cleanPhone.length < 12) { setLocalError("Please enter a valid Zimbabwe phone number"); return; }
    try {
      const user = await login({ phone_number: "+263" + formData.phone.replace(/\s/g, ""), password: formData.password });
      if (!isOnline) {
        toast.success(`Welcome, ${user.full_name}!`, { description: "Signed in offline. Some features are limited." });
      } else {
        toast.success(`Welcome, ${user.full_name}!`, { description: user.user_type === "farmer" ? "Ready to list your produce." : "Browse fresh produce from local farmers." });
      }
      setTimeout(() => {
        const dashboard = user.user_type === "buyer" ? "/buyer/dashboard" : "/farmer/dashboard";
        navigate(dashboard);
      }, 500);
    } catch (err: any) {
      const errorMsg = err.message || "Login failed. Please check your credentials.";
      setLocalError(errorMsg);
      toast.error("Login Failed", { description: errorMsg });
    }
  };

  return (
    <div 
      className="auth-page login-page"
      style={{
        backgroundImage: 'linear-gradient(rgba(11, 30, 20, 0.6), rgba(11, 30, 20, 0.8)), url(/premium_agriculture_bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh'
      }}
    >
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">You're offline</p>
            <p className="text-xs opacity-80">Sign in using your cached account.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-5 pb-2 flex items-center gap-3 animate-fade-in">
        <button onClick={() => navigate(-1)} className="btn-icon btn-back section-card-md login-back">
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        {/* Logo */}
        <div className="mb-8 animate-scale-in">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg bg-gradient-primary">
            <Leaf className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8 animate-fade-in-up delay-100 login-title-block">
          <h1 className="text-3xl font-extrabold mb-2 font-display tracking-display login-title" style={{ color: '#ffffff' }}>
            Welcome Back
          </h1>
          <p className="text-sm login-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Sign in to your Village to Market account
          </p>
        </div>

        {/* Error */}
        {(localError || error) && (
          <div className="w-full max-w-md mb-4 error-banner animate-fade-in">
            <p className="text-sm font-medium text-error">{localError || error}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="w-full max-w-md animate-fade-in-up delay-200 section-card-lg login-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="form-label">
                Phone Number
              </Label>
              <div className="phone-input-group">
                <div className="phone-prefix">+263</div>
                <input
                  id="phone"
                  type="tel"
                  placeholder="77 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="phone-input"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="form-label">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-12 rounded-xl pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg btn-icon-ghost"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={formData.remember}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setFormData({ ...formData, remember: checked as boolean })
                  }
                />
                <label htmlFor="remember" className="text-sm cursor-pointer text-muted">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => setFpStep("request")}
                className="text-sm link-primary"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={!formData.phone || !formData.password || loading}
              className="w-full h-12 rounded-xl font-semibold text-sm login-submit"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing In...</>
              ) : !isOnline ? (
                <><WifiOff className="w-4 h-4 mr-2" />Sign In Offline</>
              ) : (
                "Sign In"
              )}
            </Button>

            {/* Register link */}
            <div className="pt-1 text-center">
              <p className="text-sm text-muted">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="link-primary transition-colors"
                >
                  Create Account
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* ── Forgot Password Modal ── */}
      {fpStep !== null && (
        <div
          className="modal-overlay animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) closeFp(); }}
        >
          <div className="modal-sheet animate-slide-in-up">
            {/* Handle bar */}
            <div className="modal-handle" />

            {/* Step 1 — Enter phone */}
            {fpStep === "request" && (
              <form onSubmit={handleFpRequest}>
                <h2 className="text-xl font-bold mb-1 font-display text-fg">
                  Reset Password
                </h2>
                <p className="text-sm mb-5 text-muted">
                  Enter your registered phone number and we'll generate a reset code.
                </p>
                {fpError && (
                  <div className="error-banner p-3 rounded-xl mb-4">
                    <p className="text-sm text-error">{fpError}</p>
                  </div>
                )}
                <Label htmlFor="fp-phone" className="form-label">Phone Number</Label>
                <Input id="fp-phone" type="tel" className="mb-5 h-12 rounded-xl" value={fpPhone} onChange={(e) => setFpPhone(e.target.value)} placeholder="+263 77 123 4567" />
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl" onClick={closeFp}>Cancel</Button>
                  <Button type="submit" disabled={fpLoading} className="flex-1 h-11 rounded-xl">
                    {fpLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : "Get Reset Code"}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2 — Show token */}
            {fpStep === "token" && (
              <div>
                <h2 className="text-xl font-bold mb-1 font-display text-fg">Your Reset Code</h2>
                <p className="text-sm mb-4 text-muted">
                  Your code is shown below and pre-filled for the next step. It expires in 15 minutes.
                  {fpCountdown > 0 && <span className="ml-1 font-semibold text-warning">({fpCountdown}s)</span>}
                </p>
                <div className="login-token-card mb-2 section-card">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-muted">Reset Token</p>
                  <code className="block text-xs break-all font-mono leading-relaxed select-all text-fg">{fpToken}</code>
                </div>
                <div className="flex items-center justify-end mb-5">
                  <button type="button" onClick={handleCopyToken} className="flex items-center gap-1.5 text-sm link-primary">
                    {fpCopied ? <><CheckCircle2 className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy code</>}
                  </button>
                </div>
                <Button className="w-full h-11 rounded-xl" onClick={() => setFpStep("confirm")}>Continue — Set New Password</Button>
              </div>
            )}

            {/* Step 3 — Enter token + new password */}
            {fpStep === "confirm" && (
              <form onSubmit={handleFpConfirm}>
                <h2 className="text-xl font-bold mb-1 font-display text-fg">Set New Password</h2>
                <p className="text-sm mb-5 text-muted">Paste your reset code and choose a new password.</p>
                {fpError && (
                  <div className="error-banner p-3 rounded-xl mb-4">
                    <p className="text-sm text-error">{fpError}</p>
                  </div>
                )}
                <Label htmlFor="fp-token" className="form-label">Reset Code</Label>
                <Input id="fp-token" className="mb-1 h-12 rounded-xl font-mono text-xs" value={fpTokenInput} onChange={(e) => setFpTokenInput(e.target.value)} placeholder="Paste reset code here" />
                {fpToken && fpTokenInput === fpToken && (
                  <p className="text-xs mb-4 flex items-center gap-1 text-success">
                    <CheckCircle2 className="w-3 h-3" />Code pre-filled from previous step
                  </p>
                )}
                {(!fpToken || fpTokenInput !== fpToken) && <div className="mb-4" />}
                <Label htmlFor="fp-newpwd" className="form-label">New Password</Label>
                <div className="relative mb-5">
                  <Input id="fp-newpwd" type={fpShowPwd ? "text" : "password"} className="h-12 rounded-xl pr-12" value={fpNewPwd} onChange={(e) => setFpNewPwd(e.target.value)} placeholder="At least 6 characters" />
                  <button type="button" onClick={() => setFpShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon-ghost">
                    {fpShowPwd ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => { setFpStep("request"); setFpError(""); }}>Back</Button>
                  <Button type="submit" disabled={fpLoading} className="flex-1 h-11 rounded-xl">
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
