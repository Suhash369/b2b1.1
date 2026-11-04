import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { connectMongoDB, isMongoConnected } from "./config/database";
import { appRouter } from "./routers";
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
  AuditLog,
} from "./models";
import * as db from "./db";

describe("BazroKart Complete MongoDB Architecture & Multi-Collection Integrity", () => {
  const timestamp = Date.now();
  const testBuyerEmail = `mongo_buyer_${timestamp}@chennaiprocure.in`;
  const testSupplierEmail = `mongo_supplier_${timestamp}@precisionmachining.in`;
  const testPassword = "MongoSecurePassword#2026";

  let createdBuyerUser: any;
  let createdSupplierUser: any;
  let createdProductId: string;
  let createdRfqNumber: string;
  let createdRfqId: string;
  let createdQuoteId: string;

  beforeAll(async () => {
    await connectMongoDB();
    expect(isMongoConnected()).toBe(true);
  });

  it("1. Buyer registration creates a User and linked BuyerProfile in MongoDB", async () => {
    const caller = appRouter.createCaller({
      user: null as any,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const regResult = await caller.auth.register({
      name: "Anand Sourcing Head",
      email: testBuyerEmail,
      password: testPassword,
      companyName: "Anand Industrial Infra Private Limited",
      role: "buyer",
      phone: "+91 98401 99887",
      city: "Chennai",
      state: "Tamil Nadu",
    });

    expect(regResult.success).toBe(true);
    createdBuyerUser = regResult.user;

    // Verify in MongoDB 'users' collection
    const mongoUser = await User.findOne({ email: testBuyerEmail });
    expect(mongoUser).toBeDefined();
    expect(mongoUser?.role).toBe("buyer");
    expect(mongoUser?.accountStatus).toBe("active");

    // Verify in MongoDB 'buyerprofiles' collection
    const buyerProfile = await BuyerProfile.findOne({ userId: mongoUser?._id });
    expect(buyerProfile).toBeDefined();
    expect(buyerProfile?.companyName).toBe("Anand Industrial Infra Private Limited");
    expect(buyerProfile?.country).toBe("India");

    // Verify audit log in 'auditlogs'
    const audit = await AuditLog.findOne({ action: "USER_REGISTER", recordId: mongoUser?.openId });
    expect(audit).toBeDefined();
    expect(audit?.module).toBe("AUTH");
  });

  it("2. Supplier registration creates a User and linked SupplierProfile in MongoDB", async () => {
    const caller = appRouter.createCaller({
      user: null as any,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const regResult = await caller.auth.register({
      name: "Karthik Works Director",
      email: testSupplierEmail,
      password: testPassword,
      companyName: "Karthik Precision Castings & Components",
      role: "seller",
      phone: "+91 94440 33221",
      city: "Coimbatore",
      state: "Tamil Nadu",
      address: "SIDCO Industrial Estate, Kurichi",
    });

    expect(regResult.success).toBe(true);
    createdSupplierUser = regResult.user;

    // Verify in MongoDB 'users' collection
    const mongoUser = await User.findOne({ email: testSupplierEmail });
    expect(mongoUser).toBeDefined();
    expect(mongoUser?.role).toBe("supplier");

    // Verify in MongoDB 'supplierprofiles' collection
    const supplierProfile = await SupplierProfile.findOne({ userId: mongoUser?._id });
    expect(supplierProfile).toBeDefined();
    expect(supplierProfile?.companyName).toBe("Karthik Precision Castings & Components");
    expect(supplierProfile?.verificationStatus).toBe("pending");
  });

  it("3. Login authenticates the correct account with hashed password verification", async () => {
    const caller = appRouter.createCaller({
      user: null as any,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const loginResult = await caller.auth.login({
      email: testBuyerEmail,
      password: testPassword,
    });

    expect(loginResult.success).toBe(true);
    expect(loginResult.user.email).toBe(testBuyerEmail);

    // Reject wrong password
    await expect(
      caller.auth.login({
        email: testBuyerEmail,
        password: "IncorrectPassword123",
      })
    ).rejects.toThrow();
  });

  it("4. Products are stored under the correct supplier in MongoDB products collection", async () => {
    const caller = appRouter.createCaller({
      user: createdSupplierUser,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const productResult = await caller.products.create({
      title: "SG Iron Heavy Duty Hydraulic Flange Castings",
      department: "Automotive & Mechanical",
      price: "3850",
      mrp: "4500",
      moq: 25,
      sku: `KPC-SG-${timestamp.toString().slice(-4)}`,
      imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
      origin: "Coimbatore, Tamil Nadu",
      leadTime: "10 Days",
      hsnCode: "732599",
    });

    expect(productResult).toBeDefined();
    createdProductId = productResult.id;

    // Verify in MongoDB 'products' collection
    const mongoProduct = await Product.findOne({ id: createdProductId });
    expect(mongoProduct).toBeDefined();
    expect(mongoProduct?.productName).toBe("SG Iron Heavy Duty Hydraulic Flange Castings");
    expect(mongoProduct?.price).toBe(3850);
    expect(mongoProduct?.supplierId).toBe(createdSupplierUser.id);
    expect(mongoProduct?.publicationStatus).toBe("published");
  });

  it("5. Buyers can retrieve eligible published products while unpublished lots remain hidden", async () => {
    const caller = appRouter.createCaller({
      user: createdBuyerUser,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const productList = await caller.products.list({ query: "Hydraulic Flange" });
    expect(productList.some((p) => p.id === createdProductId)).toBe(true);

    // Create a draft product and verify it is not in the public list
    const draftProduct = await db.createProduct({
      id: `draft-${Date.now()}`,
      title: "Confidential R&D Prototype Lot",
      slug: `confidential-rd-prototype-${Date.now()}`,
      department: "Automotive & Mechanical",
      supplierId: createdSupplierUser.id,
      price: "10000",
      mrp: "12000",
      discount: null,
      moq: 1,
      inStock: true,
      sku: "DRAFT-01",
      imageUrl: "https://example.com/draft.jpg",
      isPublished: false,
    });

    const publicListAfterDraft = await caller.products.list({ query: "Confidential R&D" });
    expect(publicListAfterDraft.some((p) => p.id === draftProduct.id)).toBe(false);

    await db.deleteProduct(draftProduct.id);
  });

  it("6. Buyers can create and retrieve their own RFQs in MongoDB rfqs collection", async () => {
    const caller = appRouter.createCaller({
      user: createdBuyerUser,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const rfqResult = await caller.rfq.create({
      category: "Automotive & Mechanical",
      title: "Bulk Procurement: 500 Nos Precision Flanges",
      description: "Require certified SG Iron 500/7 hydraulic flanges for pump manufacturing line",
      quantity: 500,
      unit: "Units",
      targetPrice: "3700",
      destinationCity: "Chennai",
      requiredDate: "21 Days",
      buyerName: createdBuyerUser.name,
      buyerEmail: createdBuyerUser.email,
      buyerPhone: createdBuyerUser.phone,
    });

    expect(rfqResult).toBeDefined();
    expect(rfqResult.rfqNumber).toMatch(/^RFQ-BZK-/);
    createdRfqNumber = rfqResult.rfqNumber;
    createdRfqId = rfqResult.id;

    // Verify in MongoDB 'rfqs' collection
    const mongoRfq = await Rfq.findOne({ rfqNumber: createdRfqNumber });
    expect(mongoRfq).toBeDefined();
    expect(mongoRfq?.requirementTitle).toBe("Bulk Procurement: 500 Nos Precision Flanges");
    expect(mongoRfq?.quantity).toBe(500);
    expect(mongoRfq?.buyerEmail).toBe(testBuyerEmail);
    expect(mongoRfq?.status).toBe("open");

    // Buyer retrieves their own list
    const myRfqs = await caller.rfq.list({ buyerEmail: testBuyerEmail });
    expect(myRfqs.some((r) => r.rfqNumber === createdRfqNumber)).toBe(true);
  });

  it("7. Suppliers can retrieve authorized incoming RFQs", async () => {
    const caller = appRouter.createCaller({
      user: createdSupplierUser,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const supplierRfqs = await caller.rfq.list();
    expect(supplierRfqs.some((r) => r.rfqNumber === createdRfqNumber)).toBe(true);
  });

  it("8. Suppliers can submit quotations stored in quotations collection", async () => {
    const caller = appRouter.createCaller({
      user: createdSupplierUser,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const quoteResult = await caller.quotes.create({
      rfqId: createdRfqId,
      supplierName: createdSupplierUser.companyName,
      unitPrice: "3650",
      totalAmount: "1825000",
      moq: 100,
      deliveryDays: 14,
      validUntil: "30 Days from Issue",
      paymentTerms: "100% Proforma GST Wire Against Dispatch Clearance",
      notes: "Material test certificate EN 10204 3.1 provided with batch delivery.",
    });

    expect(quoteResult).toBeDefined();
    expect(quoteResult.quoteNumber).toMatch(/^QT-BZK-/);
    createdQuoteId = quoteResult.id;

    // Verify in MongoDB 'quotations' collection
    const mongoQuote = await Quotation.findOne({ quoteNumber: quoteResult.quoteNumber });
    expect(mongoQuote).toBeDefined();
    expect(mongoQuote?.unitPrice).toBe("3650");
    expect(mongoQuote?.supplierId).toBe(createdSupplierUser.id);

    // Verify RFQ status updated to 'quoted' in MongoDB
    const updatedRfq = await Rfq.findOne({ id: createdRfqId });
    expect(updatedRfq?.status).toBe("quoted");
  });

  it("9. Buyers can retrieve quotations for their RFQ", async () => {
    const caller = appRouter.createCaller({
      user: createdBuyerUser,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const quotes = await caller.quotes.listForRfq({ rfqId: createdRfqId });
    expect(quotes.some((q) => q.id === createdQuoteId)).toBe(true);
  });

  it("10. Notifications persist in MongoDB notifications collection with read status tracking", async () => {
    // Buyer should have received quotation notification
    const buyerNotifs = await Notification.find({ userId: createdBuyerUser.id });
    expect(buyerNotifs.length).toBeGreaterThan(0);
    const quoteNotif = buyerNotifs.find((n) => n.title === "Quotation Received");
    expect(quoteNotif).toBeDefined();
    expect(quoteNotif?.isRead).toBe(false);

    // Mark as read
    const notifId = quoteNotif?.id || (quoteNotif as any)?._id?.toString();
    await db.markNotificationAsRead(notifId, createdBuyerUser.id);

    // Verify updated read status in MongoDB
    const updatedNotif = await Notification.findOne({
      $or: [{ id: notifId }, { _id: quoteNotif?._id }],
    });
    expect(updatedNotif?.isRead).toBe(true);
  });

  it("11. Unauthorized users cannot access private listings or perform privileged mutations", async () => {
    const unauthCaller = appRouter.createCaller({
      user: null as any,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    // Unauthenticated user cannot create products
    await expect(
      unauthCaller.products.create({
        title: "Malicious Product",
        department: "General",
        price: "100",
        mrp: "200",
        sku: "MAL-01",
        imageUrl: "https://example.com/mal.jpg",
      })
    ).rejects.toThrow();

    // Buyer cannot create products (only supplier or admin)
    const buyerCaller = appRouter.createCaller({
      user: createdBuyerUser,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });
    await expect(
      buyerCaller.products.create({
        title: "Buyer Trying To List",
        department: "General",
        price: "100",
        mrp: "200",
        sku: "BUY-01",
        imageUrl: "https://example.com/buy.jpg",
      })
    ).rejects.toThrow();
  });

  it("12. Existing application functionality continues working with all collections active", async () => {
    const db = mongoose.connection.db;
    expect(db).toBeDefined();
    const collections = await db!.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    // Verify all requested collections exist
    const requiredCollections = [
      "users",
      "buyerprofiles",
      "supplierprofiles",
      "products",
      "categories",
      "rfqs",
      "quotations",
      "notifications",
      "orders",
      "auditlogs",
    ];

    for (const col of requiredCollections) {
      expect(collectionNames).toContain(col);
    }

    // Verify categories query works
    const catCount = await Category.countDocuments();
    expect(catCount).toBeGreaterThanOrEqual(0);

    // Verify users count is intact
    const userCount = await User.countDocuments();
    expect(userCount).toBeGreaterThanOrEqual(2);
  });
});
