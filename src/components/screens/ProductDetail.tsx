import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    Heart,
    Loader2,
    MapPin,
    MessageCircle,
    Phone,
    Share2,
    Star
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { listingsApi, messagingApi, pricingApi, resolveImageUrl } from "../../lib/api";
import type { Listing, MarketPrice } from "../../lib/types";
import { Button } from "../ui/button";

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const [listing, setListing] = useState<Listing | null>(null);
  const [marketPrice, setMarketPrice] = useState<MarketPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  /**
   * Extract farmer ID from whichever shape the API returns:
   *   listing.farmer_id           (top-level string)
   *   listing.farmer.id           (nested object)
   *   listing.user / listing.user_id  (auth-user reference)
   */
  const getFarmerId = (l: Listing): string | null => {
    const raw = l as any;
    return (
      l.farmer_id ||
      raw?.farmer?.id ||
      raw?.user?.id ||
      raw?.user_id ||
      raw?.created_by?.id ||
      null
    );
  };

  /** Open/create a conversation with the farmer and go to the chat screen. */
  const handleMessage = async () => {
    if (!listing) return;
    const farmerId = getFarmerId(listing);
    if (!farmerId) {
      toast.error("Cannot message seller", { description: "Seller information is not available for this listing." });
      return;
    }
    setMessagingLoading(true);
    try {
      const conversation = await messagingApi.startConversation(farmerId, listing.id);
      navigate(`/messages/${conversation.id}`);
    } catch (err: any) {
      toast.error("Could not open chat", { description: err?.message || "Please try again." });
    } finally {
      setMessagingLoading(false);
    }
  };

  /** Call the farmer directly if phone is available, otherwise fall back to chat. */
  const handleContact = async () => {
    if (!listing) return;
    const phone = listing.farmer_phone || (listing as any)?.farmer?.phone_number || (listing as any)?.farmer?.phone;
    if (phone) {
      window.location.href = `tel:${phone}`;
      return;
    }
    const farmerId = getFarmerId(listing);
    if (!farmerId) {
      toast.error("Cannot contact seller", { description: "Seller information is not available for this listing." });
      return;
    }
    setContactLoading(true);
    try {
      const conversation = await messagingApi.startConversation(farmerId, listing.id);
      navigate(`/messages/${conversation.id}`);
    } catch (err: any) {
      toast.error("Could not contact farmer", { description: err?.message || "Please try again." });
    } finally {
      setContactLoading(false);
    }
  };

  const handleShare = async () => {
    if (!listing) return;
    const title = listing.title || listing.produce_type?.name || "Produce Listing";
    const currency = listing.currency || "ZWL";
    const text = `${title} — ${currency} ${Number(listing.price_per_unit).toLocaleString()} per ${listing.quantity_available} ${listing.unit}\nDistrict: ${listing.district}\nVillage to Marketplace`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err: any) {
        // User cancelled share — not an error
        if (err?.name !== "AbortError") {
          toast.error("Could not share", { description: err?.message });
        }
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!", { description: "Product link copied to clipboard." });
      } catch {
        toast.error("Sharing not supported", { description: "Please copy the URL manually." });
      }
    }
  };

  useEffect(() => {
    if (!id) {
      setError("No product ID provided.");
      setLoading(false);
      return;
    }
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listingsApi.get(id);
        setListing(data);
        // Optional: fetch market price for comparison
        try {
          const prices = await pricingApi.getMarketPrices({
            produce_type: data.produce_type?.name,
            district: data.district,
          });
          const match =
            prices.find(
              (p) =>
                p.produce_type.toLowerCase() === data.produce_type?.name?.toLowerCase() &&
                p.district.toLowerCase() === data.district?.toLowerCase()
            ) ||
            prices.find(
              (p) => p.produce_type.toLowerCase() === data.produce_type?.name?.toLowerCase()
            ) ||
            prices[0] ||
            null;
          setMarketPrice(match);
        } catch {
          // market price is optional — silent fail
        }
      } catch (err: any) {
        setError(err.message || "Product not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const FALLBACK =
    "https://images.unsplash.com/photo-1761370980657-22586ea44093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

  const getImageUrl = (images: Listing["images"], index = 0) =>
    resolveImageUrl(images?.[index], FALLBACK);

  const priceVsMarket =
    marketPrice && listing
      ? Math.round(((listing.price_per_unit - marketPrice.price_avg) / marketPrice.price_avg) * 100)
      : null;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#2D5016] animate-spin" />
        <p className="text-[#757575] text-sm">Loading product...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-2xl">📦</div>
        <p className="text-lg font-semibold text-[#2C2C2C]">Product not found</p>
        <p className="text-sm text-[#757575]">{error}</p>
        <Button onClick={() => navigate(-1)} variant="outline" className="border-[#2D5016] text-[#2D5016]">
          Go Back
        </Button>
      </div>
    );
  }

  const images = listing.images?.length ? listing.images : [""];
  const currency = listing.currency || "ZWL";

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
          <button onClick={handleShare} className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors" title="Share listing">
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
            src={getImageUrl(images, currentImage)}
            alt={listing.title || listing.produce_type?.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              if (!el.dataset.fallback) {
                el.dataset.fallback = 'true';
                el.src = FALLBACK;
              }
            }}
          />
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentImage ? "w-8 bg-white" : "w-2 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Product Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold text-[#2C2C2C] flex-1">
              {listing.title || listing.produce_type?.name}
            </h1>
            {listing.is_organic && (
              <span className="bg-[#7CB342]/10 text-[#7CB342] px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                Organic
              </span>
            )}
          </div>
          <p className="text-sm text-[#757575]">{listing.produce_type?.name}</p>
        </div>

        {/* Price Card */}
        <div className="bg-[#2D5016]/5 rounded-xl p-4 mb-4 border-2 border-[#2D5016]/20">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-[#2D5016]">
              {currency} {Number(listing.price_per_unit).toLocaleString()}
            </span>
            <span className="text-lg text-[#757575]">
              per {listing.quantity_available} {listing.unit}
            </span>
          </div>
          {priceVsMarket !== null && (
            <div className="mt-3 pt-3 border-t border-[#2D5016]/20">
              <p className="text-sm text-[#757575]">
                Market comparison:{" "}
                <span
                  className={
                    priceVsMarket <= 0
                      ? "text-[#4CAF50] font-medium"
                      : "text-[#FFA726] font-medium"
                  }
                >
                  {priceVsMarket > 0 ? "+" : ""}
                  {priceVsMarket}% {priceVsMarket <= 0 ? "below" : "above"} market avg (
                  {currency} {marketPrice!.price_avg}/{listing.unit})
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Quantity & Availability */}
        <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#757575] mb-1">Available Quantity</p>
              <p className="text-lg font-semibold text-[#2C2C2C]">
                {listing.quantity_available} {listing.unit}
              </p>
              {listing.quantity_available < 100 && (
                <span className="inline-block mt-1 text-xs text-[#FFA726] font-medium">
                  Limited Stock
                </span>
              )}
            </div>
            {listing.harvest_date && (
              <div>
                <p className="text-sm text-[#757575] mb-1">Harvest Date</p>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-[#757575]" />
                  <p className="text-base font-semibold text-[#2C2C2C]">
                    {new Date(listing.harvest_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seller Information */}
        {(listing.farmer_name || listing.farmer_id) && (
          <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-4 mb-4">
            <p className="text-sm text-[#757575] mb-3">Seller Information</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#2D5016] flex items-center justify-center text-white font-semibold text-lg">
                {(listing.farmer_name || "F")[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[#2C2C2C]">
                    {listing.farmer_name || "Farmer"}
                  </h3>
                  <CheckCircle className="w-4 h-4 text-[#4A90E2]" />
                </div>
                <div className="flex items-center gap-1 text-sm text-[#757575] mt-1">
                  <Star className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" />
                  <span>Verified Seller</span>
                </div>
              </div>
              {listing.farmer_id && (
                <button
                  onClick={() => navigate(`/profile?farmer=${listing.farmer_id}`)}
                  className="text-sm text-[#4A90E2] font-medium hover:underline"
                >
                  View
                </button>
              )}
            </div>
          </div>
        )}

        {/* Location */}
        <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-4 mb-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#757575] mt-0.5" />
            <div>
              <p className="font-medium text-[#2C2C2C] mb-1">{listing.district}</p>
              <p className="text-sm text-[#757575]">Zimbabwe</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-4 mb-4">
            <h3 className="font-semibold text-[#2C2C2C] mb-2">Description</h3>
            <p className="text-sm text-[#757575] leading-relaxed">{listing.description}</p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#E0E0E0] p-4 z-10">
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
          <Button
            onClick={handleMessage}
            variant="outline"
            disabled={messagingLoading}
            className="h-12 border-2 border-[#2D5016] text-[#2D5016] hover:bg-[#2D5016]/5 flex items-center justify-center gap-2"
          >
            {messagingLoading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <MessageCircle className="w-5 h-5" />}
            Message
          </Button>
          <Button
            onClick={handleContact}
            disabled={contactLoading}
            className="h-12 bg-[#2D5016] hover:bg-[#234010] text-white flex items-center justify-center gap-2"
          >
            {contactLoading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Phone className="w-5 h-5" />}
            {(listing as any)?.farmer?.phone_number || listing.farmer_phone ? "Call" : "Contact"}
          </Button>
        </div>
      </div>
    </div>
  );
}
