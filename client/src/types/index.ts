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
