import { ArrowRight, ShoppingBag, TrendingUp, Wifi } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";

const slides = [
  {
    title: "Direct Market Access",
    description: "List your produce and reach buyers directly across Zimbabwe",
    image: "https://images.unsplash.com/photo-1627829380497-49c37b769ea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwd29tYW4lMjBmYXJtZXIlMjBzbWFydHBob25lJTIwZmllbGR8ZW58MXx8fHwxNzcwNzY5Njc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    icon: <ShoppingBag className="w-12 h-12" />,
    color: "from-green-600 to-green-700",
    bgGradient: "from-green-50 to-emerald-50",
  },
  {
    title: "Fair Pricing",
    description: "Get transparent market prices and sell at fair rates",
    image: "https://images.unsplash.com/photo-1744726010540-bf318d4a691f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxaaW1iYWJ3ZSUyMHZlZ2V0YWJsZXMlMjBtYXJrZXR8ZW58MXx8fHwxNzcwNzY5Njc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    icon: <TrendingUp className="w-12 h-12" />,
    color: "from-amber-500 to-orange-600",
    bgGradient: "from-amber-50 to-orange-50",
  },
  {
    title: "Works Offline",
    description: "Access the market even without internet connection",
    image: "https://images.unsplash.com/photo-1671893099330-de513eeb69f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxaaW1iYWJ3ZSUyMGZhcm0lMjBzdW5yaXNlJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc3MDc2OTY3NHww&ixlib=rb-4.1.0&q=80&w=1080",
    icon: <Wifi className="w-12 h-12" />,
    color: "from-blue-500 to-blue-600",
    bgGradient: "from-blue-50 to-sky-50",
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
    <div className={`min-h-screen flex flex-col bg-gradient-to-br ${slides[currentSlide].bgGradient} transition-all duration-700`}>
      {/* Header with Skip Button */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-6 py-6 z-20">
         
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="text-gray-700 hover:text-[#2D5016] font-medium hover:bg-white/50 backdrop-blur-sm"
        >
          Skip
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        {/* Image Card with Modern Design */}
        <div className="relative w-full max-w-md mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#2D5016] to-[#4A7023] rounded-3xl blur opacity-25 animate-pulse"></div>
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="relative h-80 overflow-hidden">
                <img
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Icon Badge on Image */}
                <div className={`absolute top-6 right-6 bg-gradient-to-br ${slides[currentSlide].color} p-4 rounded-2xl shadow-lg text-white transform transition-transform duration-300 hover:scale-110`}>
                  {slides[currentSlide].icon}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="text-center max-w-md space-y-6">
          {/* Title with modern styling */}
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            {slides[currentSlide].title}
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 leading-relaxed px-4">
            {slides[currentSlide].description}
          </p>

          {/* Dots Indicator - Modern Style */}
          <div className="flex justify-center gap-3 py-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? "w-10 h-3 bg-[#2D5016]"
                    : "w-3 h-3 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleNext}
              className="w-full h-14 bg-gradient-to-r from-[#2D5016] to-[#3f6b1f] hover:from-[#234010] hover:to-[#2D5016] text-white rounded-2xl flex items-center justify-center gap-3 text-lg font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105"
            >
              {currentSlide === slides.length - 1 ? "Get Started" : "Continue"}
              <ArrowRight className="w-6 h-6" />
            </Button>

            {currentSlide < slides.length - 1 && (
              <button
                onClick={handleSkip}
                className="w-full text-gray-600 hover:text-[#2D5016] font-medium py-3 transition-colors duration-200"
              >
                Skip to registration
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
        <div 
          className="h-full bg-gradient-to-r from-[#2D5016] to-[#4A7023] transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
