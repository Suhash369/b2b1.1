import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  User,
  Category,
  Product,
  Rfq,
  Quote,
  Order,
  Subscription,
  NetworkConnection,
  ServiceEnquiry,
  EnterpriseApplication,
  Notification,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  SUBSCRIPTION_PLANS,
  ENTERPRISE_CATEGORIES,
  SERVICES_LIST,
  NETWORK_COMPANIES,
} from "./data/initialData";
import { connectMongoDB, isMongoConnected } from "./config/database";
import {
  User as MongoUser,
  BuyerProfile,
  SupplierProfile,
  Product as MongoProduct,
  Category as MongoCategory,
  Rfq as MongoRfq,
  Quotation as MongoQuotation,
  Enquiry as MongoEnquiry,
  Notification as MongoNotification,
  SavedProduct as MongoSavedProduct,
  Review as MongoReview,
  Order as MongoOrder,
  Subscription as MongoSubscription,
  NetworkConnection as MongoNetworkConnection,
  ServiceEnquiry as MongoServiceEnquiry,
  EnterpriseApplication as MongoEnterpriseApplication,
} from "./models";
import { logAuditEvent } from "./services/auditService";
import { syncLocalStoreToMongoDB } from "./services/dbInit";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect MySQL:", error);
      _db = null;
    }
  }
  return _db;
}

// -------------------------------------------------------------
// Resilient In-Memory & File-Backed Storage for Reliable Local Ops
// -------------------------------------------------------------
interface LocalStore {
  users: User[];
  categories: Category[];
  products: Product[];
  rfqs: Rfq[];
  quotes: Quote[];
  orders: Order[];
  subscriptions: Subscription[];
  networkConnections: NetworkConnection[];
  serviceEnquiries: ServiceEnquiry[];
  enterpriseApplications: EnterpriseApplication[];
  notifications: Notification[];
}

const BUNDLED_DATA_DIR = path.resolve(process.cwd(), "server", "data");
const BUNDLED_STORE_FILE = path.join(BUNDLED_DATA_DIR, "marketplace-store.json");
const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "server-data")
  : BUNDLED_DATA_DIR;
const STORE_FILE = process.env.VERCEL
  ? path.join(DATA_DIR, "marketplace-store.json")
  : (process.env.NODE_ENV === "test" || process.env.VITEST)
  ? path.join(DATA_DIR, "marketplace-store.test.json")
  : BUNDLED_STORE_FILE;

function createInitialStore(): LocalStore {
  const now = new Date();

  const initialCategories: Category[] = INITIAL_CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    department: c.department,
    icon: c.icon,
    description: c.description,
    itemCount: "No listings yet",
    displayOrder: c.displayOrder,
    createdAt: now,
  }));

  return {
    users: [],
    categories: initialCategories,
    products: [],
    rfqs: [],
    quotes: [],
    orders: [],
    subscriptions: [],
    networkConnections: [],
    serviceEnquiries: [],
    enterpriseApplications: [],
    notifications: [],
  };
}

let localStore: LocalStore;

function initLocalStore(): LocalStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.products)) {
        parsed.notifications = Array.isArray(parsed.notifications) ? parsed.notifications : [];
        return parsed;
      }
    } else if (fs.existsSync(BUNDLED_STORE_FILE)) {
      const content = fs.readFileSync(BUNDLED_STORE_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.products)) {
        parsed.notifications = Array.isArray(parsed.notifications) ? parsed.notifications : [];
        saveLocalStore(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[LocalStore] Could not load existing store, creating fresh:", err);
  }

  const initial = createInitialStore();
  saveLocalStore(initial);
  return initial;
}

function saveLocalStore(store: LocalStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("[LocalStore] Failed to save store:", err);
  }
}

localStore = initLocalStore();

// Asynchronously bootstrap MongoDB connection and sync data in the background
connectMongoDB()
  .then(() => syncLocalStoreToMongoDB(localStore))
  .catch((err) => console.warn("[Database] Background MongoDB connection warning:", err.message));

