export interface Product {
  id: string;
  department: string;
  title: string;
  price: number;
  mrp: number;
  discount?: string | null;
  badge?: string | null;
  badgeColor?: string | null;
  rating?: number | string | null;
  reviews?: number | null;
  sku: string;
  imageAlt?: string | null;
  imageUrl: string;
  inStock: boolean;
  moq?: number;
  supplierName?: string | null;
  specs?: Record<string, string> | null;
  leadTime?: string | null;
  origin?: string | null;
  hsnCode?: string | null;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface RFQSubmission {
  departmentOrSku: string;
  quantity: string;
  gstin: string;
  contactName: string;
  phone: string;
  pincode: string;
  notes?: string;
  timestamp: string;
  rfqId: string;
}

export interface HeroSlide {
  id: number;
  badge: string;
  badgeIcon: string;
  titlePart1: string;
  titleHighlight: string;
  description: string;
  ctaText: string;
  ctaAction: "catalog" | "electronics" | "solar";
  secondaryCtaText: string;
  secondaryCtaAction: "rfq" | "tax-calc";
  tagTitle: string;
  tagSubtitle: string;
  tagBadge: string;
  tagBadgeColor: string;
  imageSrc: string;
  imageAlt: string;
  tabLabel: string;
}

export interface Rfq {
  id: string;
  rfqNumber: string;
  buyerId?: number | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string | null;
  category: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  targetPrice?: string | null;
  destinationCity?: string | null;
  requiredDate?: string | null;
  status: "open" | "quoted" | "accepted" | "closed";
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  rfqId: string;
  supplierId?: number | null;
  supplierName: string;
  unitPrice: string;
  totalAmount: string;
  moq: number;
  deliveryDays: number;
  validUntil?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  status: "pending" | "accepted" | "rejected";
  createdAt: string | Date;
}
