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
} from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import BulkRfqModal from "@/components/marketplace/BulkRfqModal";
import { CartItem } from "@/types";

interface WorkspaceProps {
  cartItems?: CartItem[];
}

export default function Workspace({ cartItems = [] }: WorkspaceProps) {
  const [location] = useLocation();
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Form state for adding a product (Seller)
  const [newTitle, setNewTitle] = useState("");
  const [newDepartment, setNewDepartment] = useState("Electrical & Electronics");
  const [newPrice, setNewPrice] = useState("");
  const [newMrp, setNewMrp] = useState("");
  const [newMoq, setNewMoq] = useState(5);
  const [newSku, setNewSku] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("https://images.unsplash.com/photo-1550041473-d254247a8b6a?auto=format&fit=crop&w=600&q=80");

  const { data: user } = trpc.auth.me.useQuery();
  const { data: rfqs = [], refetch: refetchRfqs } = trpc.rfq.list.useQuery();
  const { data: orders = [] } = trpc.orders.list.useQuery();
  const { data: products = [], refetch: refetchProducts } = trpc.products.list.useQuery();
  const { data: adminStats } = trpc.admin.getStats.useQuery();
  const { data: activeSub } = trpc.subscriptions.getActive.useQuery();

  const createProductMutation = trpc.products.create.useMutation();

  const isBuyerRoute = location.startsWith("/buyer");
  const isSupplierRoute = location.startsWith("/supplier");
  const isAdminRoute = location.startsWith("/admin");

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProductMutation.mutateAsync({
        title: newTitle,
        department: newDepartment,
        price: newPrice,
        mrp: newMrp,
        moq: Number(newMoq),
        sku: newSku || `BZK-OEM-${Date.now().toString().slice(-4)}`,
        imageUrl: newImageUrl,
        leadTime: "Dispatch in 24-48h",
        origin: "Casagrand Royale, Chennai HUB",
      });
      toast.success("Listing submitted and published to wholesale catalog!");
      setIsAddProductOpen(false);
      refetchProducts();
      setNewTitle("");
      setNewPrice("");
      setNewMrp("");
    } catch (err: any) {
      toast.error(err.message || "Failed to add listing.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#0F172A] flex flex-col font-['Inter']">
      <SiteHeader cartItems={cartItems} onOpenRfq={() => setIsRfqModalOpen(true)} />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        {/* Workspace Top Header */}
        <div className="w-full bg-[#0A1F44] text-white py-10 border-b border-white/10">
          <div className="shell flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
                <ShieldCheck size={14} />
                <span>
                  {isBuyerRoute
                    ? "Buyer Procurement Workspace"
                    : isSupplierRoute
                    ? "Supplier Operational Workspace"
                    : "Marketplace Administration"}
                </span>
              </div>
              <h1 className="font-heading font-extrabold text-[clamp(1.75rem,2.8vw,2.35rem)] text-white tracking-[-0.035em] leading-[1.15] text-balance">
                {isBuyerRoute
                  ? "Procurement & Purchase Desk"
                  : isSupplierRoute
                  ? "Supplier Hub & Catalogue Management"
                  : "Platform Operational Control Center"}
              </h1>
              <p className="text-xs text-slate-300">
                Organization: <strong>Casagrand Royale Procurement Entity</strong> • GSTIN: 33AAFCB1245P1ZX
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isBuyerRoute && (
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(true)}
                  className="px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#0A1F44] rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <FileText size={15} /> Create New RFQ
                </button>
              )}

              {isSupplierRoute && (
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#0A1F44] rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <Plus size={15} /> Add New Listing
                </button>
              )}

              <Link
                href="/products"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                View Catalog
              </Link>
            </div>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="shell py-8 space-y-8">
          {/* Workspace Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Active RFQs</span>
              <div className="text-2xl font-heading font-extrabold text-[#0A1F44] mt-1">
                {rfqs.length}
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Purchase Orders</span>
              <div className="text-2xl font-heading font-extrabold text-[#0A1F44] mt-1">
                {orders.length}
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Published SKUs</span>
              <div className="text-2xl font-heading font-extrabold text-[#0A1F44] mt-1">
                {products.length}
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Subscription Plan</span>
              <div className="text-xl font-heading font-extrabold text-[#0D9488] mt-1 uppercase">
                {activeSub?.planName || "PREMIUM"}
              </div>
            </div>
          </div>

          {/* Section: RFQs History & Quotations */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-[#0A1F44]">
                  Recent Requests for Quotation (RFQs)
                </h3>
                <p className="text-xs text-slate-500">Commercial requirement briefs dispatched to verified suppliers</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRfqModalOpen(true)}
                className="text-xs font-bold text-[#0051D5] hover:underline"
              >
                + New RFQ
              </button>
            </div>

            {rfqs.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {rfqs.map((rfq) => (
                  <div key={rfq.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0A1F44]">
                          {rfq.rfqNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                          {rfq.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#0F172A]">{rfq.title}</h4>
                      <p className="text-xs text-slate-500">
                        {rfq.category} • Quantity: {rfq.quantity} {rfq.unit} • Destination: {rfq.destinationCity || "Chennai"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        {new Date(rfq.createdAt).toLocaleDateString("en-IN")}
                      </span>
                      <button
                        type="button"
                        onClick={() => toast.info(`RFQ ${rfq.rfqNumber} is open for supplier responses.`)}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Inspect Quotations
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center space-y-3">
                <FileText size={32} className="mx-auto text-slate-300" />
                <div className="text-sm font-semibold text-slate-700">No RFQs logged yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Submit a requirement brief with desired quantities, specifications, and delivery timelines to receive comparable offers from OEM suppliers.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(true)}
                  className="px-5 py-2.5 bg-[#0A1F44] text-white rounded-xl text-xs font-bold"
                >
                  Create First RFQ
                </button>
              </div>
            )}
          </div>

          {/* Section: Purchase Orders & Invoices */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-[#0A1F44]">
                  B2B Purchase Orders (POs) &amp; Dispatch Records
                </h3>
                <p className="text-xs text-slate-500">Confirmed procurement contracts with official GST billing</p>
              </div>
              <Link href="/products" className="text-xs font-bold text-[#0051D5] hover:underline">
                Explore Catalog
              </Link>
            </div>

            {orders.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0A1F44]">
                          {ord.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                          {ord.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#0F172A]">
                        ₹{parseFloat(ord.totalAmount).toLocaleString("en-IN")} (incl. ₹{parseFloat(ord.gstAmount).toLocaleString("en-IN")} GST)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Payment: {ord.paymentMethod} • Status: {ord.paymentStatus}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString("en-IN")}
                      </span>
                      <button
                        type="button"
                        onClick={() => toast.success(`Viewing invoice for ${ord.orderNumber}`)}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        GST Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center space-y-3">
                <Truck size={32} className="mx-auto text-slate-300" />
                <div className="text-sm font-semibold text-slate-700">No purchase orders placed yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Browse products, check wholesale tiers, and checkout with Proforma or trade credit terms to view orders here.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Product Modal (Seller) */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#00081E]/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-heading font-bold text-base text-[#0A1F44]">
                Publish New B2B Listing
              </h3>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Industrial 3-Phase Servo Voltage Stabilizer 15kVA"
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full h-10 px-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Agriculture & Farming">Agriculture &amp; Farming</option>
                    <option value="Electrical & Electronics">Electrical &amp; Electronics</option>
                    <option value="Renewable Energy & Solar">Renewable Energy &amp; Solar</option>
                    <option value="Apparels & Fashion">Apparels &amp; Fashion</option>
                    <option value="Food & Beverages">Food &amp; Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">SKU Identifier</label>
                  <input
                    type="text"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="e.g. BZK-ELC-STB15"
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Wholesale Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="4500"
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newMrp}
                    onChange={(e) => setNewMrp(e.target.value)}
                    placeholder="6500"
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">MOQ Units</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMoq}
                    onChange={(e) => setNewMoq(Number(e.target.value))}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Product Image URL</label>
                <input
                  type="url"
                  required
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProductMutation.isPending}
                  className="px-6 py-2 bg-[#F59E0B] text-[#0A1F44] rounded-lg font-bold hover:bg-[#D97706]"
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

      <SiteFooter />
    </div>
  );
}
