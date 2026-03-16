import { Sprout, WifiOff } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export function SplashScreen() {
  const navigate = useNavigate();
  const isOnline = navigator.onLine;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/welcome");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-white p-6 relative overflow-hidden"
      style={{ backgroundImage: "var(--gradient-hero)" }}
    >
      {/* Background decorative circles */}
      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-[var(--accent-soft)] text-[var(--gray-900)] px-3 py-1.5 rounded-full text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>Offline</span>
        </div>
      )}

      {/* Logo */}
      <div className="mb-8 relative animate-pulse-soft">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/20">
          <Sprout className="w-14 h-14 text-[var(--primary-800)]" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-11 h-11 bg-[var(--accent-500)] rounded-full flex items-center justify-center shadow-lg">
          <span className="text-xl">🌾</span>
        </div>
      </div>

      {/* App Name */}
      <h1
        className="mb-3 text-center"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.9rem, 6vw, 2.8rem)",
          fontWeight: 900,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        From Village to Market
      </h1>

      {/* Tagline */}
      <p className="text-base sm:text-lg text-white/80 mb-12 text-center max-w-xs" style={{ fontFamily: "var(--font-body)" }}>
        Connecting Farmers to Buyers across Zimbabwe
      </p>

      {/* Loading dots */}
      <div className="flex gap-2">
        <div className="w-2.5 h-2.5 bg-white/90 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2.5 h-2.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: "160ms" }} />
        <div className="w-2.5 h-2.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "320ms" }} />
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 flex items-center gap-2 text-xs text-white/60">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
        <span>Empowering Zimbabwean Agriculture</span>
      </div>
    </div>
  );
}