// -------------------------------------------------------------
// User Operations
// -------------------------------------------------------------
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  // 1. MySQL check if configured
  const db = await getDb();
  if (db) {
    try {
      const values: InsertUser = { openId: user.openId };
      const updateSet: Record<string, unknown> = {};
      const fields = [
        "name",
        "email",
        "loginMethod",
        "phone",
        "companyName",
        "gstNumber",
        "address",
        "city",
        "state",
        "passwordHash",
      ] as const;
      for (const f of fields) {
        if (user[f] !== undefined) {
          (values as any)[f] = user[f] ?? null;
          updateSet[f] = user[f] ?? null;
        }
      }
      if (user.role) {
        values.role = user.role;
        updateSet.role = user.role;
      }
      if (user.isVerified !== undefined) {
        values.isVerified = user.isVerified;
        updateSet.isVerified = user.isVerified;
      }
      values.lastSignedIn = user.lastSignedIn ?? new Date();
      updateSet.lastSignedIn = values.lastSignedIn;
      await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
    } catch (e) {
      console.warn("[Database] MySQL upsert failed:", e);
    }
  }

  // 2. Local fallback update
  const idx = localStore.users.findIndex((u) => u.openId === user.openId);
  const now = new Date();
  let assignedNumericId = idx >= 0 ? localStore.users[idx].id : localStore.users.length + 1;

  if (idx >= 0) {
    localStore.users[idx] = {
      ...localStore.users[idx],
      name: user.name ?? localStore.users[idx].name,
      email: user.email ?? localStore.users[idx].email,
      phone: user.phone ?? localStore.users[idx].phone,
      companyName: user.companyName ?? localStore.users[idx].companyName,
      gstNumber: user.gstNumber ?? localStore.users[idx].gstNumber,
      address: user.address ?? localStore.users[idx].address,
      city: user.city ?? localStore.users[idx].city,
      state: user.state ?? localStore.users[idx].state,
      role: user.role ?? localStore.users[idx].role,
      passwordHash:
        user.passwordHash !== undefined
          ? user.passwordHash ?? null
          : localStore.users[idx].passwordHash,
      isVerified:
        user.isVerified !== undefined ? user.isVerified : localStore.users[idx].isVerified,
      lastSignedIn: now,
      updatedAt: now,
    };
  } else {
    const newUser: User = {
      id: assignedNumericId,
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      phone: user.phone ?? null,
      companyName: user.companyName ?? null,
      gstNumber: user.gstNumber ?? null,
      address: user.address ?? null,
      city: user.city ?? null,
      state: user.state ?? null,
      loginMethod: user.loginMethod ?? "credentials",
      role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "buyer"),
      isVerified: user.isVerified ?? false,
      passwordHash: user.passwordHash ?? null,
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    };
    localStore.users.push(newUser);
  }
  saveLocalStore(localStore);

  // 3. MongoDB primary persistence
  if (isMongoConnected() && user.email) {
    try {
      const normalizedRole = user.role === "seller" ? "supplier" : user.role || "buyer";
      const mongoUser = await MongoUser.findOneAndUpdate(
        { email: user.email.toLowerCase() },
        {
          $set: {
            name: user.name || "Commercial User",
            email: user.email.toLowerCase(),
            passwordHash: user.passwordHash ?? null,
            role: normalizedRole,
            accountStatus: "active",
            emailVerified: Boolean(user.isVerified),
            openId: user.openId,
            numericId: assignedNumericId,
            phone: user.phone || null,
            companyName: user.companyName || null,
            gstNumber: user.gstNumber || null,
            address: user.address || null,
            city: user.city || null,
            state: user.state || null,
            isVerified: Boolean(user.isVerified),
            loginMethod: user.loginMethod || "credentials",
            lastLogin: now,
          },
        },
        { upsert: true, returnDocument: "after" }
      );

      if (mongoUser) {
        if (normalizedRole === "buyer") {
          await BuyerProfile.findOneAndUpdate(
            { userId: mongoUser._id },
            {
              $set: {
                userId: mongoUser._id,
                companyName: user.companyName || user.name,
                businessType: "Commercial Procurement",
                country: "India",
                state: user.state || "Tamil Nadu",
                city: user.city || "Chennai",
                address: user.address || "",
                phone: user.phone || "",
                businessDescription: "Registered buyer on BazroKart commercial network.",
              },
            },
            { upsert: true }
          );
        } else if (normalizedRole === "supplier" || user.role === "seller") {
          await SupplierProfile.findOneAndUpdate(
            { userId: mongoUser._id },
            {
              $set: {
                userId: mongoUser._id,
                companyName: user.companyName || user.name,
                companyType: "OEM Manufacturer & Supplier",
                businessDescription: "Verified manufacturer and component supplier.",
                country: "India",
                state: user.state || "Tamil Nadu",
                city: user.city || "Chennai",
                address: user.address || "",
                contactDetails: {
                  phone: user.phone || "",
                  email: user.email || "",
                  representativeName: user.name || "",
                },
                verificationStatus: user.isVerified ? "verified" : "pending",
              },
            },
            { upsert: true }
          );
        }

        await logAuditEvent({
          userId: mongoUser._id,
          action: idx >= 0 ? "USER_UPDATE" : "USER_REGISTER",
          module: "AUTH",
          recordId: user.openId,
          metadata: { email: user.email, role: normalizedRole },
        });
      }
    } catch (mongoErr: any) {
      console.warn("[MongoDB] Error during user upsert:", mongoErr.message);
    }
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (db) {
    try {
      const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
      if (result.length > 0) return result[0];
    } catch (e) {
      console.warn("[Database] MySQL query failed:", e);
    }
  }

  if (isMongoConnected()) {
    try {
      const mUser = await MongoUser.findOne({ openId });
      if (mUser) {
        return {
          id: mUser.numericId || 1,
          openId: mUser.openId || openId,
          name: mUser.name,
          email: mUser.email,
          phone: mUser.phone || null,
          companyName: mUser.companyName || null,
          gstNumber: mUser.gstNumber || null,
          address: mUser.address || null,
          city: mUser.city || null,
          state: mUser.state || null,
          loginMethod: mUser.loginMethod,
          role: mUser.role === "supplier" ? "seller" : mUser.role,
          isVerified: mUser.isVerified,
          passwordHash: mUser.passwordHash || null,
          createdAt: mUser.createdAt,
          updatedAt: mUser.updatedAt,
          lastSignedIn: mUser.lastLogin || mUser.updatedAt,
        };
      }
    } catch (e) {}
  }

  return localStore.users.find((u) => u.openId === openId);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  if (isMongoConnected() && email) {
    try {
      const mUser = await MongoUser.findOne({ email: email.toLowerCase() });
      if (mUser) {
        return {
          id: mUser.numericId || 1,
          openId: mUser.openId || `usr_${mUser.numericId || Date.now()}`,
          name: mUser.name,
          email: mUser.email,
          phone: mUser.phone || null,
          companyName: mUser.companyName || null,
          gstNumber: mUser.gstNumber || null,
          address: mUser.address || null,
          city: mUser.city || null,
          state: mUser.state || null,
          loginMethod: mUser.loginMethod,
          role: mUser.role === "supplier" ? "seller" : mUser.role,
          isVerified: mUser.isVerified,
          passwordHash: mUser.passwordHash || null,
          createdAt: mUser.createdAt,
          updatedAt: mUser.updatedAt,
          lastSignedIn: mUser.lastLogin || mUser.updatedAt,
        };
      }
    } catch (e) {}
  }
  return localStore.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
}

