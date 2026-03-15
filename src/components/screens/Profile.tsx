import {
    Bell,
    Building2,
    CheckCircle,
    ChevronRight,
    Edit3,
    FileText,
    Globe,
    HardDrive,
    HelpCircle,
    Info,
    Loader2,
    LogOut,
    Mail,
    MapPin,
    Package,
    Phone,
    Save,
    Shield,
    ShoppingBag,
    Star,
    WifiOff,
    X
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { listingsApi } from "../../lib/api";
import type { User as UserType } from "../../lib/types";
import { useAuth } from "../../lib/useAuth";
import { AppShell } from "../layout/AppShell";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateProfile, refreshUser, isOffline } = useAuth();

  const [statsLoading, setStatsLoading] = useState(true);
  const [listingCount, setListingCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--gray-50)]">
        <Loader2 className="w-8 h-8 text-[var(--primary-700)] animate-spin" />
        <p className="text-[var(--gray-600)] text-sm">Loading profile…</p>
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
    <AppShell
      title="Profile"
      subtitle="Account details, role, and preferences"
    >
      {/* Offline banner */}
      {isOffline && (
        <div className="offline-banner flex items-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          You're offline — showing cached profile.
        </div>
      )}

      {/* Cover & Avatar */}
      <div className="relative mb-4">
        <div className="h-32 rounded-2xl bg-gradient-to-r from-[var(--primary-800)] to-[var(--success)]" />
        <div className="absolute -bottom-12 left-4">
          <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md">
            <div className="w-full h-full rounded-full bg-[var(--primary-700)] flex items-center justify-center text-white text-3xl font-bold select-none">
              {initials}
            </div>
          </div>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white rounded-lg text-sm font-medium text-[var(--gray-900)] transition-colors shadow"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit Profile
        </button>
      </div>

      {/* User Info */}
      <div className="mt-14 px-4 pb-4 bg-white rounded-2xl shadow-sm border border-[var(--gray-100)]">
        <div className="pt-4 mb-2">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-[var(--gray-900)]">{displayName}</h2>
            {user.is_verified && (
              <CheckCircle className="w-5 h-5 text-[var(--info)]" />
            )}
          </div>
          {orgName && (
            <div className="flex items-center gap-1 text-sm text-[var(--gray-600)] mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{orgName}</span>
            </div>
          )}
          <span className="inline-block bg-[var(--primary-50)] text-[var(--primary-800)] px-3 py-1 rounded-full text-xs font-medium capitalize">
            {isFarmer ? "Farmer" : (user.profile as any)?.buyer_type || "Buyer"}
          </span>
        </div>

        <div className="space-y-2 mt-4 text-sm text-[var(--gray-600)]">
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
          {memberSince && <p className="text-xs text-[var(--gray-400)] mt-1">Member since {memberSince}</p>}
        </div>
      </div>

      {/* Role Switcher */}
      <div className="bg-white px-4 py-4 mt-3 mb-3 rounded-2xl shadow-sm border border-[var(--gray-100)]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-[var(--gray-900)]">Account role</p>
          {roleSaving && (
            <span className="text-xs text-[var(--gray-600)] flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Switching…
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--gray-600)] mb-3">
          Use the same account as a farmer or a buyer. You can switch anytime without creating a new account.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            disabled={roleSaving || isFarmer}
            onClick={async () => {
              if (isFarmer) return;
              setRoleSaving(true);
              try {
                await updateProfile({ user_type: "farmer" } as any);
                toast.success("Switched to Farmer account", {
                  description: "You can now list produce and manage your farm profile.",
                });
                navigate("/farmer/dashboard");
              } catch (err: any) {
                toast.error("Could not switch role", { description: err?.message || "Please try again." });
              } finally {
                setRoleSaving(false);
              }
            }}
            className={`flex-1 h-10 text-sm font-medium border-2 ${
              isFarmer
                ? "bg-[var(--primary-800)] border-[var(--primary-800)] text-white"
                : "bg-white border-[var(--gray-200)] text-[var(--gray-900)] hover:border-[var(--primary-200)] hover:bg-[var(--primary-50)]"
            }`}
          >
            Farmer
          </Button>
          <Button
            type="button"
            disabled={roleSaving || !isFarmer}
            onClick={async () => {
              if (!isFarmer) return;
              setRoleSaving(true);
              try {
                await updateProfile({ user_type: "buyer" } as any);
                toast.success("Switched to Buyer account", {
                  description: "Browse and purchase from farmers across Zimbabwe.",
                });
                navigate("/buyer/dashboard");
              } catch (err: any) {
                toast.error("Could not switch role", { description: err?.message || "Please try again." });
              } finally {
                setRoleSaving(false);
              }
            }}
            className={`flex-1 h-10 text-sm font-medium border-2 ${
              !isFarmer
                ? "bg-[var(--primary-800)] border-[var(--primary-800)] text-white"
                : "bg-white border-[var(--gray-200)] text-[var(--gray-900)] hover:border-[var(--primary-200)] hover:bg-[var(--primary-50)]"
            }`}
          >
            Buyer
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white p-4 mt-3 mb-3 rounded-2xl shadow-sm border border-[var(--gray-100)]">
        {statsLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 text-[var(--primary-700)] animate-spin" />
          </div>
        ) : isFarmer ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <Package className="w-4 h-4 text-[var(--primary-800)] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[var(--gray-900)]">{listingCount}</p>
              <p className="text-xs text-[var(--gray-500)]">My Listings</p>
            </div>
            <div className="text-center border-l border-[var(--gray-200)]">
              <Star className="w-4 h-4 text-[var(--accent-500)] fill-[var(--accent-500)] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[var(--gray-900)]">{user.is_verified ? "✓" : "—"}</p>
              <p className="text-xs text-[var(--gray-500)]">{user.is_verified ? "Verified" : "Unverified"}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <ShoppingBag className="w-4 h-4 text-[var(--info)] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[var(--gray-900)]">—</p>
              <p className="text-xs text-[var(--gray-500)]">Orders</p>
            </div>
            <div className="text-center border-l border-[var(--gray-200)]">
              <Star className="w-4 h-4 text-[var(--accent-500)] fill-[var(--accent-500)] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[var(--gray-900)]">{user.is_verified ? "✓" : "—"}</p>
              <p className="text-xs text-[var(--gray-500)]">{user.is_verified ? "Verified" : "Unverified"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="bg-white divide-y divide-[var(--gray-100)] rounded-2xl shadow-sm border border-[var(--gray-100)] overflow-hidden mt-3 mb-3">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className="w-full px-4 py-4 flex items-center gap-3 hover:bg-[var(--gray-50)] transition-colors text-left"
          >
            <item.icon className="w-5 h-5 text-[var(--gray-500)]" />
            <span className="flex-1 text-[var(--gray-900)]">{item.label}</span>
            {"value" in item && item.value && (
              <span className="text-sm text-[var(--gray-500)]">{item.value}</span>
            )}
            <ChevronRight className="w-4 w-4 text-[var(--gray-400)]" />
          </button>
        ))}
      </div>

      {/* App Version */}
      <div className="py-3 text-center">
        <p className="text-xs text-[var(--gray-400)]">Village to Marketplace v1.0.0</p>
      </div>

      {/* Logout */}
      <div className="pb-6">
        <button
          onClick={handleLogout}
          className="w-full h-12 bg-white border-2 border-[var(--error)] text-[var(--error)] rounded-xl hover:bg-[var(--error)] hover:text-white transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>

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
              <h2 className="text-lg font-semibold text-[var(--gray-900)]">Edit Profile</h2>
              <button
                onClick={() => setEditOpen(false)}
                disabled={saving}
                className="p-1 hover:bg-[var(--gray-100)] rounded-full"
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
                  className="flex-1 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white"
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
    </AppShell>
  );
}
