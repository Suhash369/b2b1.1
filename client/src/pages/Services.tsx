import React, { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Handshake,
  Landmark,
  GraduationCap,
  Rocket,
  TrendingUp,
  Megaphone,
  BrainCircuit,
  Share2,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { CartItem } from "@/types";

interface ServicesProps {
  cartItems?: CartItem[];
}

export default function Services({ cartItems = [] }: ServicesProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: services = [] } = trpc.services.list.useQuery();
  const submitEnquiryMutation = trpc.services.submitEnquiry.useMutation();

  const handleOpenEnquiry = (serviceName: string) => {
    setSelectedService(serviceName);
    setIsSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    try {
      await submitEnquiryMutation.mutateAsync({
        serviceName: selectedService,
        userName,
        userEmail,
        userPhone,
        companyName,
        message: message || `Enquiry for ${selectedService} from ${companyName}.`,
      });
      setIsSubmitted(true);
      toast.success(`Enquiry for ${selectedService} submitted successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Could not submit enquiry. Please try again.");
    }
  };

  const serviceIcons: Record<string, React.ReactNode> = {
    b2b_connect: <Handshake size={24} className="text-[#FF7A00]" />,
    grants_funding: <Landmark size={24} className="text-[#0D9488]" />,
    education_training: <GraduationCap size={24} className="text-[#FF7A00]" />,
    incubation: <Rocket size={24} className="text-[#FF7A00]" />,
    investor_connect: <TrendingUp size={24} className="text-[#FF7A00]" />,
    marketing_branding: <Megaphone size={24} className="text-[#0D9488]" />,
    mentoring: <BrainCircuit size={24} className="text-[#FF7A00]" />,
    networking: <Share2 size={24} className="text-[#FF7A00]" />,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#0F172A] flex flex-col font-['Inter']">
      <SiteHeader cartItems={cartItems} />

      <main className="flex-1 pb-16">
        {/* Hero Section */}
        <div className="w-full bg-[#0B0F19] text-white pt-24 pb-14 sm:pt-28 border-b border-white/10">
          <div className="shell space-y-4">
            <div className="flex items-center gap-2 text-[#FF7A00] text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} /> BazroKart Value-Added Services
            </div>
            <h1 className="font-heading font-extrabold text-[clamp(2rem,3.4vw,2.75rem)] text-white tracking-[-0.035em] leading-[1.12] text-balance">
              Commercial Trade Services &amp; Advisory
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Accelerate your wholesale operations with verified matchmaking, MSME grant advisory, GST training, and vendor showcases backed by BazroKart Private Limited.
            </p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="shell py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#FF7A00]/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                    {serviceIcons[svc.id] || <Handshake size={24} className="text-[#FF7A00]" />}
                  </div>

                  <h3 className="font-heading font-bold text-base text-[#0F172A]">
                    {svc.name}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {svc.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEnquiry(svc.name)}
                    className="w-full py-2.5 rounded-xl bg-[#0B0F19] hover:bg-[#030712] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Request Advisory</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Service Enquiry Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] overflow-hidden">
            <div className="p-5 bg-[#0B0F19] text-white flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-white">
                  Service Enquiry
                </h3>
                <p className="text-[11px] text-[#CBD5E1]">{selectedService}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
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
                  Enquiry Logged Successfully
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our corporate services team will contact {contactPersonSummary(userName, companyName)} with dedicated advisory details.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-6 py-2.5 bg-[#0B0F19] text-white rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Casagrand Procurement Desk"
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. R. Subramanian"
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      required
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="+91 98401 22334"
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="subramanian@company.in"
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Requirements or Specific Objectives</label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Tell us what specific help your business needs regarding ${selectedService}...`}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitEnquiryMutation.isPending}
                    className="px-6 py-2.5 bg-[#FF7A00] text-white rounded-xl font-bold hover:bg-[#EA580C] disabled:opacity-60"
                  >
                    {submitEnquiryMutation.isPending ? "Submitting..." : "Send Commercial Enquiry"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

function contactPersonSummary(name: string, company: string) {
  if (name && company) return `${name} at ${company}`;
  if (name) return name;
  return "your representative";
}
