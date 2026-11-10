import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Users,
  Search,
  Building,
  CheckCircle2,
  X,
  Send,
  ShieldCheck,
  Star,
  MapPin,
  ExternalLink,
  Trash2,
} from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { CartItem } from "@/types";

interface NetworksProps {
  cartItems?: CartItem[];
}

export default function Networks({ cartItems = [] }: NetworksProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTargetCompany, setSelectedTargetCompany] = useState<string | null>(null);
  const { data: user } = trpc.auth.me.useQuery();
  const [requesterName, setRequesterName] = useState("");
  const [requesterCompany, setRequesterCompany] = useState("");
  const [leadType, setLeadType] = useState("Bulk Buyer Looking for Suppliers");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name) setRequesterName(user.name);
      if (user.companyName) setRequesterCompany(user.companyName);
    }
  }, [user]);

  const utils = trpc.useUtils();
  const { data: companies = [] } = trpc.network.listMembers.useQuery();
  const sendConnectionMutation = trpc.network.sendConnection.useMutation();
  const deleteMemberMutation = trpc.network.deleteMember.useMutation();
  const [selectedDeleteCompany, setSelectedDeleteCompany] = useState<any | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");

  const filteredCompanies = companies.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.activeRequirements.toLowerCase().includes(q)
    );
  });

  const handleOpenConnect = (companyName: string) => {
    setSelectedTargetCompany(companyName);
    setIsSubmitted(false);
  };

  const handleSendConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetCompany) return;
    try {
      await sendConnectionMutation.mutateAsync({
        targetCompany: selectedTargetCompany,
        leadType,
        requesterName,
        requesterCompany,
        message: message || `Trade connection request from ${requesterCompany} to ${selectedTargetCompany}.`,
      });
      setIsSubmitted(true);
      toast.success(`Connection request dispatched to ${selectedTargetCompany}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch connection request.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#0F172A] flex flex-col font-['Inter']">
      <SiteHeader cartItems={cartItems} />

      <main className="flex-1 pb-16">
        {/* Hero Section */}
        <div className="w-full bg-[#0B0F19] text-white pt-24 pb-14 sm:pt-28 border-b border-white/10">
          <div className="shell space-y-4">
            <div className="flex items-center gap-2 text-[#FF7A00] text-xs font-bold uppercase tracking-wider">
              <Users size={14} /> National B2B Business Directory
            </div>
            <h1 className="font-heading font-extrabold text-[clamp(2rem,3.4vw,2.75rem)] text-white tracking-[-0.035em] leading-[1.12] text-balance">
              Verified Business Networks &amp; Trade Partners
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Connect directly with verified manufacturing units, OEM distributors, and enterprise buyers across India to unlock volume contracts and regional supply lines.
            </p>
          </div>
        </div>

        {/* Directory & Search Toolbar */}
        <div className="shell py-10 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company name, sector, city, or SKU..."
                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#FF7A00] shadow-xs"
              />
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {filteredCompanies.length} Verified Commercial Entities
            </span>
          </div>

          {/* Companies Cards Grid */}
          {filteredCompanies.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-orange-50 text-[#FF7A00] flex items-center justify-center">
                <Building size={24} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  No Empaneled Entities Listed Yet
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Verified suppliers and enterprise buyers appear here once registered and approved through the Institutional Empanelment Desk.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link
                  href="/enterprises"
                  className="px-4 py-2 bg-[#FF7A00] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>Apply for Empanelment</span>
                  <ExternalLink size={13} />
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-[#0B0F19] hover:bg-[#030712] text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>Register Commercial Entity</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#FF7A00]/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-heading font-bold text-base text-[#0F172A]">
                          {comp.name}
                        </h3>
                        <span className="text-xs text-slate-500 block mt-0.5">{comp.category}</span>
                      </div>
                      {comp.isVerified && (
                        <span className="px-2.5 py-0.5 bg-[#0D9488]/10 text-[#0D9488] text-[10px] font-bold rounded-full flex items-center gap-1">
                          <CheckCircle2 size={12} /> Verified
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin size={13} className="text-[#FF7A00] flex-shrink-0" />
                        <span>{comp.city}</span>
                      </div>
                      <div>
                        <strong className="text-slate-500">GSTIN:</strong>{" "}
                        <span className="font-mono text-slate-800 font-semibold">{comp.gstin}</span>
                      </div>
                      <div className="pt-1 border-t border-slate-200 text-slate-600">
                        <strong className="text-slate-800">Procurement Focus:</strong>{" "}
                        <span>{comp.activeRequirements}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 gap-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Star size={13} className="fill-amber-400 text-amber-400" /> {comp.rating}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDeleteCompany(comp);
                          setDeleteConfirmEmail("");
                        }}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                        title="Delete Empanelment Registration"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenConnect(comp.name)}
                        className="px-4 py-2 bg-[#0B0F19] hover:bg-[#030712] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <span>Connect</span>
                        <Send size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Connection Modal */}
      {selectedTargetCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] overflow-hidden">
            <div className="p-5 bg-[#0B0F19] text-white flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-white">
                  Send B2B Connection Request
                </h3>
                <p className="text-[11px] text-[#CBD5E1]">To: {selectedTargetCompany}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTargetCompany(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {isSubmitted ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="font-heading font-bold text-lg text-slate-800">
                  Connection Request Dispatched
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your corporate connection brief has been routed to the procurement and sales desks at {selectedTargetCompany}.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedTargetCompany(null)}
                  className="px-6 py-2.5 bg-[#0B0F19] text-white rounded-xl text-xs font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendConnection} className="p-6 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Your Company / Entity Name</label>
                  <input
                    type="text"
                    required
                    value={requesterCompany}
                    onChange={(e) => setRequesterCompany(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Authorized Representative</label>
                    <input
                      type="text"
                      required
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Collaboration Purpose</label>
                    <select
                      value={leadType}
                      onChange={(e) => setLeadType(e.target.value)}
                      className="w-full h-10 px-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Bulk Buyer Looking for Suppliers">Bulk Buyer Looking for Suppliers</option>
                      <option value="OEM Factory Offering Direct Supply">OEM Factory Offering Direct Supply</option>
                      <option value="Regional Distributor Agreement">Regional Distributor Agreement</option>
                      <option value="Consortium Joint Bidding">Consortium Joint Bidding</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Commercial Message or Brief</label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Briefly state your monthly volume requirements, product interest, or commercial partnership proposal..."
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTargetCompany(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendConnectionMutation.isPending}
                    className="px-6 py-2.5 bg-[#FF7A00] text-white rounded-xl font-bold hover:bg-[#EA580C] disabled:opacity-60 flex items-center gap-1.5"
                  >
                    <Send size={13} /> {sendConnectionMutation.isPending ? "Sending..." : "Dispatch Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Empanelment Confirmation Modal */}
      {selectedDeleteCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Trash2 size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-white">
                    Delete Empanelment Registration
                  </h3>
                  <p className="text-[11px] text-rose-100">{selectedDeleteCompany.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDeleteCompany(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-100 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 leading-relaxed">
                <strong>Attention:</strong> This will remove{" "}
                <span className="font-semibold">{selectedDeleteCompany.name}</span> from the
                Verified Business Networks directory and delete the empanelment application from the database.
              </div>

              {user &&
              (user.role === "admin" ||
                (user.email &&
                  selectedDeleteCompany.email &&
                  user.email.toLowerCase() === selectedDeleteCompany.email.toLowerCase()) ||
                (user.companyName &&
                  user.companyName.toLowerCase() === selectedDeleteCompany.name.toLowerCase())) ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>
                    Authenticated representative: <strong>{user.companyName || user.name}</strong> ({user.email}).
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Confirm Registered Email Address
                  </label>
                  <input
                    type="email"
                    value={deleteConfirmEmail}
                    onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                    placeholder={
                      selectedDeleteCompany.email
                        ? `e.g. ${selectedDeleteCompany.email}`
                        : "Enter registered contact email"
                    }
                    className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-rose-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Buyers and suppliers can delete their empanelment by confirming their registered email.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedDeleteCompany(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteMemberMutation.isPending}
                  onClick={async () => {
                    try {
                      await deleteMemberMutation.mutateAsync({
                        id: selectedDeleteCompany.applicationId || selectedDeleteCompany.id,
                        companyName: selectedDeleteCompany.name,
                        email: deleteConfirmEmail || user?.email || selectedDeleteCompany.email,
                      });
                      toast.success(
                        `Empanelment for ${selectedDeleteCompany.name} deleted successfully.`
                      );
                      setSelectedDeleteCompany(null);
                      utils.network.listMembers.invalidate();
                    } catch (err: any) {
                      toast.error(err.message || "Failed to delete empanelment.");
                    }
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  <span>
                    {deleteMemberMutation.isPending ? "Deleting..." : "Confirm Delete Empanelment"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
