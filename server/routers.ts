import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { hashPassword, verifyPassword } from "./authHelper";
import { TRPCError } from "@trpc/server";

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
          password: z.string().min(1, "Password is required"),
          role: z.enum(["buyer", "seller", "admin"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No account found with this email. Please check your credentials or register.",
          });
        }

        // Verify password if user has passwordHash
        if (user.passwordHash) {
          const isValid = verifyPassword(input.password, user.passwordHash);
          if (!isValid) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Invalid password. Please check your credentials.",
            });
          }
        } else {
          // First login after migration: set password hash
          const passwordHash = hashPassword(input.password);
          await db.upsertUser({
            ...user,
            passwordHash,
            lastSignedIn: new Date(),
          });
        }

        try {
          const token = await sdk.createSessionToken(user.openId, {
            name: user.name || "User",
          });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        } catch (e) {
          console.warn("[Auth] Could not create session token:", e);
        }

        await db.upsertUser({
          ...user,
          lastSignedIn: new Date(),
        });
        const updated = await db.getUserByOpenId(user.openId);
        return { success: true, user: updated };
      }),

    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2, "Name must be at least 2 characters"),
          email: z.string().email("Valid email address required"),
          password: z.string().min(6, "Password must be at least 6 characters"),
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
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email address already exists. Please sign in instead.",
          });
        }

        const openId = `usr_${Date.now()}`;
        const passwordHash = hashPassword(input.password);
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
          isVerified: false,
          passwordHash,
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

    updateProfile: publicProcedure
      .input(
        z.object({
          name: z.string().optional(),
          phone: z.string().optional(),
          companyName: z.string().optional(),
          gstNumber: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be signed in to update your profile.",
          });
        }
        await db.upsertUser({
          ...ctx.user,
          name: input.name !== undefined ? input.name : ctx.user.name,
          phone: input.phone !== undefined ? input.phone : ctx.user.phone,
          companyName: input.companyName !== undefined ? input.companyName : ctx.user.companyName,
          gstNumber: input.gstNumber !== undefined ? input.gstNumber : ctx.user.gstNumber,
          address: input.address !== undefined ? input.address : ctx.user.address,
          city: input.city !== undefined ? input.city : ctx.user.city,
          state: input.state !== undefined ? input.state : ctx.user.state,
        });
        const updated = await db.getUserByOpenId(ctx.user.openId);
        return { success: true, user: updated };
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
            includeUnpublished: z.boolean().optional(),
            supplierId: z.number().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return db.listProducts(input || {});
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input, ctx }) => {
        const isAdmin = ctx.user?.role === "admin";
        return db.getProductBySlug(input.slug, ctx.user?.id, isAdmin, ctx.user?.companyName);
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
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Authentication required. Please sign in as a registered supplier to list products.",
          });
        }
        if (ctx.user.role !== "seller" && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only registered suppliers and manufacturers can publish products.",
          });
        }

        const id = `bzk-${Date.now()}`;
        const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

        // Calculate genuine discount percentage if MRP > price
        const numPrice = parseFloat(input.price) || 0;
        const numMrp = parseFloat(input.mrp) || 0;
        let calculatedDiscount: string | null = null;
        if (numMrp > numPrice && numMrp > 0) {
          const pct = Math.round(((numMrp - numPrice) / numMrp) * 100);
          calculatedDiscount = `${pct}% off`;
        }

        const supplierOrigin = ctx.user.city
          ? `${ctx.user.city}${ctx.user.state ? `, ${ctx.user.state}` : ""}`
          : input.origin || null;

        const product = await db.createProduct({
          id,
          title: input.title,
          slug,
          department: input.department,
          categoryId: input.categoryId || null,
          supplierId: ctx.user.id,
          supplierName: ctx.user.companyName || ctx.user.name || "Registered Supplier",
          price: input.price,
          mrp: input.mrp,
          discount: calculatedDiscount,
          moq: input.moq,
          inStock: true,
          rating: null,
          reviews: 0,
          sku: input.sku,
          badge: null,
          badgeColor: null,
          imageAlt: input.imageAlt || input.title,
          imageUrl: input.imageUrl,
          specs: input.specs || null,
          leadTime: input.leadTime || null,
          origin: supplierOrigin,
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
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getProductById(input.id);
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
        }
        if (ctx.user) {
          const isDev = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
          const isOwner =
            isDev ||
            ctx.user.role === "admin" ||
            ctx.user.role === "seller" ||
            existing.supplierId === ctx.user.id ||
            !existing.supplierId ||
            (Boolean(ctx.user.companyName) && existing.supplierName?.toLowerCase() === ctx.user.companyName?.toLowerCase());
          if (!isOwner) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own listings." });
          }
        }
        const updated = await db.updateProduct(input.id, input.updates);
        return { success: true, product: updated };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getProductById(input.id);
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
        }
        if (ctx.user) {
          const isDev = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
          const isOwner =
            isDev ||
            ctx.user.role === "admin" ||
            ctx.user.role === "seller" ||
            existing.supplierId === ctx.user.id ||
            !existing.supplierId ||
            (Boolean(ctx.user.companyName) && existing.supplierName?.toLowerCase() === ctx.user.companyName?.toLowerCase());
          if (!isOwner) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own listings." });
          }
        }
        const success = await db.deleteProduct(input.id);
        return { success, id: input.id };
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
  // Suppliers Router
  // -------------------------------------------------------------
  suppliers: router({
    list: publicProcedure
      .input(z.object({ query: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.listSuppliers(input?.query);
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return db.getSupplierBySlug(input.slug);
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
      .query(async ({ input, ctx }) => {
        // Enforce tenant isolation for buyers: buyers only see their own RFQs
        if (ctx.user?.role === "buyer") {
          return db.listRfqs(ctx.user.email || undefined);
        }
        if (ctx.user?.role === "seller" || ctx.user?.role === "admin") {
          return db.listRfqs();
        }
        if (input?.buyerEmail) {
          return db.listRfqs(input.buyerEmail);
        }
        return [];
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
          supplierName: z.string().optional(),
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
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in as a supplier to submit quotations." });
        }
        if (ctx.user.role !== "seller" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only registered suppliers can submit quotations." });
        }
        return db.createQuote({
          rfqId: input.rfqId,
          supplierId: ctx.user.id,
          supplierName: ctx.user.companyName || ctx.user.name || input.supplierName || "Registered Supplier",
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

    listAll: publicProcedure
      .input(z.object({ supplierId: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        // Enforce supplier vs buyer access control
        if (ctx.user?.role === "seller") {
          return db.listAllQuotes(ctx.user.id);
        }
        if (ctx.user?.role === "buyer") {
          const buyerRfqs = await db.listRfqs(ctx.user.email || undefined);
          const rfqIds = new Set(buyerRfqs.map((r) => r.id));
          const allQuotes = await db.listAllQuotes();
          return allQuotes.filter((q) => rfqIds.has(q.rfqId));
        }
        if (ctx.user?.role === "admin") {
          return db.listAllQuotes(input?.supplierId);
        }
        return [];
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
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in to place purchase orders." });
        }
        let primarySupplierId: number | null = null;
        if (input.items && input.items.length > 0) {
          const firstProduct = await db.getProductById(input.items[0].productId);
          if (firstProduct?.supplierId) {
            primarySupplierId = firstProduct.supplierId;
          }
        }
        return db.createOrder({
          buyerId: ctx.user.id,
          buyerName: ctx.user.name || input.buyerName,
          supplierId: primarySupplierId,
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
        if (ctx.user?.role === "buyer") {
          return db.listOrders(ctx.user.id);
        }
        if (ctx.user?.role === "seller") {
          const all = await db.listOrders();
          return all.filter((o) => o.supplierId === ctx.user?.id);
        }
        if (ctx.user?.role === "admin") {
          return db.listOrders(input?.buyerId);
        }
        return [];
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
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in to subscribe." });
        }
        return db.createSubscription(ctx.user.id, input.planName);
      }),

    getActive: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return undefined;
      return db.getSubscriptionByUserId(ctx.user.id);
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

  // -------------------------------------------------------------
  // Notifications Router
  // -------------------------------------------------------------
  notifications: router({
    list: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      return db.listNotifications(ctx.user.id);
    }),

    markAsRead: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) return false;
        return db.markNotificationAsRead(input.id, ctx.user.id);
      }),

    unreadCount: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return 0;
      return db.getUnreadNotificationsCount(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
