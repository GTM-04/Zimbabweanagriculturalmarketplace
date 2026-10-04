import { ArrowRight, BarChart3, ShieldCheck, Smartphone, Wifi } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

const slides = [
  {
    id: "connect",
    title: "Connect Directly",
    highlight: "With Buyers",
    description:
      "Skip the middleman. List your fresh produce and reach thousands of buyers directly across Zimbabwe's provinces.",
    image: "/images/farm-hero.png",
    icon: Smartphone,
    stat: "10,000+",
    statLabel: "Active farmers",
    accentClass: "welcome-accent--green",
  },
  {
    id: "pricing",
    title: "Real-Time Market",
    highlight: "Pricing",
    description:
      "Access transparent, live market prices across all major Zimbabwean trading hubs. Never sell below fair rates again.",
    image: "/images/farmer-portrait.png",
    icon: BarChart3,
    stat: "24/7",
    statLabel: "Price updates",
    accentClass: "welcome-accent--gold",
  },
  {
    id: "offline",
    title: "Works Anywhere,",
    highlight: "Even Offline",
    description:
      "Browse cached listings and prices even without a connection. Designed for rural connectivity challenges.",
    image: "/images/market-scene.png",
    icon: Wifi,
    stat: "100%",
    statLabel: "Offline capable",
    accentClass: "welcome-accent--blue",
  },
];

export function WelcomeScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const goToSlide = useCallback(
    (index: number) => {
      if (isAnimating || index === currentSlide) return;
      setDirection(index > currentSlide ? "next" : "prev");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setIsAnimating(false);
      }, 350);
    },
    [isAnimating, currentSlide]
  );

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      navigate("/register");
    }
  };

  const handleSkip = () => navigate("/register");

  // Auto-advance every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentSlide < slides.length - 1) {
        goToSlide(currentSlide + 1);
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [currentSlide, goToSlide]);

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      if (diff > 0 && currentSlide < slides.length - 1) goToSlide(currentSlide + 1);
      if (diff < 0 && currentSlide > 0) goToSlide(currentSlide - 1);
    }
    setTouchStart(null);
  };

  const progressClass = `welcome-progress-fill welcome-progress-fill--${currentSlide + 1}`;

  return (
    <div
      className="welcome-root"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top navigation */}
      <header className="welcome-header">
        <div className="welcome-brand">
          <div className="welcome-brand-icon">
            <svg viewBox="0 0 24 24" fill="none" className="welcome-brand-svg">
              <path d="M12 2C10 6 4 8 4 14C4 18.418 7.582 22 12 22C16.418 22 20 18.418 20 14C20 8 14 6 12 2Z" fill="white" />
              <path d="M12 9V19M12 9C10 11 8 13 8 15M12 9C14 11 16 13 16 15" stroke="#1B4332" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="welcome-brand-name">Village to Market</span>
        </div>
        <button onClick={handleSkip} className="welcome-skip-btn" id="welcome-skip">
          Skip
          <ArrowRight className="welcome-skip-icon" />
        </button>
      </header>

      {/* Hero image section */}
      <div className="welcome-hero">
        <div className="welcome-hero-img-wrap">
          <img
            key={slide.id}
            src={slide.image}
            alt={slide.title}
            className={`welcome-hero-img ${isAnimating ? `welcome-hero-img--${direction}` : "welcome-hero-img--enter"}`}
          />
          <div className="welcome-hero-overlay" />

          {/* Floating stat card */}
          <div className={`welcome-stat-card ${slide.accentClass}`}>
            <span className="welcome-stat-value">{slide.stat}</span>
            <span className="welcome-stat-label">{slide.statLabel}</span>
          </div>

          {/* Trust badge */}
          <div className="welcome-trust-badge">
            <ShieldCheck className="welcome-trust-icon" />
            <span>Verified Platform</span>
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="welcome-content">
        {/* Icon + slide indicator */}
        <div className="welcome-content-top">
          <div className={`welcome-feature-icon ${slide.accentClass}`}>
            <Icon className="welcome-feature-svg" strokeWidth={2} />
          </div>
          <div className="welcome-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`welcome-dot ${i === currentSlide ? "welcome-dot--active" : ""}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Text */}
        <div
          key={`text-${slide.id}`}
          className={`welcome-text ${isAnimating ? "welcome-text--exit" : "welcome-text--enter"}`}
        >
          <h1 className="welcome-title">
            {slide.title}
            <br />
            <span className="welcome-title-highlight">{slide.highlight}</span>
          </h1>
          <p className="welcome-description">{slide.description}</p>
        </div>

        {/* Actions */}
        <div className="welcome-actions">
          <button onClick={handleNext} className="welcome-cta" id="welcome-continue">
            <span>{currentSlide === slides.length - 1 ? "Get Started" : "Continue"}</span>
            <ArrowRight className="welcome-cta-arrow" />
          </button>
          {currentSlide < slides.length - 1 && (
            <button onClick={handleSkip} className="welcome-skip-text" id="welcome-skip-bottom">
              Skip introduction
            </button>
          )}
        </div>
      </div>

      {/* Bottom progress */}
      <div className="welcome-progress">
        <div className={progressClass} />
      </div>
    </div>
  );
}
