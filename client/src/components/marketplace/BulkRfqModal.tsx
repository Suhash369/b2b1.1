import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FileText, CheckCircle2, X, Building, Phone, MapPin, Hash } from "lucide-react";

interface BulkRfqModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTopic?: string;
  defaultQuantity?: number;
  onSubmitSuccess?: (rfqNumber: string) => void;
}

export default function BulkRfqModal({
  isOpen,
  onClose,
  defaultTopic = "General Enterprise Procurement",
  defaultQuantity = 50,
  onSubmitSuccess,
}: BulkRfqModalProps) {
  const [category, setCategory] = useState("Agriculture & Farming");
  const [title, setTitle] = useState(defaultTopic);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [unit, setUnit] = useState("Units");
  const [targetPrice, setTargetPrice] = useState("");
  const [destinationCity, setDestinationCity] = useState("Chennai");
  const [requiredDate, setRequiredDate] = useState("Within 14 Days");
  const [buyerName, setBuyerName] = useState("Casagrand Procure");
  const [buyerEmail, setBuyerEmail] = useState("corporate.desk@bazrokart.com");
  const [buyerPhone, setBuyerPhone] = useState("+91 98401 22334");
  const [submittedRfqNumber, setSubmittedRfqNumber] = useState<string | null>(null);

  const createRfqMutation = trpc.rfq.create.useMutation();

  useEffect(() => {
    if (defaultTopic) {
      setTitle(defaultTopic);
    }
  }, [defaultTopic]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createRfqMutation.mutateAsync({
        category,
        title,
        description: description || `Bulk commercial RFQ for ${quantity} ${unit} of ${title}. Delivery to ${destinationCity}.`,
        quantity: Number(quantity),
        unit,
        targetPrice: targetPrice || undefined,
        destinationCity,
        requiredDate,
        buyerName,
        buyerEmail,
        buyerPhone,
      });

      setSubmittedRfqNumber(res.rfqNumber);
      toast.success(`RFQ ${res.rfqNumber} successfully submitted to verified suppliers!`);
      if (onSubmitSuccess) onSubmitSuccess(res.rfqNumber);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit RFQ. Please check details.");
    }
  };

  const handleResetAndClose = () => {
    setSubmittedRfqNumber(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#00081E]/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-[#0A1F44] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B]">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">
                Request for Quotation (RFQ)
              </h3>
              <p className="text-[11px] text-[#CBD5E1]">
                Pan-India Wholesale Pricing • Direct Factory & Supplier Sourcing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#CBD5E1] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {submittedRfqNumber ? (
          /* Confirmation Screen */
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="p-5 bg-[#F2F3FF] border border-[#2563EB]/40 rounded-xl space-y-3 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#0D9488]/15 text-[#0D9488] flex items-center justify-center">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <span className="text-xs font-bold text-[#0D9488] tracking-wider uppercase">
                  Verified Quotation Brief Logged
                </span>
                <h4 className="font-heading font-extrabold text-xl text-[#0A1F44] mt-1">
                  {submittedRfqNumber}
                </h4>
              </div>
              <p className="text-xs text-[#44464E] max-w-md mx-auto leading-relaxed">
                Your procurement requirement has been dispatched to authorized OEM suppliers. Verified suppliers will review your target specifications and submit competitive proposals with tier pricing and delivery schedules.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-[#0F172A]">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Requirement</span>
                <span className="font-semibold">{title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Quantity</span>
                <span className="font-semibold">{quantity} {unit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Destination</span>
                <span className="font-semibold">{destinationCity}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Timeline</span>
                <span className="font-semibold">{requiredDate}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-full py-3 rounded-xl bg-[#0A1F44] text-white font-bold text-sm hover:bg-[#00081E] transition-colors"
            >
              Done & Return to Marketplace
            </button>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Department / Industry
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs bg-white focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="Agriculture & Farming">Agriculture & Farming</option>
                  <option value="Electrical & Electronics">Electrical & Electronics</option>
                  <option value="Renewable Energy & Solar">Renewable Energy & Solar</option>
                  <option value="Apparels & Fashion">Apparels & Fashion</option>
                  <option value="Food & Beverages">Food & Beverages</option>
                  <option value="Enterprise & Startup Network">Enterprise & Startup Network</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Product or Specification Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Monocrystalline Solar Panels 540W"
                  className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Quantity Required
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Unit of Measure
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs bg-white focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="Units">Units / Pcs</option>
                  <option value="Boxes">Boxes / Cartons</option>
                  <option value="Kg">Kilograms (Kg)</option>
                  <option value="Meters">Meters</option>
                  <option value="Pallets">Pallets</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Target Price (₹/Unit)
                </label>
                <input
                  type="text"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="Optional estimate"
                  className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Technical Specifications & Terms
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include mandatory compliance requirements, testing certificates (e.g. BIS/MNRE), packaging preferences, or delivery milestones..."
                className="w-full p-3 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Destination City & State
                </label>
                <input
                  type="text"
                  required
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  placeholder="e.g. Chennai, Tamil Nadu"
                  className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Delivery Timeline
                </label>
                <select
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs bg-white focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="Immediate (24-48h)">Immediate (24-48h)</option>
                  <option value="Within 7 Days">Within 7 Days</option>
                  <option value="Within 14 Days">Within 14 Days</option>
                  <option value="30+ Days (Scheduled Batches)">30+ Days (Scheduled Batches)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-[#CBD5E1]">
              <span className="text-[11px] font-bold text-[#0051D5] tracking-wider uppercase block mb-2">
                Purchasing Entity Contact Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[#44464E] mb-1">Entity / Name</label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full h-9 px-2.5 border border-[#CBD5E1] rounded text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#44464E] mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full h-9 px-2.5 border border-[#CBD5E1] rounded text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#44464E] mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full h-9 px-2.5 border border-[#CBD5E1] rounded text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 border border-[#CBD5E1] text-[#0F172A] rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createRfqMutation.isPending}
                className="px-6 py-2.5 bg-[#F59E0B] text-[#0F172A] rounded-xl text-xs font-bold hover:bg-[#D97706] transition-all flex items-center gap-2 shadow-sm disabled:opacity-60"
              >
                <span className="text-[#0F172A] font-bold">
                  {createRfqMutation.isPending ? "Submitting Brief..." : "Submit Commercial RFQ"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
