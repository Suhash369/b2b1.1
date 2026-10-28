import { describe, it, expect } from "vitest";
import * as db from "./db";
import { appRouter } from "./routers";
import { hashPassword, verifyPassword } from "./authHelper";

describe("BazroKart Production-Readiness & Real Business Workflow", () => {
  const timestamp = Date.now();
  const testBuyerEmail = `buyer_${timestamp}@acmeprocure.in`;
  const testSupplierEmail = `seller_${timestamp}@oemfactories.in`;
  const testPassword = "ProductionSecurePass#2026";

  let buyerUser: any;
  let supplierUser: any;
  let createdProductId: string;
  let createdRfqId: string;
  let createdQuoteId: string;

  it("1. Password hashing and verification work securely", () => {
    const hash = hashPassword(testPassword);
    expect(hash).toContain(":");
    expect(verifyPassword(testPassword, hash)).toBe(true);
    expect(verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("2. Registers a new buyer account without demo data inheritance", async () => {
    const caller = appRouter.createCaller({
      user: null as any,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const regResult = await caller.auth.register({
      name: "Acme Chief Buyer",
      email: testBuyerEmail,
      password: testPassword,
      companyName: "Acme Industrial Sourcing LLP",
      role: "buyer",
      phone: "+91 98765 43210",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641001",
    });

    expect(regResult.success).toBe(true);
    expect(regResult.user.email).toBe(testBuyerEmail);
    expect(regResult.user.role).toBe("buyer");

    buyerUser = await db.getUserByEmail(testBuyerEmail);
    expect(buyerUser).toBeDefined();
    expect(buyerUser.passwordHash).toBeDefined();
    expect(verifyPassword(testPassword, buyerUser.passwordHash)).toBe(true);
  });

  it("3. Registers a new supplier account without demo products or fabricated badges", async () => {
    const caller = appRouter.createCaller({
      user: null as any,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const regResult = await caller.auth.register({
      name: "Apex Precision Lead",
      email: testSupplierEmail,
      password: testPassword,
      companyName: "Apex Precision Components OEM",
      role: "seller",
      phone: "+91 91234 56789",
      city: "Hosur",
      state: "Tamil Nadu",
      pincode: "635109",
      gstNumber: "33AAACA1234B1Z5",
    });

    expect(regResult.success).toBe(true);
    expect(regResult.user.role).toBe("seller");
    expect(regResult.user.isVerified).toBe(false); // Does not fabricate instant verified status

    supplierUser = await db.getUserByEmail(testSupplierEmail);
    expect(supplierUser).toBeDefined();
    expect(supplierUser.passwordHash).toBeDefined();
  });

  it("4. Authenticates registered buyer and supplier with real credentials", async () => {
    const caller = appRouter.createCaller({
      user: null as any,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    // Valid login succeeds
    const loginRes = await caller.auth.login({
      email: testBuyerEmail,
      password: testPassword,
    });
    expect(loginRes.success).toBe(true);
    expect(loginRes.user.email).toBe(testBuyerEmail);

    // Invalid password throws UNAUTHORIZED
    await expect(
      caller.auth.login({
        email: testBuyerEmail,
        password: "IncorrectPassword123",
      })
    ).rejects.toThrow();
  });

  it("5. Prevents buyers from creating supplier product listings", async () => {
    const buyerCaller = appRouter.createCaller({
      user: buyerUser,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    await expect(
      buyerCaller.products.create({
        title: "Unauthorized Buyer Product",
        department: "Electrical & Electronics",
        price: "1000",
        mrp: "1500",
        moq: 10,
        sku: "BZK-UNAUTH-01",
        imageUrl: "https://example.com/item.jpg",
      })
    ).rejects.toThrow("Only registered suppliers and manufacturers can publish products");
  });

  it("6. Allows registered supplier to create and publish a genuine product record", async () => {
    const supplierCaller = appRouter.createCaller({
      user: supplierUser,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const newProd = await supplierCaller.products.create({
      title: "Precision CNC Machined Brass Bushing (100-Pack)",
      department: "Electrical & Electronics",
      price: "4500",
      mrp: "6000",
      moq: 5,
      sku: `BZK-CNC-${timestamp.toString().slice(-4)}`,
      imageUrl: "https://example.com/brass-bushing.jpg",
      leadTime: "3-5 Working Days",
      hsnCode: "848330",
    });

    expect(newProd).toBeDefined();
    createdProductId = newProd.id;
    expect(newProd.supplierId).toBe(supplierUser.id);
    expect(newProd.supplierName).toBe("Apex Precision Components OEM");
    expect(newProd.origin).toContain("Hosur");
    expect(newProd.rating).toBeNull(); // No fabricated rating
    expect(newProd.reviews).toBe(0); // No fabricated reviews
    expect(newProd.discount).toMatch(/25%\s*off/i); // Real calculated discount: (6000-4500)/6000
  });

  it("7. Product appears in public buyer catalogue search", async () => {
    const publicCaller = appRouter.createCaller({
      user: null as any,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const catalogList = await publicCaller.products.list({ query: "Brass Bushing" });
    expect(catalogList.some((p) => p.id === createdProductId)).toBe(true);

    const fetchedItem = catalogList.find((p) => p.id === createdProductId);
    expect(fetchedItem?.supplierName).toBe("Apex Precision Components OEM");
    expect(fetchedItem?.price).toBe("4500");
  });

  it("8. Buyer submits an RFQ and retrieves it with tenant isolation", async () => {
    const buyerCaller = appRouter.createCaller({
      user: buyerUser,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const rfqRes = await buyerCaller.rfq.create({
      category: "Electrical & Electronics",
      title: "Bulk Procurement: 50 Sets Brass Bushings",
      description: "Require certified brass bushings batch for industrial assembly line.",
      quantity: 50,
      unit: "Packs",
      targetPrice: "4200",
      destinationCity: "Coimbatore",
      requiredDate: "Within 14 Days",
      buyerName: buyerUser.name,
      buyerEmail: buyerUser.email,
      buyerPhone: buyerUser.phone || "+91 98765 43210",
    });

    expect(rfqRes).toBeDefined();
    expect(rfqRes.rfqNumber).toMatch(/^RFQ-BZK-/);
    createdRfqId = rfqRes.id;

    // Buyer sees their own RFQ
    const buyerRfqs = await buyerCaller.rfq.list();
    expect(buyerRfqs.some((r) => r.id === createdRfqId)).toBe(true);

    // Another buyer cannot see this RFQ
    const anotherBuyerCaller = appRouter.createCaller({
      user: { id: 99999, email: "stranger@otherfirm.in", role: "buyer" } as any,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });
    const strangerRfqs = await anotherBuyerCaller.rfq.list();
    expect(strangerRfqs.some((r) => r.id === createdRfqId)).toBe(false);
  });

  it("9. Supplier views open RFQ and submits a genuine quotation", async () => {
    const supplierCaller = appRouter.createCaller({
      user: supplierUser,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    // Supplier can see open RFQs in market
    const supplierRfqs = await supplierCaller.rfq.list();
    expect(supplierRfqs.some((r) => r.id === createdRfqId)).toBe(true);

    // Supplier submits quotation
    const quoteRes = await supplierCaller.quotes.create({
      rfqId: createdRfqId,
      unitPrice: "4150",
      totalAmount: "207500",
      moq: 50,
      deliveryDays: 5,
      paymentTerms: "100% Proforma against GST Invoice",
      notes: "Direct OEM supply from Hosur factory with Mill Test Certificates.",
    });

    expect(quoteRes).toBeDefined();
    expect(quoteRes.supplierId).toBe(supplierUser.id);
    expect(quoteRes.supplierName).toBe("Apex Precision Components OEM");
    createdQuoteId = quoteRes.id;
  });

  it("10. Quotation is visible to buyer and isolated from unauthorized parties", async () => {
    // Buyer can see the quotation for their RFQ
    const buyerCaller = appRouter.createCaller({
      user: buyerUser,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const buyerQuotes = await buyerCaller.quotes.listAll();
    expect(buyerQuotes.some((q) => q.id === createdQuoteId)).toBe(true);

    const rfqQuotes = await buyerCaller.quotes.listForRfq({ rfqId: createdRfqId });
    expect(rfqQuotes.some((q) => q.id === createdQuoteId)).toBe(true);
    expect(rfqQuotes[0].unitPrice).toBe("4150");

    // Unrelated third-party supplier cannot see quotes they did not author
    const thirdPartyCaller = appRouter.createCaller({
      user: { id: 88888, email: "other_seller@domain.in", role: "seller" } as any,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const thirdPartyQuotes = await thirdPartyCaller.quotes.listAll();
    expect(thirdPartyQuotes.some((q) => q.id === createdQuoteId)).toBe(false);
  });

  it("11. Clean empty state when searching for nonexistent items", async () => {
    const publicCaller = appRouter.createCaller({
      user: null as any,
      req: { protocol: "http", headers: {} } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    const emptyResults = await publicCaller.products.list({ query: "NonExistentImpossibleProductXYZ123" });
    expect(emptyResults).toHaveLength(0);
  });
});
