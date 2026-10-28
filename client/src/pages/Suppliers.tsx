import { useState } from "react";
import { ArrowRight, Building2, Search, ShieldCheck, Star, FileText, CheckCircle2, MapPin, Package, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import EmptyState from "@/components/site/EmptyState";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import BulkRfqModal from "@/components/marketplace/BulkRfqModal";
import { trpc } from "@/lib/trpc";

export default function Suppliers() {
  const [query, setQuery] = useState("");
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [selectedSupplierName, setSelectedSupplierName] = useState("");

  const { data: suppliers = [], isLoading } = trpc.suppliers.list.useQuery({ query: query || undefined });

  const handleOpenRfq = (supplierName: string) => {
    setSelectedSupplierName(supplierName);
    setIsRfqModalOpen(true);
  };

  return (
    <div className="app-shell bg-[#F8FAFC] text-[#0F172A] flex flex-col font-['Inter']">
      <SiteHeader onOpenRfq={() => handleOpenRfq("All Empaneled Suppliers")} />
      <main className="flex-1">
        <section className="page-hero page-hero-navy bg-[#0B0F19] text-white py-16">
          <div className="shell page-hero-inner max-w-4xl">
            <div>
              <span className="eyebrow eyebrow-light text-[#FF7A00] font-bold tracking-wider text-xs uppercase block mb-1">
                Verified Supplier Network
              </span>
              <h1 className="font-heading font-extrabold text-3xl sm:text-4xl leading-tight">
                Meet the businesses<br />
                <em className="text-[#FF7A00] not-italic">behind the supply.</em>
              </h1>
            </div>
            <p className="text-slate-200 text-sm mt-3 leading-relaxed">
              Discover approved Indian manufacturers, OEM suppliers, and certified distributors. Verify GST compliance, evaluate production capabilities, and initiate direct factory RFQs.
            </p>
          </div>
        </section>

        <section className="section section-white supplier-directory py-12 bg-white border-b border-[#E2E8F0]">
          <div className="shell">
            <div className="directory-toolbar flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <span className="eyebrow text-xs font-bold uppercase tracking-wider text-[#FF7A00]">
                  Verified Directory
                </span>
                <h2 className="font-heading font-extrabold text-2xl text-[#0F172A]">
                  Empaneled Manufacturers &amp; Suppliers ({suppliers.length})
                </h2>
              </div>
              <div className="directory-search relative w-full sm:w-80">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search suppliers, cities, or categories"
                  aria-label="Search suppliers"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#FF7A00] bg-slate-50"
                />
              </div>
            </div>

            {query && (
              <div className="query-note supplier-query-note mb-6 text-xs text-[#64748B] bg-[#FFF7ED] p-3 rounded-xl border border-[#FF7A00]/20 flex items-center gap-2">
                <Search size={14} className="text-[#FF7A00]" />
                <span>
                  Filtering suppliers for: <strong>&ldquo;{query}&rdquo;</strong>
                </span>
              </div>
            )}

            {suppliers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.map((supplier) => (
                  <div
                    key={String(supplier.id)}
                    className="bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#FF7A00]/40 shadow-xs hover:shadow-lg transition-all p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#FF7A00] flex items-center justify-center font-bold">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <h3 className="font-heading font-bold text-sm text-[#0F172A] leading-snug">
                              {supplier.companyName}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-0.5">
                              <MapPin size={12} className="text-[#FF7A00]" />
                              <span>{supplier.city}, {supplier.state}</span>
                            </div>
                          </div>
                        </div>

                        {supplier.isVerified ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0D9488]/15 text-[#0D9488] border border-[#0D9488]/30 flex items-center gap-1 flex-shrink-0">
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 flex-shrink-0">
                            Registered
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                        {supplier.description}
                      </p>

                      {/* Categories Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {supplier.departments.map((dept) => (
                          <span
                            key={dept}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-[#0F172A] border border-[#E2E8F0]"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
                      <div className="flex items-center justify-between text-xs text-[#64748B]">
                        <span className="flex items-center gap-1 font-semibold text-[#0F172A]">
                          <Package size={13} className="text-[#FF7A00]" /> {supplier.productCount} Listed SKUs
                        </span>
                        {supplier.rating ? (
                          <span className="flex items-center gap-1 text-[#FF7A00] font-bold">
                            <Star size={13} className="fill-[#FF7A00]" /> {supplier.rating} Rating
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Verified OEM Direct</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <Link
                          href={`/products?query=${encodeURIComponent(supplier.companyName)}`}
                          className="py-2 px-3 rounded-lg border border-[#E2E8F0] hover:bg-slate-100 text-[#0F172A] font-semibold text-center transition-colors"
                        >
                          View Catalog
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenRfq(supplier.companyName)}
                          className="py-2 px-3 rounded-lg bg-[#FF7A00] hover:bg-[#EA580C] text-white font-bold text-center transition-colors shadow-xs flex items-center justify-center gap-1"
                        >
                          <FileText size={13} /> Direct RFQ
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="directory-empty">
                <EmptyState
                  icon={Building2}
                  eyebrow="No suppliers found"
                  title="No supplier profiles match your query."
                  description="Try broadening your search term or discover verified manufacturers through our wholesale product categories."
                  actionLabel="Browse Product Catalog"
                  actionHref="/products"
                />
              </div>
            )}
          </div>
        </section>

        <section className="section section-slate py-12 bg-[#F8FAFC]">
          <div className="shell supplier-playbook max-w-4xl">
            <div className="playbook-heading mb-8">
              <span className="eyebrow text-xs font-bold uppercase tracking-wider text-[#FF7A00]">What belongs here</span>
              <h2 className="font-heading font-extrabold text-2xl text-[#0F172A] mt-1">Context buyers can act on.</h2>
              <p className="text-xs text-[#64748B] mt-1">The directory is designed to make commercial conversations more grounded without revealing unapproved business details.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-5 bg-white rounded-xl border border-[#E2E8F0] space-y-2">
                <span className="text-xl font-heading font-extrabold text-[#FF7A00]">01</span>
                <strong className="block text-sm font-bold text-[#0F172A]">Business Identity</strong>
                <p className="text-xs text-[#64748B]">Approved company name, GST verification status, and registered manufacturing location.</p>
              </div>
              <div className="p-5 bg-white rounded-xl border border-[#E2E8F0] space-y-2">
                <span className="text-xl font-heading font-extrabold text-[#FF7A00]">02</span>
                <strong className="block text-sm font-bold text-[#0F172A]">Verified Credentials</strong>
                <p className="text-xs text-[#64748B]">Clear status based on the completed onboarding review workflow—not a visual assumption.</p>
              </div>
              <div className="p-5 bg-white rounded-xl border border-[#E2E8F0] space-y-2">
                <span className="text-xl font-heading font-extrabold text-[#FF7A00]">03</span>
                <strong className="block text-sm font-bold text-[#0F172A]">Purchasing Paths</strong>
                <p className="text-xs text-[#64748B]">Wholesale product catalog, direct purchasing, and competitive RFQ actions.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-white supplier-cta py-10 bg-white border-t border-[#E2E8F0]">
          <div className="shell flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#FF7A00] flex items-center justify-center font-bold flex-shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <span className="eyebrow text-[10px] font-bold uppercase tracking-wider text-[#FF7A00]">For Suppliers &amp; Manufacturers</span>
                <h3 className="font-heading font-bold text-base text-[#0F172A]">Want to showcase your factory on BazroKart?</h3>
                <p className="text-xs text-[#64748B]">Complete onboarding to receive qualified RFQs from verified procurement desks across India.</p>
              </div>
            </div>
            <Link href="/register" className="px-5 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#EA580C] text-white text-xs font-bold transition-colors flex items-center gap-1.5 flex-shrink-0">
              Register as Supplier <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </main>

      <BulkRfqModal
        isOpen={isRfqModalOpen}
        onClose={() => setIsRfqModalOpen(false)}
        defaultTopic={`Direct RFQ to: ${selectedSupplierName}`}
      />

      <SiteFooter />
    </div>
  );
}
