import {
  ArrowLeft, Calendar, CheckCircle, Heart, Loader2, MapPin,
  MessageCircle, Phone, Share2, Star
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { getProduceFallbackImage, listingsApi, messagingApi, pricingApi, resolveImageUrl, selectPreferredImageEntry } from "../../lib/api";
import type { Listing, MarketPrice } from "../../lib/types";
import { BottomNav } from "../BottomNav";
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

  const getFarmerId = (l: Listing): string | null => {
    return l.farmer_id || (l.farmer?.id != null ? String(l.farmer.id) : null) || null;
  };

  const handleMessage = async () => {
    if (!listing) return;
    const farmerId = getFarmerId(listing);
    if (!farmerId) { toast.error("Cannot message seller", { description: "Seller information is not available." }); return; }
    setMessagingLoading(true);
    try { const conv = await messagingApi.startConversation(farmerId, listing.id); navigate(`/messages/${conv.id}`); }
    catch (err: any) { toast.error("Could not open chat", { description: err?.message || "Please try again." }); }
    finally { setMessagingLoading(false); }
  };

  const handleContact = async () => {
    if (!listing) return;
    const phone = listing.farmer_phone || listing.farmer?.phone_number || listing.farmer?.phone;
    if (phone) { window.location.href = `tel:${phone}`; return; }
    const farmerId = getFarmerId(listing);
    if (!farmerId) { toast.error("Cannot contact seller", { description: "Seller information is not available." }); return; }
    setContactLoading(true);
    try { const conv = await messagingApi.startConversation(farmerId, listing.id); navigate(`/messages/${conv.id}`); }
    catch (err: any) { toast.error("Could not contact farmer", { description: err?.message || "Please try again." }); }
    finally { setContactLoading(false); }
  };

  const handleShare = async () => {
    if (!listing) return;
    const title = listing.title || listing.produce_type?.name || "Produce Listing";
    const totalPrice = (Number(listing.price_per_unit) * Number(listing.quantity_available)).toFixed(2);
    const text = `${title} — USD ${totalPrice} per ${listing.quantity_available} ${listing.unit}\nDistrict: ${listing.district}\nVillage to Marketplace`;
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); }
      catch (err: any) { if (err?.name !== "AbortError") toast.error("Could not share", { description: err?.message }); }
    } else {
      try { await navigator.clipboard.writeText(url); toast.success("Link copied!", { description: "Product link copied to clipboard." }); }
      catch { toast.error("Sharing not supported", { description: "Please copy the URL manually." }); }
    }
  };

  useEffect(() => {
    if (!id) { setError("No product ID provided."); setLoading(false); return; }
    const fetchListing = async () => {
      try {
        setLoading(true); setError(null);
        const data = await listingsApi.get(id);
        setListing(data);
        try {
          const prices = await pricingApi.getMarketPrices({ produce_type: data.produce_type?.name, district: data.district });
          const match = prices.find(p => p.produce_type.toLowerCase() === data.produce_type?.name?.toLowerCase() && p.district.toLowerCase() === data.district?.toLowerCase())
            || prices.find(p => p.produce_type.toLowerCase() === data.produce_type?.name?.toLowerCase()) || prices[0] || null;
          setMarketPrice(match);
        } catch { /* market price optional */ }
      } catch (err: any) {
        // Fallback to local data if API fails
        import("../../lib/data").then(module => {
          const fallbackListing = module.produceListings.find(l => l.id === id);
          if (fallbackListing) {
            setListing({
              id: fallbackListing.id,
              title: fallbackListing.produceName,
              status: fallbackListing.status as "active",
              price_per_unit: fallbackListing.pricePerUnit,
              quantity_available: fallbackListing.quantity,
              unit: fallbackListing.unit,
              district: fallbackListing.district,
              views: fallbackListing.views,
              inquiries: fallbackListing.inquiries,
              farmer_id: String(fallbackListing.farmerId),
              produce_type: { name: fallbackListing.produceName },
              is_organic: fallbackListing.description?.toLowerCase().includes('organic') || false
            } as unknown as Listing);
            setError(null);
          } else {
            setError(err.message || "Product not found.");
          }
        }).catch(() => {
          setError(err.message || "Product not found.");
        });
      }
      finally { setLoading(false); }
    };
    fetchListing();
  }, [id]);

  const FALLBACK = getProduceFallbackImage(
    listing?.produce_type?.name ?? listing?.title,
    "https://images.unsplash.com/photo-1761370980657-22586ea44093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080"
  );
  const getImageUrl = (images: Listing["images"], index = 0) => {
    if (!images || images.length === 0) {
      return FALLBACK;
    }

    const preferredImage = selectPreferredImageEntry(images);
    if (index === 0) {
      return resolveImageUrl(preferredImage, FALLBACK);
    }

    return resolveImageUrl(images[index], FALLBACK);
  };
  const priceVsMarket = marketPrice && listing ? Math.round(((listing.price_per_unit - marketPrice.price_avg) / marketPrice.price_avg) * 100) : null;

  if (loading) return (
    <div className="product-page product-page--centered">
      <BottomNav />
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-muted text-sm">Loading product...</p>
    </div>
  );

  if (error || !listing) return (
    <div className="product-page product-page--centered product-page--error">
      <BottomNav />
      <div className="w-16 h-16 rounded-full bg-error-light flex items-center justify-center text-2xl">📦</div>
      <p className="text-lg font-semibold text-fg">Product not found</p>
      <p className="text-sm text-muted">{error}</p>
      <Button onClick={() => navigate(-1)} variant="outline" className="border-primary text-primary">Go Back</Button>
    </div>
  );

  const images = listing.images?.length ? listing.images : [""];
  const currency = "USD";

  return (
    <div className="product-page">
      <BottomNav />
      <div className="sticky-header px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn-icon-hover"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2">
          <button onClick={handleShare} className="btn-icon-hover" title="Share listing"><Share2 className="w-5 h-5" /></button>
          <button className="btn-icon-hover"><Heart className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="relative">
        <div className="aspect-[16/12] bg-muted">
          <img src={getImageUrl(images, currentImage)} alt={listing.title || listing.produce_type?.name} className="w-full h-full object-cover"
            onError={(e) => { const el = e.currentTarget as HTMLImageElement; if (!el.dataset.fallback) { el.dataset.fallback = 'true'; el.src = FALLBACK; } }} />
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (<button key={i} onClick={() => setCurrentImage(i)} className={`h-2 rounded-full transition-all ${i === currentImage ? "w-8 bg-white" : "w-2 bg-white/60"}`} />))}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold text-fg flex-1">{listing.title || listing.produce_type?.name}</h1>
            {listing.is_organic && <span className="organic-badge whitespace-nowrap">🌿 Organic</span>}
          </div>
          <p className="text-sm text-muted">{listing.produce_type?.name}</p>
        </div>

        <div className="product-price-card mb-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-primary">{currency} {(Number(listing.price_per_unit) * Number(listing.quantity_available)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-lg text-muted">per {listing.quantity_available} {listing.unit}</span>
          </div>
          {priceVsMarket !== null && (
            <div className="mt-3 pt-3 product-price-divider">
              <p className="text-sm text-muted">Market comparison:{" "}
                <span className={priceVsMarket <= 0 ? "text-success font-medium" : "text-warning font-medium"}>
                  {priceVsMarket > 0 ? "+" : ""}{priceVsMarket}% {priceVsMarket <= 0 ? "below" : "above"} market avg ({currency} {marketPrice!.price_avg}/{listing.unit})
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="product-info-card mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted mb-1">Available Quantity</p>
              <p className="text-lg font-semibold text-fg">{listing.quantity_available} {listing.unit}</p>
              {listing.quantity_available < 100 && <span className="inline-block mt-1 text-xs text-warning font-medium">Limited Stock</span>}
            </div>
            {listing.harvest_date && (
              <div>
                <p className="text-sm text-muted mb-1">Harvest Date</p>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-muted" />
                  <p className="text-base font-semibold text-fg">{new Date(listing.harvest_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {(listing.farmer_name || listing.farmer?.name || listing.farmer_id) && (
          <div className="product-info-card mb-4">
            <p className="text-sm text-muted mb-3">Seller Information</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-lg">{(listing.farmer_name || listing.farmer?.name || "F")[0].toUpperCase()}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2"><h3 className="font-semibold text-fg">{listing.farmer_name || listing.farmer?.name || "Farmer"}</h3>{listing.farmer?.is_verified && <CheckCircle className="w-4 h-4 text-info" />}</div>
                <div className="flex items-center gap-1 text-sm text-muted mt-1"><Star className="w-4 h-4 text-warning icon-fill-warning" /><span>{listing.farmer?.is_verified ? 'Verified Seller' : 'Seller'}</span></div>
              </div>
              {(listing.farmer_id || listing.farmer?.id) && <button onClick={() => navigate(`/profile?farmer=${listing.farmer_id || listing.farmer?.id}`)} className="text-sm text-info font-medium hover:underline">View</button>}
            </div>
          </div>
        )}

        <div className="product-info-card mb-4">
          <div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-muted mt-0.5" /><div><p className="font-medium text-fg mb-1">{listing.district}</p><p className="text-sm text-muted">Zimbabwe</p></div></div>
        </div>

        {listing.description && (
          <div className="product-info-card mb-4"><h3 className="font-semibold text-fg mb-2">Description</h3><p className="text-sm text-muted leading-relaxed">{listing.description}</p></div>
        )}
      </div>

      <div className="product-action-bar">
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
          <Button onClick={handleMessage} variant="outline" disabled={messagingLoading} className="h-12 border-2 border-primary text-primary hover:bg-primary/5 flex items-center justify-center gap-2">
            {messagingLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />} Message
          </Button>
          <Button onClick={handleContact} disabled={contactLoading} className="h-12 bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-2">
            {contactLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Phone className="w-5 h-5" />}
            {listing.farmer?.phone || listing.farmer?.phone_number || listing.farmer_phone ? "Call" : "Contact"}
          </Button>
        </div>
      </div>
    </div>
  );
}
