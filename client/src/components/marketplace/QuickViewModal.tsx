import React, { useState } from "react";
import { Product } from "@/types";
import { X, Check, ShieldCheck, Truck, ShoppingCart, FileText, Star } from "lucide-react";

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenRfq: (topic: string) => void;
}

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onOpenRfq,
}: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(product?.moq || 1);

  if (!isOpen || !product) return null;

  const currentMoq = product.moq || 1;
  const numPrice = typeof product.price === "string" ? parseFloat(product.price) : product.price;
  const numMrp = typeof product.mrp === "string" ? parseFloat(product.mrp) : product.mrp;

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => (q > currentMoq ? q - 1 : q));

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  const handleRfq = () => {
    onClose();
    onOpenRfq(`${product.title} (SKU: ${product.sku})`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#00081E]/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 text-[#0F172A] border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Product Media Column */}
        <div className="w-full md:w-1/2 bg-slate-100 p-6 flex flex-col justify-center items-center relative border-b md:border-b-0 md:border-r border-[#CBD5E1]">
          {product.badge && (
            <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-bold bg-[#0D9488]/15 text-[#0D9488] border border-[#0D9488]/30">
              {product.badge}
            </span>
          )}
          <img
            src={product.imageUrl}
            alt={product.imageAlt || product.title}
            className="w-full max-h-72 object-contain rounded-xl shadow-md transform hover:scale-105 transition-transform duration-300"
          />
          <div className="mt-4 flex items-center gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1 font-semibold text-[#0A1F44]">
              <ShieldCheck size={16} className="text-[#0D9488]" /> Verified Casagrand HUB
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Truck size={16} className="text-[#2563EB]" /> Pan-India Express
            </span>
          </div>
        </div>

        {/* Product Details & Purchase Controls */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="text-[11px] font-body font-medium tracking-wider text-[#2563EB] uppercase">
              {product.department}
            </div>

            <h3 className="font-body font-semibold text-xl text-[#0A1F44] leading-snug tracking-[-0.015em]">
              {product.title}
            </h3>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                SKU: {product.sku}
              </span>
              <span>•</span>
              <div className="flex items-center text-amber-500">
                <Star size={14} className="fill-current text-amber-400" />
                <span className="ml-1 font-body font-semibold text-slate-800">{product.rating || "4.8"}</span>
                <span className="ml-1 text-slate-400">({product.reviews || 42})</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block uppercase font-body font-medium tracking-[0.025em]">Wholesale Rate</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-body font-semibold text-[#0A1F44] tabular-nums tracking-[-0.015em]">
                    ₹{numPrice.toLocaleString("en-IN")}
                  </span>
                  {numMrp > numPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      ₹{numMrp.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#F59E0B] text-[#0A1F44] font-bold text-xs">
                {product.discount || "Wholesale Tier"}
              </span>
            </div>

            {/* Specifications Matrix */}
            <div className="text-xs border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              <div className="flex justify-between p-2 bg-slate-50 text-slate-600">
                <span>Minimum Order Qty (MOQ)</span>
                <span className="font-semibold text-slate-900">{currentMoq} Units</span>
              </div>
              {product.hsnCode && (
                <div className="flex justify-between p-2 text-slate-600">
                  <span>HSN Classification</span>
                  <span className="font-mono font-semibold text-slate-900">{product.hsnCode}</span>
                </div>
              )}
              {product.origin && (
                <div className="flex justify-between p-2 bg-slate-50 text-slate-600">
                  <span>Origin & Hub</span>
                  <span className="font-semibold text-slate-900">{product.origin}</span>
                </div>
              )}
              {product.leadTime && (
                <div className="flex justify-between p-2 text-slate-600">
                  <span>Dispatch Window</span>
                  <span className="font-semibold text-[#0D9488]">{product.leadTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-5 mt-4 border-t border-[#CBD5E1] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Order Quantity:</span>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= currentMoq}
                  className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                >
                  -
                </button>
                <span className="w-12 text-center text-xs font-bold text-slate-900 tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="py-2.5 px-3 rounded-xl bg-[#0A1F44] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#00081E] transition-colors shadow-sm"
              >
                <ShoppingCart size={15} /> Add to Cart
              </button>
              <button
                type="button"
                onClick={handleRfq}
                className="py-2.5 px-3 rounded-xl bg-[#F59E0B] text-[#0A1F44] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#D97706] transition-colors shadow-sm"
              >
                <FileText size={15} /> Custom RFQ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