export async function getUserById(id: number): Promise<User | undefined> {
  if (isMongoConnected() && id) {
    try {
      const mUser = await MongoUser.findOne({ numericId: id });
      if (mUser) {
        return {
          id: mUser.numericId || id,
          openId: mUser.openId || `usr_${id}`,
          name: mUser.name,
          email: mUser.email,
          phone: mUser.phone || null,
          companyName: mUser.companyName || null,
          gstNumber: mUser.gstNumber || null,
          address: mUser.address || null,
          city: mUser.city || null,
          state: mUser.state || null,
          loginMethod: mUser.loginMethod,
          role: mUser.role === "supplier" ? "seller" : mUser.role,
          isVerified: mUser.isVerified,
          passwordHash: mUser.passwordHash || null,
          createdAt: mUser.createdAt,
          updatedAt: mUser.updatedAt,
          lastSignedIn: mUser.lastLogin || mUser.updatedAt,
        };
      }
    } catch (e) {}
  }
  return localStore.users.find((u) => u.id === id);
}

export async function listUsers(): Promise<User[]> {
  return localStore.users;
}

// -------------------------------------------------------------
// Category Operations
// -------------------------------------------------------------
export async function listCategories(): Promise<Category[]> {
  const sorted = [...localStore.categories].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  );
  return sorted.map((c) => {
    const count = localStore.products.filter(
      (p) =>
        p.isPublished &&
        (p.categoryId === c.id || p.department.toLowerCase() === c.name.toLowerCase())
    ).length;
    return {
      ...c,
      itemCount: count > 0 ? `${count} ${count === 1 ? "Product" : "Products"}` : "No listings yet",
    };
  });
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const cat = localStore.categories.find((c) => c.slug === slug);
  if (!cat) return undefined;
  const count = localStore.products.filter(
    (p) =>
      p.isPublished &&
      (p.categoryId === cat.id || p.department.toLowerCase() === cat.name.toLowerCase())
  ).length;
  return {
    ...cat,
    itemCount: count > 0 ? `${count} ${count === 1 ? "Product" : "Products"}` : "No listings yet",
  };
}

// -------------------------------------------------------------
// Product Operations
// -------------------------------------------------------------
export interface ProductFilterParams {
  department?: string;
  categoryId?: string;
  query?: string;
  sort?: "relevance" | "price_asc" | "price_desc" | "rating" | "newest";
  inStockOnly?: boolean;
  includeUnpublished?: boolean;
  supplierId?: number;
}

export async function listProducts(params: ProductFilterParams = {}): Promise<Product[]> {
  let list = localStore.products;

  // By default, filter out unpublished products unless explicitly requested (e.g. supplier workspace)
  if (!params.includeUnpublished) {
    list = list.filter((p) => p.isPublished);
  }

  if (params.supplierId !== undefined) {
    list = list.filter((p) => p.supplierId === params.supplierId);
  }

  if (params.department && params.department !== "All Products" && params.department !== "all") {
    list = list.filter((p) => p.department.toLowerCase() === params.department?.toLowerCase());
  }

  if (params.categoryId) {
    list = list.filter((p) => p.categoryId === params.categoryId);
  }

  if (params.inStockOnly) {
    list = list.filter((p) => p.inStock);
  }

  if (params.query) {
    const q = params.query.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.supplierName && p.supplierName.toLowerCase().includes(q))
    );
  }

  if (params.sort) {
    switch (params.sort) {
      case "price_asc":
        list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price_desc":
        list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "rating":
        list.sort((a, b) => parseFloat(b.rating ?? "0") - parseFloat(a.rating ?? "0"));
        break;
      case "newest":
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
  }

  return list;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return localStore.products.find((p) => p.id === id);
}

export async function getProductBySlug(
  slug: string,
  allowedSupplierId?: number,
  isAdmin?: boolean,
  allowedCompanyName?: string | null
): Promise<(Product & { supplier?: Partial<User> }) | undefined> {
  const product = localStore.products.find((p) => p.slug === slug);
  if (!product) return undefined;
  // Unpublished products are only accessible to their owner supplier or platform admin
  if (!product.isPublished && !isAdmin) {
    const isOwner =
      (allowedSupplierId !== undefined && product.supplierId === allowedSupplierId) ||
      (Boolean(allowedCompanyName) &&
        product.supplierName?.toLowerCase() === allowedCompanyName?.toLowerCase());
    if (!isOwner) {
      return undefined;
    }
  }
  const supplier = product.supplierId
    ? localStore.users.find((u) => u.id === product.supplierId)
    : undefined;
  return {
    ...product,
    supplier: supplier
      ? {
          id: supplier.id,
          name: supplier.name,
          companyName: supplier.companyName,
          city: supplier.city,
          state: supplier.state,
          isVerified: Boolean(supplier.isVerified),
          gstNumber: supplier.gstNumber,
          phone: supplier.phone,
          email: supplier.email,
        }
      : undefined,
  };
}

