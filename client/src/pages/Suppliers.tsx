import { useState } from "react";
import { ArrowRight, Building2, Search, ShieldCheck, Store } from "lucide-react";
import { Link } from "wouter";
import EmptyState from "@/components/site/EmptyState";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";

export default function Suppliers() {
  const [query, setQuery] = useState("");

  return (
    <div className="app-shell">
      <SiteHeader />
      <main>
        <section className="page-hero page-hero-navy"><div className="shell page-hero-inner"><div><span className="eyebrow eyebrow-light">Supplier network</span><h1>Meet the businesses<br /><em>behind the supply.</em></h1></div><p>Supplier discovery will show approved company profiles, verification status, product categories, and the purchasing pathways each organization supports.</p></div></section>
        <section className="section section-white supplier-directory"><div className="shell"><div className="directory-toolbar"><div><span className="eyebrow">Directory</span><h2>Approved suppliers</h2></div><div className="directory-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search supplier names or categories" aria-label="Search suppliers" /></div></div>{query && <div className="query-note supplier-query-note"><Search size={14} /> Directory query staged for <strong>“{query}”</strong>. Results will appear after suppliers are approved.</div>}<div className="directory-empty"><EmptyState icon={Building2} eyebrow="No suppliers approved" title="The supplier directory is ready for its first approved profile." description="An administrator can review onboarding information, configure profile visibility, confirm verification, and publish the supplier when the record is ready." actionLabel="Open supplier onboarding" actionHref="/supplier/onboarding" /></div></div></section>
        <section className="section section-slate"><div className="shell supplier-playbook"><div className="playbook-heading"><span className="eyebrow">What belongs here</span><h2>Context buyers can act on.</h2><p>The directory is designed to make commercial conversations more grounded without revealing information that has not been approved for public visibility.</p></div><div className="playbook-list"><div><span className="playbook-number">01</span><div><strong>Business identity</strong><p>Approved company name, description, and relevant business details.</p></div></div><div><span className="playbook-number">02</span><div><strong>Verification signal</strong><p>Clear status based on the completed review workflow—not a visual assumption.</p></div></div><div><span className="playbook-number">03</span><div><strong>Purchasing paths</strong><p>Product catalog, direct purchasing, and RFQ actions where configured.</p></div></div></div></div></section>
        <section className="section section-white supplier-cta"><div className="shell supplier-cta-inner"><div className="mini-icon"><ShieldCheck size={20} /></div><div><span className="eyebrow">For marketplace owners</span><h2>Keep supplier visibility intentional.</h2><p>Publish only the company information, categories, and contact pathways your policy allows.</p></div><Link href="/admin/suppliers" className="button button-outline">Open administration <ArrowRight size={16} /></Link></div></section>
      </main>
      <SiteFooter />
    </div>
  );
}
