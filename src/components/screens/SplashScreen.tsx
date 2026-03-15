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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[var(--primary-800)] to-[var(--success)] text-white p-6 relative">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-[var(--accent-soft)] text-[var(--gray-900)] px-3 py-1.5 rounded-full text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>Offline</span>
        </div>
      )}

      {/* Logo */}
      <div className="mb-8 relative">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
          <Sprout className="w-14 h-14 text-[var(--primary-800)]" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#F5A623] rounded-full flex items-center justify-center">
          <span className="text-2xl">🌾</span>
        </div>
      </div>

      {/* App Name */}
      <h1 className="text-4xl font-bold mb-3 text-center">
        From Village to Market
      </h1>
      
      {/* Tagline */}
      <p className="text-lg text-white/90 mb-12 text-center max-w-md">
        Connecting Farmers to Buyers
      </p>

      {/* Loading Indicator */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
        <p className="text-sm text-white/80">Loading...</p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-sm text-white/70">
        Empowering Zimbabwean Agriculture
      </div>
    </div>
  );
}