export async function createProduct(
  input: Omit<Product, "createdAt" | "updatedAt">
): Promise<Product> {
  const now = new Date();
  const product: Product = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  localStore.products.push(product);
  saveLocalStore(localStore);

  // MongoDB persistence
  if (isMongoConnected()) {
    try {
      let finalSlug = product.slug;
      const existingWithSlug = await MongoProduct.findOne({ slug: finalSlug });
      if (existingWithSlug && existingWithSlug.id !== product.id) {
        finalSlug = `${product.slug}-${Date.now().toString().slice(-4)}`;
      }

      await MongoProduct.create({
        id: product.id,
        supplierId: product.supplierId ?? undefined,
        productName: product.title,
        title: product.title,
        slug: finalSlug,
        department: product.department,
        categoryId: product.categoryId ?? undefined,
        supplierName: product.supplierName ?? undefined,
        price: parseFloat(product.price) || 0,
        mrp: product.mrp,
        discount: product.discount,
        minimumOrderQuantity: product.moq || 1,
        moq: product.moq || 1,
        unit: "Units",
        currency: "INR",
        inStock: Boolean(product.inStock),
        availability: Boolean(product.inStock),
        sku: product.sku,
        imageUrl: product.imageUrl,
        images: product.imageUrl ? [product.imageUrl] : [],
        specs: product.specs,
        leadTime: product.leadTime,
        origin: product.origin,
        hsnCode: product.hsnCode,
        isPublished: Boolean(product.isPublished),
        publicationStatus: product.isPublished ? "published" : "draft",
      });

      await logAuditEvent({
        userId: product.supplierId,
        action: "PRODUCT_CREATE",
        module: "PRODUCTS",
        recordId: product.id,
        metadata: { title: product.title, slug: product.slug },
      });
    } catch (e: any) {
      console.warn("[MongoDB] Create product warning:", e.message);
    }
  }

  return product;
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | undefined> {
  const idx = localStore.products.findIndex((p) => p.id === id);
  if (idx < 0) return undefined;
  localStore.products[idx] = {
    ...localStore.products[idx],
    ...updates,
    updatedAt: new Date(),
  };
  saveLocalStore(localStore);

  if (isMongoConnected()) {
    try {
      const mongoUpdates: any = { ...updates };
      if (updates.title) mongoUpdates.productName = updates.title;
      if (updates.price) mongoUpdates.price = parseFloat(updates.price) || 0;
      if (updates.moq) mongoUpdates.minimumOrderQuantity = updates.moq;
      if (updates.isPublished !== undefined) {
        mongoUpdates.publicationStatus = updates.isPublished ? "published" : "draft";
      }
      await MongoProduct.findOneAndUpdate({ id }, { $set: mongoUpdates });

      await logAuditEvent({
        action: "PRODUCT_UPDATE",
        module: "PRODUCTS",
        recordId: id,
        metadata: { updatedFields: Object.keys(updates) },
      });
    } catch (e: any) {}
  }

  return localStore.products[idx];
}

export async function deleteProduct(id: string): Promise<boolean> {
  const before = localStore.products.length;
  localStore.products = localStore.products.filter((p) => p.id !== id);
  const deleted = localStore.products.length < before;
  if (deleted) saveLocalStore(localStore);

  if (isMongoConnected()) {
    try {
      await MongoProduct.deleteOne({ id });
      await logAuditEvent({
        action: "PRODUCT_DELETE",
        module: "PRODUCTS",
        recordId: id,
      });
    } catch (e: any) {}
  }

  return deleted;
}

// -------------------------------------------------------------
// RFQ Operations
// -------------------------------------------------------------
export async function createRfq(
  input: Omit<Rfq, "id" | "rfqNumber" | "status" | "createdAt" | "updatedAt">
): Promise<Rfq> {
  const count = localStore.rfqs.length + 1;
  const id = `rfq_${Date.now()}`;
  const rfqNumber = `RFQ-BZK-${new Date().getFullYear()}-${String(count).padStart(4, "0")}`;
  const now = new Date();

  const newRfq: Rfq = {
    id,
    rfqNumber,
    buyerId: input.buyerId ?? null,
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    buyerPhone: input.buyerPhone ?? null,
    category: input.category,
    title: input.title,
    description: input.description,
    quantity: input.quantity,
    unit: input.unit || "Units",
    targetPrice: input.targetPrice ?? null,
    destinationCity: input.destinationCity ?? null,
    requiredDate: input.requiredDate ?? null,
    status: "open",
    createdAt: now,
    updatedAt: now,
  };

  localStore.rfqs.unshift(newRfq);
  saveLocalStore(localStore);

  // MongoDB persistence
  if (isMongoConnected()) {
    try {
      await MongoRfq.create({
        id,
        rfqNumber,
        buyerId: newRfq.buyerId ?? undefined,
        requirementTitle: newRfq.title,
        title: newRfq.title,
        description: newRfq.description,
        category: newRfq.category,
        quantity: newRfq.quantity,
        unit: newRfq.unit,
        targetPrice: newRfq.targetPrice ?? undefined,
        currency: "INR",
        destinationCity: newRfq.destinationCity ?? undefined,
        deliveryLocation: newRfq.destinationCity ?? undefined,
        requiredDate: newRfq.requiredDate ?? undefined,
        buyerName: newRfq.buyerName,
        buyerEmail: newRfq.buyerEmail,
        buyerPhone: newRfq.buyerPhone ?? undefined,
        status: "open",
      });

      await logAuditEvent({
        userId: newRfq.buyerId,
        action: "RFQ_CREATE",
        module: "RFQS",
        recordId: rfqNumber,
        metadata: { title: newRfq.title, buyerEmail: newRfq.buyerEmail },
      });
    } catch (e: any) {}
  }

  // Notify registered sellers about the new RFQ
  const sellers = localStore.users.filter((u) => (u.role as string) === "seller" || (u.role as string) === "supplier");
  for (const s of sellers) {
    createNotification({
      userId: s.id,
      title: "New RFQ Received",
      message: `${newRfq.buyerName} requested quote for ${newRfq.quantity} ${newRfq.unit} of "${newRfq.title}"`,
      type: "rfq",
      link: "/workspace",
    }).catch(() => {});
  }

  return newRfq;
}

export async function listRfqs(buyerEmail?: string): Promise<Rfq[]> {
  if (buyerEmail) {
    return localStore.rfqs.filter(
      (r) => r.buyerEmail.toLowerCase() === buyerEmail.toLowerCase()
    );
  }
  return localStore.rfqs;
}

export async function getRfqById(id: string): Promise<Rfq | undefined> {
  return localStore.rfqs.find((r) => r.id === id || r.rfqNumber === id);
}

export async function updateRfqStatus(
  id: string,
  status: "open" | "quoted" | "accepted" | "closed"
): Promise<Rfq | undefined> {
  const rfq = localStore.rfqs.find((r) => r.id === id || r.rfqNumber === id);
  if (!rfq) return undefined;
  rfq.status = status;
  rfq.updatedAt = new Date();
  saveLocalStore(localStore);

  if (isMongoConnected()) {
    try {
      await MongoRfq.findOneAndUpdate(
        { $or: [{ id }, { rfqNumber: id }] },
        { $set: { status } }
      );
      await logAuditEvent({
        action: "RFQ_STATUS_UPDATE",
        module: "RFQS",
        recordId: id,
        metadata: { status },
      });
    } catch (e: any) {}
  }

  return rfq;
}

// -------------------------------------------------------------
// Quotation Operations
// -------------------------------------------------------------
export async function createQuote(
  input: Omit<Quote, "id" | "quoteNumber" | "status" | "createdAt">
): Promise<Quote> {
  const count = localStore.quotes.length + 1;
  const id = `qt_${Date.now()}`;
  const quoteNumber = `QT-BZK-${String(count).padStart(4, "0")}`;
  const now = new Date();

  const newQuote: Quote = {
    id,
    quoteNumber,
    rfqId: input.rfqId,
    supplierId: input.supplierId ?? null,
    supplierName: input.supplierName,
    unitPrice: input.unitPrice,
    totalAmount: input.totalAmount,
    moq: input.moq || 1,
    deliveryDays: input.deliveryDays || 7,
    validUntil: input.validUntil ?? "30 Days from Issue",
    paymentTerms: input.paymentTerms ?? "100% Proforma against GST Invoice",
    notes: input.notes ?? null,
    status: "pending",
    createdAt: now,
  };

  localStore.quotes.unshift(newQuote);
  // Also update rfq status
  await updateRfqStatus(input.rfqId, "quoted");
  saveLocalStore(localStore);

  // MongoDB persistence
  if (isMongoConnected()) {
    try {
      await MongoQuotation.create({
        id,
        quoteNumber,
        rfqId: newQuote.rfqId,
        supplierId: newQuote.supplierId ?? undefined,
        supplierName: newQuote.supplierName,
        unitPrice: newQuote.unitPrice,
        totalAmount: newQuote.totalAmount,
        quantity: newQuote.moq,
        moq: newQuote.moq,
        deliveryDays: newQuote.deliveryDays,
        validUntil: newQuote.validUntil ?? undefined,
        validity: newQuote.validUntil ?? undefined,
        paymentTerms: newQuote.paymentTerms ?? undefined,
        commercialTerms: newQuote.paymentTerms ?? undefined,
        notes: newQuote.notes ?? undefined,
        status: "submitted",
      });

      await logAuditEvent({
        userId: newQuote.supplierId,
        action: "QUOTATION_CREATE",
        module: "QUOTATIONS",
        recordId: quoteNumber,
        metadata: { rfqId: newQuote.rfqId, totalAmount: newQuote.totalAmount },
      });
    } catch (e: any) {}
  }

  // Notify buyer who created the RFQ
  const targetRfq = localStore.rfqs.find((r) => r.id === input.rfqId);
  if (targetRfq?.buyerId) {
    await createNotification({
      userId: targetRfq.buyerId,
      title: "Quotation Received",
      message: `${newQuote.supplierName} submitted quotation ${newQuote.quoteNumber} (₹${newQuote.totalAmount}) for RFQ ${targetRfq.rfqNumber}`,
      type: "quote",
      link: "/workspace",
    }).catch(() => {});
  }

  return newQuote;
}

export async function listQuotesForRfq(rfqId: string): Promise<Quote[]> {
  return localStore.quotes.filter((q) => q.rfqId === rfqId);
}

export async function getQuoteById(id: string): Promise<Quote | undefined> {
  return localStore.quotes.find((q) => q.id === id || q.quoteNumber === id);
}

export async function updateQuoteStatus(
  id: string,
  status: "pending" | "accepted" | "rejected"
): Promise<Quote | undefined> {
  const quote = localStore.quotes.find((q) => q.id === id || q.quoteNumber === id);
  if (!quote) return undefined;
  quote.status = status;

  if (status === "accepted") {
    await updateRfqStatus(quote.rfqId, "accepted");
    if (quote.supplierId) {
      createNotification({
        userId: quote.supplierId,
        title: "Quotation Accepted!",
        message: `Your quotation ${quote.quoteNumber} has been accepted by the buyer.`,
        type: "quote",
        link: "/workspace",
      }).catch(() => {});
    }
  }

  saveLocalStore(localStore);

  if (isMongoConnected()) {
    try {
      await MongoQuotation.findOneAndUpdate(
        { $or: [{ id }, { quoteNumber: id }] },
        { $set: { status: status === "pending" ? "submitted" : status } }
      );
      await logAuditEvent({
        action: "QUOTATION_STATUS_UPDATE",
        module: "QUOTATIONS",
        recordId: id,
        metadata: { status },
      });
    } catch (e: any) {}
  }

  return quote;
}

export async function listAllQuotes(supplierId?: number): Promise<Quote[]> {
  if (supplierId) {
    return localStore.quotes.filter((q) => q.supplierId === supplierId);
  }
  return localStore.quotes;
}

export interface SupplierProfile {
  id: string | number;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  companyName: string;
  gstNumber?: string;
  address?: string;
  city: string;
  state: string;
  isVerified: boolean;
  departments: string[];
  productCount: number;
  rating?: string;
  badge?: string;
  description: string;
  products?: Product[];
}

export async function listSuppliers(query?: string): Promise<SupplierProfile[]> {
  const map = new Map<string, SupplierProfile>();

  // Collect exclusively from genuine registered seller users
  const sellers = localStore.users.filter((u) => (u.role as string) === "seller" || (u.role as string) === "supplier");
  for (const s of sellers) {
    const sName = s.companyName || s.name || "Empaneled Supplier";
    const slug = sName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const prods = localStore.products.filter(
      (p) =>
        p.isPublished &&
        (p.supplierId === s.id ||
          (p.supplierName && p.supplierName.toLowerCase() === sName.toLowerCase()))
    );
    const depts = Array.from(new Set(prods.map((p) => p.department)));

    map.set(slug, {
      id: s.id,
      name: s.name || sName,
      slug,
      email: s.email || undefined,
      phone: s.phone || undefined,
      companyName: sName,
      gstNumber: s.gstNumber || undefined,
      address: s.address || undefined,
      city: s.city || "India",
      state: s.state || "",
      isVerified: Boolean(s.isVerified),
      departments: depts.length ? depts : ["Industrial & Commercial Supply"],
      productCount: prods.length,
      rating: undefined, // Only display genuine database ratings
      badge: s.isVerified ? "Verified Supplier" : "Registered Supplier",
      description: s.companyName
        ? `${sName} is an empaneled wholesale supplier on BazroKart offering trade supply and B2B ordering.`
        : "Registered supplier on the BazroKart wholesale marketplace.",
    });
  }

  let list = Array.from(map.values());
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(
      (s) =>
        s.companyName.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.departments.some((d) => d.toLowerCase().includes(q))
    );
  }
  return list;
}

