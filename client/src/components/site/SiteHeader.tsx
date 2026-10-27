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
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: user } = trpc.auth.me.useQuery();

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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      {/* Top Corporate Ticker */}
      <div className="w-full bg-[#00081E] py-1 text-slate-300 text-[11px] font-['Inter'] overflow-hidden border-b border-white/10 hidden sm:block">
        <div className="shell flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[#0D9488] font-bold flex items-center gap-1">
              <ShieldCheck size={13} /> Official GST Invoicing
            </span>
            <span className="text-slate-600">•</span>
            <span>Casagrand Royale, Sholinganallur, Chennai HUB</span>
            <span className="text-slate-600">•</span>
            <span>Pan-India Direct Express Freight</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span className="text-[#F59E0B] font-semibold">Toll-Free: 1800-419-BAZRO</span>
            <Link href="/supplier/onboarding" className="hover:text-white transition-colors">
              Supplier Empanelment ↗
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav
        className={`w-full transition-all duration-200 border-b ${
          isScrolled
            ? "bg-[#0A1F44]/95 backdrop-blur-md shadow-lg border-white/10 py-2.5"
            : "bg-[#0A1F44] border-white/10 py-3"
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
                    target.parentElement.innerHTML = `<span class="font-extrabold text-sm text-[#0A1F44]">BK</span>`;
                  }
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl text-white tracking-tight leading-none">
                Bazro<span className="text-[#F59E0B]">Kart</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-[#87A9E9] leading-tight font-heading">
                B2B Marketplace
              </span>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md items-center bg-white/10 hover:bg-white/15 focus-within:bg-white focus-within:text-slate-900 text-white rounded-xl px-3 py-1.5 border border-white/20 transition-all"
          >
            <Search size={16} className="text-slate-300 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 500,000+ MRO parts, wholesale lots, SKU..."
              className="w-full bg-transparent text-xs placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-[#F59E0B] text-[#0A1F44] rounded-lg text-xs font-bold hover:bg-[#D97706] transition-colors ml-1 shadow-xs"
            >
              <span className="text-[#0A1F44] font-bold">Search</span>
            </button>
          </form>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-5 text-xs font-semibold text-[#CBD7EA]">
            {/* Products & Categories Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className={`flex items-center gap-1 hover:text-white transition-colors py-1 ${
                  categoriesOpen ? "text-[#F59E0B]" : ""
                }`}
              >
                <span>Products &amp; Categories</span>
                <ChevronDown size={14} className={`transform transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
              </button>

              {categoriesOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-700 tracking-wider">
                    All Departments
                  </div>
                  <div className="py-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/products?department=${encodeURIComponent(cat.name)}`}
                        onClick={() => setCategoriesOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 text-xs text-slate-800 font-semibold hover:bg-[#F2F3FF] hover:text-[#0051D5] transition-colors group"
                      >
                        <span className="text-base flex-shrink-0">{cat.icon}</span>
                        <span className="text-slate-800 group-hover:text-[#0051D5] font-semibold">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 p-2.5 bg-slate-50/70">
                    <Link
                      href="/products"
                      onClick={() => setCategoriesOpen(false)}
                      className="flex items-center justify-center w-full py-2 rounded-lg bg-[#0A1F44] hover:bg-[#00081E] text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      <span className="text-white font-bold">Explore All Categories →</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/enterprises"
              className={`hover:text-white transition-colors ${location === "/enterprises" ? "text-white font-bold" : ""}`}
            >
              Enterprises
            </Link>

            <Link
              href="/services"
              className={`hover:text-white transition-colors ${location === "/services" ? "text-white font-bold" : ""}`}
            >
              Services
            </Link>

            <Link
              href="/networks"
              className={`hover:text-white transition-colors ${location === "/networks" ? "text-white font-bold" : ""}`}
            >
              Networks
            </Link>

            <Link
              href="/subscription"
              className={`hover:text-white transition-colors ${location === "/subscription" ? "text-white font-bold" : ""}`}
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
              <FileText size={14} className="text-[#F59E0B]" />
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
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#F59E0B] text-[#0A1F44] text-[11px] font-extrabold flex items-center justify-center shadow-md">
                  {totalCartUnits}
                </span>
              )}
            </button>

            {/* Auth / Account Profile */}
            {user ? (
              <Link
                href={user.role === "seller" ? "/supplier/dashboard" : user.role === "admin" ? "/admin/dashboard" : "/buyer/dashboard"}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all"
              >
                <UserIcon size={14} className="text-[#0D9488]" />
                <span className="max-w-[100px] truncate">{user.name || "Account"}</span>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-[#CBD7EA] hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#0A1F44] rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <span className="text-[#0A1F44] font-bold">Register</span>
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
          <div className="lg:hidden bg-[#0A1F44] border-t border-white/10 px-4 py-4 space-y-3 animate-in slide-in-from-top-3 duration-200">
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
                className="px-4 py-2 bg-[#F59E0B] text-[#0A1F44] rounded-lg text-xs font-bold"
              >
                Request RFQ
              </button>
              <div className="flex items-center gap-2">
                <Link href="/login" onClick={() => setIsOpen(false)} className="text-xs text-slate-200 px-3 py-1.5">
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setIsOpen(false)} className="px-3.5 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-bold">
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
