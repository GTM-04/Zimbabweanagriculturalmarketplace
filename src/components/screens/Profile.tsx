import { useNavigate } from "react-router";
import {
  ArrowLeft,
  User,
  Bell,
  Globe,
  HardDrive,
  HelpCircle,
  FileText,
  Shield,
  Info,
  LogOut,
  ChevronRight,
  Star,
  Package,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { BottomNav } from "../BottomNav";

export function Profile() {
  const navigate = useNavigate();

  // Mock user data
  const user = {
    name: "Tendai Moyo",
    userType: "Farmer",
    location: "Harare",
    phone: "+263 77 123 4567",
    email: "tendai@example.com",
    memberSince: "Jan 2023",
    verified: true,
    rating: 4.8,
    totalListings: 12,
    successfulSales: 45,
  };

  const menuItems = [
    { icon: User, label: "My Account", action: () => {} },
    { icon: Bell, label: "Notifications Settings", action: () => {} },
    { icon: Globe, label: "Language", value: "English", action: () => {} },
    { icon: HardDrive, label: "Data & Storage", action: () => {} },
    { icon: HelpCircle, label: "Help & Support", action: () => {} },
    { icon: FileText, label: "Terms & Conditions", action: () => {} },
    { icon: Shield, label: "Privacy Policy", action: () => {} },
    { icon: Info, label: "About From Village to Market", action: () => {} },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#E0E0E0] px-4 py-4 flex items-center gap-3 z-10 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#2C2C2C]" />
        </button>
        <h1 className="text-xl font-semibold text-[#2C2C2C]">Profile</h1>
      </div>

      {/* Cover & Profile Photo */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-[#2D5016] to-[#7CB342]"></div>
        <div className="absolute -bottom-12 left-4">
          <div className="w-24 h-24 rounded-full bg-white p-1">
            <div className="w-full h-full rounded-full bg-[#2D5016] flex items-center justify-center text-white text-3xl font-bold">
              {user.name[0]}
            </div>
          </div>
        </div>
        <button className="absolute top-4 right-4 px-4 py-2 bg-white/90 hover:bg-white rounded-lg text-sm font-medium text-[#2C2C2C] transition-colors">
          Edit Profile
        </button>
      </div>

      {/* User Info */}
      <div className="mt-14 px-4 pb-4 bg-white">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-[#2C2C2C]">{user.name}</h2>
              {user.verified && (
                <div className="w-5 h-5 rounded-full bg-[#4A90E2] flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
            <span className="inline-block bg-[#2D5016]/10 text-[#2D5016] px-3 py-1 rounded-full text-xs font-medium">
              {user.userType}
            </span>
          </div>
        </div>

        <div className="space-y-2 mt-4 text-sm text-[#757575]">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{user.location}, Zimbabwe</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{user.phone}</span>
          </div>
          <p className="text-xs">Member since {user.memberSince}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white p-4 mb-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Package className="w-4 h-4 text-[#2D5016]" />
            </div>
            <p className="text-2xl font-bold text-[#2C2C2C]">{user.totalListings}</p>
            <p className="text-xs text-[#757575]">Total Listings</p>
          </div>
          <div className="text-center border-x border-[#E0E0E0]">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-[#F5A623] fill-[#F5A623]" />
            </div>
            <p className="text-2xl font-bold text-[#2C2C2C]">{user.rating}</p>
            <p className="text-xs text-[#757575]">Rating</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#2C2C2C]">{user.successfulSales}</p>
            <p className="text-xs text-[#757575]">Successful Sales</p>
          </div>
        </div>
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
            {item.value && (
              <span className="text-sm text-[#757575]">{item.value}</span>
            )}
            <ChevronRight className="w-5 h-5 text-[#757575]" />
          </button>
        ))}
      </div>

      {/* App Version */}
      <div className="px-4 py-4 text-center">
        <p className="text-xs text-[#757575]">Version 1.0.0</p>
      </div>

      {/* Logout Button */}
      <div className="px-4 pb-6">
        <button
          onClick={() => navigate("/login")}
          className="w-full h-12 bg-white border-2 border-[#EF5350] text-[#EF5350] rounded-lg hover:bg-[#EF5350] hover:text-white transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      <BottomNav userType="farmer" />
    </div>
  );
}