export async function getSupplierBySlug(slug: string): Promise<SupplierProfile | undefined> {
  const all = await listSuppliers();
  const normalized = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const supplier = all.find((s) => s.slug === normalized || String(s.id) === slug);
  if (!supplier) return undefined;
  const prods = localStore.products.filter(
    (p) =>
      p.isPublished &&
      (p.supplierId === supplier.id ||
        (p.supplierName && p.supplierName.toLowerCase() === supplier.companyName.toLowerCase()))
  );
  return { ...supplier, products: prods };
}

// -------------------------------------------------------------
// Order & Fulfillment Operations
// -------------------------------------------------------------
export async function createOrder(
  input: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">
): Promise<Order> {
  const count = localStore.orders.length + 1;
  const id = `ord_${Date.now()}`;
  const orderNumber = `BZK-PO-${new Date().getFullYear()}-${String(count).padStart(5, "0")}`;
  const now = new Date();

  const newOrder: Order = {
    id,
    orderNumber,
    buyerId: input.buyerId ?? null,
    buyerName: input.buyerName,
    supplierId: input.supplierId ?? null,
    totalAmount: input.totalAmount,
    gstAmount: input.gstAmount,
    items: input.items,
    status: input.status ?? "placed",
    shippingAddress: input.shippingAddress,
    paymentStatus: input.paymentStatus ?? "pending",
    paymentMethod: input.paymentMethod ?? "GST Proforma Wire",
    createdAt: now,
    updatedAt: now,
  };

  localStore.orders.unshift(newOrder);
  saveLocalStore(localStore);

  if (isMongoConnected()) {
    try {
      await MongoOrder.create({
        id,
        orderNumber,
        buyerId: newOrder.buyerId ?? undefined,
        supplierId: newOrder.supplierId ?? undefined,
        buyerName: newOrder.buyerName,
        totalAmount: newOrder.totalAmount,
        currency: "INR",
        gstAmount: newOrder.gstAmount,
        items: newOrder.items,
        products: Array.isArray(newOrder.items)
          ? newOrder.items.map((it: any) => ({
              productId: it.productId,
              productName: it.title,
              quantity: it.quantity,
              unitPrice: it.price,
              totalPrice: it.price * it.quantity,
            }))
          : [],
        orderStatus: newOrder.status,
        status: newOrder.status,
        shippingAddress: newOrder.shippingAddress,
        paymentStatus: newOrder.paymentStatus,
        paymentMethod: newOrder.paymentMethod ?? undefined,
      });

      await logAuditEvent({
        userId: newOrder.buyerId,
        action: "ORDER_CREATE",
        module: "ORDERS",
        recordId: orderNumber,
        metadata: { totalAmount: newOrder.totalAmount },
      });
    } catch (e: any) {}
  }

  if (newOrder.buyerId) {
    createNotification({
      userId: newOrder.buyerId,
      title: "Order Placed",
      message: `Purchase order ${newOrder.orderNumber} (₹${newOrder.totalAmount}) placed successfully.`,
      type: "order",
      link: "/workspace",
    }).catch(() => {});
  }
  if (newOrder.supplierId) {
    createNotification({
      userId: newOrder.supplierId,
      title: "New Purchase Order",
      message: `New Order ${newOrder.orderNumber} received from ${newOrder.buyerName}.`,
      type: "order",
      link: "/workspace",
    }).catch(() => {});
  }

  return newOrder;
}

