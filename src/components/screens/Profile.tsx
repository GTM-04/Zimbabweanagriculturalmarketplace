import {
    ArrowLeft,
    Bell,
    ChevronRight,
    FileText,
    Globe,
    HardDrive,
    HelpCircle,
    Info,
    Loader2,
    LogOut,
    MapPin,
    Package,
    Phone,
    Shield,
    Star
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { listingsApi } from "../../lib/api";
import type { User as UserType } from "../../lib/types";
import { useAuth } from "../../lib/useAuth";
import { BottomNav } from "../BottomNav";

export function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateProfile, refreshUser, isOffline } = useAuth();

  const [statsLoading, setStatsLoading] = useState(true);
  const [listingCount, setListingCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    district: "",
    ward: "",
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        full_name: user.full_name ?? "",
        email: user.email ?? "",
        district: user.district ?? "",
        ward: user.ward ?? "",
      });
    }
  }, [user]);

  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      if (user?.user_type === "farmer") {
        try {
          const listings = await listingsApi.myListings();
          setListingCount(listings.length);
        } catch {
          setListingCount(0);
        }
      }
      setStatsLoading(false);
    };
    if (user) loadStats();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<UserType> = {
        full_name: editForm.full_name.trim(),
        district: editForm.district.trim(),
        ward: editForm.ward.trim(),
      };
      if (editForm.email.trim()) payload.email = editForm.email.trim();
      await updateProfile(payload);
      toast.success("Profile updated successfully");
      setEditOpen(false);
    } catch (err: any) {
      toast.error("Update failed", { description: err?.message || "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRefresh = async () => {
    try {
      await refreshUser();
      toast.success("Profile refreshed");
    } catch { /* silently fail */ }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[#2D5016] animate-spin" />
        <p className="text-[#757575] text-sm">Loading profile…</p>
      </div>
    );
  }

  const isFarmer = user.user_type === "farmer";
  const displayName = user.full_name || "User";
  const initials = displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const orgName = (user.profile as any)?.organization_name || (user.profile as any)?.farm_name || null;
  const memberSince = (() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      const date = new Date(parsed.date_joined || parsed.created_at);
      if (!isNaN(date.getTime()))
        return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    } catch { /* ignore */ }
    return null;
  })();

  const menuItems = [
    { icon: Bell,      label: "Notification Settings",          action: () => toast.info("Coming soon") },
    { icon: Globe,     label: "Language",      value: "English", action: () => toast.info("Coming soon") },
    { icon: HardDrive, label: "Data & Storage",                  action: () => toast.info("Coming soon") },
    { icon: HelpCircle,label: "Help & Support",                  action: () => toast.info("Coming soon") },
    { icon: FileText,  label: "Terms & Conditions",              action: () => toast.info("Coming soon") },
    { icon: Shield,    label: "Privacy Policy",                  action: () => toast.info("Coming soon") },
    { icon: Info,      label: "About Village to Marketplace",    action: () => toast.info("Village to Marketplace v1.0.0", { description: "Connecting Zimbabwe's farmers with buyers." }) },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* Offline banner */}
      {isOffline && (
        <div className="bg-[#FFA726] text-[#2C2C2C] px-4 py-2 flex items-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          You're offline — showing cached profile.
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#E0E0E0] px-4 py-4 flex items-center gap-3 z-10 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#2C2C2C]" />
        </button>
        <h1 className="text-xl font-semibold text-[#2C2C2C] flex-1">Profile</h1>
        {!isOffline && (
          <button
            onClick={handleRefresh}
            className="text-xs text-[#4A90E2] font-medium hover:underline"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Cover & Avatar */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-[#2D5016] to-[#7CB342]" />
        <div className="absolute -bottom-12 left-4">
          <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md">
            <div className="w-full h-full rounded-full bg-[#2D5016] flex items-center justify-center text-white text-3xl font-bold select-none">
              {initials}
            </div>
          </div>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white rounded-lg text-sm font-medium text-[#2C2C2C] transition-colors shadow"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit Profile
        </button>
      </div>

      {/* User Info */}
      <div className="mt-14 px-4 pb-4 bg-white">
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-[#2C2C2C]">{displayName}</h2>
            {user.is_verified && (
              <CheckCircle className="w-5 h-5 text-[#4A90E2]" />
            )}
          </div>
          {orgName && (
            <div className="flex items-center gap-1 text-sm text-[#757575] mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{orgName}</span>
            </div>
          )}
          <span className="inline-block bg-[#2D5016]/10 text-[#2D5016] px-3 py-1 rounded-full text-xs font-medium capitalize">
            {isFarmer ? "Farmer" : (user.profile as any)?.buyer_type || "Buyer"}
          </span>
        </div>

        <div className="space-y-2 mt-4 text-sm text-[#757575]">
          {user.district && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>
                {user.district}{user.ward ? `, ${user.ward}` : ""}, Zimbabwe
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>{user.phone_number}</span>
          </div>
          {user.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
          {memberSince && <p className="text-xs">Member since {memberSince}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white p-4 mt-3 mb-3">
        {statsLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 text-[#2D5016] animate-spin" />
          </div>
        ) : isFarmer ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <Package className="w-4 h-4 text-[#2D5016] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[#2C2C2C]">{listingCount}</p>
              <p className="text-xs text-[#757575]">My Listings</p>
            </div>
            <div className="text-center border-l border-[#E0E0E0]">
              <Star className="w-4 h-4 text-[#F5A623] fill-[#F5A623] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[#2C2C2C]">{user.is_verified ? "✓" : "—"}</p>
              <p className="text-xs text-[#757575]">{user.is_verified ? "Verified" : "Unverified"}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <ShoppingBag className="w-4 h-4 text-[#4A90E2] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[#2C2C2C]">—</p>
              <p className="text-xs text-[#757575]">Orders</p>
            </div>
            <div className="text-center border-l border-[#E0E0E0]">
              <Star className="w-4 h-4 text-[#F5A623] fill-[#F5A623] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[#2C2C2C]">{user.is_verified ? "✓" : "—"}</p>
              <p className="text-xs text-[#757575]">{user.is_verified ? "Verified" : "Unverified"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="bg-white divide-y divide-[#E0E0E0]">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className="w-full px-4 py-4 flex items-center gap-3 hover:bg-[#F5F5F5] transition-colors text-left"
          >
            <item.icon className="w-5 h-5 text-[#757575]" />
            <span className="flex-1 text-[#2C2C2C]">{item.label}</span>
            {"value" in item && item.value && (
              <span className="text-sm text-[#757575]">{item.value}</span>
            )}
            <ChevronRight className="w-5 h-5 text-[#757575]" />
          </button>
        ))}
      </div>

      {/* App Version */}
      <div className="px-4 py-4 text-center">
        <p className="text-xs text-[#757575]">Village to Marketplace v1.0.0</p>
      </div>

      {/* Logout */}
      <div className="px-4 pb-6">
        <button
          onClick={handleLogout}
          className="w-full h-12 bg-white border-2 border-[#EF5350] text-[#EF5350] rounded-lg hover:bg-[#EF5350] hover:text-white transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      <BottomNav userType={isFarmer ? "farmer" : "buyer"} />

      {/* Edit Profile Modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
          onClick={() => !saving && setEditOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#2C2C2C]">Edit Profile</h2>
              <button
                onClick={() => setEditOpen(false)}
                disabled={saving}
                className="p-1 hover:bg-[#F5F5F5] rounded-full"
              >
                <X className="w-5 h-5 text-[#757575]" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="Your full name"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={editForm.district}
                  onChange={(e) => setEditForm((f) => ({ ...f, district: e.target.value }))}
                  placeholder="e.g. Harare"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ward">Ward</Label>
                <Input
                  id="ward"
                  value={editForm.ward}
                  onChange={(e) => setEditForm((f) => ({ ...f, ward: e.target.value }))}
                  placeholder="e.g. Ward 5"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#2D5016] hover:bg-[#234010] text-white"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
