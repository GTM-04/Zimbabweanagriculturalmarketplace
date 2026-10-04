import { ArrowLeft, MapPin, MessageCircle, Package, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { listingsApi, resolveImageUrl, usersApi } from "../../lib/api";
import type { Listing } from "../../lib/types";
import { BottomNav } from "../BottomNav";

export function FarmerPublicProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!username) return;
      try {
        setLoading(true);
        const [profileData, listingsData] = await Promise.all([
          usersApi.getPublicFarmerProfile(username),
          listingsApi.list({ farmer_id: username, status: "active" }), // Using username as query (backend might need to support filtering by username)
        ]);
        setProfile(profileData);
        // Fallback filter locally if the backend doesn't filter by farmer_id
        setListings(
          listingsData.filter((l: any) => l.farmer?.id === profileData.id || l.farmer_id === profileData.id)
        );
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [username]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-bg px-4">
        <p className="mb-4 text-center text-lg text-error">{error || "Profile not found"}</p>
        <button onClick={() => navigate(-1)} className="btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-elevated/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-icon-hover">
            <ArrowLeft className="h-5 w-5 text-fg" />
          </button>
          <h1 className="text-lg font-semibold text-fg">Farmer Profile</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg">
        {/* Profile Info */}
        <section className="bg-elevated px-4 py-6 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary/10">
            {profile.profile_picture ? (
              <img src={resolveImageUrl(profile.profile_picture, "")} alt={profile.full_name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-semibold text-primary">
                {profile.full_name[0].toUpperCase()}
              </span>
            )}
          </div>
          
          <h2 className="mb-1 text-2xl font-bold text-fg flex items-center justify-center gap-2">
            {profile.full_name}
            {profile.is_verified && <ShieldCheck className="h-5 w-5 text-success" />}
          </h2>
          
          <p className="mb-2 text-sm text-muted">@{profile.username}</p>
          
          {profile.bio && (
            <p className="mx-auto mb-4 max-w-xs text-sm text-fg leading-relaxed">
              "{profile.bio}"
            </p>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted">
            {profile.farm_name && (
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>{profile.farm_name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{profile.district}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button 
              onClick={() => navigate(`/messages/new?recipient_id=${profile.id}`)}
              className="btn-primary flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Message
            </button>
          </div>
        </section>

        {/* Listings */}
        <section className="px-4 py-6">
          <h3 className="mb-4 text-lg font-semibold text-fg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Active Listings ({listings.length})
          </h3>

          {listings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-elevated py-8 text-center">
              <p className="text-sm text-muted">No active listings right now.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {listings.map((listing) => {
                const img = resolveImageUrl(listing.images?.[0], "https://images.unsplash.com/photo-1649251037465-72c9d378acb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400");
                return (
                  <div
                    key={listing.id}
                    onClick={() => navigate(`/product/${listing.id}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-elevated p-3 transition-colors hover:border-primary"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <img src={img} alt={listing.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-medium text-fg">{listing.title}</h4>
                      <p className="font-semibold text-primary">
                        ${listing.price_per_unit}/{listing.unit}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
