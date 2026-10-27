import React from "react";
import { Link } from "wouter";
import { ShieldCheck, Mail, Phone, MapPin, Building, FileText, ArrowRight } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="w-full bg-[#00081E] text-slate-300 font-['Inter'] border-t border-white/10 select-none">
      {/* Upper Value Proposition Strip */}
      <div className="border-b border-white/10 py-8 bg-[#0A1F44]/50">
        <div className="shell grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center text-[#93c5fd] flex-shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <strong className="block text-white text-xs font-bold uppercase tracking-wider">
                100% Verified Suppliers
              </strong>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Direct factory accreditation, empanelled MSMEs, and verified GSTIN compliance.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488]/20 border border-[#0D9488]/40 flex items-center justify-center text-[#5eead4] flex-shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <strong className="block text-white text-xs font-bold uppercase tracking-wider">
                Official GST Tax Invoicing
              </strong>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Compliant HSN breakdown with 100% Input Tax Credit (ITC) assurance for businesses.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#fcd34d] flex-shrink-0">
              <Building size={20} />
            </div>
            <div>
              <strong className="block text-white text-xs font-bold uppercase tracking-wider">
                Pan-India Logistics Desk
              </strong>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Direct dispatches from Casagrand Royale Chennai Hub and partnered national warehouses.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white flex-shrink-0">
              <Phone size={20} />
            </div>
            <div>
              <strong className="block text-white text-xs font-bold uppercase tracking-wider">
                Dedicated Enterprise Support
              </strong>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Direct procurement desk: 1800-419-BAZRO (Toll-Free, 9 AM - 7 PM Mon-Sat).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Company Details */}
      <div className="shell py-12 grid grid-cols-1 md:grid-cols-5 gap-8 text-xs">
        {/* Company Identity */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-md">
              <img
                src="/logo.png"
                alt="BazroKart Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <span className="font-heading font-extrabold text-xl text-white tracking-tight">
              Bazro<span className="text-[#F59E0B]">Kart</span>
            </span>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
            BazroKart connects manufacturers, suppliers, wholesalers, distributors, MSMEs, and business buyers across India through structured procurement, volume pricing, and verified trade networks.
          </p>

          <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1.5 text-[11px] font-mono text-slate-400">
            <div><strong className="text-slate-200">Entity:</strong> BazroKart Private Limited</div>
            <div><strong className="text-slate-200">CIN:</strong> U74999TN2023PTC158902</div>
            <div><strong className="text-slate-200">GSTIN:</strong> 33AAFCB1245P1ZX (State: 33 TN)</div>
            <div className="flex items-start gap-1.5 pt-1 text-slate-300">
              <MapPin size={14} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
              <span>A1-508, Casagrand Royale, Model School Road Extn., Sholinganallur, Chennai, Tamil Nadu - 600119, India</span>
            </div>
          </div>
        </div>

        {/* Column 1: Marketplace Solutions */}
        <div className="space-y-3">
          <span className="font-bold text-white text-xs uppercase tracking-wider block">
            Marketplace
          </span>
          <ul className="space-y-2 text-slate-400">
            <li><Link href="/products" className="hover:text-white transition-colors">Products &amp; Catalog</Link></li>
            <li><Link href="/products?department=Agriculture%20%26%20Farming" className="hover:text-white transition-colors">Agriculture &amp; Farming</Link></li>
            <li><Link href="/products?department=Electrical%20%26%20Electronics" className="hover:text-white transition-colors">Electrical &amp; Electronics</Link></li>
            <li><Link href="/products?department=Renewable%20Energy%20%26%20Solar" className="hover:text-white transition-colors">Renewable Energy &amp; Solar</Link></li>
            <li><Link href="/products?department=Apparels%20%26%20Fashion" className="hover:text-white transition-colors">Apparels &amp; Fashion</Link></li>
            <li><Link href="/products?department=Food%20%26%20Beverages" className="hover:text-white transition-colors">Food &amp; Beverages</Link></li>
          </ul>
        </div>

        {/* Column 2: Ecosystem & Services */}
        <div className="space-y-3">
          <span className="font-bold text-white text-xs uppercase tracking-wider block">
            Ecosystem
          </span>
          <ul className="space-y-2 text-slate-400">
            <li><Link href="/enterprises" className="hover:text-white transition-colors">Enterprise Programs</Link></li>
            <li><Link href="/services" className="hover:text-white transition-colors">Business Services</Link></li>
            <li><Link href="/networks" className="hover:text-white transition-colors">Business Networks</Link></li>
            <li><Link href="/subscription" className="hover:text-white transition-colors">Subscription Plans</Link></li>
            <li><Link href="/buyer/rfqs" className="hover:text-white transition-colors">Bulk RFQ Desk</Link></li>
            <li><Link href="/suppliers" className="hover:text-white transition-colors">Supplier Directory</Link></li>
          </ul>
        </div>

        {/* Column 3: Workspaces & Legal */}
        <div className="space-y-3">
          <span className="font-bold text-white text-xs uppercase tracking-wider block">
            Workspaces &amp; Auth
          </span>
          <ul className="space-y-2 text-slate-400">
            <li><Link href="/login" className="hover:text-white transition-colors">Account Login</Link></li>
            <li><Link href="/register" className="hover:text-white transition-colors">Buyer Registration</Link></li>
            <li><Link href="/supplier/onboarding" className="hover:text-white transition-colors">Seller Registration</Link></li>
            <li><Link href="/buyer/dashboard" className="hover:text-white transition-colors">Buyer Workspace</Link></li>
            <li><Link href="/supplier/dashboard" className="hover:text-white transition-colors">Supplier Workspace</Link></li>
            <li><Link href="/admin/dashboard" className="hover:text-white transition-colors">Administration</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal Rights Bar */}
      <div className="border-t border-white/10 py-5 bg-[#000514] text-[11px] text-slate-500">
        <div className="shell flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} BazroKart Private Limited. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Corporate Desk: corporate.desk@bazrokart.com</span>
            <span>•</span>
            <span>CIN: U74999TN2023PTC158902</span>
            <span>•</span>
            <span>Sholinganallur, Chennai HUB</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
