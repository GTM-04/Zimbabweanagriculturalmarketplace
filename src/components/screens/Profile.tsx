import {
    ArrowLeft, ArrowLeftRight, Bell, Building2, CheckCircle, ChevronRight,
    Edit3, FileText, Globe, HardDrive, HelpCircle, Info, Leaf, Loader2,
    LogOut, Mail, MapPin, Package, Phone, Save, Shield, ShoppingBag, Star,
    WifiOff, X
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
  const { user, logout, updateProfile, refreshUser, isOffline, switchMode } = useAuth();
  const [statsLoading, setStatsLoading] = useState(true);
  const [listingCount, setListingCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", district: "", ward: "" });

  useEffect(() => { if (user) setEditForm({ full_name: user.full_name ?? "", email: user.email ?? "", district: user.district ?? "", ward: user.ward ?? "" }); }, [user]);

  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      if (user?.user_type === "farmer") { try { setListingCount((await listingsApi.myListings()).length); } catch { setListingCount(0); } }
      setStatsLoading(false);
    };
    if (user) loadStats();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload: Partial<UserType> = { full_name: editForm.full_name.trim(), district: editForm.district.trim(), ward: editForm.ward.trim() };
      if (editForm.email.trim()) payload.email = editForm.email.trim();
      await updateProfile(payload);
      toast.success("Profile updated successfully");
      setEditOpen(false);
    } catch (err: any) { toast.error("Update failed", { description: err?.message || "Please try again." }); }
    finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); navigate("/login"); };
  const handleRefresh = async () => { try { await refreshUser(); toast.success("Profile refreshed"); } catch { } };

  if (!user) {
    return (<div className="pf-loading-page"><Loader2 size={32} className="fd-spin" /><p>Loading profile…</p></div>);
  }

  const isFarmer = user.user_type === "farmer";
  const displayName = user.full_name || "User";
  const initials = displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const orgName = (user.profile as any)?.organization_name || (user.profile as any)?.farm_name || null;
  const memberSince = (() => { try { const s = localStorage.getItem("user"); if (!s) return null; const p = JSON.parse(s); const d = new Date(p.date_joined || p.created_at); if (!isNaN(d.getTime())) return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }); } catch { } return null; })();

  const menuItems = [
    { icon: Bell, label: "Notification Settings" },
    { icon: Globe, label: "Language", value: "English" },
    { icon: HardDrive, label: "Data & Storage" },
    { icon: HelpCircle, label: "Help & Support" },
    { icon: FileText, label: "Terms & Conditions" },
    { icon: Shield, label: "Privacy Policy" },
    { icon: Info, label: "About Village to Marketplace" },
  ];

  return (
    <div className="pf-page">
      <BottomNav />

      {isOffline && (<div className="pf-banner"><WifiOff size={15} /><span>Offline — showing cached profile.</span></div>)}

      {/* Header */}
      <header className="pf-header" style={{ overflow: "hidden" }}>
        <div className="pf-cover__gradient" />
        <div className="pf-cover__orb pf-cover__orb--1" />
        <div className="pf-cover__orb pf-cover__orb--2" />
        
        <div className="pf-header__top" style={{ position: "relative", zIndex: 2 }}>
          <button onClick={() => navigate(-1)} className="pf-back"><ArrowLeft size={18} /></button>
          <h1 className="pf-header__title">Profile</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setEditOpen(true)} className="pf-cover__edit" style={{ position: 'relative', top: 0, right: 0 }}>
              <Edit3 size={13} /> Edit
            </button>
            {!isOffline && (<button onClick={handleRefresh} className="pf-refresh-btn">Refresh</button>)}
          </div>
        </div>
      </header>

      {/* Avatar + Info */}
      <div className="pf-info-section">
        <div className="pf-avatar-wrap">
          <div className="pf-avatar">{initials}</div>
          {user.is_verified && <div className="pf-avatar__verified"><CheckCircle size={14} className="pf-verified-icon" /></div>}
        </div>

        <div className="pf-user-card animate-fade-in-up">
          <h2 className="pf-user-card__name">{displayName}</h2>
          {orgName && (<div className="pf-user-card__org"><Building2 size={14} /><span>{orgName}</span></div>)}
          <span className={`pf-role-badge ${isFarmer ? "pf-role-badge--farmer" : "pf-role-badge--buyer"}`}>
            {isFarmer ? "🌱 Farmer" : `🛒 ${(user.profile as any)?.buyer_type || "Buyer"}`}
          </span>

          <div className="pf-contact-list">
            {user.district && (
              <div className="pf-contact"><div className="pf-contact__icon"><MapPin size={14} /></div><span>{user.district}{user.ward ? `, ${user.ward}` : ""}, Zimbabwe</span></div>
            )}
            <div className="pf-contact"><div className="pf-contact__icon"><Phone size={14} /></div><span>{user.phone_number}</span></div>
            {user.email && (<div className="pf-contact"><div className="pf-contact__icon"><Mail size={14} /></div><span>{user.email}</span></div>)}
            {memberSince && <p className="pf-member-since">Member since {memberSince}</p>}
          </div>
        </div>
      </div>

      {/* Mode Switch */}
      <div className="pf-section">
        <button onClick={async () => {
          const newMode = isFarmer ? "buyer" : "farmer";
          try { await switchMode(newMode); toast.success(`Switched to ${newMode === "farmer" ? "Farmer" : "Buyer"} mode`); navigate(newMode === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard"); }
          catch { toast.error("Failed to switch mode."); }
        }} className="pf-mode-switch">
          <div className={`pf-mode-switch__icon ${isFarmer ? "pf-mode-switch__icon--buyer" : "pf-mode-switch__icon--farmer"}`}>
            <ArrowLeftRight size={18} />
          </div>
          <div className="pf-mode-switch__text">
            <span className="pf-mode-switch__label">Switch to {isFarmer ? "Buyer" : "Farmer"} Mode</span>
            <span className="pf-mode-switch__desc">{isFarmer ? "Browse and purchase fresh produce" : "List your produce and manage your farm"}</span>
          </div>
          <ChevronRight size={18} className="pf-chevron" />
        </button>
      </div>

      {/* Stats */}
      <div className="pf-section">
        <div className="pf-stats-card">
          {statsLoading ? (
            <div className="pf-stats-loading"><Loader2 size={20} className="fd-spin" /></div>
          ) : (
            <div className="pf-stats-grid">
              <div className="pf-stat">
                <div className="pf-stat__icon pf-stat__icon--primary">
                  {isFarmer ? <Package size={20} /> : <ShoppingBag size={20} />}
                </div>
                <span className="pf-stat__value">{isFarmer ? listingCount : "0"}</span>
                <span className="pf-stat__label">{isFarmer ? "My Listings" : "Orders"}</span>
              </div>
              <div className="pf-stat pf-stat--border">
                <div className="pf-stat__icon pf-stat__icon--warning">
                  <Star size={20} className="icon-fill-current" />
                </div>
                <span className="pf-stat__value">{user.is_verified ? "✓" : "✗"}</span>
                <span className="pf-stat__label">{user.is_verified ? "Verified" : "Unverified"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Menu */}
      <div className="pf-section">
        <div className="pf-menu">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <button key={i} onClick={() => toast.info("Coming soon")} className="pf-menu__item">
                <div className="pf-menu__icon"><Icon size={16} /></div>
                <span className="pf-menu__label">{item.label}</span>
                {"value" in item && item.value && <span className="pf-menu__value">{item.value}</span>}
                <ChevronRight size={16} className="pf-chevron" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Version */}
      <div className="pf-version">
        <Leaf size={14} className="pf-version__icon" />
        <p>Village to Marketplace v1.0.0</p>
        <span>Empowering Zimbabwean Agriculture</span>
      </div>

      {/* Logout */}
      <div className="pf-section pf-section--footer">
        <button onClick={handleLogout} className="pf-logout">
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className="ml-overlay" onClick={() => !saving && setEditOpen(false)}>
          <div className="ml-modal ml-modal--edit animate-slide-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="ml-modal__header">
              <h2 className="ml-modal__header-title">Edit Profile</h2>
              <button onClick={() => setEditOpen(false)} disabled={saving} className="ml-modal__close"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveProfile} className="ml-edit-form">
              {[
                { id: "full_name", label: "Full Name", placeholder: "Your full name", required: true, type: "text", key: "full_name" as const },
                { id: "email", label: "Email (optional)", placeholder: "you@example.com", required: false, type: "email", key: "email" as const },
                { id: "district", label: "District", placeholder: "e.g. Harare", required: false, type: "text", key: "district" as const },
                { id: "ward", label: "Ward", placeholder: "e.g. Ward 5", required: false, type: "text", key: "ward" as const },
              ].map((field) => (
                <div key={field.id} className="ml-edit-field">
                  <label className="ml-edit-label">{field.label}</label>
                  <input className="ml-edit-input" type={field.type} value={editForm[field.key]} onChange={(e) => setEditForm((f) => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder} required={field.required} />
                </div>
              ))}
              <div className="ml-modal__actions">
                <button type="button" className="ml-modal__btn ml-modal__btn--cancel" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="ml-modal__btn ml-modal__btn--primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="fd-spin" /> : <><Save size={14} /> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
