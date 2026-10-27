import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core User table supporting Buyers, Sellers, Admins
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  phone: varchar("phone", { length: 20 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  companyName: varchar("companyName", { length: 255 }),
  gstNumber: varchar("gstNumber", { length: 30 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["buyer", "seller", "admin", "user"]).default("buyer").notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Product Categories & Departments
 */
export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  department: varchar("department", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 64 }),
  description: text("description"),
  itemCount: varchar("itemCount", { length: 64 }),
  displayOrder: int("displayOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * B2B Product Catalogue with MOQ, Tier Pricing, Specifications
 */
export const products = mysqlTable("products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }).notNull(),
  categoryId: varchar("categoryId", { length: 64 }),
  supplierId: int("supplierId"),
  supplierName: varchar("supplierName", { length: 255 }).default("BazroKart Verified Supplier"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  mrp: decimal("mrp", { precision: 12, scale: 2 }).notNull(),
  discount: varchar("discount", { length: 50 }),
  moq: int("moq").default(1).notNull(),
  inStock: boolean("inStock").default(true).notNull(),
  rating: decimal("rating", { precision: 3, scale: 1 }).default("4.8"),
  reviews: int("reviews").default(0),
  sku: varchar("sku", { length: 100 }).notNull(),
  badge: varchar("badge", { length: 100 }),
  badgeColor: varchar("badgeColor", { length: 100 }),
  imageAlt: text("imageAlt"),
  imageUrl: text("imageUrl").notNull(),
  specs: json("specs").$type<Record<string, string>>(),
  leadTime: varchar("leadTime", { length: 100 }).default("Dispatch in 24h"),
  origin: varchar("origin", { length: 255 }).default("Casagrand Royale, Chennai HUB"),
  hsnCode: varchar("hsnCode", { length: 50 }),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Requests for Quotation (RFQs)
 */
export const rfqs = mysqlTable("rfqs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  rfqNumber: varchar("rfqNumber", { length: 64 }).notNull().unique(),
  buyerId: int("buyerId"),
  buyerName: varchar("buyerName", { length: 255 }).notNull(),
  buyerEmail: varchar("buyerEmail", { length: 320 }).notNull(),
  buyerPhone: varchar("buyerPhone", { length: 20 }),
  category: varchar("category", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  quantity: int("quantity").notNull(),
  unit: varchar("unit", { length: 50 }).default("Units").notNull(),
  targetPrice: decimal("targetPrice", { precision: 12, scale: 2 }),
  destinationCity: varchar("destinationCity", { length: 100 }),
  requiredDate: varchar("requiredDate", { length: 100 }),
  status: mysqlEnum("status", ["open", "quoted", "accepted", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Rfq = typeof rfqs.$inferSelect;
export type InsertRfq = typeof rfqs.$inferInsert;

/**
 * Seller Quotations for RFQs
 */
export const quotes = mysqlTable("quotes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  quoteNumber: varchar("quoteNumber", { length: 64 }).notNull().unique(),
  rfqId: varchar("rfqId", { length: 64 }).notNull(),
  supplierId: int("supplierId"),
  supplierName: varchar("supplierName", { length: 255 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  moq: int("moq").default(1).notNull(),
  deliveryDays: int("deliveryDays").default(7).notNull(),
  validUntil: varchar("validUntil", { length: 100 }),
  paymentTerms: varchar("paymentTerms", { length: 255 }).default("100% Against Proforma / GST Invoice"),
  status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

/**
 * B2B Procurement Orders & Invoices
 */
export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderNumber: varchar("orderNumber", { length: 64 }).notNull().unique(),
  buyerId: int("buyerId"),
  buyerName: varchar("buyerName", { length: 255 }).notNull(),
  supplierId: int("supplierId"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  gstAmount: decimal("gstAmount", { precision: 12, scale: 2 }).notNull(),
  items: json("items").$type<Array<{
    productId: string;
    title: string;
    sku: string;
    price: number;
    quantity: number;
    hsnCode?: string;
  }>>().notNull(),
  status: mysqlEnum("status", ["placed", "confirmed", "shipped", "delivered", "cancelled"]).default("placed").notNull(),
  shippingAddress: json("shippingAddress").$type<{
    name: string;
    company: string;
    gstin?: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  }>().notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "credit_term", "failed"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 100 }).default("GST Proforma / Bank Wire"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Subscription Plans & Memberships
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  planName: mysqlEnum("planName", ["basic", "premium", "elite"]).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingInterval: varchar("billingInterval", { length: 50 }).default("monthly").notNull(),
  listingLimit: int("listingLimit").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired"]).default("active").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Business Network Connections & Leads
 */
export const networkConnections = mysqlTable("network_connections", {
  id: varchar("id", { length: 64 }).primaryKey(),
  requesterId: int("requesterId"),
  requesterName: varchar("requesterName", { length: 255 }).notNull(),
  requesterCompany: varchar("requesterCompany", { length: 255 }).notNull(),
  targetCompany: varchar("targetCompany", { length: 255 }).notNull(),
  leadType: varchar("leadType", { length: 100 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["pending", "connected", "declined"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NetworkConnection = typeof networkConnections.$inferSelect;
export type InsertNetworkConnection = typeof networkConnections.$inferInsert;

/**
 * Enterprise Inquiries & Services
 */
export const serviceEnquiries = mysqlTable("service_enquiries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  serviceName: varchar("serviceName", { length: 255 }).notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  userEmail: varchar("userEmail", { length: 320 }).notNull(),
  userPhone: varchar("userPhone", { length: 20 }).notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["submitted", "in_review", "connected"]).default("submitted").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ServiceEnquiry = typeof serviceEnquiries.$inferSelect;
export type InsertServiceEnquiry = typeof serviceEnquiries.$inferInsert;

/**
 * Enterprise Empanelment Applications (Startups, MSMEs, Social Enterprises)
 */
export const enterpriseApplications = mysqlTable("enterprise_applications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  enterpriseCategory: mysqlEnum("enterpriseCategory", ["startup", "msme", "social_enterprise", "innovative_business"]).notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  businessStage: varchar("businessStage", { length: 100 }).notNull(),
  employeeCount: varchar("employeeCount", { length: 50 }),
  annualTurnover: varchar("annualTurnover", { length: 100 }),
  needs: text("needs").notNull(),
  status: mysqlEnum("status", ["submitted", "under_review", "approved"]).default("submitted").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EnterpriseApplication = typeof enterpriseApplications.$inferSelect;
export type InsertEnterpriseApplication = typeof enterpriseApplications.$inferInsert;