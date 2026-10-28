import React, { useState } from "react";
import { Link, useParams } from "wouter";
import {
  ShieldCheck,
  Truck,
  ShoppingCart,
  FileText,
  Star,
  CheckCircle2,
  Building,
  ArrowLeft,
  ChevronRight,
  Package,
  Layers,
  PhoneCall,
  Clock,
  BadgeCheck,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CartItem, Product } from "@/types";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import BulkRfqModal from "@/components/marketplace/BulkRfqModal";
import CartDrawer from "@/components/marketplace/CartDrawer";
import CheckoutModal from "@/components/marketplace/CheckoutModal";
import GstInvoiceModal from "@/components/marketplace/GstInvoiceModal";
import { toast } from "sonner";

interface ProductDetailProps {
  cartItems?: CartItem[];
  onAddToCart?: (product: Product, quantity: number) => void;
  onUpdateCartQuantity?: (id: string, delta: number) => void;
  onRemoveCartItem?: (id: string) => void;
}

export default function ProductDetail({
  cartItems = [],
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveCartItem,
}: ProductDetailProps) {
  const { slug } = useParams<{ slug: string }>();

  const [quantity, setQuantity] = useState<number>(1);
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Fetch product by slug
  const { data: product, isLoading } = trpc.products.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: Boolean(slug) }
  );

  // Fetch related products from same department
  const { data: relatedProducts = [] } = trpc.products.list.useQuery(
    { department: product?.department },
    { enabled: Boolean(product?.department) }
  );

  // Initialize quantity to MOQ when product loads
  React.useEffect(() => {
    if (product?.moq) {
      setQuantity(product.moq);
    }
  }, [product?.moq]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-['Inter']">
        <SiteHeader cartItems={cartItems} onOpenCart={() => setIsCartOpen(true)} />
        <main className="flex-1 pt-32 pb-20 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#FF7A00] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#64748B] font-semibold">Loading wholesale product details...</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-['Inter']">
        <SiteHeader cartItems={cartItems} onOpenCart={() => setIsCartOpen(true)} />
        <main className="flex-1 pt-32 pb-20 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 text-center space-y-4">
            <Package size={40} className="mx-auto text-[#64748B]" />
            <h1 className="font-heading font-extrabold text-xl text-[#0F172A]">Listing Not Found</h1>
            <p className="text-xs text-[#64748B]">
              The product SKU or slug &ldquo;{slug}&rdquo; is not published in the active catalog.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#EA580C] text-white text-xs font-bold transition-colors"
              >
                <ArrowLeft size={14} /> Back to Catalog
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const numPrice = typeof product.price === "string" ? parseFloat(product.price) : Number(product.price);
  const numMrp = typeof product.mrp === "string" ? parseFloat(product.mrp) : Number(product.mrp);
  const moq = product.moq || 1;
  const totalPrice = numPrice * quantity;
  const savings = numMrp > numPrice ? (numMrp - numPrice) * quantity : 0;

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => (q > moq ? q - 1 : q));

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product as any, quantity);
      toast.success(`Added ${quantity} units of ${product.title} to your procurement cart!`);
      setIsCartOpen(true);
    }
  };

  const handleOpenRfq = () => {
    setIsRfqModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-['Inter']">
      <SiteHeader
        cartItems={cartItems}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenRfq={() => setIsRfqModalOpen(true)}
      />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        {/* Breadcrumb Navigation */}
        <div className="w-full bg-white border-b border-[#E2E8F0] py-3 text-xs text-[#64748B]">
          <div className="shell flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-[#FF7A00] transition-colors">
              Home
            </Link>
            <ChevronRight size={12} />
            <Link href="/products" className="hover:text-[#FF7A00] transition-colors">
              Products
            </Link>
            <ChevronRight size={12} />
            <Link
              href={`/products?department=${encodeURIComponent(product.department)}`}
              className="hover:text-[#FF7A00] transition-colors font-medium text-[#FF7A00]"
            >
              {product.department}
            </Link>
            <ChevronRight size={12} />
            <span className="text-[#0F172A] font-semibold truncate max-w-xs">{product.title}</span>
          </div>
        </div>

        {/* Unpublished / Draft Preview Notice */}
        {!product.isPublished && (
          <div className="shell pt-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-amber-100 border border-amber-300 rounded-lg text-amber-800 font-bold text-xs uppercase tracking-wider">
                  Draft / Unpublished
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-amber-900">
                    Listing Preview Mode
                  </p>
                  <p className="text-[11px] text-amber-700">
                    This product is currently unlisted from the public catalog. You are previewing how it appears to buyers.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/supplier"
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
                >
                  Manage in Workspace
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main Product Showcase Grid */}
        <div className="shell py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Product Visuals */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 relative flex items-center justify-center overflow-hidden min-h-[380px]">
                {product.badge && (
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-[#0D9488]/15 text-[#0D9488] border border-[#0D9488]/30 z-10">
                    {product.badge}
                  </span>
                )}
                <span className="absolute top-4 right-4 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-slate-100 text-[#0F172A] border border-[#E2E8F0]">
                  SKU: {product.sku}
                </span>

                <img
                  src={product.imageUrl}
                  alt={product.imageAlt || product.title}
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23F1F5F9'/%3E%3Cpath d='M160 130a20 20 0 1 0 0-40 20 20 0 0 0 0 40zm-40 80h160l-50-65-35 45-25-30-50 50z' fill='%2394A3B8'/%3E%3Ctext x='50%25' y='80%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2364748B'%3EImage Not Available%3C/text%3E%3C/svg%3E";
                  }}
                  className="w-full max-h-[320px] object-contain transform hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Verified Quality & Logistics Guarantees */}
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-[#0F172A]">
                <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] space-y-1">
                  <ShieldCheck size={18} className="mx-auto text-[#0D9488]" />
                  <span>GST Certified</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] space-y-1">
                  <Truck size={18} className="mx-auto text-[#FF7A00]" />
                  <span>{product.leadTime || "24-48h Dispatch"}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] space-y-1">
                  <BadgeCheck size={18} className="mx-auto text-[#FF7A00]" />
                  <span>Factory Direct</span>
                </div>
              </div>
            </div>

            {/* Middle Column: Commercial & Technical Details */}
            <div className="lg:col-span-4 space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A00]">
                  {product.department}
                </span>
                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A] tracking-tight mt-1 leading-snug">
                  {product.title}
                </h1>

                <div className="flex items-center gap-3 text-xs mt-2 text-[#64748B]">
                  {product.rating && typeof product.reviews === "number" && product.reviews > 0 && (
                    <>
                      <span className="flex items-center gap-1 text-[#FF7A00] font-bold">
                        <Star size={14} className="fill-[#FF7A00]" /> {product.rating}
                      </span>
                      <span>•</span>
                    </>
                  )}
                  {typeof product.reviews === "number" && product.reviews > 0 && (
                    <>
                      <span>{product.reviews} Verified Orders</span>
                      <span>•</span>
                    </>
                  )}
                  <span className="font-mono">SKU: {product.sku}</span>
                  {product.hsnCode && (
                    <>
                      <span>•</span>
                      <span className="font-mono">HSN: {product.hsnCode}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Wholesale Pricing Box */}
              <div className="p-5 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-[#64748B] block font-medium">B2B Wholesale Price</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-extrabold text-[#0F172A] tracking-tight tabular-nums">
                        ₹{numPrice.toLocaleString("en-IN")}
                      </span>
                      {numMrp > numPrice && (
                        <span className="text-sm text-[#64748B] line-through tabular-nums">
                          ₹{numMrp.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FF7A00]/15 text-[#FF7A00] border border-[#FF7A00]/30">
                    {numMrp > numPrice
                      ? `${Math.round(((numMrp - numPrice) / numMrp) * 100)}% off`
                      : product.discount || "Wholesale Tier"}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
                  <span>Minimum Order Quantity (MOQ):</span>
                  <strong className="text-[#0F172A] font-bold">{moq} Units</strong>
                </div>

                <div className="text-[11px] text-[#0D9488] bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={14} />
                  <span>Prices exclude GST. Official Tax Invoice issued upon checkout.</span>
                </div>
              </div>

              {/* Specifications Matrix */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 space-y-3">
                <h3 className="font-heading font-bold text-sm text-[#0F172A]">
                  Technical &amp; Trade Specifications
                </h3>
                <div className="divide-y divide-[#E2E8F0] text-xs">
                  <div className="py-2 flex justify-between">
                    <span className="text-[#64748B]">Dispatch Origin</span>
                    <span className="font-semibold text-[#172033]">{product.origin || "Chennai Hub"}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-[#64748B]">Lead Time</span>
                    <span className="font-semibold text-[#0D9488]">{product.leadTime || "24-48 Hours"}</span>
                  </div>
                  {product.hsnCode && (
                    <div className="py-2 flex justify-between">
                      <span className="text-[#64748B]">HSN Code</span>
                      <span className="font-mono font-semibold text-[#172033]">{product.hsnCode}</span>
                    </div>
                  )}
                  {product.specs &&
                    Object.entries(product.specs).map(([key, val]) => (
                      <div key={key} className="py-2 flex justify-between capitalize">
                        <span className="text-[#64748B]">{key}</span>
                        <span className="font-semibold text-[#172033] text-right">{val}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right Column: Procurement Action Card */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-5 sticky top-28">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">
                    Order Quantity
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-[#E2E8F0] rounded-xl overflow-hidden bg-slate-50">
                      <button
                        type="button"
                        onClick={handleDecrement}
                        disabled={quantity <= moq}
                        className="px-3 py-2 text-sm font-bold text-[#0F172A] hover:bg-slate-100 disabled:opacity-40 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={moq}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(moq, Number(e.target.value) || moq))}
                        className="w-16 text-center font-bold text-xs bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleIncrement}
                        className="px-3 py-2 text-sm font-bold text-[#0F172A] hover:bg-slate-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-[#64748B]">Units (MOQ: {moq})</span>
                  </div>
                </div>

                {/* Subtotal Calculation */}
                <div className="p-3 bg-slate-50 rounded-xl border border-[#E2E8F0] space-y-1 text-xs">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Lot Value ({quantity} pcs):</span>
                    <span className="font-bold text-[#0F172A] tabular-nums">
                      ₹{totalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-[#0D9488] font-semibold">
                      <span>Commercial Savings:</span>
                      <span className="tabular-nums">₹{savings.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>

                {/* Primary CTA Buttons */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleOpenRfq}
                    className="w-full py-3 px-4 bg-[#FF7A00] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <FileText size={16} /> Request Custom RFQ
                  </button>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full py-3 px-4 bg-[#1E293B] hover:bg-[#0F172A] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={16} /> Add {quantity} to Cart
                  </button>
                </div>

                {/* Verified Supplier Information Snippet */}
                <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">
                    Fulfilled by Empaneled Supplier
                  </span>
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#FF7A00] flex items-center justify-center flex-shrink-0 font-bold">
                      <Building size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">
                        {(product as any).supplier?.companyName || (product as any).supplier?.name || product.supplierName || "Empaneled Supplier"}
                      </h4>
                      <p className="text-[11px] text-[#64748B]">
                        {(product as any).supplier?.city ? `${(product as any).supplier.city}, ${(product as any).supplier.state}` : (product.origin || "Chennai Hub")}
                      </p>
                      {(product as any).supplier?.gstNumber && (
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                          GSTIN: {(product as any).supplier.gstNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/suppliers`}
                    className="text-[11px] text-[#FF7A00] font-bold hover:underline flex items-center gap-1 pt-1"
                  >
                    <span>View Supplier Profile &amp; Audit Badges</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 1 && (
            <div className="mt-16 space-y-6">
              <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-extrabold text-xl text-[#0F172A]">
                    Similar Wholesale Lots in {product.department}
                  </h3>
                  <p className="text-xs text-[#64748B]">Alternative OEM specifications and procurement packs</p>
                </div>
                <Link
                  href={`/products?department=${encodeURIComponent(product.department)}`}
                  className="text-xs font-bold text-[#FF7A00] hover:underline"
                >
                  View All ({relatedProducts.length}) →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {relatedProducts
                  .filter((p) => p.id !== product.id)
                  .slice(0, 4)
                  .map((item) => {
                    const price = typeof item.price === "string" ? parseFloat(item.price) : Number(item.price);
                    return (
                      <Link
                        key={item.id}
                        href={`/products/${item.slug}`}
                        className="group bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#FF7A00]/40 shadow-xs hover:shadow-lg transition-all p-4 flex flex-col justify-between"
                      >
                        <div className="w-full h-40 bg-[#F8FAFC] rounded-xl flex items-center justify-center p-3 mb-3 overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            onError={(e) => {
                              e.currentTarget.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23F1F5F9'/%3E%3Cpath d='M120 90a15 15 0 1 0 0-30 15 15 0 0 0 0 30zm-30 60h120l-37-48-26 33-18-22-39 37z' fill='%2394A3B8'/%3E%3Ctext x='50%25' y='80%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%2364748B'%3EImage Not Available%3C/text%3E%3C/svg%3E";
                            }}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase text-[#FF7A00]">
                            {item.department}
                          </span>
                          <h4 className="font-semibold text-xs text-[#0F172A] line-clamp-2 group-hover:text-[#FF7A00] transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-baseline justify-between pt-2">
                            <span className="text-sm font-bold text-[#0F172A]">
                              ₹{price.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-[#64748B]">MOQ: {item.moq || 1}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* RFQ Modal prefilled with this product */}
      <BulkRfqModal
        isOpen={isRfqModalOpen}
        onClose={() => setIsRfqModalOpen(false)}
        defaultTopic={`Wholesale RFQ: ${product.title} (SKU: ${product.sku})`}
        defaultQuantity={moq}
      />

      {/* Cart Drawer & Modals */}
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
