import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CartItem } from "@/types";
import { toast } from "sonner";
import { X, CheckCircle2, ShieldCheck, Building, CreditCard, FileText } from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onOrderSuccess: (orderNumber: string) => void;
  onOpenGstInvoice: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onOrderSuccess,
  onOpenGstInvoice,
}: CheckoutModalProps) {
  const [buyerName, setBuyerName] = useState("Casagrand Procure");
  const [company, setCompany] = useState("Casagrand Royale Procurement Entity");
  const [gstin, setGstin] = useState("33AAFCB1245P1ZX");
  const [street, setStreet] = useState("A1-508, Casagrand Royale, Model School Road Extn, Sholinganallur");
  const [city, setCity] = useState("Chennai");
  const [state, setState] = useState("Tamil Nadu");
  const [pincode, setPincode] = useState("600119");
  const [phone, setPhone] = useState("+91 98401 22334");
  const [paymentMethod, setPaymentMethod] = useState("GST Proforma Bank Wire / RTGS");
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);

  const createOrderMutation = trpc.orders.create.useMutation();

  if (!isOpen) return null;

  const totalPayable = cartItems.reduce(
    (sum, item) => sum + (typeof item.product.price === "string" ? parseFloat(item.product.price) : item.product.price) * item.quantity,
    0
  );
  const subtotalExclTax = Math.round(totalPayable / 1.18);
  const gstAmount = totalPayable - subtotalExclTax;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedItems = cartItems.map((item) => ({
        productId: item.product.id,
        title: item.product.title,
        sku: item.product.sku,
        price: typeof item.product.price === "string" ? parseFloat(item.product.price) : item.product.price,
        quantity: item.quantity,
        hsnCode: item.product.hsnCode || "85414300",
      }));

      const res = await createOrderMutation.mutateAsync({
        buyerName,
        totalAmount: totalPayable.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        items: formattedItems,
        shippingAddress: {
          name: buyerName,
          company,
          gstin,
          street,
          city,
          state,
          pincode,
          phone,
        },
        paymentMethod,
      });

      setConfirmedOrderNumber(res.orderNumber);
      toast.success(`Purchase Order ${res.orderNumber} placed successfully!`);
      onOrderSuccess(res.orderNumber);
    } catch (err: any) {
      toast.error(err.message || "Could not generate purchase order. Please verify details.");
    }
  };

  const handleDone = () => {
    setConfirmedOrderNumber(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#00081E]/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-[#0A1F44] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/25 flex items-center justify-center text-[#93c5fd]">
              <Building size={18} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">
                B2B Commercial Procurement Checkout
              </h3>
              <p className="text-[11px] text-[#CBD5E1]">
                Official Tax Invoice • GST Input Tax Credit (ITC) • Pan-India Freight
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDone}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#CBD5E1] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {confirmedOrderNumber ? (
          /* Confirmation Screen */
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="p-5 bg-[#F2F3FF] border border-[#2563EB]/40 rounded-xl space-y-3 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#0D9488]/15 text-[#0D9488] flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <span className="text-xs font-bold text-[#0D9488] tracking-wider uppercase">
                  Commercial Purchase Order Confirmed
                </span>
                <h4 className="font-heading font-extrabold text-2xl text-[#0A1F44] mt-1">
                  {confirmedOrderNumber}
                </h4>
              </div>
              <p className="text-xs text-[#44464E] max-w-md mx-auto leading-relaxed">
                Your purchase order has been generated under BazroKart Private Limited master commercial agreements. An official GST Proforma tax invoice with itemized HSN codes and supplier dispatch schedule has been logged.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Purchasing Entity</span>
                <span className="font-semibold">{company}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Registered GSTIN</span>
                <span className="font-mono font-semibold">{gstin}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Total Commercial Amount</span>
                <span className="font-bold text-[#0A1F44]">₹{totalPayable.toLocaleString("en-IN")} (incl. 18% GST)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Payment Routing</span>
                <span className="font-semibold text-[#0051D5]">{paymentMethod}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGstInvoice();
                }}
                className="py-3 px-4 border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0A1F44] hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
              >
                <FileText size={16} className="text-[#0D9488]" /> View GST Tax Invoice
              </button>
              <button
                type="button"
                onClick={handleDone}
                className="py-3 px-4 bg-[#0A1F44] text-white rounded-xl text-xs font-bold hover:bg-[#00081E] transition-colors"
              >
                Return to Storefront
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Details Form */
          <form onSubmit={handleSubmitOrder} className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="p-3.5 bg-[#F2F3FF] border border-[#2563EB]/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block uppercase font-medium">Order Total Payable</span>
                <span className="text-lg font-heading font-extrabold text-[#0A1F44]">
                  ₹{totalPayable.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-[#0D9488] ml-2 font-semibold">
                  (Includes ₹{gstAmount.toLocaleString("en-IN")} 18% GST)
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#0A1F44] text-white text-xs font-semibold">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Units Total
              </span>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-[#2563EB] tracking-wider uppercase block">
                1. Purchasing Entity & Commercial Registration
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Company / Entity Name</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Entity GSTIN (for ITC)</label>
                  <input
                    type="text"
                    required
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs font-mono uppercase focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-[#2563EB] tracking-wider uppercase block">
                2. Shipping & Warehouse Destination
              </span>
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Street / Industrial Estate</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs font-mono focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-[#2563EB] tracking-wider uppercase block">
                3. B2B Commercial Payment Terms
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3 border rounded-xl flex items-start gap-2.5 cursor-pointer transition-colors ${
                    paymentMethod.includes("Wire") ? "border-[#2563EB] bg-[#F2F3FF]" : "border-[#CBD5E1]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod.includes("Wire")}
                    onChange={() => setPaymentMethod("GST Proforma Bank Wire / RTGS")}
                    className="mt-0.5"
                  />
                  <div>
                    <strong className="block text-xs text-[#0A1F44]">Proforma Wire / RTGS</strong>
                    <span className="text-[11px] text-slate-500">Direct transfer with official Tax Invoice reference.</span>
                  </div>
                </label>

                <label
                  className={`p-3 border rounded-xl flex items-start gap-2.5 cursor-pointer transition-colors ${
                    paymentMethod.includes("Credit") ? "border-[#2563EB] bg-[#F2F3FF]" : "border-[#CBD5E1]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod.includes("Credit")}
                    onChange={() => setPaymentMethod("Enterprise Net-30 Trade Credit")}
                    className="mt-0.5"
                  />
                  <div>
                    <strong className="block text-xs text-[#0A1F44]">Net-30 Trade Credit</strong>
                    <span className="text-[11px] text-slate-500">For pre-approved Casagrand &amp; corporate accounts.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-[#CBD5E1]">
              <button
                type="button"
                onClick={handleDone}
                className="px-4 py-2.5 border border-[#CBD5E1] text-[#0F172A] rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Back to Cart
              </button>
              <button
                type="submit"
                disabled={createOrderMutation.isPending}
                className="px-7 py-3 bg-[#F59E0B] text-[#0A1F44] rounded-xl text-xs font-bold hover:bg-[#D97706] transition-all flex items-center gap-2 shadow-md disabled:opacity-60"
              >
                {createOrderMutation.isPending ? "Generating PO..." : "Place Commercial Purchase Order"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
