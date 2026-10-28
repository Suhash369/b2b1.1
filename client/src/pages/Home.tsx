import React, { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  Search,
  ShieldCheck,
  Package,
  Layers,
  Building,
  Store,
  FileText,
  Users,
  Compass,
  CheckCircle2,
  TrendingUp,
  Award,
  ChevronRight,
  Handshake,
  Check,
  Sparkles,
  Truck,
  CreditCard,
  Briefcase,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CartItem, Product } from "@/types";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import BulkRfqModal from "@/components/marketplace/BulkRfqModal";
import QuickViewModal from "@/components/marketplace/QuickViewModal";
import CartDrawer from "@/components/marketplace/CartDrawer";
import CheckoutModal from "@/components/marketplace/CheckoutModal";
import GstInvoiceModal from "@/components/marketplace/GstInvoiceModal";

interface HomeProps {
  cartItems?: CartItem[];
  onAddToCart?: (product: Product, quantity: number) => void;
  onUpdateCartQuantity?: (id: string, delta: number) => void;
  onRemoveCartItem?: (id: string) => void;
}

export default function Home({
  cartItems = [],
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveCartItem,
}: HomeProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [rfqTopic, setRfqTopic] = useState("General Enterprise Sourcing");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Queries
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: featuredProducts = [] } = trpc.products.list.useQuery({ sort: "relevance" });
  const { data: networkCompanies = [] } = trpc.network.listMembers.useQuery();
  const { data: subscriptionPlans = [] } = trpc.subscriptions.getPlans.useQuery();

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      setLocation(`/products?query=${encodeURIComponent(q)}`);
    } else {
      setLocation("/products");
    }
  };

  const handleOpenRfq = (topic?: string) => {
    if (topic) setRfqTopic(topic);
    setIsRfqModalOpen(true);
  };

  const handleOpenQuickView = (product: Product) => {
    setSelectedProduct(product);
  };

  return (
    <div className="min-h-screen bg-white text-[#0F172A] flex flex-col font-['Inter'] selection:bg-[#FF7A00] selection:text-white">
      {/* Global Header */}
      <SiteHeader
        cartItems={cartItems}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenRfq={handleOpenRfq}
      />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* SECTION A — HERO SECTION                                  */}
        {/* ========================================================= */}
        <section className="relative w-full bg-[#0B0F19] text-white overflow-hidden pt-20 sm:pt-24 lg:pt-28 pb-14 lg:pb-20 border-b border-white/10">
          {/* Background Industrial Logistics Video Layer */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/images/hero-logistics-poster.jpg"
              className="w-full h-full object-cover opacity-25 scale-105 motion-reduce:hidden transition-opacity duration-1000"
            >
              <source src="/videos/hero-logistics.mp4" type="video/mp4" />
              <source src="/videos/hero-logistics.webm" type="video/webm" />
            </video>
            {/* Reduced motion static fallback poster */}
            <div
              className="hidden motion-reduce:block absolute inset-0 w-full h-full bg-cover bg-center opacity-20"
              style={{ backgroundImage: "url('/images/hero-logistics-poster.jpg')" }}
            />
            {/* Cinematic BazroKart Midnight-Navy & Orange Overlay Gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19] via-[#0B0F19]/92 to-[#0B0F19]/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-[#0B0F19]/60" />
            <div className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full bg-[#FF7A00]/15 blur-3xl animate-subtle-glow" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#0D9488]/15 blur-3xl" />
          </div>

          <div className="shell grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left Hero Content */}
            <div className="lg:col-span-6 space-y-6">
              <h1 className="font-heading font-extrabold text-[clamp(2.35rem,4.8vw,4.25rem)] text-white tracking-[-0.04em] leading-[1.08] text-balance">
                Where Businesses Connect.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7A00] to-[#fdba74]">
                  Where Trade Grows.
                </span>
              </h1>

              <p className="font-body font-normal text-sm sm:text-[15px] text-slate-300 max-w-xl leading-[1.68]">
                Find products, connect with suppliers, explore business opportunities, and manage your sourcing journey through BazroKart.
              </p>

              {/* Prominent Hero Search */}
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20 focus-within:bg-white focus-within:text-slate-900 transition-all max-w-lg shadow-xl backdrop-blur-md"
              >
                <div className="pl-3 text-slate-300">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, verified suppliers, SKU, or HSN code..."
                  className="w-full bg-transparent font-body font-normal text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none px-2"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#FF7A00] hover:bg-[#EA580C] text-white rounded-lg text-xs font-heading font-semibold tracking-[-0.01em] transition-all shadow-md hover:shadow-orange-500/30 flex-shrink-0 cursor-pointer active:scale-95"
                >
                  Search
                </button>
              </form>

              {/* Primary Dual-Journey CTAs (I'm a Buyer / I'm a Seller) */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/products"
                  className="px-6 py-3 rounded-xl bg-[#FF7A00] hover:bg-[#EA580C] text-white font-heading font-semibold text-sm flex items-center gap-2 shadow-lg hover:shadow-orange-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 tracking-[-0.01em]"
                >
                  <span>I&apos;m a Buyer</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/supplier/onboarding"
                  className="px-6 py-3 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-white/10 text-white font-heading font-semibold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 tracking-[-0.01em]"
                >
                  <span>I&apos;m a Seller</span>
                  <Store size={16} />
                </Link>

                <Link
                  href="/products"
                  className="text-xs font-bold text-slate-300 hover:text-white underline underline-offset-4 flex items-center gap-1 pl-2 transition-colors"
                >
                  Explore Products →
                </Link>
              </div>
            </div>

            {/* Right Interactive 3D Scene */}
            <div className="lg:col-span-6 flex items-center justify-center relative">
              <Hero3DCanvas className="w-full max-w-lg lg:max-w-none" />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION B — MARKETPLACE INTRODUCTION                      */}
        {/* ========================================================= */}
        <section className="py-16 bg-[#F8FAFC] border-b border-slate-200">
          <div className="shell space-y-10">
            <div className="max-w-3xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A00] flex items-center gap-1.5">
                <Layers size={14} /> Comprehensive Trade Capabilities
              </span>
              <h2 className="font-heading font-bold text-[clamp(1.65rem,2.5vw,2.35rem)] text-[#0F172A] tracking-[-0.035em] leading-[1.15] text-balance">
                Built for Institutional B2B Commerce &amp; Wholesale Precision
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                BazroKart is architected to eliminate commercial friction across India&apos;s wholesale supply chain. We streamline every stage from discovery to freight clearance with verified commercial standards.
              </p>
            </div>

            {/* 6 Core Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center font-bold">
                  <Package size={20} />
                </div>
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  Product Sourcing
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Direct access to accredited industrial engineering inputs, MRO consumables, electrical components, and verified raw materials with transparent technical data sheets.
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center font-bold">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  Supplier Discovery
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Empanelled manufacturer and distributor directory featuring real verification credentials, production capacities, active GSTIN records, and location data.
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF7A00]/15 text-[#FF7A00] flex items-center justify-center font-bold">
                  <TrendingUp size={20} />
                </div>
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  Bulk Procurement
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Transparent minimum order quantities (MOQ), volume tier discounts, automated 18% GST calculation, and institutional proforma invoices.
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0F172A] flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  Business Enquiries &amp; RFQs
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Structured request-for-quotation workflows allowing purchase managers to specify commercial terms, technical tolerances, and receive binding offers.
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center font-bold">
                  <Users size={20} />
                </div>
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  Business Networking
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Direct B2B connection channels between verified enterprises, facilitating trade partnerships, consortium procurement, and regional subcontracting.
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center font-bold">
                  <Briefcase size={20} />
                </div>
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  Enterprise Services
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Specialized empanelment tracks for Startups, MSMEs, and Social Enterprises, including incubation support, government grant desk referrals, and trade credit facilitation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION C — PRODUCT CATEGORIES                            */}
        {/* ========================================================= */}
        <section className="py-16 bg-white border-b border-slate-200">
          <div className="shell space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
                  Verified Commercial Catalog
                </span>
                <h2 className="font-heading font-bold text-[clamp(1.65rem,2.5vw,2.35rem)] text-[#0F172A] tracking-[-0.035em] leading-[1.15] text-balance mt-1">
                  Product Categories &amp; Departments
                </h2>
              </div>
              <Link
                href="/products"
                className="px-4 py-2 rounded-xl bg-[#0B0F19] hover:bg-[#030712] text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <span>Explore All Categories</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Categories Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?department=${encodeURIComponent(cat.name)}`}
                  className="group p-6 bg-slate-50 hover:bg-[#FFF7ED] border border-slate-200 hover:border-[#FF7A00]/50 rounded-2xl transition-all duration-300 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-lg card-smooth-hover"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl transform group-hover:scale-115 group-hover:-translate-y-1 transition-transform duration-300 inline-block">
                        {cat.icon === "potted_plant" ? "🌱" : cat.icon === "bolt" ? "⚡" : cat.icon === "solar_power" ? "☀️" : cat.icon === "apparel" ? "👔" : cat.icon === "restaurant" ? "🌾" : "🏢"}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 group-hover:border-[#FF7A00]/30 transition-colors">
                        {cat.itemCount}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-[#0F172A] group-hover:text-[#FF7A00] transition-colors">
                      {cat.name}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-[#0F172A] group-hover:text-[#FF7A00] transition-colors">
                    <span>View Listings</span>
                    <ChevronRight size={16} className="transform group-hover:translate-x-1.5 transition-transform duration-200" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION C.2 — FEATURED WHOLESALE PRODUCTS SHOWCASE         */}
        {/* ========================================================= */}
        <section className="py-16 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="shell space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A00]">
                  Verified Production Lots
                </span>
                <h2 className="font-heading font-extrabold text-[clamp(1.65rem,2.5vw,2.35rem)] text-[#0F172A] tracking-[-0.035em] leading-[1.15] mt-1">
                  Featured B2B Wholesale Listings
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  Pan-India factory-direct listings with transparent MOQ and bulk volume matrices
                </p>
              </div>

              <Link
                href="/products"
                className="px-4 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#EA580C] active:scale-95 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <span>View Full Catalog</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {featuredProducts.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center max-w-lg mx-auto">
                <p className="text-[#64748B] text-sm font-medium">
                  No products are available yet. Please check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.slice(0, 8).map((product) => {
                  const price = typeof product.price === "string" ? parseFloat(product.price) : Number(product.price);
                  const mrp = typeof product.mrp === "string" ? parseFloat(product.mrp) : Number(product.mrp);
                  const moq = product.moq || 1;

                  return (
                    <div
                      key={product.id}
                      className="group bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#FF7A00]/50 shadow-xs hover:shadow-xl transition-all duration-300 p-4 flex flex-col justify-between card-smooth-hover card-entrance"
                    >
                      <div>
                        <div className="relative w-full h-44 bg-[#F8FAFC] rounded-xl flex items-center justify-center p-3 mb-3 overflow-hidden border border-[#E2E8F0]/60">
                          {product.badge && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0D9488]/15 text-[#0D9488] border border-[#0D9488]/30 z-10">
                              {product.badge}
                            </span>
                          )}
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            onError={(e) => {
                              e.currentTarget.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23F1F5F9'/%3E%3Cpath d='M120 90a15 15 0 1 0 0-30 15 15 0 0 0 0 30zm-30 60h120l-37-48-26 33-18-22-39 37z' fill='%2394A3B8'/%3E%3Ctext x='50%25' y='80%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%2364748B'%3EImage Not Available%3C/text%3E%3C/svg%3E";
                            }}
                            className="w-full h-full object-contain img-zoom-hover"
                            loading="lazy"
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#FF7A00] tracking-wider block">
                            {product.department}
                          </span>
                          <Link href={`/products/${product.slug}`} className="block">
                            <h4 className="font-heading font-bold text-xs text-[#0F172A] line-clamp-2 leading-snug group-hover:text-[#FF7A00] transition-colors">
                              {product.title}
                            </h4>
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                            <span>MOQ: <strong className="text-[#0F172A]">{moq}</strong></span>
                            {product.rating && typeof product.reviews === "number" && product.reviews > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-[#FF7A00] font-bold">★ {product.rating}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#E2E8F0] space-y-2">
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-extrabold text-[#0F172A] tabular-nums">
                              ₹{price.toLocaleString("en-IN")}
                            </span>
                            {mrp > price && (
                              <span className="text-[11px] text-[#64748B] line-through tabular-nums">
                                ₹{mrp.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-[#FF7A00]">
                            {mrp > price
                              ? `${Math.round(((mrp - price) / mrp) * 100)}% off`
                              : product.discount || "Wholesale"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <Link
                            href={`/products/${product.slug}`}
                            className="py-1.5 px-2 bg-[#FFF7ED] hover:bg-[#FFEDD5] active:scale-95 text-[#EA580C] rounded-lg text-[11px] font-bold text-center transition-all"
                          >
                            Details
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenRfq(`${product.title} (SKU: ${product.sku})`)}
                            className="py-1.5 px-2 bg-[#FF7A00] hover:bg-[#EA580C] active:scale-95 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs"
                          >
                            RFQ
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION D — BUYER AND SELLER JOURNEYS                     */}
        {/* ========================================================= */}
        <section className="py-16 bg-[#0B0F19] text-white border-b border-white/10 relative overflow-hidden">
          <div className="shell space-y-12 relative z-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
                Two Distinct Procurement Pathways
              </span>
              <h2 className="font-heading font-bold text-[clamp(1.65rem,2.5vw,2.35rem)] text-white tracking-[-0.035em] leading-[1.15] text-balance">
                Designed Around the Way Businesses Actually Trade
              </h2>
            </div>

            {/* Asymmetric Dual Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Buyer Pathway Panel */}
              <div className="group p-8 rounded-2xl bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-[#FF7A00]/40 space-y-6 relative overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-xl card-smooth-hover">
                {/* Ambient glow & lightweight animated illustration */}
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#FF7A00]/10 blur-3xl pointer-events-none animate-subtle-glow" />
                <div className="absolute top-6 right-6 opacity-20 pointer-events-none animate-slow-float hidden sm:block">
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="30" width="80" height="60" rx="12" stroke="#FF7A00" strokeWidth="2.5" strokeDasharray="4 4"/>
                    <path d="M40 50H80M40 65H70M40 80H55" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="85" cy="75" r="16" fill="#FF7A00" fillOpacity="0.2" stroke="#FF7A00" strokeWidth="2"/>
                    <path d="M80 75L84 79L92 71" stroke="#FF7A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="text-[#FF7A00] text-xs font-bold uppercase tracking-wider">
                    01 / For Business Buyers
                  </div>
                  <h3 className="font-heading font-extrabold text-2xl text-white">
                    Procure with Commercial Clarity &amp; Direct Terms
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Designed for purchase managers, contractors, and retail chains who need transparent pricing without endless phone calls or unvetted brokers.
                  </p>

                  <ul className="space-y-2.5 text-xs text-slate-200 pt-2">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-[#0D9488] flex-shrink-0" />
                      <span>Instant MOQ &amp; volume-discount tier inspection</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-[#0D9488] flex-shrink-0" />
                      <span>Formal Request-for-Quotation (RFQ) desk with comparable offers</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-[#0D9488] flex-shrink-0" />
                      <span>GST-compliant Proforma generation with input tax credit</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-[#0D9488] flex-shrink-0" />
                      <span>Freight tracking from Chennai Casagrand Hub to destination</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
                  <Link
                    href="/products"
                    className="px-6 py-3 rounded-xl bg-[#FF7A00] hover:bg-[#EA580C] active:scale-95 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all group"
                  >
                    <span>Explore Products</span>
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleOpenRfq()}
                    className="text-xs font-bold text-slate-300 hover:text-[#FF7A00] active:scale-95 transition-all underline underline-offset-4"
                  >
                    Submit an RFQ →
                  </button>
                </div>
              </div>

              {/* Seller Pathway Panel */}
              <div className="group p-8 rounded-2xl bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-[#0D9488]/40 space-y-6 relative overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-xl card-smooth-hover">
                {/* Ambient glow & lightweight animated illustration */}
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#0D9488]/15 blur-3xl pointer-events-none animate-subtle-glow" />
                <div className="absolute top-6 right-6 opacity-20 pointer-events-none animate-slow-float hidden sm:block" style={{ animationDelay: "-3.5s" }}>
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M25 90V45L55 60V90H25Z" stroke="#0D9488" strokeWidth="2" fill="#0D9488" fillOpacity="0.1"/>
                    <path d="M55 90V45L85 60V90H55Z" stroke="#0D9488" strokeWidth="2" fill="#0D9488" fillOpacity="0.15"/>
                    <path d="M85 90V35L105 45V90H85Z" stroke="#0D9488" strokeWidth="2" fill="#0D9488" fillOpacity="0.2"/>
                    <line x1="20" y1="90" x2="110" y2="90" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="40" cy="30" r="8" stroke="#5eead4" strokeWidth="2" strokeDasharray="2 2"/>
                    <circle cx="70" cy="22" r="12" stroke="#5eead4" strokeWidth="2" strokeDasharray="3 3"/>
                  </svg>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="text-[#5eead4] text-xs font-bold uppercase tracking-wider">
                    02 / For Manufacturers &amp; Suppliers
                  </div>
                  <h3 className="font-heading font-extrabold text-2xl text-white">
                    Scale National Reach &amp; Secure Purchase Orders
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Designed for OEM factories, certified MSMEs, and authorized distributors looking to receive high-intent inquiries from verified institutional buyers.
                  </p>

                  <ul className="space-y-2.5 text-xs text-slate-200 pt-2">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-[#FF7A00] flex-shrink-0" />
                      <span>Verified Supplier Accreditation &amp; Catalogue Showcase</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-[#FF7A00] flex-shrink-0" />
                      <span>Direct RFQ inbox with target pricing and delivery timelines</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-[#FF7A00] flex-shrink-0" />
                      <span>Configurable quantity-based wholesale matrices &amp; lead times</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-[#FF7A00] flex-shrink-0" />
                      <span>Empanelment opportunities across corporate buyer networks</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
                  <Link
                    href="/supplier/onboarding"
                    className="px-6 py-3 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-white/10 active:scale-95 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all group"
                  >
                    <span>Start Selling</span>
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/subscription"
                    className="text-xs font-bold text-slate-300 hover:text-white active:scale-95 transition-all underline underline-offset-4"
                  >
                    View Seller Plans →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION E — ENTERPRISES                                   */}
        {/* ========================================================= */}
        <section className="py-16 bg-white border-b border-slate-200" id="enterprises">
          <div className="shell space-y-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div className="max-w-2xl space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A00]">
                  Empanelment &amp; Growth Programs
                </span>
                <h2 className="font-heading font-bold text-[clamp(1.65rem,2.5vw,2.35rem)] text-[#0F172A] tracking-[-0.035em] leading-[1.15] text-balance">
                  Enterprises &amp; Institutional Ecosystem
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  BazroKart partners with enterprises across India to provide dedicated empanelment support, vendor verification, and wholesale procurement access.
                </p>
              </div>

              <Link
                href="/enterprises"
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-[#0F172A] text-[#0F172A] text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <span>View Enterprise Desk</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Enterprise Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-[#F8FAFC] border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF7A00] block">
                    Innovation Track
                  </span>
                  <h3 className="font-heading font-bold text-base text-[#0F172A]">
                    Startups
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Rapid vendor onboarding, small-batch sample fulfillment, and agile supplier agreements for hardware &amp; D2C founders.
                  </p>
                </div>
                <Link href="/enterprises" className="text-xs font-bold text-[#FF7A00] hover:underline pt-2">
                  Learn about Startup Desk →
                </Link>
              </div>

              <div className="p-6 bg-[#F8FAFC] border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488] block">
                    Make in India
                  </span>
                  <h3 className="font-heading font-bold text-base text-[#0F172A]">
                    MSMEs
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Connecting manufacturing units with wholesale buyers across India with guaranteed GST-compliant billing and logistics.
                  </p>
                </div>
                <Link href="/enterprises" className="text-xs font-bold text-[#FF7A00] hover:underline pt-2">
                  Learn about MSME Desk →
                </Link>
              </div>

              <div className="p-6 bg-[#F8FAFC] border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF7A00] block">
                    Impact Sourcing
                  </span>
                  <h3 className="font-heading font-bold text-base text-[#0F172A]">
                    Social Enterprises
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Dedicated channels for rural cooperatives, agricultural self-help groups, and sustainable manufacturing networks.
                  </p>
                </div>
                <Link href="/enterprises" className="text-xs font-bold text-[#FF7A00] hover:underline pt-2">
                  Learn about Impact Desk →
                </Link>
              </div>

              <div className="p-6 bg-[#F8FAFC] border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A] block">
                    Tech &amp; Hardware
                  </span>
                  <h3 className="font-heading font-bold text-base text-[#0F172A]">
                    Innovative Businesses
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Advanced component sourcing for solar energy systems, IoT embedded hardware, and specialized industrial automation.
                  </p>
                </div>
                <Link href="/enterprises" className="text-xs font-bold text-[#FF7A00] hover:underline pt-2">
                  Learn about Tech Desk →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION F — SERVICES                                      */}
        {/* ========================================================= */}
        <section className="py-16 bg-[#F8FAFC] border-b border-slate-200" id="services">
          <div className="shell space-y-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div className="max-w-2xl space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
                  Value-Added Solutions
                </span>
                <h2 className="font-heading font-bold text-[clamp(1.65rem,2.5vw,2.35rem)] text-[#0F172A] tracking-[-0.035em] leading-[1.15] text-balance">
                  Business Services &amp; Trade Enablement
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Beyond product discovery, BazroKart provides actionable business services to help suppliers and buyers navigate funding, compliance, and matchmaking.
                </p>
              </div>

              <Link
                href="/services"
                className="px-4 py-2 rounded-xl bg-[#0B0F19] text-white text-xs font-bold flex items-center gap-2 hover:bg-[#030712] transition-colors"
              >
                <span>Explore All Services</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* 8 Configured Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "B2B Connect", desc: "Direct matchmaking with verified suppliers for custom requirements." },
                { name: "Grants & Funding Info", desc: "Curated registry of central/state MSME schemes and subsidized credit." },
                { name: "Education & Training", desc: "Procurement webinars on GST compliance, HSN rules, and sourcing." },
                { name: "Incubation Support", desc: "Operational guidance for new manufacturing and retail ventures." },
                { name: "Investor Connect", desc: "Showcases connecting high-growth supply enterprises with trade capital." },
                { name: "Marketing & Branding", desc: "Featured catalog placement and direct reach to corporate buyers." },
                { name: "Mentoring", desc: "Advisory sessions with supply chain veterans in logistics and contracts." },
                { name: "Networking Circles", desc: "Industry-specific meetups fostering partnerships and consortium bidding." },
              ].map((svc, i) => (
                <div
                  key={i}
                  className="p-5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#0F172A]">
                    {svc.name}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {svc.desc}
                  </p>
                  <Link href="/services" className="text-xs font-semibold text-[#FF7A00] hover:underline block pt-1">
                    Enquire Now →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION G — BUSINESS NETWORKS                             */}
        {/* ========================================================= */}
        <section className="py-16 bg-white border-b border-slate-200" id="networks">
          <div className="shell space-y-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div className="max-w-2xl space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A00]">
                  Trade Partnerships &amp; Directory
                </span>
                <h2 className="font-heading font-bold text-[clamp(1.65rem,2.5vw,2.35rem)] text-[#0F172A] tracking-[-0.035em] leading-[1.15] text-balance">
                  Business Networks &amp; Verified Companies
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Discover genuine corporate buyers, manufacturers, and trade partners across India with verified GSTIN credentials and active procurement briefs.
                </p>
              </div>

              <Link
                href="/networks"
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-[#0F172A] text-[#0F172A] text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <span>Open Network Directory</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Network Companies List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {networkCompanies.map((comp) => (
                <div
                  key={comp.id}
                  className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 hover:border-[#FF7A00]/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-base text-[#0F172A]">
                        {comp.name}
                      </h4>
                      <span className="text-xs text-slate-500 block mt-0.5">{comp.category}</span>
                    </div>
                    {comp.isVerified && (
                      <span className="px-2 py-0.5 bg-[#0D9488]/10 text-[#0D9488] text-[10px] font-bold rounded-full flex items-center gap-1">
                        <Check size={12} /> Verified
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                    <div><strong>Location:</strong> {comp.city}</div>
                    <div><strong>GSTIN:</strong> <span className="font-mono">{comp.gstin}</span></div>
                    <div><strong>Active Requirements:</strong> <span className="text-slate-800">{comp.activeRequirements}</span></div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <Link
                      href="/networks"
                      className="px-4 py-2 bg-[#0B0F19] hover:bg-[#030712] text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Connect with Entity
                    </Link>
                    <span className="text-xs text-slate-500 font-semibold">Rating: ★ {comp.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION H — HOW IT WORKS                                  */}
        {/* ========================================================= */}
        <section className="py-16 bg-[#F8FAFC] border-b border-slate-200">
          <div className="shell space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A00]">
                Step-by-Step Workflow
              </span>
              <h2 className="font-heading font-bold text-[clamp(1.65rem,2.5vw,2.35rem)] text-[#0F172A] tracking-[-0.035em] leading-[1.15] text-balance">
                How Procurement Works on BazroKart
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                From requirement brief to pan-India freight delivery, our four-stage protocol ensures commercial accountability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3 relative">
                <span className="text-2xl font-extrabold font-heading text-[#FF7A00]">
                  01
                </span>
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  Register &amp; Profile Setup
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Create a verified buyer or seller account with registered GSTIN and corporate address.
                </p>
              </div>

              <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3 relative">
                <span className="text-2xl font-extrabold font-heading text-[#FF7A00]">
                  02
                </span>
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  Discover or Submit RFQ
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Browse published catalog lots with MOQs or submit a custom specification brief to verified suppliers.
                </p>
              </div>

              <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3 relative">
                <span className="text-2xl font-extrabold font-heading text-[#0D9488]">
                  03
                </span>
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  Compare &amp; Negotiate
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Review binding quotations, verify delivery schedules, and lock volume pricing with the supplier.
                </p>
              </div>

              <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3 relative">
                <span className="text-2xl font-extrabold font-heading text-[#0F172A]">
                  04
                </span>
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  Order, Freight &amp; ITC
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Confirm purchase order with GST Proforma invoice, dispatched via dedicated pan-India logistics.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION I — SUBSCRIPTION PLANS                            */}
        {/* ========================================================= */}
        <section className="py-16 bg-white border-b border-slate-200" id="subscription">
          <div className="shell space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
                Transparent Membership Tiers
              </span>
              <h2 className="font-heading font-bold text-[clamp(1.65rem,2.5vw,2.35rem)] text-[#0F172A] tracking-[-0.035em] leading-[1.15] text-balance">
                Subscription Plans for Growing Businesses
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Preserving BazroKart&apos;s actual Basic, Premium, and Elite tiers with verified pricing, listing quotas, and enterprise benefits.
              </p>
            </div>

            {/* 3 Subscription Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-8 flex flex-col justify-between border relative transition-all duration-200 ${
                    plan.recommended
                      ? "bg-[#0B0F19] text-white border-[#FF7A00] shadow-2xl scale-105 z-10"
                      : "bg-[#F8FAFC] text-slate-900 border-slate-200 shadow-sm"
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-[#FF7A00] text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                      Most Popular for MSMEs
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className={`font-heading font-extrabold text-xl ${plan.recommended ? "text-white" : "text-[#0F172A]"}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-xs ${plan.recommended ? "text-slate-300" : "text-slate-600"} leading-relaxed`}>
                        {plan.description}
                      </p>
                    </div>

                    <div className="pt-2 flex items-baseline gap-1">
                      <span className={`text-3xl font-extrabold font-heading ${plan.recommended ? "text-white" : "text-[#0F172A]"}`}>
                        ₹{plan.price.toLocaleString("en-IN")}
                      </span>
                      <span className={`text-xs ${plan.recommended ? "text-slate-400" : "text-slate-500"}`}>
                        /{plan.billingInterval}
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl border text-xs space-y-1 ${plan.recommended ? "bg-white/10 border-white/20 text-slate-200" : "bg-white border-slate-200 text-slate-700"}`}>
                      <div><strong>Listing Quota:</strong> {plan.listingLimit} Active Products</div>
                      <div><strong>RFQ Processing:</strong> {plan.rfqLimit}</div>
                      <div><strong>Trade Commission:</strong> {plan.commissionRate}</div>
                    </div>

                    <ul className={`space-y-2.5 text-xs pt-2 ${plan.recommended ? "text-slate-200" : "text-slate-600"}`}>
                      {plan.features.map((feat: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check size={14} className={plan.recommended ? "text-[#FF7A00] flex-shrink-0 mt-0.5" : "text-[#0D9488] flex-shrink-0 mt-0.5"} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <Link
                      href={`/subscription?plan=${plan.id}`}
                      className={`block w-full py-3 rounded-xl text-center text-xs font-bold transition-all shadow-md ${
                        plan.recommended
                          ? "bg-[#FF7A00] hover:bg-[#EA580C] text-white"
                          : "bg-[#0B0F19] hover:bg-[#030712] text-white"
                      }`}
                    >
                      {plan.ctaText}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION J — CLOSING CTA                                   */}
        {/* ========================================================= */}
        <section className="py-20 bg-[#0B0F19] text-white border-b border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19] via-[#0B0F19]/90 to-[#030712] pointer-events-none" />
          <div className="shell relative z-10 text-center max-w-3xl mx-auto space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A00]">
              Ready to Accelerate Trade?
            </span>

            <h2 className="font-heading font-bold text-[clamp(1.85rem,3.2vw,2.75rem)] text-white tracking-[-0.035em] leading-[1.15] text-balance">
              Find Your Next Business Opportunity.
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Whether you need reliable suppliers or want to introduce your products to more businesses, start with the right connection.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/products"
                className="px-8 py-3.5 rounded-xl bg-[#FF7A00] hover:bg-[#EA580C] text-white font-heading font-bold text-sm shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <span>I&apos;m a Buyer</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/supplier/onboarding"
                className="px-8 py-3.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-white/10 text-white font-heading font-bold text-sm shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <span>I&apos;m a Seller</span>
                <Store size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Global Modals */}
      <BulkRfqModal
        isOpen={isRfqModalOpen}
        onClose={() => setIsRfqModalOpen(false)}
        defaultTopic={rfqTopic}
      />

      <QuickViewModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(prod, qty) => onAddToCart && onAddToCart(prod, qty)}
        onOpenRfq={(topic) => handleOpenRfq(topic)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={(id, delta) => onUpdateCartQuantity && onUpdateCartQuantity(id, delta)}
        onRemoveItem={(id) => onRemoveCartItem && onRemoveCartItem(id)}
        onProceedCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onOpenGstInvoice={() => {
          setIsCartOpen(false);
          setIsInvoiceOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onOrderSuccess={(orderNum) => {
          setIsCheckoutOpen(false);
          setIsInvoiceOpen(true);
        }}
        onOpenGstInvoice={() => setIsInvoiceOpen(true)}
      />

      <GstInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        cartItems={cartItems}
      />

      {/* Global Footer */}
      <SiteFooter />
    </div>
  );
}
