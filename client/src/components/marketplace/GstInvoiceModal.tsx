import React from "react";
import { CartItem } from "@/types";
import { X, Printer, Download, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface GstInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  orderNumber?: string;
}

export default function GstInvoiceModal({
  isOpen,
  onClose,
  cartItems,
  orderNumber = "BZK-TAX-2026-08912",
}: GstInvoiceModalProps) {
  const { data: user } = trpc.auth.me.useQuery();

  if (!isOpen) return null;

  const buyerTitle = user?.companyName || user?.name || "Corporate Procurement Buyer";
  const buyerAddress = user?.address || (user?.city ? `${user.city}, ${user.state || "India"}` : "Address provided on file");
  const buyerGstin = user?.gstNumber ? `GSTIN: ${user.gstNumber}` : "GSTIN: Unregistered / Consumer Buyer";

  const totalPayable = cartItems.reduce(
    (sum, item) => sum + (typeof item.product.price === "string" ? parseFloat(item.product.price) : item.product.price) * item.quantity,
    0
  );
  const subtotalExclTax = Math.round(totalPayable / 1.18);
  const totalGst = totalPayable - subtotalExclTax;
  const cgst = Math.round(totalGst / 2);
  const sgst = totalGst - cgst;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] overflow-hidden max-h-[94vh] flex flex-col">
        {/* Modal Controls Bar */}
        <div className="p-4 bg-[#0B0F19] text-white flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-sm">
              Official GST Tax Invoice Preview
            </span>
            <span className="bg-[#0D9488] text-white text-[11px] px-2 py-0.5 rounded font-mono">
              ITC Eligible (18%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-8 overflow-y-auto space-y-6 text-[#0F172A] font-['Inter'] print:p-0">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-heading text-2xl font-extrabold tracking-tight text-[#0F172A]">
                  Bazro<span className="text-[#FF7A00]">Kart</span>
                </span>
                <span className="text-xs px-2 py-0.5 bg-slate-100 font-bold uppercase rounded text-slate-700">
                  Private Limited
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
                A1-508, Casagrand Royale, Model School Road Extn., Sholinganallur, Chennai, Tamil Nadu - 600119, India
              </p>
              <div className="text-xs text-slate-700 space-y-0.5 mt-2 font-mono">
                <div><strong>GSTIN:</strong> 33AAFCB1245P1ZX (Tamil Nadu - 33)</div>
                <div><strong>CIN:</strong> U74999TN2023PTC158902</div>
                <div><strong>Email:</strong> corporate.desk@bazrokart.com</div>
              </div>
            </div>

            <div className="text-right sm:min-w-[200px]">
              <span className="text-xs uppercase font-extrabold text-[#FF7A00] tracking-wider block">
                TAX INVOICE / PROFORMA
              </span>
              <div className="font-mono text-base font-extrabold text-slate-900 mt-1">
                {orderNumber}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
              <div className="text-xs text-slate-500">
                Reverse Charge: <strong>NO</strong>
              </div>
            </div>
          </div>

          {/* Bill To & Ship To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold uppercase text-slate-400 text-[10px] tracking-wider block mb-1">
                Billed To (Purchasing Entity):
              </span>
              <div className="font-bold text-sm text-slate-900">{buyerTitle}</div>
              <div className="text-slate-600 mt-0.5">{buyerAddress}</div>
              <div className="font-mono mt-1 text-slate-700">{buyerGstin}</div>
            </div>

            <div>
              <span className="font-bold uppercase text-slate-400 text-[10px] tracking-wider block mb-1">
                Shipped From / Logistics HUB:
              </span>
              <div className="font-bold text-sm text-slate-900">Casagrand Royale Hub (Direct OEM Dispatch)</div>
              <div className="text-slate-600 mt-0.5">Pan-India Freight Service Desk</div>
              <div className="text-slate-700 mt-1">Dispatch Mode: Dedicated Commercial Freight Cargo</div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0B0F19] text-white">
                <tr>
                  <th className="p-3 font-semibold">#</th>
                  <th className="p-3 font-semibold">Description of Goods</th>
                  <th className="p-3 font-semibold">HSN Code</th>
                  <th className="p-3 font-semibold text-center">Qty</th>
                  <th className="p-3 font-semibold text-right">Unit Rate</th>
                  <th className="p-3 font-semibold text-right">Taxable Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cartItems.map((item, index) => {
                  const price = typeof item.product.price === "string" ? parseFloat(item.product.price) : item.product.price;
                  const itemExcl = Math.round((price * item.quantity) / 1.18);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500">{index + 1}</td>
                      <td className="p-3 font-medium text-slate-900">
                        {item.product.title}
                        <span className="block text-[11px] text-slate-400 font-mono">
                          SKU: {item.product.sku}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-700">{item.product.hsnCode || "85414300"}</td>
                      <td className="p-3 text-center font-bold tabular-nums">{item.quantity}</td>
                      <td className="p-3 text-right tabular-nums">₹{Math.round(price / 1.18).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right font-semibold tabular-nums">₹{itemExcl.toLocaleString("en-IN")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tax Calculation Matrix */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            <div className="text-xs text-slate-600 max-w-sm space-y-1">
              <div className="font-semibold text-slate-800">Bank Remittance Particulars:</div>
              <div>Account Name: BazroKart Private Limited</div>
              <div>Bank: HDFC Bank Limited (Sholinganallur Branch)</div>
              <div className="font-mono">A/C: 50200088991244 • IFSC: HDFC0001892</div>
              <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck size={14} className="text-[#0D9488]" /> Certified GST electronic invoice under Section 31 of CGST Act.
              </div>
            </div>

            <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Value:</span>
                <span className="font-semibold text-slate-900">₹{subtotalExclTax.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST (9.0%):</span>
                <span className="font-semibold text-slate-900">₹{cgst.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST (9.0%):</span>
                <span className="font-semibold text-slate-900">₹{sgst.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-extrabold text-[#0F172A]">
                <span>Invoice Total:</span>
                <span className="font-heading font-extrabold text-base">
                  ₹{totalPayable.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
