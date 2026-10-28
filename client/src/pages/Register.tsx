import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Building, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

export default function Register() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialRole = searchParams.get("role") === "seller" ? "seller" : "buyer";

  const [role, setRole] = useState<"buyer" | "seller">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [city, setCity] = useState("Chennai");
  const [state, setState] = useState("Tamil Nadu");

  const registerMutation = trpc.auth.register.useMutation();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    try {
      await registerMutation.mutateAsync({
        name,
        email,
        password,
        phone,
        companyName,
        gstNumber,
        role,
        city,
        state,
      });
      toast.success("Account registered successfully!");
      if (role === "seller") {
        setLocation("/supplier/dashboard");
      } else {
        setLocation("/buyer/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to register account.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-['Inter']">
      <SiteHeader />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF7A00]">
              Verified Trade Onboarding
            </span>
            <h1 className="font-heading font-extrabold text-[clamp(1.5rem,2.2vw,1.85rem)] text-[#0F172A] tracking-[-0.03em] leading-[1.2] text-balance">
              Register Your Business on BazroKart
            </h1>
            <p className="text-xs text-[#64748B]">
              Join India&apos;s verified B2B network for wholesale procurement and OEM distribution
            </p>
          </div>

          {/* Account Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 border border-[#E2E8F0] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setRole("buyer")}
              className={`py-2.5 rounded-lg transition-colors ${
                role === "buyer" ? "bg-[#FF7A00] text-white shadow-xs" : "text-[#64748B] hover:text-[#172033]"
              }`}
            >
              Business Buyer
            </button>
            <button
              type="button"
              onClick={() => setRole("seller")}
              className={`py-2.5 rounded-lg transition-colors ${
                role === "seller" ? "bg-[#FF7A00] text-white shadow-xs" : "text-[#64748B] hover:text-[#172033]"
              }`}
            >
              Manufacturer / Supplier
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Company / Entity Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Tirupur Apparel Matrix"
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">GSTIN (Optional for MSME)</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                  placeholder="33AAFCB1245P1ZX"
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Representative Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
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
                  placeholder="+91 98401 22334"
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Corporate Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="purchasing@company.in"
                className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Create Account Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
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
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-3 bg-[#FF7A00] hover:bg-[#EA580C] text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 text-xs mt-2"
            >
              <span>{registerMutation.isPending ? "Creating Account..." : `Complete ${role === "buyer" ? "Buyer" : "Seller"} Registration`}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>Already have an account?</span>{" "}
            <Link href="/login" className="font-bold text-[#FF7A00] hover:underline">
              Sign in to workspace →
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
