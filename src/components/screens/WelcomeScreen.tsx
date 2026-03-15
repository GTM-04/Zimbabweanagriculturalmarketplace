import { ArrowRight, CheckCircle2, Sprout } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";

export function WelcomeScreen() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[var(--gray-50)] flex flex-col">
      {/* Top navigation / brand bar */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-[var(--gray-200)]">
        <div className="avn-container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--primary-700)] flex items-center justify-center text-white shadow-sm">
              <Sprout className="w-6 h-6" />
            </div>
            <div className="leading-none">
              <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gray-500)] uppercase">
                From Village to Market
              </p>
              <p className="text-xs text-[var(--gray-600)]">Zimbabwe's agricultural marketplace</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-[var(--gray-600)]">
            <button className="hover:text-[var(--primary-700)]">Features</button>
            <button className="hover:text-[var(--primary-700)]">Impact</button>
            <button className="hover:text-[var(--primary-700)]">Trust</button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              className="hidden sm:inline-flex text-[var(--primary-700)] hover:bg-[var(--gray-100)] px-4 py-2 rounded-full text-xs font-medium"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate("/user-type")}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white text-xs font-semibold shadow-md"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="avn-container py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-12 text-white">
          {/* Left hero copy */}
          <div className="flex-1 space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/25 text-[10px] font-semibold uppercase tracking-[0.18em]">
              <span>🏆</span>
              <span>Zimbabwe's #1 farm-to-market platform</span>
            </div>

            <h1
              className="text-white"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.5rem, 6vw, 3.8rem)",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              Connect Directly.
              <br />
              <span style={{ color: "var(--accent-500)" }}>Sell Fair.</span>
              <br />
              Grow Together.
            </h1>

            <p
              className="text-sm sm:text-base leading-relaxed text-white/90 max-w-xl"
              style={{ fontFamily: "var(--font-body)" }}
            >
              From Village to Market is Zimbabwe's agricultural marketplace connecting rural farmers with urban buyers —
              featuring offline-first access, transparent pricing, and instant messaging.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Button
                onClick={() => navigate("/register/farmer")}
                className="flex-1 sm:flex-none sm:px-6 h-12 rounded-xl bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white font-semibold shadow-lg flex items-center justify-center gap-2"
              >
                Start Selling
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigate("/register/buyer")}
                variant="outline"
                className="flex-1 sm:flex-none sm:px-6 h-12 rounded-xl border border-white/40 bg-white/10 text-white text-sm font-medium hover:bg-white/20"
              >
                Browse Produce
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 text-xs text-white/85">
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--success-light)]" />
                <span>Offline-first &amp; low data usage</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--success-light)]" />
                <span>Transparent, district-level pricing</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--success-light)]" />
                <span>Instant chat between farmers and buyers</span>
              </div>
            </div>
          </div>

          {/* Right floating stats card */}
          <div className="flex-1 w-full max-w-md lg:max-w-sm self-stretch lg:self-center animate-scale-fade-in">
            <div className="card-glass shadow-2xl border border-white/30 bg-white/90 text-[var(--gray-900)]">
              <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-700)] uppercase mb-3">
                Real-time marketplace snapshot
              </p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="stat-card p-0 text-left">
                  <div className="stat-number text-[1.8rem]" style={{ backgroundImage: "var(--gradient-primary)" }}>
                    24,567
                  </div>
                  <div className="stat-label text-[11px] uppercase tracking-wide text-[var(--gray-600)]">
                    Active Farmers
                  </div>
                </div>
                <div className="stat-card p-0 text-left">
                  <div className="stat-number text-[1.8rem]" style={{ backgroundImage: "var(--gradient-accent)" }}>
                    3,842
                  </div>
                  <div className="stat-label text-[11px] uppercase tracking-wide text-[var(--gray-600)]">
                    Active Buyers
                  </div>
                </div>
                <div className="stat-card p-0 text-left">
                  <div
                    className="stat-number text-[1.8rem]"
                    style={{ backgroundImage: "linear-gradient(135deg,#14B8A6,#38BDF8)" }}
                  >
                    $2.8M+
                  </div>
                  <div className="stat-label text-[11px] uppercase tracking-wide text-[var(--gray-600)]">
                    Trade Volume
                  </div>
                </div>
              </div>
              <p className="text-xs text-[var(--gray-600)] leading-relaxed">
                Figures shown are illustrative and represent the type of impact From Village to Market is built to
                unlock for Zimbabwean agriculture.
              </p>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="h-16 bg-white" style={{ clipPath: "path('M0,64 C120,32 240,0 360,0 C480,0 600,32 720,64 L720,128 L0,128 Z')" }} />
      </section>

      {/* Impact section */}
      <section className="bg-white">
        <div className="avn-container py-16 lg:py-20 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
          <div>
            <span className="badge badge-primary mb-4 inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-600)]" />
              Real Impact
            </span>
            <h2
              className="mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 2.8rem)",
                fontWeight: 800,
                color: "var(--gray-900)",
                lineHeight: 1.2,
              }}
            >
              Empowering Zimbabwe's
              <br />
              agricultural future.
            </h2>
            <p className="text-sm sm:text-base text-[var(--gray-600)] leading-relaxed max-w-xl mb-8">
              From Village to Market is built for financial inclusion. Many of our farmers are women-led and
              smallholder businesses feeding Zimbabwe's towns and cities — with tools to earn fair, stable prices.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="card">
                <div className="stat-number text-[2.2rem]" style={{ backgroundImage: "var(--gradient-primary)" }}>
                  24k+
                </div>
                <div className="stat-label">Active farmers</div>
              </div>
              <div className="card">
                <div className="stat-number text-[2.2rem]" style={{ backgroundImage: "var(--gradient-accent)" }}>
                  3.8k
                </div>
                <div className="stat-label">Active buyers</div>
              </div>
              <div className="card">
                <div
                  className="stat-number text-[2.2rem]"
                  style={{ backgroundImage: "linear-gradient(135deg,#14B8A6,#38BDF8)" }}
                >
                  10
                </div>
                <div className="stat-label">Provinces</div>
              </div>
              <div className="card">
                <div
                  className="stat-number text-[2.2rem]"
                  style={{ backgroundImage: "linear-gradient(135deg,#8B5CF6,#EC4899)" }}
                >
                  99.8%
                </div>
                <div className="stat-label">Target uptime</div>
              </div>
            </div>
          </div>

          {/* Simple testimonial / image placeholder */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-[var(--primary-700)] min-h-56 flex items-end">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--primary-400)_0,transparent_55%)] opacity-80" />
              <div className="relative p-6 text-white space-y-3">
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-white/80">Farmer Story</p>
                <p className="text-base font-semibold leading-snug">
                  “I can now see market prices before I harvest. Buyers message me directly — even when my signal is
                  weak.”
                </p>
                <p className="text-xs text-white/75">Tendai M., vegetable farmer — Mashonaland East</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section
        className="py-16 lg:py-20 text-white"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        <div className="avn-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="badge badge-accent mb-3">Breakthrough innovations</span>
            <h2
              className="mb-3"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 3vw, 2.6rem)",
                fontWeight: 800,
              }}
            >
              Built for Zimbabwe's farmers
            </h2>
            <p className="text-sm sm:text-base text-white/80">
              Three core features designed specifically for local connectivity, pricing, and trust — from rural wards
              to city markets.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Offline-first */}
            <div className="card-glass bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl"
                   style={{ backgroundImage: "var(--gradient-accent)" }}>
                <span className="text-2xl">📶</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">Offline-first marketplace</h3>
              <p className="mt-3 text-sm text-white/80">
                List produce, browse offers, and queue actions even without a stable connection. Sync automatically when
                you're back online.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--success-bg)] flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success-light)]" />
                  </span>
                  Auto-sync queued listings
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--success-bg)] flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success-light)]" />
                  </span>
                  Cache key data on device
                </li>
              </ul>
            </div>

            {/* Fair pricing */}
            <div className="card-glass bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl"
                   style={{ backgroundImage: "linear-gradient(135deg,#22C55E,#A3E635)" }}>
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">Fair pricing engine</h3>
              <p className="mt-3 text-sm text-white/80">
                View district-level price trends so you never have to guess again. Sell at fair, informed rates.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--success-bg)] flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success-light)]" />
                  </span>
                  Weekly trend snapshots per crop
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--success-bg)] flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success-light)]" />
                  </span>
                  Compare districts before you harvest
                </li>
              </ul>
            </div>

            {/* Direct connect */}
            <div className="card-glass bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl"
                   style={{ backgroundImage: "linear-gradient(135deg,#38BDF8,#6366F1)" }}>
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">Direct buyer messaging</h3>
              <p className="mt-3 text-sm text-white/80">
                Buyers contact you directly through secure chat with photos and details — no middlemen taking cuts.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--success-bg)] flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success-light)]" />
                  </span>
                  In-app messaging tied to listings
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--success-bg)] flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success-light)]" />
                  </span>
                  Negotiation history saved per buyer
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-[var(--gray-50)] border-t border-[var(--gray-200)] py-10">
        <div className="avn-container text-center">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-500)] mb-6">
            Trusted by farmers across all 10 provinces
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {[
              "ZIMRA integrated",
              "RBZ compliant",
              "Ministry of Agriculture aligned",
              "ISO 27001-minded security",
              "Built for Zimbabwe",
            ].map((label) => (
              <div
                key={label}
                className="bg-white border border-[var(--gray-200)] rounded-xl px-3 sm:px-4 py-2 flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-[var(--gray-700)] shadow-xs hover:border-[var(--primary-500)] hover:shadow-md transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-[var(--success-bg)] flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-[var(--success)]" />
                </span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
