import { ShoppingCart, Users } from "lucide-react";
import { useNavigate } from "react-router";

export function UserTypeSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[var(--gray-50)] to-white p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1
          className="text-3xl font-bold text-[var(--gray-900)] mb-3"
          style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
        >
          Welcome to From Village to Market
        </h1>
        <p className="text-base text-[var(--gray-600)]">
          Choose how you want to use the platform
        </p>
      </div>

      {/* Selection Cards */}
      <div className="w-full max-w-md space-y-4">
        {/* Farmer Card */}
        <button
          onClick={() => navigate("/register/farmer")}
          className="w-full bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-[var(--primary-700)] group"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[var(--primary-50)] flex items-center justify-center group-hover:bg-[var(--primary-100)] transition-colors">
              <Users className="w-10 h-10 text-[var(--primary-800)]" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-xl font-semibold text-[var(--gray-900)] mb-1">
                I'm a Farmer/Producer
              </h3>
              <p className="text-sm text-[var(--gray-600)]">
                List and sell your produce to buyers
              </p>
            </div>
          </div>
          <div className="mt-4 h-32 rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1627829380497-49c37b769ea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwbWFuJTIwZmFybWVyJTIwY3JvcHN8ZW58MXx8fHwxNzcwNzY2MDcxfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Farmer"
              className="w-full h-full object-cover"
            />
          </div>
        </button>

        {/* Buyer Card */}
        <button
          onClick={() => navigate("/register/buyer")}
          className="w-full bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-[var(--accent-600)] group"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[var(--accent-50)] flex items-center justify-center group-hover:bg-[var(--accent-100)] transition-colors">
              <ShoppingCart className="w-10 h-10 text-[var(--accent-600)]" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-xl font-semibold text-[var(--gray-900)] mb-1">
                I'm a Buyer
              </h3>
              <p className="text-sm text-[var(--gray-600)]">
                Browse and purchase fresh produce
              </p>
            </div>
          </div>
          <div className="mt-4 h-32 rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1744726010540-bf318d4a691f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxaaW1iYWJ3ZSUyMHZlZ2V0YWJsZXMlMjBtYXJrZXR8ZW58MXx8fHwxNzcwNzY5Njc1fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Buyer"
              className="w-full h-full object-cover"
            />
          </div>
        </button>
      </div>

      {/* Login Link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-[var(--gray-600)]">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-[var(--primary-800)] font-medium hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