export async function listOrders(buyerId?: number): Promise<Order[]> {
  if (buyerId !== undefined) {
    return localStore.orders.filter((o) => o.buyerId === buyerId);
  }
  return localStore.orders;
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  return localStore.orders.find((o) => o.id === id || o.orderNumber === id);
}

export async function updateOrderStatus(
  id: string,
  status: Order["status"],
  paymentStatus?: Order["paymentStatus"]
): Promise<Order | undefined> {
  const order = localStore.orders.find((o) => o.id === id || o.orderNumber === id);
  if (!order) return undefined;
  order.status = status;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  order.updatedAt = new Date();
  saveLocalStore(localStore);

  if (isMongoConnected()) {
    try {
      const updateData: any = { status, orderStatus: status };
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      await MongoOrder.findOneAndUpdate({ $or: [{ id }, { orderNumber: id }] }, { $set: updateData });

      await logAuditEvent({
        action: "ORDER_STATUS_UPDATE",
        module: "ORDERS",
        recordId: id,
        metadata: { status, paymentStatus },
      });
    } catch (e: any) {}
  }

  return order;
}

// -------------------------------------------------------------
// Subscriptions
// -------------------------------------------------------------
export async function getSubscriptionPlans() {
  return SUBSCRIPTION_PLANS;
}

