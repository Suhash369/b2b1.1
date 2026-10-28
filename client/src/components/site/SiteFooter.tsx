import React from "react";
import { Link } from "wouter";
import { ShieldCheck, Phone, Building, FileText } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="w-full bg-[#030712] text-slate-300 font-['Inter'] border-t border-white/10 select-none">
      {/* Upper Value Proposition Strip */}
      <div className="border-b border-white/10 py-10 bg-[#0B0F19]/80">
        <div className="shell grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FF7A00]/20 border border-[#FF7A00]/40 flex items-center justify-center text-[#FF7A00] flex-shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <strong className="block text-white text-xs font-bold uppercase tracking-wider">
                100% Verified Suppliers
              </strong>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Direct factory accreditation, empanelled MSMEs, and verified GSTIN compliance.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488]/20 border border-[#0D9488]/40 flex items-center justify-center text-[#5eead4] flex-shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <strong className="block text-white text-xs font-bold uppercase tracking-wider">
                Official GST Tax Invoicing
              </strong>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Compliant HSN breakdown with 100% Input Tax Credit (ITC) assurance for businesses.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FF7A00]/20 border border-[#FF7A00]/40 flex items-center justify-center text-[#FF7A00] flex-shrink-0">
              <Building size={20} />
            </div>
            <div>
              <strong className="block text-white text-xs font-bold uppercase tracking-wider">
                Pan-India Logistics Desk
              </strong>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Direct dispatches from certified fulfillment centers and partnered national warehouses.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white flex-shrink-0">
              <Phone size={20} />
            </div>
            <div>
              <strong className="block text-white text-xs font-bold uppercase tracking-wider">
                Dedicated Enterprise Support
              </strong>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Direct procurement desk: 1800-419-BAZRO (Toll-Free, 9 AM - 7 PM Mon-Sat).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Company Details */}
      <div className="shell py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14 text-xs">
        {/* Company Identity */}
        <div className="space-y-4">
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
              Bazro<span className="text-[#FF7A00]">Kart</span>
            </span>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">
            BazroKart connects manufacturers, suppliers, wholesalers, distributors, MSMEs, and business buyers across India through structured procurement, volume pricing, and verified trade networks.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Empanelled B2B Trade Network</span>
          </div>
        </div>

        {/* Column 1: Marketplace Solutions */}
        <div className="space-y-4">
          <span className="font-bold text-white text-xs uppercase tracking-wider block">
            Marketplace
          </span>
          <ul className="space-y-2.5 text-slate-400">
            <li><Link href="/products" className="hover:text-white transition-colors">Products &amp; Catalog</Link></li>
            <li><Link href="/products?department=Agriculture%20%26%20Farming" className="hover:text-white transition-colors">Agriculture &amp; Farming</Link></li>
            <li><Link href="/products?department=Electrical%20%26%20Electronics" className="hover:text-white transition-colors">Electrical &amp; Electronics</Link></li>
            <li><Link href="/products?department=Renewable%20Energy%20%26%20Solar" className="hover:text-white transition-colors">Renewable Energy &amp; Solar</Link></li>
            <li><Link href="/products?department=Apparels%20%26%20Fashion" className="hover:text-white transition-colors">Apparels &amp; Fashion</Link></li>
            <li><Link href="/products?department=Food%20%26%20Beverages" className="hover:text-white transition-colors">Food &amp; Beverages</Link></li>
          </ul>
        </div>

        {/* Column 2: Ecosystem & Services */}
        <div className="space-y-4">
          <span className="font-bold text-white text-xs uppercase tracking-wider block">
            Ecosystem
          </span>
          <ul className="space-y-2.5 text-slate-400">
            <li><Link href="/enterprises" className="hover:text-white transition-colors">Enterprise Programs</Link></li>
            <li><Link href="/services" className="hover:text-white transition-colors">Business Services</Link></li>
            <li><Link href="/networks" className="hover:text-white transition-colors">Business Networks</Link></li>
            <li><Link href="/subscription" className="hover:text-white transition-colors">Subscription Plans</Link></li>
            <li><Link href="/buyer/rfqs" className="hover:text-white transition-colors">Bulk RFQ Desk</Link></li>
            <li><Link href="/suppliers" className="hover:text-white transition-colors">Supplier Directory</Link></li>
          </ul>
        </div>

        {/* Column 3: Corporate & Support */}
        <div className="space-y-4">
          <span className="font-bold text-white text-xs uppercase tracking-wider block">
            Corporate &amp; Support
          </span>
          <div className="space-y-3 text-slate-400">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Procurement Desk</span>
              <a href="tel:18004192297" className="text-white hover:text-[#FF7A00] font-semibold transition-colors">
                1800-419-BAZRO (Toll-Free)
              </a>
              <span className="text-[10px] text-slate-500 block mt-0.5">9:00 AM – 7:00 PM IST (Mon–Sat)</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Corporate Inquiries</span>
              <a href="mailto:corporate.desk@bazrokart.com" className="text-slate-300 hover:text-white transition-colors break-all">
                corporate.desk@bazrokart.com
              </a>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Headquarters</span>
              <p className="text-slate-400 text-[11px]">Chennai, Tamil Nadu, India</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Rights Bar */}
      <div className="border-t border-white/10 py-6 bg-[#020408] text-[11px] text-slate-500">
        <div className="shell flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} BazroKart Private Limited. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span>Corporate Desk: corporate.desk@bazrokart.com</span>
            <span>•</span>
            <span>CIN: U74999TN2023PTC158902</span>
            <span>•</span>
            <span>Chennai, Tamil Nadu, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
