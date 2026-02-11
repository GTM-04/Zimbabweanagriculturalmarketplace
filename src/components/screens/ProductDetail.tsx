import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Heart, Share2, MapPin, Calendar, Star, Phone, MessageCircle, CheckCircle } from "lucide-react";
import { Button } from "../ui/button";
import { getListingById, getFarmerById } from "../../lib/data";

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);

  const listing = getListingById(id || "");
  const farmer = listing ? getFarmerById(listing.farmerId) : null;

  if (!listing || !farmer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Product not found</p>
      </div>
    );
  }

  const getImageUrl = (keywords: string[]) => {
    const imageMap: Record<string, string> = {
      "maize-field-zimbabwe": "https://images.unsplash.com/photo-1649251037465-72c9d378acb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWl6ZSUyMGNvcm4lMjBmaWVsZCUyMGhhcnZlc3R8ZW58MXx8fHwxNzcwNzY5Nzg0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "tomatoes-harvest": "https://images.unsplash.com/photo-1700064165267-8fa68ef07167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHRvbWF0b2VzJTIwcHJvZHVjZXxlbnwxfHx8fDE3NzA3MDk4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "butternut-squash": "https://images.unsplash.com/photo-1695590293008-50388acdd7fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXR0ZXJudXQlMjBzcXVhc2glMjB2ZWdldGFibGVzfGVufDF8fHx8MTc3MDc2OTc4NHww&ixlib=rb-4.1.0&q=80&w=1080",
    };
    return imageMap[keywords[0]] || "https://images.unsplash.com/photo-1761370980657-22586ea44093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwbWFya2V0JTIwZnJlc2glMjBwcm9kdWNlfGVufDF8fHx8MTc3MDc2OTc5MXww&ixlib=rb-4.1.0&q=80&w=1080";
  };

  const priceComparison = listing.pricePerUnit < 170 ? -15 : 10;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-[#E0E0E0] px-4 py-3 flex items-center justify-between z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#2C2C2C]" />
        </button>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors">
            <Share2 className="w-5 h-5 text-[#2C2C2C]" />
          </button>
          <button className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors">
            <Heart className="w-5 h-5 text-[#2C2C2C]" />
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative">
        <div className="aspect-[16/12] bg-[#F5F5F5]">
          <img
            src={getImageUrl(listing.images)}
            alt={listing.produceName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === currentImage ? "w-8 bg-white" : "w-2 bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Product Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold text-[#2C2C2C] flex-1">
              {listing.produceName}
            </h1>
            <span className="bg-[#7CB342]/10 text-[#7CB342] px-3 py-1 rounded-full text-sm font-medium">
              {listing.category}
            </span>
          </div>
          {listing.variety && (
            <p className="text-sm text-[#757575]">Variety: {listing.variety}</p>
          )}
        </div>

        {/* Price Card */}
        <div className="bg-[#2D5016]/5 rounded-xl p-4 mb-4 border-2 border-[#2D5016]/20">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-[#2D5016]">
              ZWL {listing.pricePerUnit}
            </span>
            <span className="text-lg text-[#757575]">per {listing.unit}</span>
          </div>
          {listing.negotiable && (
            <span className="inline-block bg-[#F5A623] text-white px-3 py-1 rounded-full text-xs font-medium">
              Negotiable
            </span>
          )}
          <div className="mt-3 pt-3 border-t border-[#2D5016]/20">
            <p className="text-sm text-[#757575]">
              Market price comparison:{" "}
              <span className={priceComparison < 0 ? "text-[#4CAF50] font-medium" : "text-[#FFA726] font-medium"}>
                {priceComparison > 0 ? "+" : ""}{priceComparison}% {priceComparison < 0 ? "below" : "above"} average
              </span>
            </p>
          </div>
        </div>

        {/* Quantity & Availability */}
        <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#757575] mb-1">Available Quantity</p>
              <p className="text-lg font-semibold text-[#2C2C2C]">
                {listing.quantity} {listing.unit}
              </p>
              {listing.quantity < 100 && (
                <span className="inline-block mt-1 text-xs text-[#FFA726] font-medium">
                  Limited Stock
                </span>
              )}
            </div>
            <div>
              <p className="text-sm text-[#757575] mb-1">Available Until</p>
              <p className="text-lg font-semibold text-[#2C2C2C]">
                {new Date(listing.availableUntil).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Farmer Information */}
        <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-4 mb-4">
          <p className="text-sm text-[#757575] mb-3">Seller Information</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#2D5016] flex items-center justify-center text-white font-semibold text-lg">
              {farmer.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[#2C2C2C]">{farmer.name}</h3>
                {farmer.verified && (
                  <CheckCircle className="w-4 h-4 text-[#4A90E2]" />
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-[#757575] mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" />
                  <span>{farmer.rating}</span>
                </div>
                <span>•</span>
                <span>{farmer.totalListings} listings</span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/profile?farmer=${farmer.id}`)}
              className="text-sm text-[#4A90E2] font-medium hover:underline"
            >
              View
            </button>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-4 mb-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#757575] mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-[#2C2C2C] mb-1">{listing.district}</p>
              <p className="text-sm text-[#757575]">{listing.location}, Zimbabwe</p>
              {listing.deliveryAvailable && (
                <div className="mt-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#4CAF50]" />
                  <span className="text-sm text-[#4CAF50] font-medium">Delivery Available</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-4 mb-4">
            <h3 className="font-semibold text-[#2C2C2C] mb-2">Description</h3>
            <p className="text-sm text-[#757575] leading-relaxed">
              {listing.description}
            </p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#E0E0E0] p-4 z-10">
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate(`/messages/${farmer.id}`)}
            variant="outline"
            className="h-12 border-2 border-[#2D5016] text-[#2D5016] hover:bg-[#2D5016]/5 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Message
          </Button>
          <Button
            onClick={() => window.open(`tel:${farmer.phone}`, "_self")}
            className="h-12 bg-[#2D5016] hover:bg-[#234010] text-white flex items-center justify-center gap-2"
          >
            <Phone className="w-5 h-5" />
            Call Farmer
          </Button>
        </div>
      </div>
    </div>
  );
}
