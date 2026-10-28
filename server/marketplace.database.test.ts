import { describe, it, expect, beforeEach } from "vitest";
import * as db from "./db";

describe("Marketplace Database-Driven Integrity & Tenant Isolation", () => {
  it("enforces unpublished products are hidden from public queries", async () => {
    // Create an unpublished test product
    const testProduct = await db.createProduct({
      id: "prod-test-unpublished-99",
      title: "Private Factory Spare Part Lot",
      slug: "private-factory-spare-part-lot",
      department: "Electrical & Electronics",
      categoryId: "cat-elc",
      supplierId: 2, // Owned by seller 2
      supplierName: "Apex Power Systems Private Limited",
      price: "15000",
      mrp: "20000",
      discount: "25% OFF",
      moq: 1,
      inStock: true,
      rating: null,
      reviews: 0,
      sku: "TEST-SKU-99",
      badge: null,
      badgeColor: null,
      imageAlt: null,
      imageUrl: "https://example.com/test.jpg",
      specs: null,
      leadTime: "7 Days",
      origin: "Chennai",
      hsnCode: "850440",
      isPublished: false,
    });

    // Public list must not include unpublished products
    const publicList = await db.listProducts({ query: "Private Factory Spare Part" });
    expect(publicList.some((p) => p.id === testProduct.id)).toBe(false);

    // Public getBySlug (no user, not admin) must return undefined
    const publicBySlug = await db.getProductBySlug(testProduct.slug, undefined, false);
    expect(publicBySlug).toBeUndefined();

    // Owner supplier getBySlug must return the product
    const ownerBySlug = await db.getProductBySlug(testProduct.slug, 2, false);
    expect(ownerBySlug).toBeDefined();
    expect(ownerBySlug?.id).toBe(testProduct.id);

    // Admin getBySlug must return the product
    const adminBySlug = await db.getProductBySlug(testProduct.slug, 999, true);
    expect(adminBySlug).toBeDefined();
    expect(adminBySlug?.id).toBe(testProduct.id);

    // Clean up
    await db.deleteProduct(testProduct.id);
  });

  it("retrieves genuine supplier profiles and attaches them to products", async () => {
    const sellers = await db.listSuppliers();
    expect(sellers.length).toBeGreaterThan(0);
    for (const s of sellers) {
      // Must not fabricate ratings or fake verified status
      expect(typeof s.isVerified).toBe("boolean");
      if (!s.isVerified) {
        expect(s.badge).not.toBe("Verified Supplier");
      }
    }
  });

  it("persists RFQs, isolates buyer RFQs, and dispatches notifications", async () => {
    const testBuyerEmail = `procure_${Date.now()}@buyercompany.in`;
    const rfq = await db.createRfq({
      buyerId: 1,
      buyerName: "Automated QA Buyer",
      buyerEmail: testBuyerEmail,
      buyerPhone: "+91 99999 88888",
      category: "Electrical & Electronics",
      title: "100 Units Custom Solar Inverters",
      description: "Industrial grade 5kW hybrid solar inverters with MPPT controller",
      quantity: 100,
      unit: "Units",
      targetPrice: "22000",
      destinationCity: "Chennai",
      requiredDate: "30 Days",
    });

    expect(rfq).toBeDefined();
    expect(rfq.rfqNumber).toMatch(/^RFQ-BZK-/);

    // Retrieve via listRfqs isolated by email
    const isolatedList = await db.listRfqs(testBuyerEmail);
    expect(isolatedList.length).toBe(1);
    expect(isolatedList[0].id).toBe(rfq.id);

    // Other buyer email should not see this RFQ
    const otherList = await db.listRfqs("nonexistent_other_buyer@domain.com");
    expect(otherList.length).toBe(0);

    // Submitting a quotation persists the quote and updates RFQ status
    const quote = await db.createQuote({
      rfqId: rfq.id,
      supplierId: 2,
      supplierName: "Apex Power Systems Private Limited",
      unitPrice: "21500",
      totalAmount: "2150000",
      moq: 50,
      deliveryDays: 14,
      validUntil: "30 Days",
      paymentTerms: "100% Proforma GST Wire",
      notes: "Direct factory shipment from Guindy",
    });

    expect(quote).toBeDefined();
    expect(quote.quoteNumber).toMatch(/^QT-BZK-/);

    // Inspect RFQ status updated to 'quoted'
    const updatedRfq = await db.getRfqById(rfq.id);
    expect(updatedRfq?.status).toBe("quoted");

    // Notifications must be generated for buyer 1
    const notifs = await db.listNotifications(1);
    expect(notifs.some((n) => n.title === "Quotation Received" && n.message.includes(quote.quoteNumber))).toBe(true);

    // Accepting quote updates status and notifies supplier 2
    await db.updateQuoteStatus(quote.id, "accepted");
    const supplierNotifs = await db.listNotifications(2);
    expect(supplierNotifs.some((n) => n.title === "Quotation Accepted!" && n.message.includes(quote.quoteNumber))).toBe(true);
  });
});
