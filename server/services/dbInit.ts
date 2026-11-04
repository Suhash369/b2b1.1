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

    // 2. Sync Users & Profiles
    if (localStore.users && localStore.users.length > 0) {
      let syncedUsers = 0;
      for (const u of localStore.users) {
        if (!u.email) continue;
        const normalizedRole = u.role === "seller" ? "supplier" : u.role || "buyer";

        const userDoc = await User.findOneAndUpdate(
          { email: u.email.toLowerCase() },
          {
            $set: {
              name: u.name || "Commercial User",
              email: u.email.toLowerCase(),
              passwordHash: u.passwordHash || null,
              role: normalizedRole,
              accountStatus: "active",
              emailVerified: Boolean(u.isVerified),
              openId: u.openId || `usr_${u.id}`,
              numericId: u.id,
              phone: u.phone || null,
              companyName: u.companyName || null,
              gstNumber: u.gstNumber || null,
              address: u.address || null,
              city: u.city || null,
              state: u.state || null,
              isVerified: Boolean(u.isVerified),
              loginMethod: u.loginMethod || "credentials",
              lastLogin: u.lastSignedIn ? new Date(u.lastSignedIn) : new Date(),
            },
          },
          { upsert: true, returnDocument: "after" }
        );

        if (userDoc) {
          // If buyer, ensure BuyerProfile exists
          if (normalizedRole === "buyer") {
            await BuyerProfile.findOneAndUpdate(
              { userId: userDoc._id },
              {
                $set: {
                  userId: userDoc._id,
                  companyName: u.companyName || u.name,
                  businessType: "Commercial Procurement",
                  country: "India",
                  state: u.state || "Tamil Nadu",
                  city: u.city || "Chennai",
                  address: u.address || "",
                  phone: u.phone || "",
                  businessDescription: `Registered buyer on BazroKart commercial network.`,
                },
              },
              { upsert: true }
            );
          }

          // If supplier, ensure SupplierProfile exists
          if (normalizedRole === "supplier" || u.role === "seller") {
            await SupplierProfile.findOneAndUpdate(
              { userId: userDoc._id },
              {
                $set: {
                  userId: userDoc._id,
                  companyName: u.companyName || u.name,
                  companyType: "OEM Manufacturer & Supplier",
                  businessDescription: `Verified manufacturer and component supplier.`,
                  country: "India",
                  state: u.state || "Tamil Nadu",
                  city: u.city || "Chennai",
                  address: u.address || "",
                  contactDetails: {
                    phone: u.phone || "",
                    email: u.email || "",
                    representativeName: u.name || "",
                  },
                  verificationStatus: u.isVerified ? "verified" : "pending",
                },
              },
              { upsert: true }
            );
          }
          syncedUsers++;
        }
      }
      console.log(`[DBInit] Synced ${syncedUsers} users & profiles to MongoDB.`);
    }

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
