import mongoose from "mongoose";

const DEFAULT_URI = "mongodb://localhost:27017/bazrokart";
const FALLBACK_IP_URI = "mongodb://127.0.0.1:27017/bazrokart";

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

export async function connectMongoDB(): Promise<typeof mongoose | null> {
  // Check if already connected
  if (isConnectionReady()) {
    return mongoose;
  }

  // Prevent race conditions on concurrent connection calls
  if (isConnecting) {
    let attempts = 0;
    while (isConnecting && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      attempts++;
    }
    if (isConnectionReady()) {
      return mongoose;
    }
  }

  isConnecting = true;
  lastConnectionError = null;

  const primaryUri = process.env.MONGODB_URI || DEFAULT_URI;

  const options: mongoose.ConnectOptions = {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 4000,
    socketTimeoutMS: 45000,
    autoIndex: true,
  };

  try {
    console.log(`[MongoDB] Connecting to dedicated database at ${primaryUri}...`);
    await mongoose.connect(primaryUri, options);
    console.log(`[MongoDB] Connected successfully to database: ${mongoose.connection.name}`);
    registerLifecycleHandlers();
    isConnecting = false;
    return mongoose;
  } catch (primaryErr: any) {
    console.warn(`[MongoDB] Connection to ${primaryUri} failed (${primaryErr.message}). Testing fallback loopback...`);
    
    // If primary failed and was using localhost, retry with 127.0.0.1 (IPv4 loopback bypass)
    if (primaryUri.includes("localhost")) {
      try {
        await mongoose.connect(FALLBACK_IP_URI, options);
        console.log(`[MongoDB] Connected successfully via fallback 127.0.0.1 to database: ${mongoose.connection.name}`);
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
