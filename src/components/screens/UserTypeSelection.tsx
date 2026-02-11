import { useNavigate } from "react-router";
import { Users, ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";

export function UserTypeSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#F5F5F5] to-white p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-[#2C2C2C] mb-3">
          Welcome to From Village to Market
        </h1>
        <p className="text-base text-[#757575]">
          Choose how you want to use the platform
        </p>
      </div>

      {/* Selection Cards */}
      <div className="w-full max-w-md space-y-4">
        {/* Farmer Card */}
        <button
          onClick={() => navigate("/register/farmer")}
          className="w-full bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-[#2D5016] group"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#2D5016]/10 flex items-center justify-center group-hover:bg-[#2D5016]/20 transition-colors">
              <Users className="w-10 h-10 text-[#2D5016]" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-xl font-semibold text-[#2C2C2C] mb-1">
                I'm a Farmer/Producer
              </h3>
              <p className="text-sm text-[#757575]">
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
          className="w-full bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-[#4A90E2] group"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#4A90E2]/10 flex items-center justify-center group-hover:bg-[#4A90E2]/20 transition-colors">
              <ShoppingCart className="w-10 h-10 text-[#4A90E2]" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-xl font-semibold text-[#2C2C2C] mb-1">
                I'm a Buyer
              </h3>
              <p className="text-sm text-[#757575]">
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
        <p className="text-sm text-[#757575]">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-[#2D5016] font-medium hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
