import { ArrowLeft, FileQuestion, ShieldCheck } from "lucide-react";
import { Link, useParams } from "wouter";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";

export default function RecordPlaceholder({ kind }: { kind: "product" | "category" | "supplier" }) {
  const params = useParams<{ slug?: string }>();
  const labels = {
    product: { eyebrow: "Product detail", title: "This product is not published.", description: "The requested product record is not available in the public catalog. Approved listings will show commercial details, supplier context, and purchasing actions here." },
    category: { eyebrow: "Category", title: "This category is not configured.", description: "The requested category has not been published. An authorized owner can create and organize categories before products are made discoverable." },
    supplier: { eyebrow: "Supplier profile", title: "This supplier profile is not public.", description: "The requested supplier record is not available for public viewing. Profiles appear only after onboarding and visibility approval are complete." },
  }[kind];

  return <div className="app-shell"><SiteHeader /><main><section className="record-page"><div className="shell record-card"><div className="record-icon"><FileQuestion size={24} /></div><span className="eyebrow">{labels.eyebrow}{params.slug ? ` · ${params.slug}` : ""}</span><h1>{labels.title}</h1><p>{labels.description}</p><div className="record-actions"><Link href="/" className="button button-primary"><ArrowLeft size={16} /> Back to home</Link><Link href="/products" className="button button-outline">Browse catalog</Link></div><div className="record-note"><ShieldCheck size={16} /> BazroKart never invents public business content to fill an empty record.</div></div></section></main><SiteFooter /></div>;
}
