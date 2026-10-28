import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

export default function Login() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialRole = searchParams.get("role") === "seller" ? "seller" : searchParams.get("role") === "admin" ? "admin" : "buyer";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "seller" | "admin">(initialRole);

  const loginMutation = trpc.auth.login.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await loginMutation.mutateAsync({
        email,
        password,
        role,
      });
      toast.success(`Signed in as ${res.user?.name || role}!`);
      if (role === "seller") {
        setLocation("/supplier/dashboard");
      } else if (role === "admin") {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/buyer/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in. Please verify credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-['Inter']">
      <SiteHeader />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#0B0F19] text-[#FF7A00] border border-white/10 flex items-center justify-center font-bold shadow-md">
              <span className="font-heading text-base font-extrabold">BK</span>
            </div>
            <h1 className="font-heading font-extrabold text-[clamp(1.5rem,2.2vw,1.85rem)] text-[#0F172A] tracking-[-0.03em] leading-[1.2] text-balance">
              Sign in to BazroKart
            </h1>
            <p className="text-xs text-[#64748B]">
              Access your procurement cart, RFQ inbox, and order tracking
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#64748B]">
            <button
              type="button"
              onClick={() => setRole("buyer")}
              className={`py-2 rounded-lg transition-colors ${
                role === "buyer" ? "bg-[#FF7A00] text-white shadow-xs" : "hover:text-[#172033]"
              }`}
            >
              Buyer Desk
            </button>
            <button
              type="button"
              onClick={() => setRole("seller")}
              className={`py-2 rounded-lg transition-colors ${
                role === "seller" ? "bg-[#FF7A00] text-white shadow-xs" : "hover:text-[#172033]"
              }`}
            >
              Supplier
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`py-2 rounded-lg transition-colors ${
                role === "admin" ? "bg-[#FF7A00] text-white shadow-xs" : "hover:text-[#172033]"
              }`}
            >
              Platform
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Corporate Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.in"
                  className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Account Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 bg-[#0B0F19] hover:bg-[#030712] text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 text-xs border border-white/5"
            >
              <span>{loginMutation.isPending ? "Authenticating..." : `Enter as ${role.toUpperCase()}`}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>New organization to BazroKart?</span>{" "}
            <Link href="/register" className="font-bold text-[#FF7A00] hover:underline">
              Register commercial entity →
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
