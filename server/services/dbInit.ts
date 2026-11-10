import fs from "fs";
import path from "path";
import { connectMongoDB, isMongoConnected } from "../config/database";
import {
  User,
  BuyerProfile,
  SupplierProfile,
  Product,
  Category,
  Rfq,
  Quotation,
  Notification,
  Order,
  Subscription,
  NetworkConnection,
  ServiceEnquiry,
  EnterpriseApplication,
} from "../models";
import { logAuditEvent } from "./auditService";

const DATA_DIR = path.resolve(process.cwd(), "server", "data");
const STORE_FILE = path.join(DATA_DIR, "marketplace-store.json");

function persistLocalStore(store: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (e) {
    console.error("[DBInit] Failed to persist localStore:", e);
  }
}

export async function syncLocalStoreToMongoDB(localStore: any): Promise<void> {
  if (!isMongoConnected()) {
    await connectMongoDB();
  }
  if (!isMongoConnected()) {
    console.warn("[DBInit] MongoDB is not connected; skipping initial sync.");
    return;
  }

  console.log("[DBInit] Synchronizing collections into dedicated 'bazrokart' MongoDB database...");

  try {
    // 1. Sync Categories
    if (localStore.categories && localStore.categories.length > 0) {
      for (const cat of localStore.categories) {
        await Category.findOneAndUpdate(
          { slug: cat.slug },
          {
            $set: {
              id: cat.id,
              categoryName: cat.name,
              slug: cat.slug,
              name: cat.name,
              department: cat.department,
              icon: cat.icon,
              description: cat.description,
              displayOrder: cat.displayOrder || 0,
              status: "active",
            },
          },
          { upsert: true, returnDocument: "after" }
        );
      }
      console.log(`[DBInit] Synced ${localStore.categories.length} categories to MongoDB.`);
    }

    // 2. Sync Users & Profiles (Authoritative MongoDB Sync)
    // Deleting a user in MongoDB must cascade-delete profiles and prune localStore
    const allMongoUsers = await User.find({});
    const activeUserIds = allMongoUsers.map((u) => u._id);
    const activeEmails = new Set(allMongoUsers.map((u) => u.email.toLowerCase()));

    // Clean up any orphaned profiles whose user was deleted from the users collection
    if (activeUserIds.length > 0) {
      await BuyerProfile.deleteMany({ userId: { $nin: activeUserIds } });
      await SupplierProfile.deleteMany({ userId: { $nin: activeUserIds } });
    } else {
      await BuyerProfile.deleteMany({});
      await SupplierProfile.deleteMany({});
    }

    // Prune deleted users from localStore.users so deleted accounts never resurrect
    if (localStore.users && localStore.users.length > 0) {
      localStore.users = localStore.users.filter(
        (u: any) => u.email && activeEmails.has(u.email.toLowerCase())
      );
    } else if (!localStore.users) {
      localStore.users = [];
    }

    // Populate active MongoDB users into localStore.users
    for (const mUser of allMongoUsers) {
      const exists = localStore.users.some(
        (u: any) => u.email && u.email.toLowerCase() === mUser.email.toLowerCase()
      );
      if (!exists) {
        localStore.users.push({
          id: mUser.numericId || localStore.users.length + 1,
          openId: mUser.openId || `usr_${mUser.numericId || Date.now()}`,
          name: mUser.name,
          email: mUser.email,
          phone: mUser.phone || null,
          companyName: mUser.companyName || null,
          gstNumber: mUser.gstNumber || null,
          address: mUser.address || null,
          city: mUser.city || null,
          state: mUser.state || null,
          loginMethod: mUser.loginMethod || "credentials",
          role: mUser.role === "supplier" ? "seller" : mUser.role,
          isVerified: Boolean(mUser.isVerified),
          passwordHash: mUser.passwordHash || null,
          createdAt: mUser.createdAt,
          updatedAt: mUser.updatedAt,
          lastSignedIn: mUser.lastLogin || mUser.updatedAt,
        });
      }
    }
    persistLocalStore(localStore);
    console.log(`[DBInit] Authoritative user sync complete (${allMongoUsers.length} active users in MongoDB).`);

    // 3. Sync Products
    if (localStore.products && localStore.products.length > 0) {
      for (const p of localStore.products) {
        await Product.findOneAndUpdate(
          { slug: p.slug },
          {
            $set: {
              id: p.id,
              supplierId: p.supplierId,
              productName: p.title,
              title: p.title,
              slug: p.slug,
              department: p.department,
              categoryId: p.categoryId,
              supplierName: p.supplierName,
              price: parseFloat(p.price) || 0,
              mrp: p.mrp,
              discount: p.discount,
              minimumOrderQuantity: p.moq || 1,
              moq: p.moq || 1,
              unit: "Units",
              currency: "INR",
              inStock: Boolean(p.inStock),
              availability: Boolean(p.inStock),
              sku: p.sku,
              imageUrl: p.imageUrl,
              images: p.imageUrl ? [p.imageUrl] : [],
              specs: p.specs,
              leadTime: p.leadTime,
              origin: p.origin,
              hsnCode: p.hsnCode,
              isPublished: Boolean(p.isPublished),
              publicationStatus: p.isPublished ? "published" : "draft",
            },
          },
          { upsert: true }
        );
      }
      console.log(`[DBInit] Synced ${localStore.products.length} products to MongoDB.`);
    }

    // 4. Sync RFQs
    if (localStore.rfqs && localStore.rfqs.length > 0) {
      for (const r of localStore.rfqs) {
        await Rfq.findOneAndUpdate(
          { rfqNumber: r.rfqNumber || r.id },
          {
            $set: {
              id: r.id,
              rfqNumber: r.rfqNumber || r.id,
              buyerId: r.buyerId,
              buyerName: r.buyerName,
              buyerEmail: r.buyerEmail,
              buyerPhone: r.buyerPhone,
              category: r.category,
              title: r.title,
              requirementTitle: r.title,
              description: r.description,
              quantity: r.quantity,
              unit: r.unit || "Units",
              targetPrice: r.targetPrice,
              destinationCity: r.destinationCity,
              deliveryLocation: r.destinationCity,
              requiredDate: r.requiredDate,
              status: r.status || "open",
            },
          },
          { upsert: true }
        );
      }
      console.log(`[DBInit] Synced ${localStore.rfqs.length} RFQs to MongoDB.`);
    }

    // 5. Sync Quotes
    if (localStore.quotes && localStore.quotes.length > 0) {
      for (const q of localStore.quotes) {
        await Quotation.findOneAndUpdate(
          { quoteNumber: q.quoteNumber || q.id },
          {
            $set: {
              id: q.id,
              quoteNumber: q.quoteNumber || q.id,
              rfqId: q.rfqId,
              supplierId: q.supplierId,
              supplierName: q.supplierName,
              unitPrice: q.unitPrice,
              totalAmount: q.totalAmount,
              quantity: q.moq || 1,
              moq: q.moq || 1,
              deliveryDays: q.deliveryDays,
              validUntil: q.validUntil,
              paymentTerms: q.paymentTerms,
              notes: q.notes,
              status: q.status || "submitted",
            },
          },
          { upsert: true }
        );
      }
      console.log(`[DBInit] Synced ${localStore.quotes.length} quotations to MongoDB.`);
    }

    // 6. Sync Subscriptions
    if (localStore.subscriptions && localStore.subscriptions.length > 0) {
      for (const s of localStore.subscriptions) {
        await Subscription.findOneAndUpdate(
          { id: s.id },
          {
            $set: {
              id: s.id,
              userId: s.userId,
              planName: s.planName,
              startDate: new Date(s.startedAt || Date.now()),
              endDate: new Date(s.expiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: s.status || "active",
            },
          },
          { upsert: true }
        );
      }
    }

    // Record audit event
    await logAuditEvent({
      action: "INITIAL_DATABASE_SYNC",
      module: "SYSTEM",
      recordId: "bazrokart-database-init",
      metadata: {
        database: "bazrokart",
        syncedCategories: localStore.categories?.length || 0,
        syncedUsers: localStore.users?.length || 0,
      },
    });

    console.log("[DBInit] MongoDB dedicated 'bazrokart' database initialization completed successfully.");
  } catch (err: any) {
    console.error("[DBInit] Error syncing store to MongoDB:", err.message);
  }
}