export async function createSubscription(
  userId: number,
  planName: "basic" | "premium" | "elite"
): Promise<Subscription> {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planName) || SUBSCRIPTION_PLANS[0];
  const now = new Date();
  const sub: Subscription = {
    id: `sub_${Date.now()}`,
    userId,
    planName,
    price: plan.price.toFixed(2),
    billingInterval: "monthly",
    listingLimit: plan.listingLimit,
    status: "active",
    startedAt: now,
    expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
  };
  localStore.subscriptions = localStore.subscriptions.filter((s) => s.userId !== userId);
  localStore.subscriptions.push(sub);
  saveLocalStore(localStore);

  if (isMongoConnected()) {
    try {
      await MongoSubscription.create({
        id: sub.id,
        userId: sub.userId,
        planName: sub.planName,
        startDate: sub.startedAt,
        endDate: sub.expiresAt,
        status: "active",
      });
    } catch (e: any) {}
  }

  return sub;
}

export async function getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
  return localStore.subscriptions.find((s) => s.userId === userId && s.status === "active");
}

// -------------------------------------------------------------
// Business Networks
// -------------------------------------------------------------
export interface NetworkMember {
  id: string;
  name: string;
  category: string;
  city: string;
  gstin: string;
  isVerified: boolean;
  rating: string;
  activeRequirements: string;
}

export async function listNetworkMembers(): Promise<NetworkMember[]> {
  const members: NetworkMember[] = [];
  const seenNames = new Set<string>();

  const categoryLabels: Record<string, string> = {
    startup: "Startup Innovation Hub",
    msme: "MSME Manufacturing & Sourcing",
    social_enterprise: "Social Enterprise & Cooperatives",
    innovative_business: "Industrial Technology & Systems",
  };

  // 1. Entities from Enterprise Empanelment Applications
  const apps = localStore.enterpriseApplications || [];
  for (const app of apps) {
    if (!app.companyName || !app.companyName.trim()) continue;
    const norm = app.companyName.trim().toLowerCase();
    if (seenNames.has(norm)) continue;
    seenNames.add(norm);

    const matchedUser = localStore.users.find(
      (u) =>
        (u.email && app.email && u.email.trim().toLowerCase() === app.email.trim().toLowerCase()) ||
        (u.companyName && u.companyName.trim().toLowerCase() === norm)
    );

    const gstin = matchedUser?.gstNumber || "Empanelment Registered";
    const city = app.city ? (app.state ? `${app.city}, ${app.state}` : app.city) : "Pan-India";

    members.push({
      id: app.id,
      name: app.companyName.trim(),
      category: categoryLabels[app.enterpriseCategory] || "Enterprise Partner Network",
      city,
      gstin,
      isVerified: true,
      rating: "4.9",
      activeRequirements: app.needs || "Direct Sourcing & Verified Supply Agreements",
    });
  }

  // 2. Commercial entities who registered and applied for empanelment
  const registeredCommercial = localStore.users.filter(
    (u) =>
      u.companyName &&
      u.companyName.trim().length > 0 &&
      !seenNames.has(u.companyName.trim().toLowerCase()) &&
      ((u.role as string) === "seller" || u.role === "buyer" || (u.role as string) === "supplier") &&
      apps.some(
        (app) =>
          (app.email && u.email && app.email.trim().toLowerCase() === u.email.trim().toLowerCase()) ||
          (app.companyName &&
            app.companyName.trim().toLowerCase() === u.companyName?.trim().toLowerCase())
      )
  );

  for (const u of registeredCommercial) {
    const norm = u.companyName!.trim().toLowerCase();
    if (seenNames.has(norm)) continue;
    seenNames.add(norm);

    const city = u.city ? (u.state ? `${u.city}, ${u.state}` : u.city) : "Pan-India";
    members.push({
      id: `usr-ent-${u.id}`,
      name: u.companyName!.trim(),
      category:
        (u.role as string) === "seller" || (u.role as string) === "supplier"
          ? "Empaneled Manufacturer & Supplier"
          : "Empaneled Procurement Entity",
      city,
      gstin: u.gstNumber || "GST Verified",
      isVerified: true,
      rating: "5.0",
      activeRequirements:
        (u.role as string) === "seller" || (u.role as string) === "supplier"
          ? "OEM Production Lots & Commercial Dispatches"
          : "High-Volume Factory Procurement",
    });
  }

  return members;
}

export async function createNetworkConnection(
  input: Omit<NetworkConnection, "id" | "status" | "createdAt">
): Promise<NetworkConnection> {
  const conn: NetworkConnection = {
    id: `net_${Date.now()}`,
    requesterId: input.requesterId ?? null,
    requesterName: input.requesterName,
    requesterCompany: input.requesterCompany,
    targetCompany: input.targetCompany,
    leadType: input.leadType,
    message: input.message,
    status: "pending",
    createdAt: new Date(),
  };
  localStore.networkConnections.unshift(conn);
  saveLocalStore(localStore);

  if (isMongoConnected()) {
    try {
      await MongoNetworkConnection.create(conn);
    } catch (e: any) {}
  }

  return conn;
}

// -------------------------------------------------------------
// Services & Enterprises
// -------------------------------------------------------------
export async function listServices() {
  return SERVICES_LIST;
}

export async function createServiceEnquiry(
  input: Omit<ServiceEnquiry, "id" | "status" | "createdAt">
): Promise<ServiceEnquiry> {
  const enquiry: ServiceEnquiry = {
    id: `svc_${Date.now()}`,
    serviceName: input.serviceName,
    userName: input.userName,
    userEmail: input.userEmail,
    userPhone: input.userPhone,
    companyName: input.companyName,
    message: input.message,
    status: "submitted",
    createdAt: new Date(),
  };
  localStore.serviceEnquiries.unshift(enquiry);
  saveLocalStore(localStore);

  if (isMongoConnected()) {
    try {
      await MongoServiceEnquiry.create(enquiry);
    } catch (e: any) {}
  }

  return enquiry;
}

