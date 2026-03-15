import { ArrowRight, ShoppingCart, Sprout, Users } from "lucide-react";
import { useNavigate } from "react-router";

export function UserTypeSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[var(--gray-50)] to-white px-5 py-10">
      {/* Brand mark */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-full bg-[var(--primary-700)] flex items-center justify-center text-white shadow-sm">
          <Sprout className="w-6 h-6" />
        </div>
        <div className="leading-none">
          <p className="text-[10px] font-semibold tracking-[0.22em] text-[var(--gray-500)] uppercase">
            From Village to Market
          </p>
          <p className="text-xs text-[var(--gray-600)]">Zimbabwe's agricultural marketplace</p>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-10 max-w-sm">
        <h1
          className="text-2xl sm:text-3xl font-bold text-[var(--gray-900)] mb-2"
          style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
        >
          How will you use the platform?
        </h1>
        <p className="text-sm text-[var(--gray-500)]">
          Select your role to get started
        </p>
      </div>

      {/* Selection Cards */}
      <div className="w-full max-w-md space-y-4">
        {/* Farmer Card */}
        <button
          onClick={() => navigate("/register/farmer")}
          className="w-full bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-[var(--primary-700)] group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-700)]"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-[var(--primary-50)] flex items-center justify-center group-hover:bg-[var(--primary-100)] transition-colors flex-shrink-0">
              <Users className="w-7 h-7 text-[var(--primary-800)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-[var(--gray-900)]">
                I'm a Farmer / Producer
              </h3>
              <p className="text-xs text-[var(--gray-500)] mt-0.5">
                List produce, manage listings, connect with buyers
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--gray-400)] group-hover:text-[var(--primary-700)] transition-colors flex-shrink-0" />
          </div>
          <div className="h-28 sm:h-36 rounded-xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1627829380497-49c37b769ea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwbWFuJTIwZmFybWVyJTIwY3JvcHN8ZW58MXx8fHwxNzcwNzY2MDcxfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Farmer in field"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </button>

        {/* Buyer Card */}
        <button
          onClick={() => navigate("/register/buyer")}
          className="w-full bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-[var(--accent-600)] group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-600)]"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-[var(--accent-50)] flex items-center justify-center group-hover:bg-[var(--accent-100)] transition-colors flex-shrink-0">
              <ShoppingCart className="w-7 h-7 text-[var(--accent-600)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-[var(--gray-900)]">
                I'm a Buyer
              </h3>
              <p className="text-xs text-[var(--gray-500)] mt-0.5">
                Browse produce, message farmers, get fresh food
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--gray-400)] group-hover:text-[var(--accent-600)] transition-colors flex-shrink-0" />
          </div>
          <div className="h-28 sm:h-36 rounded-xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1744726010540-bf318d4a691f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxaaW1iYWJ3ZSUyMHZlZ2V0YWJsZXMlMjBtYXJrZXR8ZW58MXx8fHwxNzcwNzY5Njc1fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Fresh market produce"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </button>
      </div>

      {/* Login Link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-[var(--gray-500)]">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-[var(--primary-800)] font-semibold hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
