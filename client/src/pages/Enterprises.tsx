import React, { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Building, Rocket, ShieldCheck, HeartHandshake, Cpu, CheckCircle2, ArrowRight } from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { CartItem } from "@/types";

interface EnterprisesProps {
  cartItems?: CartItem[];
}

export default function Enterprises({ cartItems = [] }: EnterprisesProps) {
  const [selectedCategory, setSelectedCategory] = useState<"startup" | "msme" | "social_enterprise" | "innovative_business">("msme");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [businessStage, setBusinessStage] = useState("Operational (1-3 Years)");
  const [employeeCount, setEmployeeCount] = useState("10-50 Employees");
  const [annualTurnover, setAnnualTurnover] = useState("₹1 Cr - ₹5 Cr");
  const [needs, setNeeds] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: categories = [] } = trpc.enterprises.listCategories.useQuery();
  const applyMutation = trpc.enterprises.submitApplication.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await applyMutation.mutateAsync({
        enterpriseCategory: selectedCategory,
        companyName,
        contactPerson,
        email,
        phone,
        city,
        state,
        businessStage,
        employeeCount,
        annualTurnover,
        needs: needs || `Empanelment application for ${companyName} under ${selectedCategory} category.`,
      });
      setIsSubmitted(true);
      toast.success("Enterprise empanelment application submitted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application. Please review form fields.");
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
              <Building size={14} /> BazroKart Institutional Empanelment Desk
            </div>
            <h1 className="font-heading font-extrabold text-[clamp(2rem,3.4vw,2.75rem)] text-white tracking-[-0.035em] leading-[1.12] text-balance">
              Enterprise Programs &amp; Sourcing Empanelment
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              BazroKart connects Startups, MSMEs, Social Enterprises, and Technology innovators with high-volume buyers, public procurement desks, and verified supplier supply lines.
            </p>
          </div>
        </div>

        {/* 4 Tracks Overview */}
        <div className="shell py-12 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                  selectedCategory === cat.id
                    ? "bg-white border-[#FF7A00] shadow-lg ring-2 ring-[#FF7A00]/20"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {cat.badge}
                </span>
                <h3 className="font-heading font-bold text-base text-[#0F172A] mt-3">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {cat.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-700 font-medium">
                  {cat.services.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Empanelment Application Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-3xl mx-auto space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider block">
                Empanelment Registry
              </span>
              <h2 className="font-heading font-extrabold text-2xl text-[#0F172A] mt-1">
                Apply for Enterprise Empanelment
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Selected Track: <strong className="text-[#FF7A00] capitalize">{selectedCategory.replace("_", " ")}</strong>
              </p>
            </div>

            {isSubmitted ? (
              <div className="p-8 text-center space-y-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="font-heading font-bold text-xl text-emerald-900">
                  Application Logged for Review
                </h3>
                <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
                  Your enterprise profile has been registered in the BazroKart institutional desk. A verification officer will review your business credentials and reach out within 2 business days.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="px-6 py-2.5 bg-[#0B0F19] text-white rounded-xl text-xs font-bold"
                >
                  Submit Another Application
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Company / Enterprise Name</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Tamil Nadu Agro Naturals"
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Authorized Contact Person</label>
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. R. Subramanian (Director)"
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Corporate Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@company.in"
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98400 12345"
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Coimbatore"
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Tamil Nadu"
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Business Stage</label>
                    <select
                      value={businessStage}
                      onChange={(e) => setBusinessStage(e.target.value)}
                      className="w-full h-10 px-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Early Prototype">Early Prototype</option>
                      <option value="Operational (1-3 Years)">Operational (1-3 Yrs)</option>
                      <option value="Established (3-10 Years)">Established (3-10 Yrs)</option>
                      <option value="Enterprise (10+ Years)">Enterprise (10+ Yrs)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Employees</label>
                    <select
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(e.target.value)}
                      className="w-full h-10 px-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="1-10">1-10 Employees</option>
                      <option value="10-50">10-50 Employees</option>
                      <option value="50-250">50-250 Employees</option>
                      <option value="250+">250+ Employees</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Annual Turnover</label>
                    <select
                      value={annualTurnover}
                      onChange={(e) => setAnnualTurnover(e.target.value)}
                      className="w-full h-10 px-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Under ₹50 Lakhs">Under ₹50 Lakhs</option>
                      <option value="₹50L - ₹1 Cr">₹50L - ₹1 Cr</option>
                      <option value="₹1 Cr - ₹5 Cr">₹1 Cr - ₹5 Cr</option>
                      <option value="₹5 Cr - ₹25 Cr">₹5 Cr - ₹25 Cr</option>
                      <option value="₹25 Cr+">₹25 Cr+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Specific Sourcing or Supply Requirements
                  </label>
                  <textarea
                    rows={3}
                    value={needs}
                    onChange={(e) => setNeeds(e.target.value)}
                    placeholder="Describe what products you manufacture or what component inputs you seek to procure in wholesale quantities..."
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={applyMutation.isPending}
                  className="w-full py-3 bg-[#FF7A00] hover:bg-[#EA580C] text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-60"
                >
                  {applyMutation.isPending ? "Submitting Application..." : "Submit Empanelment Application"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