export async function listEnterpriseCategories() {
  return ENTERPRISE_CATEGORIES;
}

export async function createEnterpriseApplication(
  input: Omit<EnterpriseApplication, "id" | "status" | "createdAt">
): Promise<EnterpriseApplication> {
  const app: EnterpriseApplication = {
    id: `ent_${Date.now()}`,
    enterpriseCategory: input.enterpriseCategory,
    companyName: input.companyName,
    contactPerson: input.contactPerson,
    email: input.email,
    phone: input.phone,
    city: input.city,
    state: input.state,
    businessStage: input.businessStage,
    employeeCount: input.employeeCount ?? null,
    annualTurnover: input.annualTurnover ?? null,
    needs: input.needs,
    status: "submitted",
    createdAt: new Date(),
  };
  localStore.enterpriseApplications.unshift(app);
  saveLocalStore(localStore);

  if (isMongoConnected()) {
    try {
      await MongoEnterpriseApplication.create(app);
    } catch (e: any) {}
  }

  return app;
}

// -------------------------------------------------------------
// Admin Overview Stats
// -------------------------------------------------------------
export async function getAdminStats() {
  return {
    totalUsers: localStore.users.length,
    totalProducts: localStore.products.length,
    totalRfqs: localStore.rfqs.length,
    totalOrders: localStore.orders.length,
    totalQuotes: localStore.quotes.length,
    activeSubscriptions: localStore.subscriptions.filter((s) => s.status === "active").length,
    pendingVerifications: localStore.users.filter((u) => !u.isVerified).length,
  };
}

// -------------------------------------------------------------
// Notification Operations
// -------------------------------------------------------------
export async function createNotification(input: {
  userId: number;
  title: string;
  message: string;
  type?: "rfq" | "quote" | "order" | "system";
  link?: string;
}): Promise<Notification> {
  const notif: Notification = {
    id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type || "system",
    link: input.link || null,
    isRead: false,
    createdAt: new Date(),
  };
  localStore.notifications = localStore.notifications || [];
  localStore.notifications.unshift(notif);
  saveLocalStore(localStore);

  if (isMongoConnected()) {
    try {
      await MongoNotification.create({
        id: notif.id,
        userId: notif.userId,
        notificationType: notif.type,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        link: notif.link,
        isRead: false,
      });
    } catch (e: any) {}
  }

  return notif;
}

export async function listNotifications(userId: number): Promise<Notification[]> {
  localStore.notifications = localStore.notifications || [];
  return localStore.notifications.filter((n) => n.userId === userId);
}

export async function markNotificationAsRead(id: string, userId: number): Promise<boolean> {
  localStore.notifications = localStore.notifications || [];
  const notif = localStore.notifications.find(
    (n) => (n.id === id || String(n.id) === id) && n.userId === userId
  );
  if (notif) {
    notif.isRead = true;
    saveLocalStore(localStore);
  }

  if (isMongoConnected()) {
    try {
      const orConditions: any[] = [{ id }];
      if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      await MongoNotification.updateMany(
        { $or: orConditions },
        { $set: { isRead: true } }
      );
    } catch (e: any) {
      console.warn("[MongoDB] Mark notification as read warning:", e.message);
    }
  }

  return true;
}

export async function getUnreadNotificationsCount(userId: number): Promise<number> {
  localStore.notifications = localStore.notifications || [];
  return localStore.notifications.filter((n) => n.userId === userId && !n.isRead).length;
}

// -------------------------------------------------------------
// Saved Products & Reviews Operations (MERN Marketplace Extensions)
// -------------------------------------------------------------
export async function saveProduct(buyerId: any, productId: string, supplierId?: any) {
  if (isMongoConnected()) {
    try {
      return await MongoSavedProduct.findOneAndUpdate(
        { buyerId, productId },
        { $set: { buyerId, productId, supplierId } },
        { upsert: true, returnDocument: "after" }
      );
    } catch (e: any) {}
  }
  return null;
}

export async function unsaveProduct(buyerId: any, productId: string) {
  if (isMongoConnected()) {
    try {
      const res = await MongoSavedProduct.deleteOne({ buyerId, productId });
      return res.deletedCount > 0;
    } catch (e: any) {}
  }
  return false;
}

export async function listSavedProducts(buyerId: any) {
  if (isMongoConnected()) {
    try {
      return await MongoSavedProduct.find({ buyerId }).sort({ createdAt: -1 });
    } catch (e: any) {}
  }
  return [];
}

export async function createReview(
  buyerId: any,
  supplierId: any,
  rating: number,
  review?: string,
  productId?: string
) {
  if (isMongoConnected()) {
    try {
      const rev = await MongoReview.create({
        buyerId,
        supplierId,
        rating,
        review,
        productId,
      });
      await logAuditEvent({
        userId: buyerId,
        action: "REVIEW_CREATE",
        module: "REVIEWS",
        recordId: rev._id.toString(),
        metadata: { supplierId, rating },
      });
      return rev;
    } catch (e: any) {}
  }
  return null;
}

export async function listReviewsForSupplier(supplierId: any) {
  if (isMongoConnected()) {
    try {
      return await MongoReview.find({ supplierId }).sort({ createdAt: -1 });
    } catch (e: any) {}
  }
  return [];
}

export async function createEnquiry(
  buyerId: any,
  supplierId: any,
  message: string,
  quantity?: number,
  productId?: string
) {
  if (isMongoConnected()) {
    try {
      const enq = await MongoEnquiry.create({
        buyerId,
        supplierId,
        message,
        quantity,
        productId,
        status: "new",
      });
      await logAuditEvent({
        userId: buyerId,
        action: "ENQUIRY_CREATE",
        module: "ENQUIRIES",
        recordId: enq._id.toString(),
        metadata: { supplierId },
      });
      return enq;
    } catch (e: any) {}
  }
  return null;
}
