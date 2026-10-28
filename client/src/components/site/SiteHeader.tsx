import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  ShoppingCart,
  ChevronDown,
  Menu,
  X,
  FileText,
  Building,
  Briefcase,
  Layers,
  Sparkles,
  User as UserIcon,
  Settings,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SettingsModal from "@/components/marketplace/SettingsModal";
import { CartItem } from "@/types";

interface SiteHeaderProps {
  cartItems?: CartItem[];
  onOpenCart?: () => void;
  onOpenRfq?: (topic?: string) => void;
}

export default function SiteHeader({
  cartItems = [],
  onOpenCart,
  onOpenRfq,
}: SiteHeaderProps) {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuth();

  const totalCartUnits = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      setProfileOpen(false);
      setIsOpen(false);
      await logout();
      toast.success("Signed out successfully");
      setLocation("/login");
    } catch (err: any) {
      toast.error("Failed to sign out");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      setLocation(`/products?query=${encodeURIComponent(q)}`);
    } else {
      setLocation("/products");
    }
  };

  const categories = [
    { name: "Agriculture & Farming", slug: "agriculture-and-farming", icon: "🌱" },
    { name: "Electrical & Electronics", slug: "electrical-and-electronics", icon: "⚡" },
    { name: "Renewable Energy & Solar", slug: "renewable-energy-and-solar", icon: "☀️" },
    { name: "Apparels & Fashion", slug: "apparels-and-fashion", icon: "👔" },
    { name: "Food & Beverages", slug: "food-and-beverages", icon: "🌾" },
    { name: "Enterprise & Startup Network", slug: "enterprise-and-startup-network", icon: "🏢" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 select-none">
      {/* Main Navigation Bar */}
      <nav
        className={`w-full transition-all duration-200 border-b ${
          isScrolled
            ? "bg-[#0B0F19]/95 backdrop-blur-md shadow-lg border-white/10 py-2.5"
            : "bg-[#0B0F19] border-white/10 py-3"
        }`}
      >
        <div className="shell flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center shadow-md">
              <img
                src="/logo.png"
                alt="BazroKart Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to stylized SVG monogram if image missing
                  const target = e.currentTarget;
                  target.style.display = "none";
                  if (target.parentElement) {
                    target.parentElement.innerHTML = `<span class="font-extrabold text-sm text-[#0F172A]">BK</span>`;
                  }
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl text-white tracking-tight leading-none">
                Bazro<span className="text-[#FF7A00]">Kart</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-[#94A3B8] leading-tight font-heading">
                B2B Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-200">
            {/* Products & Categories Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className={`flex items-center gap-1 text-slate-200 hover:text-white transition-colors py-1 cursor-pointer ${
                  categoriesOpen ? "text-[#FF7A00] font-bold" : ""
                }`}
              >
                <span>Products &amp; Categories</span>
                <ChevronDown size={14} className={`transform transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
              </button>

              {categoriesOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-900">
                  <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-600 tracking-wider">
                    All Departments
                  </div>
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/products?department=${encodeURIComponent(cat.name)}`}
                      onClick={() => setCategoriesOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] hover:bg-[#FFF7ED] hover:text-[#FF7A00] transition-colors"
                      style={{ color: "#0F172A" }}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span className="font-semibold text-[#0F172A]">{cat.name}</span>
                    </Link>
                  ))}
                  <div className="border-t border-slate-100 p-2 bg-slate-50">
                    <Link
                      href="/products"
                      onClick={() => setCategoriesOpen(false)}
                      className="block w-full text-center py-2 px-3 rounded-lg bg-[#0B0F19] text-white text-xs font-bold hover:bg-[#1E293B] transition-colors shadow-sm"
                      style={{ color: "#FFFFFF", backgroundColor: "#0B0F19" }}
                    >
                      Explore All Categories →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/enterprises"
              className={`text-slate-200 hover:text-white transition-colors ${location === "/enterprises" ? "text-white font-bold" : ""}`}
            >
              Enterprises
            </Link>

            <Link
              href="/services"
              className={`text-slate-200 hover:text-white transition-colors ${location === "/services" ? "text-white font-bold" : ""}`}
            >
              Services
            </Link>

            <Link
              href="/networks"
              className={`text-slate-200 hover:text-white transition-colors ${location === "/networks" ? "text-white font-bold" : ""}`}
            >
              Networks
            </Link>

            <Link
              href="/subscription"
              className={`text-slate-200 hover:text-white transition-colors ${location === "/subscription" ? "text-white font-bold" : ""}`}
            >
              Subscription
            </Link>
          </div>

          {/* Action Buttons (Cart, RFQ, Account) */}
          <div className="flex items-center gap-2.5">
            {/* Quick Bulk RFQ Button */}
            <button
              type="button"
              onClick={() => onOpenRfq && onOpenRfq()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all"
            >
              <FileText size={14} className="text-[#FF7A00]" />
              <span>Bulk RFQ</span>
            </button>

            {/* Procurement Cart Trigger */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-2 text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1.5"
              aria-label="Open Cart"
            >
              <ShoppingCart size={19} className="text-[#CBD7EA]" />
              {totalCartUnits > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF7A00] text-white text-[11px] font-extrabold flex items-center justify-center shadow-md">
                  {totalCartUnits}
                </span>
              )}
            </button>

            {/* Auth / Account Profile */}
            {user ? (
              <div className="relative hidden sm:block" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all focus:outline-none cursor-pointer"
                  aria-expanded={profileOpen}
                  aria-label="User Profile and Account Menu"
                >
                  <UserIcon size={14} className="text-[#0D9488]" />
                  <span className="max-w-[120px] truncate">{user.name || "Account"}</span>
                  <ChevronDown
                    size={12}
                    className={`text-slate-300 transition-transform duration-200 ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800">
                    {/* User Profile Card Header */}
                    <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-heading font-extrabold text-sm text-[#0F172A] truncate">
                          {user.name || "Enterprise Account"}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700 border-purple-200"
                              : user.role === "seller"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-orange-50 text-orange-800 border-orange-200"
                          }`}
                        >
                          {user.role === "admin" ? "Admin" : user.role === "seller" ? "Supplier" : "Buyer"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate font-medium">
                        {user.companyName || user.name || "Commercial Entity"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
                    </div>

                    {/* Navigation Menu Options */}
                    <div className="p-1 space-y-0.5">
                      <Link
                        href={
                          user.role === "seller"
                            ? "/supplier/dashboard"
                            : user.role === "admin"
                            ? "/admin/dashboard"
                            : "/buyer/dashboard"
                        }
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-[#FFF7ED] hover:text-[#0F172A] transition-colors"
                      >
                        <LayoutDashboard size={15} className="text-[#FF7A00]" />
                        <div className="flex flex-col">
                          <span>Operations Workspace</span>
                          <span className="text-[10px] text-slate-400 font-normal">Manage orders, quotes &amp; RFQs</span>
                        </div>
                      </Link>

                      {/* Settings Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          setIsSettingsOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-[#FFF7ED] hover:text-[#0F172A] transition-colors text-left cursor-pointer"
                      >
                        <Settings size={15} className="text-[#0D9488]" />
                        <div className="flex flex-col">
                          <span>Settings</span>
                          <span className="text-[10px] text-slate-400 font-normal">Profile, GSTIN &amp; Company info</span>
                        </div>
                      </button>
                    </div>

                    {/* Sign Out Option */}
                    <div className="border-t border-slate-100 p-1 mt-1">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left cursor-pointer"
                      >
                        <LogOut size={15} className="text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-bold text-white hover:text-[#FF7A00] transition-colors border border-white/20 rounded-lg hover:border-white/40 cursor-pointer"
                  style={{ color: "#FFFFFF" }}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 bg-[#FF7A00] hover:bg-[#EA580C] text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                  style={{ color: "#FFFFFF", backgroundColor: "#FF7A00" }}
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Drawer Toggle */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle Navigation"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="lg:hidden bg-[#0B0F19] border-t border-white/10 px-4 py-4 space-y-3 animate-in slide-in-from-top-3 duration-200">
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-white rounded-lg px-3 py-1.5 text-slate-800">
              <Search size={16} className="text-slate-400 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or SKU..."
                className="w-full text-xs focus:outline-none"
              />
            </form>

            <div className="space-y-1 text-xs text-slate-200 font-medium">
              <Link href="/products" onClick={() => setIsOpen(false)} className="block py-2 px-2 hover:bg-white/10 rounded">
                All Products &amp; Categories
              </Link>
              <Link href="/enterprises" onClick={() => setIsOpen(false)} className="block py-2 px-2 hover:bg-white/10 rounded">
                Enterprises
              </Link>
              <Link href="/services" onClick={() => setIsOpen(false)} className="block py-2 px-2 hover:bg-white/10 rounded">
                Services
              </Link>
              <Link href="/networks" onClick={() => setIsOpen(false)} className="block py-2 px-2 hover:bg-white/10 rounded">
                Networks
              </Link>
              <Link href="/subscription" onClick={() => setIsOpen(false)} className="block py-2 px-2 hover:bg-white/10 rounded">
                Subscription Plans
              </Link>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenRfq) onOpenRfq();
                }}
                className="px-4 py-2 bg-[#FF7A00] text-white rounded-lg text-xs font-bold hover:bg-[#EA580C]"
              >
                Request RFQ
              </button>

              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold"
                  >
                    <Settings size={13} className="text-[#0D9488]" />
                    <span>Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" onClick={() => setIsOpen(false)} className="text-xs text-slate-200 px-3 py-1.5">
                    Sign In
                  </Link>
                  <Link href="/register" onClick={() => setIsOpen(false)} className="px-3.5 py-1.5 bg-[#FF7A00] hover:bg-[#EA580C] text-white rounded-lg text-xs font-bold">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Profile & Enterprise Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
}
