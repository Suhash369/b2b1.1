import React from "react";
import { CartItem } from "@/types";
import { ShoppingCart, X, Trash2, ArrowRight, FileCheck, ShieldCheck } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedCheckout: () => void;
  onOpenGstInvoice: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedCheckout,
  onOpenGstInvoice,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const totalPayable = cartItems.reduce(
    (sum, item) => sum + (typeof item.product.price === "string" ? parseFloat(item.product.price) : item.product.price) * item.quantity,
    0
  );
  const totalUnits = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Exact 18% GST breakdown
  const subtotalExclTax = Math.round(totalPayable / 1.18);
  const gstAmount = totalPayable - subtotalExclTax;

  const freeShippingThreshold = 25000;
  const diffToFree = Math.max(0, freeShippingThreshold - totalPayable);
  const progressPercent = Math.min(100, Math.round((totalPayable / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#030712]/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0B0F19] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingCart size={20} className="text-[#FF7A00]" />
            <span className="font-heading font-bold text-lg">Procurement Cart</span>
            <span className="bg-[#FF7A00] px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums text-white">
              {totalUnits} items
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Shipping Tier Banner */}
        <div className="p-3.5 bg-orange-50/50 border-b border-[#CBD5E1]">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="text-[#44464E] font-medium">Pan-India Direct Logistics</span>
            <span className="text-[#FF7A00] font-bold">
              {diffToFree > 0
                ? `₹${diffToFree.toLocaleString("en-IN")} more for Free Dispatch`
                : "Free Commercial Freight Unlocked!"}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#FF7A00] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length > 0 ? (
            cartItems.map((item) => {
              const price = typeof item.product.price === "string" ? parseFloat(item.product.price) : item.product.price;
              const moq = item.product.moq || 1;
              return (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 flex items-center justify-center p-1">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#0F172A] truncate">
                      {item.product.title}
                    </h4>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      SKU: {item.product.sku}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs font-bold text-[#0F172A]">
                        ₹{(price * item.quantity).toLocaleString("en-IN")}
                        <span className="text-[10px] font-normal text-slate-400 block">
                          (₹{price.toLocaleString("en-IN")} / unit)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-300 rounded-md bg-white">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            disabled={item.quantity <= moq}
                            className="w-6 h-6 flex items-center justify-center text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-xs text-slate-600 hover:bg-slate-100"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <ShoppingCart size={40} className="text-slate-300" />
              <div className="text-sm font-semibold text-slate-700">Procurement Cart is Empty</div>
              <p className="text-xs text-slate-500 max-w-xs">
                Browse our verified B2B catalogue or request a bulk quotation to add items to your cart.
              </p>
            </div>
          )}
        </div>

        {/* Footer Summary & Actions */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 bg-white border-t border-[#CBD5E1] space-y-3 flex-shrink-0">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal (Excl. Tax):</span>
                <span className="font-semibold text-slate-800">
                  ₹{subtotalExclTax.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Applicable GST (18% Input Tax Credit):</span>
                <span className="font-semibold text-[#0D9488]">
                  +₹{gstAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-body font-semibold text-[#0F172A]">
                <span>Total Payable:</span>
                <span className="text-base text-[#0F172A] font-body font-semibold tabular-nums">
                  ₹{totalPayable.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={onOpenGstInvoice}
                className="py-2.5 px-2 border border-[#CBD5E1] rounded-xl text-xs font-heading font-semibold text-[#0F172A] hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors tracking-[-0.01em]"
              >
                <FileCheck size={14} className="text-[#0D9488]" />
                <span className="text-[#0A1F44] font-semibold">View GST Invoice</span>
              </button>
              <button
                type="button"
                onClick={onProceedCheckout}
                className="py-2.5 px-3 bg-[#FF7A00] hover:bg-[#EA580C] text-white rounded-xl text-xs font-heading font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm tracking-[-0.01em]"
              >
                <span className="text-[#0A1F44] font-bold">Checkout</span>
                <ArrowRight size={14} className="text-[#0A1F44]" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <ShieldCheck size={13} className="text-[#0D9488]" />
              <span>Official B2B Proforma & Input Tax Credit Guarantee</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
