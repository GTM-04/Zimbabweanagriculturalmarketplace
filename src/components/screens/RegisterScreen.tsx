import { ArrowLeft, Camera, Check, ChevronDown, Eye, EyeOff, Leaf, Loader2, Lock, MapPin, Sprout, User, Wheat } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { zimbabweDistricts } from "../../lib/data";
import { useAuth } from "../../lib/useAuth";

/* ─── step config ─── */
const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Location", icon: MapPin },
  { id: 3, label: "Security", icon: Lock },
] as const;

export function RegisterScreen() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    district: "",
    ward: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  /* ─── field updater ─── */
  const updateField = useCallback(
    (field: string, value: string | boolean) =>
      setFormData((prev) => ({ ...prev, [field]: value })),
    [],
  );

  /* ─── step validation ─── */
  const stepValid = useMemo(() => {
    if (step === 1) return formData.fullName.trim().length >= 2 && formData.phone.replace(/\s/g, "").length >= 9;
    if (step === 2) return formData.district !== "";
    if (step === 3)
      return (
        formData.password.length >= 8 &&
        formData.password === formData.confirmPassword &&
        formData.terms
      );
    return false;
  }, [step, formData]);

  /* ─── password strength ─── */
  const passwordStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return { score: 0, label: "", color: "" };
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    if (s <= 1) return { score: 1, label: "Weak", color: "#EF4444" };
    if (s <= 2) return { score: 2, label: "Fair", color: "#F59E0B" };
    if (s <= 3) return { score: 3, label: "Good", color: "#3B82F6" };
    return { score: 4, label: "Strong", color: "#16A34A" };
  }, [formData.password]);

  const strengthLevel =
    passwordStrength.score === 1 ? "weak"
      : passwordStrength.score === 2 ? "fair"
        : passwordStrength.score === 3 ? "good"
          : "strong";

  /* ─── avatar preview ─── */
  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setProfilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  /* ─── submit ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    const cleanPhone = "+263" + formData.phone.replace(/\s/g, "");
    if (cleanPhone.length < 12) {
      setError("Please enter a valid Zimbabwe phone number");
      return;
    }

    try {
      await register({
        full_name: formData.fullName,
        phone_number: cleanPhone,
        password: formData.password,
        district: formData.district,
        ward: formData.ward || undefined,
      });
      toast.success("Welcome aboard! 🌱", {
        description: `Account created for ${formData.fullName}. You can switch between Farmer and Buyer modes anytime.`,
      });
      setTimeout(() => navigate("/farmer/dashboard"), 500);
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Registration failed. Please try again.";
      setError(msg);
      toast.error("Registration Failed", { description: msg });
    }
  };

  /* ────────────────────────── RENDER ────────────────────────── */
  return (
    <div className="register-page">
      {/* ═══ Cinematic left panel (desktop only) ═══ */}
      <aside className="register-hero" aria-hidden="true">
        <div className="register-hero__overlay" />

        {/* decorative floating elements */}
        <div className="register-hero__deco register-hero__deco--1">
          <Wheat size={28} className="register-hero__deco-icon register-hero__deco-icon--wheat" />
        </div>
        <div className="register-hero__deco register-hero__deco--2">
          <Sprout size={22} className="register-hero__deco-icon register-hero__deco-icon--sprout" />
        </div>
        <div className="register-hero__deco register-hero__deco--3">
          <Leaf size={18} className="register-hero__deco-icon register-hero__deco-icon--leaf" />
        </div>

        <div className="register-hero__content">
          <div className="register-hero__badge">
            <Sprout size={14} />
            <span>Village to Market</span>
          </div>
          <h2 className="register-hero__title">
            Grow your business,<br />
            <span className="register-hero__title--gold">feed the nation.</span>
          </h2>
          <p className="register-hero__subtitle">
            Join thousands of Zimbabwean farmers and buyers on the premier agricultural marketplace.
          </p>

          {/* social proof */}
          <div className="register-hero__stats">
            {[
              { value: "2,400+", label: "Active Farmers" },
              { value: "1,100+", label: "Verified Buyers" },
              { value: "10K+", label: "Listings" },
            ].map((s) => (
              <div key={s.label} className="register-hero__stat">
                <span className="register-hero__stat-value">{s.value}</span>
                <span className="register-hero__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ═══ Form panel ═══ */}
      <main className="register-form-panel">
        {/* mobile top bar */}
        <div className="register-topbar">
          <button onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))} className="register-back" aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
          <div className="register-topbar__brand">
            <div className="register-topbar__icon">
              <Sprout size={16} className="register-topbar__icon-svg" />
            </div>
            <span className="register-topbar__name">Create Account</span>
          </div>
          <div className="register-topbar__spacer" />
        </div>

        {/* stepper */}
        <div className="register-stepper">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="register-stepper__item">
                {i > 0 && <div className={`register-stepper__line ${step > s.id ? "register-stepper__line--done" : ""}`} />}
                <button
                  type="button"
                  onClick={() => { if (done) setStep(s.id); }}
                  className={`register-stepper__dot ${done ? "register-stepper__dot--done" : active ? "register-stepper__dot--active" : ""}`}
                >
                  {done ? <Check size={14} /> : <Icon size={14} />}
                </button>
                <span className={`register-stepper__label ${active ? "register-stepper__label--active" : ""}`}>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* scrollable form body */}
        <form onSubmit={handleSubmit} className="register-body">
          {/* error banner */}
          {error && (
            <div className="register-error animate-fade-in">
              <p>{error}</p>
            </div>
          )}

          {/* ── Step 1: Personal ── */}
          {step === 1 && (
            <div className="register-step animate-fade-in-up">
              <div className="register-section-head">
                <h3>Personal Information</h3>
                <p>Tell us who you are — this helps build trust in the marketplace.</p>
              </div>

              {/* avatar */}
              <div className="register-avatar-wrap">
                <label className="register-avatar" htmlFor="avatar-upload">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Profile preview" className="register-avatar__img" />
                  ) : (
                    <Camera size={28} className="register-avatar__icon" />
                  )}
                  <div className="register-avatar__badge">
                    <Camera size={12} className="register-avatar__badge-icon" />
                  </div>
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatar} className="register-avatar__input" />
                </label>
                <span className="register-avatar__hint">Add a profile photo</span>
              </div>

              {/* full name */}
              <div className="register-field">
                <label htmlFor="reg-name" className="register-label">Full Name <span className="register-req">*</span></label>
                <div className="register-input-wrap">
                  <User size={16} className="register-input-icon" />
                  <input
                    id="reg-name"
                    type="text"
                    className="register-input"
                    placeholder="e.g. Tendai Moyo"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* phone */}
              <div className="register-field">
                <label htmlFor="reg-phone" className="register-label">Phone Number <span className="register-req">*</span></label>
                <div className="register-phone-group">
                  <div className="register-phone-prefix">
                    <span className="register-phone-flag">🇿🇼</span>
                    <span>+263</span>
                  </div>
                  <input
                    id="reg-phone"
                    type="tel"
                    className="register-phone-input"
                    placeholder="77 123 4567"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    required
                  />
                </div>
                <span className="register-hint">Your phone number is your login ID</span>
              </div>

              {/* dual-mode notice */}
              <div className="register-notice">
                <div className="register-notice__icon">
                  <Sprout size={16} />
                </div>
                <div>
                  <strong>One account, two modes</strong>
                  <p>Your account works as both Farmer & Buyer. Switch anytime.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Location ── */}
          {step === 2 && (
            <div className="register-step animate-fade-in-up">
              <div className="register-section-head">
                <h3>Your Location</h3>
                <p>We match you with nearby farmers and buyers for faster trade.</p>
              </div>

              {/* map deco */}
              <div className="register-map-deco">
                <MapPin size={32} className="register-map-icon" />
                <div className="register-map-deco__rings" />
              </div>

              {/* district */}
              <div className="register-field">
                <label htmlFor="reg-district" className="register-label">District <span className="register-req">*</span></label>
                <div className="register-select-wrap">
                  <MapPin size={16} className="register-input-icon" />
                  <select
                    id="reg-district"
                    className="register-select"
                    value={formData.district}
                    onChange={(e) => updateField("district", e.target.value)}
                    required
                  >
                    <option value="">Select your district</option>
                    {zimbabweDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="register-select-arrow" />
                </div>
              </div>

              {/* ward */}
              <div className="register-field">
                <label htmlFor="reg-ward" className="register-label">Ward <span className="register-opt">(optional)</span></label>
                <div className="register-input-wrap">
                  <MapPin size={16} className="register-input-icon" />
                  <input
                    id="reg-ward"
                    type="text"
                    className="register-input"
                    placeholder="e.g. Ward 5"
                    value={formData.ward}
                    onChange={(e) => updateField("ward", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Security ── */}
          {step === 3 && (
            <div className="register-step animate-fade-in-up">
              <div className="register-section-head">
                <h3>Secure Your Account</h3>
                <p>Choose a strong password to keep your account safe.</p>
              </div>

              {/* password */}
              <div className="register-field">
                <label htmlFor="reg-pass" className="register-label">Password <span className="register-req">*</span></label>
                <div className="register-input-wrap">
                  <Lock size={16} className="register-input-icon" />
                  <input
                    id="reg-pass"
                    type={showPassword ? "text" : "password"}
                    className="register-input register-input--has-toggle"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="register-toggle" aria-label="Toggle password">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* strength bar */}
                {formData.password && (
                  <div className={`register-strength register-strength--${strengthLevel}`}>
                    <div className="register-strength__track">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="register-strength__seg" />
                      ))}
                    </div>
                    <span className={`register-strength__label register-strength__label--${strengthLevel}`}>{passwordStrength.label}</span>
                  </div>
                )}
                <span className="register-hint">At least 8 characters</span>
              </div>

              {/* confirm password */}
              <div className="register-field">
                <label htmlFor="reg-confirm" className="register-label">Confirm Password <span className="register-req">*</span></label>
                <div className="register-input-wrap">
                  <Lock size={16} className="register-input-icon" />
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    className="register-input register-input--has-toggle"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="register-toggle" aria-label="Toggle confirm password">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <span className="register-hint register-hint--error">Passwords don't match</span>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && formData.confirmPassword.length >= 8 && (
                  <span className="register-hint register-hint--success">✓ Passwords match</span>
                )}
              </div>

              {/* terms */}
              <label className="register-terms" htmlFor="reg-terms">
                <input
                  id="reg-terms"
                  type="checkbox"
                  checked={formData.terms}
                  onChange={(e) => updateField("terms", e.target.checked)}
                  className="register-checkbox"
                />
                <span>
                  I agree to the <button type="button" className="register-link">Terms & Conditions</button> and{" "}
                  <button type="button" className="register-link">Privacy Policy</button>
                </span>
              </label>
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div className={`register-actions ${step === 1 ? "register-actions--single" : ""}`}>
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="register-btn register-btn--secondary">
                <ArrowLeft size={16} /> Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                disabled={!stepValid}
                onClick={() => setStep(step + 1)}
                className="register-btn register-btn--primary"
              >
                Continue
                <Sprout size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!stepValid || loading}
                className="register-btn register-btn--primary register-btn--submit"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="register-spinner" />
                    Creating Account…
                  </>
                ) : (
                  <>
                    Create Account
                    <Sprout size={16} />
                  </>
                )}
              </button>
            )}
          </div>

          {/* sign-in link */}
          <p className="register-footer">
            Already have an account?{" "}
            <button type="button" onClick={() => navigate("/login")} className="register-link">
              Sign In
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}
