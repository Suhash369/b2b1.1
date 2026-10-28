import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";

export function createExpressApp() {
  const app = express();

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check routes
  app.get(["/api/health", "/health"], (_req, res) => res.json({ status: "ok" }));

  // Platform runtime config script
  app.get(["/api/platform/config.js", "/platform/config.js"], (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });

  // OAuth authentication routes
  registerOAuthRoutes(app);

  // tRPC API middleware mounted for both full URL and rewritten paths
  app.use(
    ["/api/trpc", "/trpc"],
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
