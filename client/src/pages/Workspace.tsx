import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ShieldCheck,
  Building,
  Store,
  FileText,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  Truck,
  Plus,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Users,
  Eye,
  Check,
  X,
  Send,
  Building2,
  MapPin,
  FileSpreadsheet,
  Settings,
  Bell,
  Trash2,
  Upload,
} from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import BulkRfqModal from "@/components/marketplace/BulkRfqModal";
import GstInvoiceModal from "@/components/marketplace/GstInvoiceModal";
import SettingsModal from "@/components/marketplace/SettingsModal";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { CartItem, Product, Rfq, Quote } from "@/types";

interface WorkspaceProps {
  cartItems?: CartItem[];
}

export default function Workspace({ cartItems = [] }: WorkspaceProps) {
  const [location] = useLocation();
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(location.endsWith("/settings"));

  // Quote Inspection Modal (Buyer)
  const [inspectRfq, setInspectRfq] = useState<Rfq | null>(null);

  // Quote Submission Modal (Supplier)
  const [submittingRfq, setSubmittingRfq] = useState<Rfq | null>(null);
  const [quoteUnitPrice, setQuoteUnitPrice] = useState("");
  const [quoteTotalAmount, setQuoteTotalAmount] = useState("");
  const [quoteMoq, setQuoteMoq] = useState(10);
  const [quoteDeliveryDays, setQuoteDeliveryDays] = useState(5);
  const [quotePaymentTerms, setQuotePaymentTerms] = useState("100% Proforma against GST Invoice");
  const [quoteNotes, setQuoteNotes] = useState("");

  // Invoice modal
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Form state for adding a product (Seller)
  const [newTitle, setNewTitle] = useState("");
  const [newDepartment, setNewDepartment] = useState("Electrical & Electronics");
  const [newPrice, setNewPrice] = useState("");
  const [newMrp, setNewMrp] = useState("");
  const [newMoq, setNewMoq] = useState(5);
  const [newSku, setNewSku] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imageUploadType, setImageUploadType] = useState<"file" | "url">("file");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should be less than 5MB.");
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setNewImageUrl(base64);
      setIsUploadingImage(false);
      toast.success("Product image loaded!");
    };
    reader.onerror = () => {
      toast.error("Failed to read image file.");
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Listing action states
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const { data: user, isLoading: isLoadingUser } = trpc.auth.me.useQuery();
  const { data: rfqs = [], refetch: refetchRfqs, isLoading: isLoadingRfqs } = trpc.rfq.list.useQuery();
  const { data: orders = [], isLoading: isLoadingOrders } = trpc.orders.list.useQuery();
  const { data: products = [], refetch: refetchProducts, isLoading: isLoadingProducts } = trpc.products.list.useQuery({ includeUnpublished: true });
  const { data: adminStats, isLoading: isLoadingAdminStats } = trpc.admin.getStats.useQuery();
  const { data: activeSub } = trpc.subscriptions.getActive.useQuery();
  const { data: quotes = [], refetch: refetchQuotes, isLoading: isLoadingQuotes } = trpc.quotes.listAll.useQuery();

  // Queries for the selected RFQ's quotes
  const { data: rfqQuotes = [], refetch: refetchRfqQuotes } = trpc.quotes.listForRfq.useQuery(
    { rfqId: inspectRfq?.id || "" },
    { enabled: Boolean(inspectRfq) }
  );

  const createProductMutation = trpc.products.create.useMutation();
  const updateProductMutation = trpc.products.update.useMutation();
  const deleteProductMutation = trpc.products.delete.useMutation();
  const createQuoteMutation = trpc.quotes.create.useMutation();
  const updateQuoteStatusMutation = trpc.quotes.updateStatus.useMutation();
  const { data: notifications = [], refetch: refetchNotifications, isLoading: isLoadingNotifications } = trpc.notifications.list.useQuery();
  const markNotificationAsReadMutation = trpc.notifications.markAsRead.useMutation();

  const isBuyerRoute = location.startsWith("/buyer") || (!location.startsWith("/supplier") && !location.startsWith("/admin"));
  const isSupplierRoute = location.startsWith("/supplier");
  const isAdminRoute = location.startsWith("/admin");

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fallbackPlaceholder =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23F1F5F9'/%3E%3Cpath d='M160 130a20 20 0 1 0 0-40 20 20 0 0 0 0 40zm-40 80h160l-50-65-35 45-25-30-50 50z' fill='%2394A3B8'/%3E%3Ctext x='50%25' y='80%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2364748B'%3EProduct Photo%3C/text%3E%3C/svg%3E";

      await createProductMutation.mutateAsync({
        title: newTitle,
        department: newDepartment,
        price: newPrice,
        mrp: newMrp,
        moq: Number(newMoq),
        sku: newSku || `BZK-OEM-${Date.now().toString().slice(-4)}`,
        imageUrl: newImageUrl.trim() || fallbackPlaceholder,
        supplierName: user?.companyName || user?.name || "Empaneled Supplier",
        leadTime: "Dispatch in 24-48h",
        origin: user?.city ? `${user.city}, ${user.state || ""}` : "Registered Supplier Hub",
      });
      toast.success("Listing submitted and published to wholesale catalog!");
      setIsAddProductOpen(false);
      refetchProducts();
      setNewTitle("");
      setNewPrice("");
      setNewMrp("");
      setNewImageUrl("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      toast.error(err.message || "Failed to add listing.");
    }
  };

  const handleOpenSubmitQuote = (rfq: Rfq) => {
    setSubmittingRfq(rfq);
    const unitP = rfq.targetPrice || "250";
    setQuoteUnitPrice(unitP);
    setQuoteTotalAmount((Number(unitP) * rfq.quantity).toString());
    setQuoteMoq(rfq.quantity);
    setQuoteDeliveryDays(7);
    setQuotePaymentTerms("100% Proforma against GST Invoice");
    setQuoteNotes(`Standard OEM wholesale packing and dispatch to ${rfq.destinationCity || "Commercial Hub"}.`);
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingRfq) return;
    try {
      await createQuoteMutation.mutateAsync({
        rfqId: submittingRfq.id,
        supplierName: user?.companyName || user?.name || "Empaneled Supplier",
        unitPrice: quoteUnitPrice,
        totalAmount: quoteTotalAmount,
        moq: Number(quoteMoq),
        deliveryDays: Number(quoteDeliveryDays),
        paymentTerms: quotePaymentTerms,
        notes: quoteNotes,
      });
      toast.success(`Commercial quotation dispatched for RFQ ${submittingRfq.rfqNumber}!`);
      setSubmittingRfq(null);
      refetchRfqs();
      refetchQuotes();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit quotation.");
    }
  };

  const handleAcceptQuote = async (quote: Quote) => {
    try {
      await updateQuoteStatusMutation.mutateAsync({
        id: quote.id,
        status: "accepted",
      });
      toast.success(`Quotation ${quote.quoteNumber} accepted! A purchase contract has been drafted.`);
      refetchRfqQuotes();
      refetchRfqs();
      refetchQuotes();
    } catch (err: any) {
      toast.error(err.message || "Failed to accept quotation.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-['Inter']">
      <SiteHeader cartItems={cartItems} onOpenRfq={() => setIsRfqModalOpen(true)} />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        {/* Workspace Top Header */}
        <div className="w-full bg-[#0B0F19] text-white py-10 border-b border-white/10">
          <div className="shell flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF7A00]">
                <ShieldCheck size={14} />
                <span>
                  {isSupplierRoute
                    ? "Supplier Operational Workspace"
                    : isAdminRoute
                    ? "Platform Operational Control Center"
                    : "Buyer Procurement Workspace"}
                </span>
              </div>
              <h1 className="font-heading font-extrabold text-[clamp(1.75rem,2.8vw,2.35rem)] text-white tracking-[-0.035em] leading-[1.15] text-balance">
                {isSupplierRoute
                  ? "Supplier Hub & RFQ Response Center"
                  : isAdminRoute
                  ? "Platform Operational Control Center"
                  : "Procurement Desk & RFQ Tracker"}
              </h1>
              <p className="text-xs text-slate-200">
                Logged in as: <strong>{user?.companyName || user?.name || "Corporate User"}</strong>
                {user?.gstNumber ? ` • GSTIN: ${user.gstNumber}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isSupplierRoute ? (
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-5 py-2.5 bg-[#FF7A00] hover:bg-[#E06B00] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <Plus size={15} /> Add New Listing
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(true)}
                  className="px-5 py-2.5 bg-[#FF7A00] hover:bg-[#E06B00] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <FileText size={15} /> Create New RFQ
                </button>
              )}

              <Link
                href="/products"
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Browse Catalog
              </Link>

              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Settings size={14} className="text-[#FF7A00]" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="shell py-8 space-y-8">
          {/* Quick Metrics Ribbon */}
          {(() => {
            const rfqCount = isSupplierRoute
              ? rfqs.filter((r) => r.status === "open").length
              : isAdminRoute
              ? (adminStats?.totalRfqs ?? rfqs.length)
              : rfqs.filter((r) => r.status === "open" || r.status === "quoted").length;
            const isRfqMetricLoading = isSupplierRoute ? isLoadingRfqs : isAdminRoute ? (isLoadingAdminStats || isLoadingRfqs) : isLoadingRfqs;

            const metric4Count = isSupplierRoute
              ? products.filter((p) => p.supplierId === user?.id || (user?.companyName && p.supplierName?.toLowerCase() === user.companyName.toLowerCase())).length
              : isAdminRoute
              ? (adminStats?.totalUsers ?? 0)
              : notifications.filter((n) => !n.isRead).length;
            const isMetric4Loading = isSupplierRoute ? isLoadingProducts : isAdminRoute ? isLoadingAdminStats : isLoadingNotifications;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#FF7A00]/40 shadow-xs hover:shadow-md transition-all duration-300 card-smooth-hover">
                  <span className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">
                    {isSupplierRoute ? "Available Open RFQs" : isAdminRoute ? "Total Platform RFQs" : "Active RFQs"}
                  </span>
                  <div className="text-2xl font-heading font-extrabold text-[#0F172A] mt-1 h-8 flex items-center">
                    {isRfqMetricLoading ? (
                      <div className="h-7 w-16 rounded-md skeleton-shimmer" />
                    ) : (
                      <AnimatedCounter value={rfqCount} duration={750} />
                    )}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#FF7A00]/40 shadow-xs hover:shadow-md transition-all duration-300 card-smooth-hover">
                  <span className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">
                    {isSupplierRoute ? "Quotes Submitted" : isAdminRoute ? "Total Quotes" : "Received Quotations"}
                  </span>
                  <div className="text-2xl font-heading font-extrabold text-[#FF7A00] mt-1 h-8 flex items-center">
                    {isLoadingQuotes ? (
                      <div className="h-7 w-16 rounded-md skeleton-shimmer" />
                    ) : (
                      <AnimatedCounter value={quotes.length} duration={750} />
                    )}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#FF7A00]/40 shadow-xs hover:shadow-md transition-all duration-300 card-smooth-hover">
                  <span className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">
                    {isSupplierRoute ? "Purchase Orders" : isAdminRoute ? "Total Orders" : "Confirmed Orders"}
                  </span>
                  <div className="text-2xl font-heading font-extrabold text-[#0F172A] mt-1 h-8 flex items-center">
                    {isLoadingOrders ? (
                      <div className="h-7 w-16 rounded-md skeleton-shimmer" />
                    ) : (
                      <AnimatedCounter value={orders.length} duration={750} />
                    )}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#FF7A00]/40 shadow-xs hover:shadow-md transition-all duration-300 card-smooth-hover">
                  <span className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">
                    {isSupplierRoute ? "My Listed SKUs" : isAdminRoute ? "Registered Users" : "Unread Notifications"}
                  </span>
                  <div className="text-2xl font-heading font-extrabold text-[#0D9488] mt-1 h-8 flex items-center">
                    {isMetric4Loading ? (
                      <div className="h-7 w-16 rounded-md skeleton-shimmer" />
                    ) : (
                      <AnimatedCounter value={metric4Count} duration={750} />
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Section: RFQs (Buyer & Supplier Views) */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  {isSupplierRoute ? "Incoming Requests for Quotation (RFQs)" : "Your Procurement RFQ Inquiries"}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {isSupplierRoute
                    ? "Buyer demand briefs ready for factory pricing & commercial terms"
                    : "Commercial briefs submitted to empaneled suppliers for bulk pricing"}
                </p>
              </div>
              {!isSupplierRoute && (
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(true)}
                  className="text-xs font-bold text-[#FF7A00] hover:underline"
                >
                  + New RFQ
                </button>
              )}
            </div>

            {isLoadingRfqs ? (
              <div className="divide-y divide-[#E2E8F0] p-4 space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-36 rounded-md skeleton-shimmer" />
                      <div className="h-5 w-3/4 rounded-md skeleton-shimmer" />
                      <div className="h-3 w-1/2 rounded-md skeleton-shimmer" />
                    </div>
                    <div className="h-9 w-28 rounded-xl skeleton-shimmer" />
                  </div>
                ))}
              </div>
            ) : rfqs.length > 0 ? (
              <div className="divide-y divide-[#E2E8F0]">
                {rfqs.map((rfq) => {
                  const statusColors = {
                    open: "bg-orange-50 text-orange-700 border-orange-200",
                    quoted: "bg-amber-50 text-amber-700 border-amber-200",
                    accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    closed: "bg-slate-100 text-slate-700 border-slate-200",
                  }[rfq.status] || "bg-slate-100 text-slate-700 border-slate-200";

                  return (
                    <div
                      key={rfq.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#0F172A] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {rfq.rfqNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColors}`}>
                            {rfq.status}
                          </span>
                          <span className="text-[11px] text-[#64748B]">
                            {rfq.category}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-[#172033]">{rfq.title}</h4>
                        <p className="text-xs text-[#64748B] line-clamp-1">
                          {rfq.description}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-[#64748B] pt-0.5">
                          <span>Quantity: <strong className="text-[#172033]">{rfq.quantity} {rfq.unit}</strong></span>
                          <span>Destination: <strong>{rfq.destinationCity || "Chennai"}</strong></span>
                          {rfq.targetPrice && (
                            <span>Target: <strong className="text-[#FF7A00]">₹{rfq.targetPrice}/unit</strong></span>
                          )}
                          <span>Buyer: <strong>{rfq.buyerName}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <span className="text-xs text-[#64748B] hidden md:inline">
                          {new Date(rfq.createdAt).toLocaleDateString("en-IN")}
                        </span>

                        {isSupplierRoute ? (
                          <button
                            type="button"
                            onClick={() => handleOpenSubmitQuote(rfq)}
                            className="px-3.5 py-2 bg-[#FF7A00] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                          >
                            <Send size={13} /> Submit Quotation
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setInspectRfq(rfq)}
                            className="px-3.5 py-2 bg-[#1E293B] hover:bg-[#0F172A] text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                          >
                            <Eye size={13} /> View Quotations
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center space-y-3">
                <FileText size={32} className="mx-auto text-[#64748B]" />
                <div className="text-sm font-semibold text-[#172033]">No RFQs logged yet</div>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Submit a requirement brief with desired quantities, specifications, and delivery timelines to receive offers from OEM suppliers.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(true)}
                  className="px-5 py-2.5 bg-[#FF7A00] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold"
                >
                  Create First RFQ
                </button>
              </div>
            )}
          </div>

          {/* Section: Supplier Catalog Management (if Supplier) */}
          {isSupplierRoute && (() => {
            const supplierProducts = products.filter((p) => {
              if (user?.role === "admin") return true;
              if (user?.id && p.supplierId === user.id) return true;
              if (user?.companyName && p.supplierName?.toLowerCase() === user.companyName.toLowerCase()) return true;
              if (!user) return true;
              return false;
            });
            return (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#0F172A]">
                      Your Wholesale B2B Catalogue ({supplierProducts.length} Items)
                    </h3>
                    <p className="text-xs text-[#64748B]">Manage wholesale listings, pricing tiers, and publication status</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(true)}
                    className="px-4 py-2 bg-[#FF7A00] text-white rounded-xl text-xs font-bold hover:bg-[#EA580C] transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Listing
                  </button>
                </div>

                {isLoadingProducts ? (
                  <div className="divide-y divide-[#E2E8F0] p-4 space-y-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="py-3 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 rounded-lg skeleton-shimmer flex-shrink-0" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-1/2 rounded-md skeleton-shimmer" />
                            <div className="h-3 w-1/4 rounded-md skeleton-shimmer" />
                          </div>
                        </div>
                        <div className="h-8 w-20 rounded-xl skeleton-shimmer" />
                      </div>
                    ))}
                  </div>
                ) : supplierProducts.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Package size={22} />
                    </div>
                    <h4 className="font-heading font-bold text-sm text-slate-700">No products listed yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      You have not created any wholesale product listings. Click "Add Listing" to start selling on BazroKart.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddProductOpen(true)}
                      className="px-4 py-2 bg-[#FF7A00] text-white rounded-xl text-xs font-bold hover:bg-[#EA580C] transition-colors"
                    >
                      Add Your First Product
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E2E8F0]">
                    {supplierProducts.map((p) => {
                      const price = typeof p.price === "string" ? parseFloat(p.price) : Number(p.price);
                      return (
                        <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="w-12 h-12 object-contain rounded-lg border border-[#E2E8F0] bg-slate-50 p-1"
                            />
                            <div>
                              <h4 className="text-xs font-bold text-[#172033] line-clamp-1">{p.title}</h4>
                              <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                                <span className="font-mono">SKU: {p.sku}</span>
                                <span>•</span>
                                <span>{p.department}</span>
                                <span>•</span>
                                <span>MOQ: {p.moq}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-sm font-extrabold text-[#FF7A00] tabular-nums">
                                ₹{price.toLocaleString("en-IN")}
                              </span>
                              <span className={`block text-[10px] font-semibold ${p.isPublished ? "text-[#0D9488]" : "text-amber-600"}`}>
                                {p.isPublished ? "Live Listing" : "Draft / Unlisted"}
                              </span>
                            </div>

                            <button
                              type="button"
                              disabled={togglingProductId === p.id}
                              onClick={async () => {
                                setTogglingProductId(p.id);
                                try {
                                  const nextStatus = !p.isPublished;
                                  await updateProductMutation.mutateAsync({
                                    id: p.id,
                                    updates: { isPublished: nextStatus },
                                  });
                                  await refetchProducts();
                                  toast.success(
                                    nextStatus
                                      ? `Listing "${p.title}" published live!`
                                      : `Listing "${p.title}" unpublished.`
                                  );
                                } catch (err: any) {
                                  toast.error(err.message || "Failed to update listing status.");
                                } finally {
                                  setTogglingProductId(null);
                                }
                              }}
                              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center justify-center min-w-[84px] ${
                                togglingProductId === p.id
                                  ? "opacity-60 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200"
                                  : p.isPublished
                                  ? "border-[#E2E8F0] hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-sm"
                                  : "border-[#0D9488]/40 bg-[#0D9488]/10 hover:bg-[#0D9488]/20 text-[#0D9488] shadow-sm"
                              }`}
                              title={
                                p.isPublished
                                  ? "Take listing offline from public catalog"
                                  : "Publish listing live to wholesale catalog"
                              }
                            >
                              {togglingProductId === p.id
                                ? "Saving..."
                                : p.isPublished
                                ? "Unpublish"
                                : "Publish"}
                            </button>

                            <Link
                              href={`/products/${p.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-700 hover:text-[#FF7A00] hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center justify-center"
                              title={
                                p.isPublished
                                  ? "View Live Listing (opens in new tab)"
                                  : "Preview Unpublished Listing (opens in new tab)"
                              }
                            >
                              <Eye size={16} />
                            </Link>

                            <button
                              type="button"
                              disabled={deletingProductId === p.id}
                              onClick={async () => {
                                if (
                                  !window.confirm(
                                    `Are you sure you want to permanently delete "${p.title}" (SKU: ${p.sku})? This action cannot be undone.`
                                  )
                                ) {
                                  return;
                                }
                                setDeletingProductId(p.id);
                                try {
                                  await deleteProductMutation.mutateAsync({ id: p.id });
                                  await refetchProducts();
                                  toast.success(`Listing "${p.title}" deleted successfully.`);
                                } catch (err: any) {
                                  toast.error(err.message || "Failed to delete listing.");
                                } finally {
                                  setDeletingProductId(null);
                                }
                              }}
                              className={`p-2 rounded-lg transition-colors inline-flex items-center justify-center ${
                                deletingProductId === p.id
                                  ? "opacity-50 cursor-not-allowed text-slate-400 bg-slate-50"
                                  : "text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                              }`}
                              title="Delete Listing permanently"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Section: Purchase Orders & Invoices */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  B2B Purchase Orders (POs) &amp; Dispatch Records
                </h3>
                <p className="text-xs text-[#64748B]">Confirmed procurement contracts with official GST billing</p>
              </div>
              <Link href="/products" className="text-xs font-bold text-[#FF7A00] hover:underline">
                Explore Catalog
              </Link>
            </div>

            {isLoadingOrders ? (
              <div className="divide-y divide-[#E2E8F0] p-4 space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="py-3 flex justify-between items-center gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-28 rounded-md skeleton-shimmer" />
                      <div className="h-5 w-1/3 rounded-md skeleton-shimmer" />
                      <div className="h-3 w-1/2 rounded-md skeleton-shimmer" />
                    </div>
                    <div className="h-8 w-24 rounded-xl skeleton-shimmer" />
                  </div>
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="divide-y divide-[#E2E8F0]">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0F172A]">
                          {ord.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                          {ord.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#172033]">
                        ₹{parseFloat(ord.totalAmount).toLocaleString("en-IN")} (incl. ₹{parseFloat(ord.gstAmount).toLocaleString("en-IN")} GST)
                      </h4>
                      <p className="text-xs text-[#64748B]">
                        Buyer: {ord.buyerName} • Payment: {ord.paymentMethod}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#64748B]">
                        {new Date(ord.createdAt).toLocaleDateString("en-IN")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsInvoiceOpen(true)}
                        className="px-3.5 py-1.5 border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] bg-white hover:bg-slate-100 transition-colors shadow-xs"
                      >
                        GST Tax Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center space-y-3">
                <Truck size={32} className="mx-auto text-[#64748B]" />
                <div className="text-sm font-semibold text-[#172033]">No purchase orders placed yet</div>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Browse products, check wholesale tiers, and checkout with Proforma or trade credit terms to view orders here.
                </p>
              </div>
            )}
          </div>

          {/* Section: Live Activity Notifications */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-[#0F172A] flex items-center gap-2">
                  <Bell size={18} className="text-[#FF7A00]" />
                  Operational Notifications &amp; Alerts ({notifications.filter((n) => !n.isRead).length} Unread)
                </h3>
                <p className="text-xs text-[#64748B]">
                  Real-time transactional updates on RFQs, quotation responses, and purchase order status
                </p>
              </div>
            </div>

            {isLoadingNotifications ? (
              <div className="divide-y divide-[#E2E8F0] p-4 space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="py-2.5 flex justify-between items-center gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-1/3 rounded-md skeleton-shimmer" />
                      <div className="h-3 w-2/3 rounded-md skeleton-shimmer" />
                    </div>
                    <div className="h-6 w-16 rounded-xl skeleton-shimmer" />
                  </div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-[#E2E8F0]">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                      notif.isRead ? "bg-white" : "bg-orange-50/50"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#172033]">{notif.title}</span>
                        {!notif.isRead && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FF7A00] text-white">
                            NEW
                          </span>
                        )}
                        <span className="text-[10px] text-[#64748B]">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B]">{notif.message}</p>
                    </div>

                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={async () => {
                          await markNotificationAsReadMutation.mutateAsync({ id: notif.id });
                          refetchNotifications();
                          toast.success("Notification marked as read");
                        }}
                        className="px-3 py-1 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] hover:text-[#FF7A00] rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#64748B]">
                No notifications at this time. Transaction updates will appear here in real-time.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Inspect Quotations Modal (Buyer) */}
      {inspectRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-[#0B0F19] text-white flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#FF7A00] tracking-wider block">
                  Quotations for {inspectRfq.rfqNumber}
                </span>
                <h3 className="font-heading font-bold text-base text-white mt-0.5">
                  {inspectRfq.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectRfq(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[#64748B] block">Requested Units:</span>
                  <strong className="text-[#172033]">{inspectRfq.quantity} {inspectRfq.unit}</strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">Target Rate:</span>
                  <strong className="text-[#FF7A00]">{inspectRfq.targetPrice ? `₹${inspectRfq.targetPrice}` : "Open"}</strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">Destination:</span>
                  <strong className="text-[#172033]">{inspectRfq.destinationCity || "Chennai"}</strong>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Supplier Quotations Received ({rfqQuotes.length})
                </h4>

                {rfqQuotes.length > 0 ? (
                  <div className="space-y-3">
                    {rfqQuotes.map((quote) => (
                      <div
                        key={quote.id}
                        className={`p-4 rounded-xl border transition-all ${
                          quote.status === "accepted"
                            ? "bg-emerald-50/60 border-emerald-300 shadow-xs"
                            : "bg-white border-[#E2E8F0] hover:border-[#FF7A00]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#0F172A]">
                                {quote.quoteNumber}
                              </span>
                              <span className="font-semibold text-xs text-[#172033]">
                                {quote.supplierName}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                {quote.status}
                              </span>
                            </div>
                            <div className="text-xs text-[#64748B] mt-1 space-y-0.5">
                              <div>Delivery: <strong>{quote.deliveryDays} Days</strong> • Terms: <strong>{quote.paymentTerms}</strong></div>
                              {quote.notes && <div className="italic text-[#172033]">Note: {quote.notes}</div>}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-xs text-[#64748B] block">Unit Price</span>
                            <span className="text-lg font-extrabold text-[#FF7A00] tabular-nums">
                              ₹{quote.unitPrice}
                            </span>
                            <div className="text-[11px] text-[#64748B] tabular-nums">
                              Total: ₹{quote.totalAmount}
                            </div>
                          </div>
                        </div>

                        {quote.status !== "accepted" && (
                          <div className="pt-3 mt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleAcceptQuote(quote)}
                              className="px-4 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                            >
                              <Check size={13} /> Accept Quotation
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[#64748B] bg-slate-50 rounded-xl border border-dashed border-[#E2E8F0]">
                    No quotations submitted yet for this RFQ. Empaneled suppliers have been notified.
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={() => setInspectRfq(null)}
                className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-xs font-semibold hover:bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Quotation Modal (Supplier) */}
      {submittingRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-5 bg-[#0B0F19] text-white flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#FF7A00] tracking-wider block">
                  Quote for {submittingRfq.rfqNumber}
                </span>
                <h3 className="font-heading font-bold text-base text-white mt-0.5">
                  Submit Official Wholesale Quote
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSubmittingRfq(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitQuote} className="p-5 space-y-4 text-xs overflow-y-auto">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                <div className="font-bold text-[#172033]">{submittingRfq.title}</div>
                <div className="text-[#64748B]">
                  Buyer: <strong>{submittingRfq.buyerName}</strong> • Destination: <strong>{submittingRfq.destinationCity || "Chennai"}</strong>
                </div>
                <div className="text-[#0F172A] font-semibold">
                  Requested Lot: {submittingRfq.quantity} {submittingRfq.unit}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Offered Unit Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={quoteUnitPrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuoteUnitPrice(val);
                      if (val) setQuoteTotalAmount((Number(val) * submittingRfq.quantity).toString());
                    }}
                    placeholder="250"
                    className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Total Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={quoteTotalAmount}
                    onChange={(e) => setQuoteTotalAmount(e.target.value)}
                    className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Production / Dispatch Days</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quoteDeliveryDays}
                    onChange={(e) => setQuoteDeliveryDays(Number(e.target.value))}
                    className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Minimum Lot Order (MOQ)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quoteMoq}
                    onChange={(e) => setQuoteMoq(Number(e.target.value))}
                    className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Payment Terms</label>
                <input
                  type="text"
                  required
                  value={quotePaymentTerms}
                  onChange={(e) => setQuotePaymentTerms(e.target.value)}
                  placeholder="e.g. 100% Proforma against GST Invoice"
                  className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Quotation Notes &amp; Logistics Details</label>
                <textarea
                  rows={2}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="e.g. Includes freight insurance, test certificate, and wooden crate packaging."
                  className="w-full p-2.5 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmittingRfq(null)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createQuoteMutation.isPending}
                  className="px-6 py-2 bg-[#FF7A00] hover:bg-[#E06B00] text-white rounded-xl font-bold shadow-md"
                >
                  {createQuoteMutation.isPending ? "Sending..." : "Dispatch Quotation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal (Seller) */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-heading font-bold text-base text-[#0F172A]">
                Publish New B2B Listing
              </h3>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="text-[#64748B] hover:text-[#172033]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Product Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Industrial 3-Phase Servo Voltage Stabilizer 15kVA"
                  className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full h-10 px-2 border border-[#E2E8F0] rounded-xl bg-white focus:outline-none"
                  >
                    <option value="Agriculture & Farming">Agriculture &amp; Farming</option>
                    <option value="Electrical & Electronics">Electrical &amp; Electronics</option>
                    <option value="Renewable Energy & Solar">Renewable Energy &amp; Solar</option>
                    <option value="Apparels & Fashion">Apparels &amp; Fashion</option>
                    <option value="Food & Beverages">Food &amp; Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">SKU Identifier</label>
                  <input
                    type="text"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="e.g. BZK-ELC-STB15"
                    className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl font-mono focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Wholesale Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="4500"
                    className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">MRP Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newMrp}
                    onChange={(e) => setNewMrp(e.target.value)}
                    placeholder="6500"
                    className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">MOQ Units</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMoq}
                    onChange={(e) => setNewMoq(Number(e.target.value))}
                    className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-[#172033]">Product Image</label>
                  <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setImageUploadType("file")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        imageUploadType === "file"
                          ? "bg-white text-[#FF7A00] shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadType("url")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        imageUploadType === "url"
                          ? "bg-white text-[#FF7A00] shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {imageUploadType === "file" ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {newImageUrl ? (
                      <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <img
                          src={newImageUrl}
                          alt="Product Preview"
                          className="w-14 h-14 object-contain rounded-lg bg-white border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-slate-800 block truncate">
                            Selected Product Image
                          </span>
                          <span className="text-[10px] text-emerald-600 font-medium">Ready to upload with listing</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewImageUrl("");
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-[#FF7A00] bg-slate-50 hover:bg-orange-50/20 rounded-xl p-4 text-center cursor-pointer transition-colors"
                      >
                        <Upload size={22} className="mx-auto text-[#FF7A00] mb-1.5" />
                        <span className="text-xs font-bold text-slate-800 block">
                          Click to browse product photo from your device
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          PNG, JPG, WebP up to 5MB
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://example.com/product-image.jpg"
                      className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProductMutation.isPending}
                  className="px-6 py-2 bg-[#FF7A00] text-white rounded-xl font-bold hover:bg-[#E06B00] shadow-md"
                >
                  {createProductMutation.isPending ? "Publishing..." : "Publish to Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RFQ Modal */}
      <BulkRfqModal
        isOpen={isRfqModalOpen}
        onClose={() => setIsRfqModalOpen(false)}
        onSubmitSuccess={() => refetchRfqs()}
      />

      {/* Invoice Modal */}
      <GstInvoiceModal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} cartItems={cartItems} />

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />

      <SiteFooter />
    </div>
  );
}
