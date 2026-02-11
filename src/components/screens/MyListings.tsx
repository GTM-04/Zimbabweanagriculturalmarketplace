import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Search, Filter, Eye, MessageCircle, MoreVertical, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { BottomNav } from "../BottomNav";
import { produceListings, getFarmerById } from "../../lib/data";

export function MyListings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"active" | "draft" | "sold" | "expired">("active");
  const [searchQuery, setSearchQuery] = useState("");

  const farmerId = "1";
  const myListings = produceListings.filter(l => l.farmerId === farmerId);
  const activeListings = myListings.filter(l => l.status === "active");

  const getImageUrl = (keywords: string[]) => {
    if (keywords[0] === "maize-field-zimbabwe") {
      return "https://images.unsplash.com/photo-1649251037465-72c9d378acb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWl6ZSUyMGNvcm4lMjBmaWVsZCUyMGhhcnZlc3R8ZW58MXx8fHwxNzcwNzY5Nzg0fDA&ixlib=rb-4.1.0&q=80&w=1080";
    }
    return "https://images.unsplash.com/photo-1700064165267-8fa68ef07167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHRvbWF0b2VzJTIwcHJvZHVjZXxlbnwxfHx8fDE3NzA3MDk4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080";
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#E0E0E0] z-10 shadow-sm">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/farmer/dashboard")}
            className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#2C2C2C]" />
          </button>
          <h1 className="text-xl font-semibold text-[#2C2C2C] flex-1">My Listings</h1>
          <button className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors">
            <Filter className="w-5 h-5 text-[#2C2C2C]" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E0E0E0]">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "active"
                ? "text-[#2D5016]"
                : "text-[#757575] hover:text-[#2C2C2C]"
            }`}
          >
            Active ({activeListings.length})
            {activeTab === "active" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D5016]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("draft")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "draft"
                ? "text-[#2D5016]"
                : "text-[#757575] hover:text-[#2C2C2C]"
            }`}
          >
            Draft (0)
            {activeTab === "draft" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D5016]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("sold")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "sold"
                ? "text-[#2D5016]"
                : "text-[#757575] hover:text-[#2C2C2C]"
            }`}
          >
            Sold (0)
            {activeTab === "sold" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D5016]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("expired")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "expired"
                ? "text-[#2D5016]"
                : "text-[#757575] hover:text-[#2C2C2C]"
            }`}
          >
            Expired (0)
            {activeTab === "expired" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D5016]"></div>
            )}
          </button>
        </div>
      </div>

      {/* Listings */}
      <div className="p-4 space-y-3">
        {activeListings.map((listing) => (
          <div
            key={listing.id}
            onClick={() => navigate(`/product/${listing.id}`)}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex gap-4 p-4">
              {/* Image */}
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-[#F5F5F5] flex-shrink-0">
                <img
                  src={getImageUrl(listing.images)}
                  alt={listing.produceName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#2C2C2C] truncate">
                      {listing.produceName}
                    </h3>
                    <p className="text-sm text-[#757575]">
                      {listing.quantity} {listing.unit}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="p-1 hover:bg-[#F5F5F5] rounded-full transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-[#757575]" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-[#2D5016]">
                    ZWL {listing.pricePerUnit}
                  </span>
                  <span className="text-sm text-[#757575]">per {listing.unit}</span>
                  {listing.negotiable && (
                    <span className="text-xs bg-[#F5A623]/10 text-[#F5A623] px-2 py-0.5 rounded-full font-medium">
                      Negotiable
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-[#757575]">
                    <Eye className="w-4 h-4" />
                    <span>{listing.views}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#757575]">
                    <MessageCircle className="w-4 h-4" />
                    <span>{listing.inquiries}</span>
                  </div>
                  <span className="text-xs bg-[#4CAF50]/10 text-[#4CAF50] px-2 py-0.5 rounded-full font-medium ml-auto">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {activeListings.length === 0 && activeTab === "active" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-[#757575]" />
            </div>
            <p className="text-[#757575] mb-4">You haven't listed any produce yet</p>
            <Button
              onClick={() => navigate("/farmer/list-produce")}
              className="bg-[#2D5016] hover:bg-[#234010] text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Listing
            </Button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate("/farmer/list-produce")}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[#2D5016] hover:bg-[#234010] text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomNav userType="farmer" />
    </div>
  );
}

function Package(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}
