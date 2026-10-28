import React, { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  CreditCard,
  Check,
  ShieldCheck,
  Sparkles,
  Store,
  Layers,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { CartItem } from "@/types";

interface SubscriptionProps {
  cartItems?: CartItem[];
}

export default function Subscription({ cartItems = [] }: SubscriptionProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: plans = [], refetch } = trpc.subscriptions.getPlans.useQuery();
  const { data: activeSub } = trpc.subscriptions.getActive.useQuery();
  const subscribeMutation = trpc.subscriptions.subscribe.useMutation();

  const handleSubscribe = async (planId: "basic" | "premium" | "elite") => {
    try {
      await subscribeMutation.mutateAsync({ planName: planId });
      toast.success(`Subscribed to ${planId.toUpperCase()} plan successfully!`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update subscription.");
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
              <CreditCard size={14} /> BazroKart Supplier &amp; Buyer Membership
            </div>
            <h1 className="font-heading font-extrabold text-[clamp(2rem,3.4vw,2.75rem)] text-white tracking-[-0.035em] leading-[1.12] text-balance">
              Subscription Plans &amp; Listing Limits
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Transparent, volume-tiered membership plans built to scale with your enterprise trading volume, catalog breadth, and procurement velocity.
            </p>
          </div>
        </div>

        {/* Active Plan Badge if any */}
        {activeSub && (
          <div className="shell pt-8">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>
                  Current Active Plan: <strong className="uppercase font-bold">{activeSub.planName}</strong> • {activeSub.listingLimit} Listings Allotted
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700">Status: Active</span>
            </div>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="shell py-12 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => {
              const isActive = activeSub?.planName === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-8 flex flex-col justify-between border relative transition-all duration-200 ${
                    plan.recommended
                      ? "bg-[#0B0F19] text-white border-[#FF7A00] shadow-2xl scale-105 z-10"
                      : "bg-white text-slate-900 border-slate-200 shadow-sm"
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-[#FF7A00] text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                      Most Popular for MSMEs
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-heading font-extrabold text-xl ${plan.recommended ? "text-white" : "text-[#0F172A]"}`}>
                          {plan.name}
                        </h3>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${plan.recommended ? "text-slate-300" : "text-slate-600"} leading-relaxed`}>
                        {plan.description}
                      </p>
                    </div>

                    <div className="pt-2 flex items-baseline gap-1">
                      <span className={`text-3xl font-extrabold font-heading ${plan.recommended ? "text-white" : "text-[#0F172A]"}`}>
                        ₹{plan.price.toLocaleString("en-IN")}
                      </span>
                      <span className={`text-xs ${plan.recommended ? "text-slate-400" : "text-slate-500"}`}>
                        /{plan.billingInterval}
                      </span>
                    </div>

                    <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${plan.recommended ? "bg-white/10 border-white/20 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                      <div><strong>Catalogue Listings:</strong> {plan.listingLimit} Active SKUs</div>
                      <div><strong>RFQ Processing:</strong> {plan.rfqLimit}</div>
                      <div><strong>Trade Commission:</strong> {plan.commissionRate}</div>
                    </div>

                    <ul className={`space-y-2.5 text-xs pt-2 ${plan.recommended ? "text-slate-200" : "text-slate-600"}`}>
                      {plan.features.map((feat: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check size={14} className={plan.recommended ? "text-[#FF7A00] flex-shrink-0 mt-0.5" : "text-[#0D9488] flex-shrink-0 mt-0.5"} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <button
                      type="button"
                      disabled={isActive || subscribeMutation.isPending}
                      onClick={() => handleSubscribe(plan.id as any)}
                      className={`w-full py-3 rounded-xl text-center text-xs font-bold transition-all shadow-md disabled:opacity-50 ${
                        plan.recommended
                          ? "bg-[#FF7A00] hover:bg-[#EA580C] text-white"
                          : "bg-[#0B0F19] hover:bg-[#030712] text-white"
                      }`}
                    >
                      {isActive ? "Current Active Plan" : subscribeMutation.isPending ? "Activating..." : plan.ctaText}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Institutional Note */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl max-w-2xl mx-auto text-center space-y-2 text-xs text-slate-600">
            <span className="font-bold text-[#0F172A] block text-sm">Need Custom Enterprise Billing or Net-60 Credit?</span>
            <p>
              For public sector undertakings (PSUs), government tenders, and annual trade volume exceeding ₹10 Crore, contact our institutional desk for customized vendor contracts.
            </p>
            <div className="pt-2 text-[#FF7A00] font-semibold">
              corporate.desk@bazrokart.com • Toll-Free: 1800-419-BAZRO
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
