import React, { useState, useEffect } from "react";
import { X, Building2, User, Phone, MapPin, ShieldCheck, Check, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const utils = trpc.useUtils();
  const { data: user } = trpc.auth.me.useQuery();
  const updateProfileMutation = trpc.auth.updateProfile.useMutation();

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setCompanyName(user.companyName || "");
      setGstNumber(user.gstNumber || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setCity(user.city || "");
      setState(user.state || "");
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateProfileMutation.mutateAsync({
        name,
        companyName,
        gstNumber,
        phone,
        address,
        city,
        state,
      });

      if (res.user) {
        utils.auth.me.setData(undefined, res.user);
      }
      await utils.auth.me.invalidate();
      toast.success("Profile & Enterprise settings updated successfully!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile settings.");
    }
  };

  const roleLabel =
    user?.role === "admin"
      ? "Platform Administrator"
      : user?.role === "seller"
      ? "Verified Wholesale Supplier"
      : "Verified Procurement Buyer";

  const roleBadgeColor =
    user?.role === "admin"
      ? "bg-purple-100 text-purple-700 border-purple-200"
      : user?.role === "seller"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-orange-100 text-orange-800 border-orange-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-[#0B0F19] text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${roleBadgeColor}`}>
                {roleLabel}
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
              <Building2 size={20} className="text-[#FF7A00]" />
              Account &amp; Enterprise Settings
            </h2>
            <p className="text-xs text-slate-200">
              Update registered business contacts, tax registration, and primary billing address.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Identity & Basic Contacts */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <User size={14} className="text-[#FF7A00]" />
              Primary Contact Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-800">Contact / Admin Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full h-9 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF7A00] text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800">Phone / WhatsApp</label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98401 22334"
                    className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF7A00] text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-800">Registered Email</label>
              <input
                type="email"
                disabled
                value={user?.email || "admin@bazrokart.com"}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Official authentication address (managed by platform SSO).</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#0D9488]" />
              Corporate Entity &amp; GSTIN
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-800">Registered Enterprise Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Casagrand Royale Procurement Entity"
                  className="w-full h-9 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF7A00] text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800">GSTIN Number</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                  placeholder="33AAFCB1245P1ZX"
                  className="w-full h-9 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF7A00] text-xs font-mono font-semibold uppercase"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <MapPin size={14} className="text-[#FF7A00]" />
              Commercial Hub &amp; Dispatch Address
            </h3>

            <div>
              <label className="block font-semibold mb-1 text-slate-800">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="A1-508, Casagrand Royale, Sholinganallur"
                className="w-full h-9 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF7A00] text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-800">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Chennai"
                  className="w-full h-9 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF7A00] text-xs font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-800">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Tamil Nadu"
                  className="w-full h-9 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF7A00] text-xs font-medium"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-orange-50/60 border border-orange-100 rounded-xl text-[11px] text-slate-800 flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-[#FF7A00] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">GST Compliance Guarantee</p>
              <p className="text-slate-600 text-[10px] mt-0.5">
                All purchase orders, automated tax invoices, and proforma contracts created by your account will reflect these verified enterprise credentials.
              </p>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-5 py-2 bg-[#FF7A00] hover:bg-[#E06B00] text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Save size={14} />
              {updateProfileMutation.isPending ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
