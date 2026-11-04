import "dotenv/config";
import dns from "dns";
import mongoose from "mongoose";

// Ensure DNS SRV resolution succeeds across all local and cloud environments
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
  // Ignore in restricted environments
}

const DEFAULT_URI = "mongodb+srv://sivaprof46_db_user:Siva%407305@cluster0.peikbmh.mongodb.net/bazrokart?compressors=zlib";
const FALLBACK_LOCAL_URI = "mongodb://127.0.0.1:27017/bazrokart";

let isConnecting = false;
let shutdownRegistered = false;

export interface MongoStatus {
  isConnected: boolean;
  status: "connected" | "connecting" | "disconnected" | "error";
  host?: string;
  port?: number;
  dbName?: string;
  poolSize?: number;
  error?: string;
}

let lastConnectionError: string | null = null;

function isConnectionReady(): boolean {
  return (mongoose.connection.readyState as unknown as number) === 1;
}

/**
 * Normalizes MongoDB connection URI:
 * 1. Encodes special characters in password (such as '@' to '%40')
 * 2. Strips Atlas template angle brackets (e.g. :<password>@ -> :password@)
 * 3. Ensures the dedicated 'bazrokart' database name is present in the path
 */
export function normalizeMongoUri(rawUri: string): string {
  let cleaned = rawUri.trim();

  // Strip angle brackets around password if present
  cleaned = cleaned.replace(/:<([^>]+)>@/, (_match, p1) => {
    return `:${encodeURIComponent(p1)}@`;
  });

  // Handle unencoded '@' inside password
  const protoMatch = cleaned.match(/^(mongodb(?:\+srv)?:\/\/)(.*)$/);
  if (protoMatch) {
    const rest = protoMatch[2];
    const atIndex = rest.lastIndexOf("@");
    if (atIndex > -1) {
      const auth = rest.substring(0, atIndex);
      const hostPart = rest.substring(atIndex + 1);
      const colonIndex = auth.indexOf(":");
      if (colonIndex > -1) {
        const user = auth.substring(0, colonIndex);
        let pass = auth.substring(colonIndex + 1);
        try {
          pass = decodeURIComponent(pass);
        } catch {
          // ignore
        }
        pass = encodeURIComponent(pass);
        cleaned = `${protoMatch[1]}${user}:${pass}@${hostPart}`;
      }
    }
  }

  // Ensure 'bazrokart' database name is included before query params
  if (cleaned.includes(".mongodb.net/?")) {
    cleaned = cleaned.replace(".mongodb.net/?", ".mongodb.net/bazrokart?");
  } else if (cleaned.endsWith(".mongodb.net/")) {
    cleaned = `${cleaned}bazrokart`;
  } else if (cleaned.endsWith(".mongodb.net")) {
    cleaned = `${cleaned}/bazrokart`;
  }

  return cleaned;
}

export function sanitizeLogUri(uri: string): string {
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
}

export async function connectMongoDB(): Promise<typeof mongoose | null> {
  // Check if already connected
  if (isConnectionReady()) {
    return mongoose;
  }

  // Prevent race conditions on concurrent connection calls
  if (isConnecting) {
    let attempts = 0;
    while (isConnecting && attempts < 25) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      attempts++;
    }
    if (isConnectionReady()) {
      return mongoose;
    }
  }

  isConnecting = true;
  lastConnectionError = null;

  const rawUri = process.env.MONGODB_URI || DEFAULT_URI;
  const primaryUri = normalizeMongoUri(rawUri);

  const options: mongoose.ConnectOptions = {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    autoIndex: true,
  };

  try {
    console.log(`[MongoDB] Connecting to dedicated database at ${sanitizeLogUri(primaryUri)}...`);
    await mongoose.connect(primaryUri, options);
    console.log(`[MongoDB] Connected successfully to database: ${mongoose.connection.name}`);
    registerLifecycleHandlers();
    isConnecting = false;
    return mongoose;
  } catch (primaryErr: any) {
    console.warn(`[MongoDB] Primary connection failed (${primaryErr.message}). Testing fallback...`);

    // If primary was localhost, try 127.0.0.1 loopback
    if (primaryUri.includes("localhost")) {
      try {
        await mongoose.connect(FALLBACK_LOCAL_URI, options);
        console.log(`[MongoDB] Connected successfully via fallback loopback to database: ${mongoose.connection.name}`);
        registerLifecycleHandlers();
        isConnecting = false;
        return mongoose;
      } catch (fallbackErr: any) {
        lastConnectionError = fallbackErr.message;
        console.error(`[MongoDB] Fallback connection also failed:`, fallbackErr.message);
      }
    } else {
      lastConnectionError = primaryErr.message;
    }

    isConnecting = false;
    return null;
  }
}

export function isMongoConnected(): boolean {
  return isConnectionReady();
}

export function getMongoStatus(): MongoStatus {
  const ready = mongoose.connection.readyState as unknown as number;
  let status: MongoStatus["status"] = "disconnected";
  if (ready === 1) status = "connected";
  else if (ready === 2) status = "connecting";
  else if (lastConnectionError) status = "error";

  return {
    isConnected: ready === 1,
    status,
    host: mongoose.connection.host || "localhost",
    port: mongoose.connection.port || 27017,
    dbName: mongoose.connection.name || "bazrokart",
    error: lastConnectionError || undefined,
  };
}

export async function disconnectMongoDB(): Promise<void> {
  if ((mongoose.connection.readyState as unknown as number) !== 0) {
    try {
      await mongoose.disconnect();
      console.log("[MongoDB] Disconnected gracefully from database.");
    } catch (err: any) {
      console.error("[MongoDB] Error during disconnect:", err.message);
    }
  }
}

function registerLifecycleHandlers() {
  if (shutdownRegistered) return;
  shutdownRegistered = true;

  mongoose.connection.on("error", (err) => {
    lastConnectionError = err.message;
    console.error("[MongoDB] Connection runtime error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] Connection disconnected.");
  });

  mongoose.connection.on("reconnected", () => {
    lastConnectionError = null;
    console.log("[MongoDB] Reconnected successfully.");
  });

  // Graceful shutdown on process termination
  const handleShutdown = async (signal: string) => {
    console.log(`[MongoDB] Received ${signal}. Closing MongoDB connection...`);
    await disconnectMongoDB();
  };

  process.once("SIGINT", () => handleShutdown("SIGINT"));
  process.once("SIGTERM", () => handleShutdown("SIGTERM"));
}
