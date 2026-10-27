import React, { FormEvent, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  Filter,
  ArrowUpDown,
  ShoppingCart,
  Eye,
  FileText,
  ShieldCheck,
  Star,
  CheckCircle2,
  ChevronRight,
  PackageSearch,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CartItem, Product } from "@/types";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import BulkRfqModal from "@/components/marketplace/BulkRfqModal";
import QuickViewModal from "@/components/marketplace/QuickViewModal";
import CartDrawer from "@/components/marketplace/CartDrawer";
import CheckoutModal from "@/components/marketplace/CheckoutModal";
import GstInvoiceModal from "@/components/marketplace/GstInvoiceModal";

interface CatalogProps {
  cartItems?: CartItem[];
  onAddToCart?: (product: Product, quantity: number) => void;
  onUpdateCartQuantity?: (id: string, delta: number) => void;
  onRemoveCartItem?: (id: string) => void;
}

export default function Catalog({
  cartItems = [],
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveCartItem,
}: CatalogProps) {
  const [location, setLocation] = useLocation();

  // Read URL search query or department
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const initialDept = searchParams.get("department") || "All Products";
  const initialQuery = searchParams.get("query") || "";

  const [activeDepartment, setActiveDepartment] = useState(initialDept);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortOption, setSortOption] = useState<"relevance" | "price_asc" | "price_desc" | "rating" | "newest">("relevance");
  const [inStockOnly, setInStockOnly] = useState(false);

  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [rfqTopic, setRfqTopic] = useState("Wholesale Procurement Lot");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Sync state when URL params change
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const dept = params.get("department");
    const q = params.get("query");
    if (dept) setActiveDepartment(dept);
    if (q !== null) setSearchQuery(q);
  }, [location]);

  // Fetch products
  const { data: products = [], isLoading } = trpc.products.list.useQuery({
    department: activeDepartment === "All Products" ? undefined : activeDepartment,
    query: searchQuery || undefined,
    sort: sortOption,
    inStockOnly,
  });

  const departments = [
    "All Products",
    "Agriculture & Farming",
    "Electrical & Electronics",
    "Renewable Energy & Solar",
    "Apparels & Fashion",
    "Food & Beverages",
  ];

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      setLocation(`/products?query=${encodeURIComponent(q)}&department=${encodeURIComponent(activeDepartment)}`);
    } else {
      setLocation(`/products?department=${encodeURIComponent(activeDepartment)}`);
    }
  };

  const handleSelectDepartment = (dept: string) => {
    setActiveDepartment(dept);
    setLocation(`/products?department=${encodeURIComponent(dept)}${searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : ""}`);
  };

  const handleOpenRfq = (topic?: string) => {
    if (topic) setRfqTopic(topic);
    setIsRfqModalOpen(true);
  };

  const handleOpenQuickView = (product: Product) => {
    setSelectedProduct(product);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#0F172A] flex flex-col font-['Inter']">
      <SiteHeader
        cartItems={cartItems}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenRfq={handleOpenRfq}
      />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        {/* Catalog Hero Banner */}
        <div className="w-full bg-[#0A1F44] text-white py-10 border-b border-white/10">
          <div className="shell flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#87A9E9] uppercase font-bold tracking-wider mb-1">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span>/</span>
                <span>Wholesale Catalog</span>
                {activeDepartment !== "All Products" && (
                  <>
                    <span>/</span>
                    <span className="text-white">{activeDepartment}</span>
                  </>
                )}
              </div>
              <h1 className="font-heading font-extrabold text-[clamp(1.85rem,3.2vw,2.5rem)] text-white tracking-[-0.035em] leading-[1.15] text-balance">
                Industrial &amp; Commercial Product Catalog
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Verified wholesale lots with minimum order quantities, OEM specifications, and GST input tax credit guarantee.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenRfq(`Bulk RFQ for ${activeDepartment}`)}
              className="px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#0A1F44] rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <FileText size={15} /> Request Department RFQ
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
          <div className="shell py-3">
            {/* Department Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {departments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => handleSelectDepartment(dept)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeDepartment === dept
                      ? "bg-[#0A1F44] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <form onSubmit={handleSearchSubmit} className="w-full sm:max-w-md flex items-center bg-slate-100 rounded-xl px-3 py-1.5 text-xs text-slate-800 border border-slate-200 focus-within:bg-white focus-within:border-[#2563EB]">
                <Search size={15} className="text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by keyword, SKU, or specification..."
                  className="w-full bg-transparent focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setLocation(`/products?department=${encodeURIComponent(activeDepartment)}`);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase ml-1"
                  >
                    Clear
                  </button>
                )}
              </form>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded text-[#2563EB]"
                  />
                  <span>In Stock Only</span>
                </label>

                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                  <span className="text-slate-500">Sort:</span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="shell pt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 animate-pulse">
                  <div className="w-full h-44 bg-slate-200 rounded-xl" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-6 bg-slate-200 rounded w-1/3 pt-2" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;
                const mrp = typeof product.mrp === "string" ? parseFloat(product.mrp) : product.mrp;
                const moq = product.moq || 1;

                return (
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl border border-slate-200 hover:border-[#2563EB]/40 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden"
                  >
                    {/* Image Area */}
                    <div className="relative w-full h-48 bg-slate-50 p-4 flex items-center justify-center overflow-hidden border-b border-slate-100">
                      {product.badge && (
                        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0D9488]/15 text-[#0D9488] z-10 border border-[#0D9488]/30">
                          {product.badge}
                        </span>
                      )}

                      <img
                        src={product.imageUrl}
                        alt={product.imageAlt || product.title}
                        className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Quick View Hover Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenQuickView(product as any)}
                        className="absolute inset-0 bg-[#0A1F44]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-xs"
                      >
                        <Eye size={16} /> Quick View
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-body font-medium text-[#2563EB] tracking-wider block">
                          {product.department}
                        </span>

                        <h3 className="font-body font-semibold text-sm sm:text-[15px] text-[#0A1F44] line-clamp-2 leading-snug group-hover:text-[#2563EB] transition-colors tracking-[-0.015em]">
                          {product.title}
                        </h3>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-mono text-slate-600">SKU: {product.sku}</span>
                          <span>•</span>
                          <span className="text-amber-500 font-body font-semibold">★ {product.rating || "4.8"}</span>
                        </div>
                      </div>

                      {/* Pricing Matrix & MOQ */}
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-body font-semibold text-[#0A1F44] tabular-nums tracking-[-0.015em]">
                              ₹{price.toLocaleString("en-IN")}
                            </span>
                            {mrp > price && (
                              <span className="text-[11px] text-slate-400 line-through tabular-nums font-body font-normal">
                                ₹{mrp.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-body font-medium text-[#F59E0B] tracking-wide">
                            {product.discount || "Wholesale"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>MOQ: <strong className="text-slate-800">{moq} Units</strong></span>
                          <span className="text-[#0D9488] font-semibold">{product.leadTime || "24h Dispatch"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer Buttons */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onAddToCart && onAddToCart(product as any, moq)}
                        className="py-2 px-2.5 rounded-lg bg-[#0A1F44] hover:bg-[#00081E] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <ShoppingCart size={13} className="text-white" />
                        <span className="text-white font-bold">Add {moq}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRfq(`${product.title} (SKU: ${product.sku})`)}
                        className="py-2 px-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#0A1F44] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <FileText size={13} className="text-[#0A1F44]" />
                        <span className="text-[#0A1F44] font-bold">RFQ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4 bg-white rounded-2xl border border-slate-200 p-8 max-w-lg mx-auto">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <PackageSearch size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-lg text-slate-800">
                  No listings found for this filter
                </h3>
                <p className="text-xs text-slate-500">
                  Try clearing search filters or request a custom quotation directly from authorized manufacturers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveDepartment("All Products");
                  setLocation("/products");
                }}
                className="px-5 py-2.5 bg-[#0A1F44] text-white rounded-xl text-xs font-bold"
              >
                Reset Catalog Filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
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
        onOrderSuccess={() => {
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

      <SiteFooter />
    </div>
  );
}
