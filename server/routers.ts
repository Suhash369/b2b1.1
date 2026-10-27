import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";

export const appRouter = router({
  system: systemRouter,

  // -------------------------------------------------------------
  // Authentication Router
  // -------------------------------------------------------------
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (ctx.user) return ctx.user;
      // Return default guest identity or first user for demo convenience
      return null;
    }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().optional(),
          role: z.enum(["buyer", "seller", "admin"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        let user = await db.getUserByEmail(input.email);
        if (!user) {
          const openId = `usr_${Date.now()}`;
          const namePart = input.email.split("@")[0];
          await db.upsertUser({
            openId,
            name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
            email: input.email,
            role: input.role || "buyer",
            loginMethod: "credentials",
            lastSignedIn: new Date(),
          });
          user = await db.getUserByEmail(input.email);
        }

        if (user) {
          try {
            const token = await sdk.createSessionToken(user.openId, {
              name: user.name || "User",
            });
            const cookieOptions = getSessionCookieOptions(ctx.req);
            ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          } catch (e) {
            console.warn("[Auth] Could not create session token:", e);
          }
        }

        return { success: true, user };
      }),

    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2),
          email: z.string().email(),
          phone: z.string().optional(),
          companyName: z.string().optional(),
          gstNumber: z.string().optional(),
          role: z.enum(["buyer", "seller", "admin"]).default("buyer"),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const openId = `usr_${Date.now()}`;
        await db.upsertUser({
          openId,
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          companyName: input.companyName || null,
          gstNumber: input.gstNumber || null,
          role: input.role,
          address: input.address || null,
          city: input.city || null,
          state: input.state || null,
          loginMethod: "credentials",
          lastSignedIn: new Date(),
        });

        const user = await db.getUserByOpenId(openId);

        if (user) {
          try {
            const token = await sdk.createSessionToken(user.openId, {
              name: user.name || "User",
            });
            const cookieOptions = getSessionCookieOptions(ctx.req);
            ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          } catch (e) {
            console.warn("[Auth] Session cookie issue:", e);
          }
        }

        return { success: true, user };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // -------------------------------------------------------------
  // Product Catalog Router
  // -------------------------------------------------------------
  products: router({
    list: publicProcedure
      .input(
        z
          .object({
            department: z.string().optional(),
            categoryId: z.string().optional(),
            query: z.string().optional(),
            sort: z.enum(["relevance", "price_asc", "price_desc", "rating", "newest"]).optional(),
            inStockOnly: z.boolean().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return db.listProducts(input || {});
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return db.getProductBySlug(input.slug);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return db.getProductById(input.id);
      }),

    create: publicProcedure
      .input(
        z.object({
          title: z.string().min(3),
          slug: z.string().optional(),
          department: z.string(),
          categoryId: z.string().optional(),
          price: z.string(),
          mrp: z.string(),
          discount: z.string().optional(),
          moq: z.number().default(1),
          sku: z.string(),
          imageUrl: z.string(),
          imageAlt: z.string().optional(),
          specs: z.record(z.string(), z.string()).optional(),
          leadTime: z.string().optional(),
          origin: z.string().optional(),
          hsnCode: z.string().optional(),
          supplierName: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const id = `bzk-${Date.now()}`;
        const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const product = await db.createProduct({
          id,
          title: input.title,
          slug,
          department: input.department,
          categoryId: input.categoryId || null,
          supplierId: ctx.user?.id || 1,
          supplierName: input.supplierName || ctx.user?.companyName || "BazroKart Verified Supplier",
          price: input.price,
          mrp: input.mrp,
          discount: input.discount || null,
          moq: input.moq,
          inStock: true,
          rating: "5.0",
          reviews: 1,
          sku: input.sku,
          badge: "New Listing",
          badgeColor: "bg-[#2563EB]/10 text-[#2563EB]",
          imageAlt: input.imageAlt || input.title,
          imageUrl: input.imageUrl,
          specs: input.specs || null,
          leadTime: input.leadTime || "Dispatch in 24h",
          origin: input.origin || "Casagrand Royale, Chennai HUB",
          hsnCode: input.hsnCode || null,
          isPublished: true,
        });
        return product;
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.string(),
          updates: z.record(z.string(), z.any()),
        })
      )
      .mutation(async ({ input }) => {
        return db.updateProduct(input.id, input.updates);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return db.deleteProduct(input.id);
      }),
  }),

  // -------------------------------------------------------------
  // Categories Router
  // -------------------------------------------------------------
  categories: router({
    list: publicProcedure.query(async () => {
      return db.listCategories();
    }),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return db.getCategoryBySlug(input.slug);
      }),
  }),

  // -------------------------------------------------------------
  // RFQ (Request for Quotations) Router
  // -------------------------------------------------------------
  rfq: router({
    create: publicProcedure
      .input(
        z.object({
          category: z.string(),
          title: z.string().min(3),
          description: z.string().min(5),
          quantity: z.number().min(1),
          unit: z.string().default("Units"),
          targetPrice: z.string().optional(),
          destinationCity: z.string().optional(),
          requiredDate: z.string().optional(),
          buyerName: z.string().min(2),
          buyerEmail: z.string().email(),
          buyerPhone: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return db.createRfq({
          buyerId: ctx.user?.id || null,
          buyerName: input.buyerName,
          buyerEmail: input.buyerEmail,
          buyerPhone: input.buyerPhone || null,
          category: input.category,
          title: input.title,
          description: input.description,
          quantity: input.quantity,
          unit: input.unit,
          targetPrice: input.targetPrice || null,
          destinationCity: input.destinationCity || null,
          requiredDate: input.requiredDate || null,
        });
      }),

    list: publicProcedure
      .input(z.object({ buyerEmail: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.listRfqs(input?.buyerEmail);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const rfq = await db.getRfqById(input.id);
        if (!rfq) return null;
        const quotes = await db.listQuotesForRfq(rfq.id);
        return { ...rfq, quotes };
      }),

    updateStatus: publicProcedure
      .input(
        z.object({
          id: z.string(),
          status: z.enum(["open", "quoted", "accepted", "closed"]),
        })
      )
      .mutation(async ({ input }) => {
        return db.updateRfqStatus(input.id, input.status);
      }),
  }),

  // -------------------------------------------------------------
  // Quotations Router
  // -------------------------------------------------------------
  quotes: router({
    create: publicProcedure
      .input(
        z.object({
          rfqId: z.string(),
          supplierName: z.string(),
          unitPrice: z.string(),
          totalAmount: z.string(),
          moq: z.number().default(1),
          deliveryDays: z.number().default(7),
          validUntil: z.string().optional(),
          paymentTerms: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return db.createQuote({
          rfqId: input.rfqId,
          supplierId: ctx.user?.id || 2,
          supplierName: input.supplierName,
          unitPrice: input.unitPrice,
          totalAmount: input.totalAmount,
          moq: input.moq,
          deliveryDays: input.deliveryDays,
          validUntil: input.validUntil || "30 Days from Issue",
          paymentTerms: input.paymentTerms || "100% Against Proforma GST Invoice",
          notes: input.notes || null,
        });
      }),

    listForRfq: publicProcedure
      .input(z.object({ rfqId: z.string() }))
      .query(async ({ input }) => {
        return db.listQuotesForRfq(input.rfqId);
      }),

    updateStatus: publicProcedure
      .input(
        z.object({
          id: z.string(),
          status: z.enum(["pending", "accepted", "rejected"]),
        })
      )
      .mutation(async ({ input }) => {
        return db.updateQuoteStatus(input.id, input.status);
      }),
  }),

  // -------------------------------------------------------------
  // Orders & Fulfillment Router
  // -------------------------------------------------------------
  orders: router({
    create: publicProcedure
      .input(
        z.object({
          buyerName: z.string(),
          totalAmount: z.string(),
          gstAmount: z.string(),
          items: z.array(
            z.object({
              productId: z.string(),
              title: z.string(),
              sku: z.string(),
              price: z.number(),
              quantity: z.number(),
              hsnCode: z.string().optional(),
            })
          ),
          shippingAddress: z.object({
            name: z.string(),
            company: z.string(),
            gstin: z.string().optional(),
            street: z.string(),
            city: z.string(),
            state: z.string(),
            pincode: z.string(),
            phone: z.string(),
          }),
          paymentMethod: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return db.createOrder({
          buyerId: ctx.user?.id || 1,
          buyerName: input.buyerName,
          supplierId: 1,
          totalAmount: input.totalAmount,
          gstAmount: input.gstAmount,
          items: input.items,
          status: "placed",
          shippingAddress: input.shippingAddress,
          paymentStatus: "pending",
          paymentMethod: input.paymentMethod || "GST Proforma Wire",
        });
      }),

    list: publicProcedure
      .input(z.object({ buyerId: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.listOrders(input?.buyerId || ctx.user?.id);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return db.getOrderById(input.id);
      }),

    updateStatus: publicProcedure
      .input(
        z.object({
          id: z.string(),
          status: z.enum(["placed", "confirmed", "shipped", "delivered", "cancelled"]),
          paymentStatus: z.enum(["pending", "paid", "credit_term", "failed"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        return db.updateOrderStatus(input.id, input.status, input.paymentStatus);
      }),
  }),

  // -------------------------------------------------------------
  // Subscriptions Router
  // -------------------------------------------------------------
  subscriptions: router({
    getPlans: publicProcedure.query(async () => {
      return db.getSubscriptionPlans();
    }),

    subscribe: publicProcedure
      .input(z.object({ planName: z.enum(["basic", "premium", "elite"]) }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id || 1;
        return db.createSubscription(userId, input.planName);
      }),

    getActive: publicProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id || 1;
      return db.getSubscriptionByUserId(userId);
    }),
  }),

  // -------------------------------------------------------------
  // Business Networks Router
  // -------------------------------------------------------------
  network: router({
    listMembers: publicProcedure.query(async () => {
      return db.listNetworkMembers();
    }),

    sendConnection: publicProcedure
      .input(
        z.object({
          targetCompany: z.string(),
          leadType: z.string(),
          message: z.string().min(5),
          requesterName: z.string(),
          requesterCompany: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return db.createNetworkConnection({
          requesterId: ctx.user?.id || null,
          requesterName: input.requesterName,
          requesterCompany: input.requesterCompany,
          targetCompany: input.targetCompany,
          leadType: input.leadType,
          message: input.message,
        });
      }),
  }),

  // -------------------------------------------------------------
  // Services Router
  // -------------------------------------------------------------
  services: router({
    list: publicProcedure.query(async () => {
      return db.listServices();
    }),

    submitEnquiry: publicProcedure
      .input(
        z.object({
          serviceName: z.string(),
          userName: z.string().min(2),
          userEmail: z.string().email(),
          userPhone: z.string().min(7),
          companyName: z.string().min(2),
          message: z.string().min(5),
        })
      )
      .mutation(async ({ input }) => {
        return db.createServiceEnquiry(input);
      }),
  }),

  // -------------------------------------------------------------
  // Enterprises Router
  // -------------------------------------------------------------
  enterprises: router({
    listCategories: publicProcedure.query(async () => {
      return db.listEnterpriseCategories();
    }),

    submitApplication: publicProcedure
      .input(
        z.object({
          enterpriseCategory: z.enum(["startup", "msme", "social_enterprise", "innovative_business"]),
          companyName: z.string().min(2),
          contactPerson: z.string().min(2),
          email: z.string().email(),
          phone: z.string().min(7),
          city: z.string().min(2),
          state: z.string().min(2),
          businessStage: z.string().min(2),
          employeeCount: z.string().optional(),
          annualTurnover: z.string().optional(),
          needs: z.string().min(5),
        })
      )
      .mutation(async ({ input }) => {
        return db.createEnterpriseApplication({
          ...input,
          employeeCount: input.employeeCount || null,
          annualTurnover: input.annualTurnover || null,
        });
      }),
  }),

  // -------------------------------------------------------------
  // Admin Operations Router
  // -------------------------------------------------------------
  admin: router({
    getStats: publicProcedure.query(async () => {
      return db.getAdminStats();
    }),
    listUsers: publicProcedure.query(async () => {
      return db.listUsers();
    }),
    listOrders: publicProcedure.query(async () => {
      return db.listOrders();
    }),
    listRfqs: publicProcedure.query(async () => {
      return db.listRfqs();
    }),
  }),
});

export type AppRouter = typeof appRouter;
