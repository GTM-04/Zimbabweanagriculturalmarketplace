import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, TrendingUp, Wifi, ShoppingBag } from "lucide-react";
import { Button } from "../ui/button";

const slides = [
  {
    title: "Direct Market Access",
    description: "List your produce and reach buyers directly across Zimbabwe",
    image: "https://images.unsplash.com/photo-1627829380497-49c37b769ea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwd29tYW4lMjBmYXJtZXIlMjBzbWFydHBob25lJTIwZmllbGR8ZW58MXx8fHwxNzcwNzY5Njc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    icon: <ShoppingBag className="w-16 h-16 text-[#2D5016]" />,
  },
  {
    title: "Fair Pricing",
    description: "Get transparent market prices and sell at fair rates",
    image: "https://images.unsplash.com/photo-1744726010540-bf318d4a691f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxaaW1iYWJ3ZSUyMHZlZ2V0YWJsZXMlMjBtYXJrZXR8ZW58MXx8fHwxNzcwNzY5Njc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    icon: <TrendingUp className="w-16 h-16 text-[#F5A623]" />,
  },
  {
    title: "Works Offline",
    description: "Access the market even without internet connection",
    image: "https://images.unsplash.com/photo-1671893099330-de513eeb69f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxaaW1iYWJ3ZSUyMGZhcm0lMjBzdW5yaXNlJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc3MDc2OTY3NHww&ixlib=rb-4.1.0&q=80&w=1080",
    icon: <Wifi className="w-16 h-16 text-[#4A90E2]" />,
  },
];

export function WelcomeScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/user-type");
    }
  };

  const handleSkip = () => {
    navigate("/user-type");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-10">
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="text-[#757575] hover:text-[#2C2C2C]"
        >
          Skip
        </Button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col">
        {/* Image */}
        <div className="h-1/2 relative overflow-hidden bg-[#F5F5F5]">
          <img
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Content */}
        <div className="h-1/2 flex flex-col items-center justify-center px-8 py-12 text-center">
          {/* Icon */}
          <div className="mb-6">
            {slides[currentSlide].icon}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-[#2C2C2C] mb-4">
            {slides[currentSlide].title}
          </h2>

          {/* Description */}
          <p className="text-base text-[#757575] mb-8 max-w-md leading-relaxed">
            {slides[currentSlide].description}
          </p>

          {/* Dots Indicator */}
          <div className="flex gap-2 mb-8">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "w-8 bg-[#2D5016]"
                    : "w-2 bg-[#E0E0E0]"
                }`}
              />
            ))}
          </div>

          {/* Next Button */}
          <Button
            onClick={handleNext}
            className="w-full max-w-md h-12 bg-[#2D5016] hover:bg-[#234010] text-white rounded-lg flex items-center justify-center gap-2"
          >
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
