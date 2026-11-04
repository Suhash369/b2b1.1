import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Store,
  TrendingUp,
  Lightbulb,
  Landmark,
  Users,
  GraduationCap,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  Check,
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

  const { data: user } = trpc.auth.me.useQuery();
  const { data: services = [] } = trpc.services.list.useQuery();
  const submitEnquiryMutation = trpc.services.submitEnquiry.useMutation();

  useEffect(() => {
    if (user) {
      if (user.name && !userName) setUserName(user.name);
      if (user.email && !userEmail) setUserEmail(user.email);
      if (user.phone && !userPhone) setUserPhone(user.phone);
      if (user.companyName && !companyName) setCompanyName(user.companyName);
    }
  }, [user]);

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
    marketplace_sourcing: <Store size={26} className="text-[#FF7A00]" />,
    market_technology_trends: <TrendingUp size={26} className="text-[#0D9488]" />,
    rd_product_innovation: <Lightbulb size={26} className="text-[#FF7A00]" />,
    government_grant_funding: <Landmark size={26} className="text-[#0D9488]" />,
    professional_staffing: <Users size={26} className="text-[#FF7A00]" />,
    skill_development_training: <GraduationCap size={26} className="text-[#0D9488]" />,
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
              Industrial &amp; Trade Enablement Services
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Accelerate manufacturing operations with market intelligence, technology upgradation, R&amp;D innovation, government funding advisory, professional staffing, and workforce upskilling.
            </p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="shell py-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc: any) => (
              <div
                key={svc.id}
                className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 hover:border-[#FF7A00]/40 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                      {serviceIcons[svc.id] || <Store size={26} className="text-[#FF7A00]" />}
                    </div>
                    {svc.tagline && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7A00] bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100 text-right leading-tight">
                        {svc.tagline}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-lg text-[#0F172A] leading-snug">
                      {svc.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {svc.description}
                    </p>
                  </div>

                  {Array.isArray(svc.highlights) && svc.highlights.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                        Key Capabilities &amp; Support
                      </span>
                      <ul className="space-y-2 text-xs text-slate-600">
                        {svc.highlights.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 leading-relaxed">
                            <Check size={14} className="text-[#0D9488] flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEnquiry(svc.name)}
                    className="w-full py-2.5 rounded-xl bg-[#0B0F19] hover:bg-[#030712] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Request Advisory &amp; Consultation</span>
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
                  Service Advisory Enquiry
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
                  Enquiry Submitted Successfully
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our industrial advisory desk will review your requirements for <strong>{selectedService}</strong> and connect with your representative within 24 business hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-6 py-2.5 bg-[#0B0F19] text-white rounded-xl text-xs font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Company / Entity Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Averon Precision Components"
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Contact Person</label>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. S. Kumar"
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Corporate Email Address</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="procurement@company.com"
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Brief Your Industrial Requirement</label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Specify your operational goals, staffing needs, technology bottlenecks, or grant assistance required..."
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
                    className="px-6 py-2.5 bg-[#FF7A00] text-white rounded-xl font-bold hover:bg-[#EA580C] disabled:opacity-60 flex items-center gap-1.5"
                  >
                    <ArrowRight size={13} /> {submitEnquiryMutation.isPending ? "Submitting..." : "Submit Enquiry"}
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
