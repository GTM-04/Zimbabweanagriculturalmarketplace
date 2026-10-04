import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export function SplashScreen() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0); // 0=initial, 1=logo, 2=text, 3=exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 2600);
    const t4 = setTimeout(() => navigate("/welcome"), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [navigate]);

  return (
    <div className="splash-root" data-phase={phase}>
      {/* Animated grain texture overlay */}
      <div className="splash-grain" />

      {/* Radial ambient lights */}
      <div className="splash-orb splash-orb--green" />
      <div className="splash-orb splash-orb--gold" />
      <div className="splash-orb splash-orb--teal" />

      {/* Decorative floating wheat SVGs */}
      <svg className="splash-wheat splash-wheat--1" viewBox="0 0 24 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 58V12" stroke="rgba(233,168,43,0.3)" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="7" cy="16" rx="5" ry="3" fill="rgba(233,168,43,0.15)" transform="rotate(-25 7 16)" />
        <ellipse cx="17" cy="22" rx="5" ry="3" fill="rgba(233,168,43,0.15)" transform="rotate(25 17 22)" />
        <ellipse cx="7" cy="28" rx="5" ry="3" fill="rgba(233,168,43,0.12)" transform="rotate(-20 7 28)" />
        <ellipse cx="17" cy="34" rx="5" ry="3" fill="rgba(233,168,43,0.12)" transform="rotate(20 17 34)" />
        <ellipse cx="12" cy="10" rx="3" ry="5" fill="rgba(233,168,43,0.2)" />
      </svg>
      <svg className="splash-wheat splash-wheat--2" viewBox="0 0 24 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 58V12" stroke="rgba(82,183,136,0.25)" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="7" cy="16" rx="5" ry="3" fill="rgba(82,183,136,0.12)" transform="rotate(-25 7 16)" />
        <ellipse cx="17" cy="22" rx="5" ry="3" fill="rgba(82,183,136,0.12)" transform="rotate(25 17 22)" />
        <ellipse cx="7" cy="28" rx="5" ry="3" fill="rgba(82,183,136,0.1)" transform="rotate(-20 7 28)" />
        <ellipse cx="12" cy="10" rx="3" ry="5" fill="rgba(82,183,136,0.15)" />
      </svg>

      {/* Main content */}
      <div className="splash-center">
        {/* Logo Mark */}
        <div className="splash-logo-wrap">
          <div className="splash-logo-ring" />
          <div className="splash-logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="splash-logo-icon">
              <path d="M24 4C20 12 8 16 8 28C8 36.837 15.163 44 24 44C32.837 44 40 36.837 40 28C40 16 28 12 24 4Z" fill="url(#leafGrad)" />
              <path d="M24 18V38M24 18C20 22 16 26 16 30M24 18C28 22 32 26 32 30" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="leafGrad" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#40916C" />
                  <stop offset="1" stopColor="#1B4332" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {/* Gold badge */}
          <div className="splash-badge">
            <svg viewBox="0 0 20 20" fill="none" className="splash-badge-icon">
              <path d="M10 2L12 7H18L13 11L15 17L10 13L5 17L7 11L2 7H8L10 2Z" fill="#F7C948" />
            </svg>
          </div>
        </div>

        {/* Brand text */}
        <div className="splash-brand">
          <h1 className="splash-title">
            <span className="splash-title-line1">From Village</span>
            <span className="splash-title-line2">to Market</span>
          </h1>
          <p className="splash-subtitle">Zimbabwe's Agricultural Marketplace</p>
        </div>

        {/* Loading indicator */}
        <div className="splash-loader">
          <div className="splash-loader-track">
            <div className="splash-loader-fill" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="splash-footer">
        <p className="splash-footer-text">Empowering Farmers • Connecting Markets</p>
      </div>
    </div>
  );
}
