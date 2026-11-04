import { AuditLog } from "../models/AuditLog";
import { isMongoConnected } from "../config/database";

export interface AuditParams {
  userId?: any;
  action: string;
  module: string;
  recordId?: string | null;
  metadata?: Record<string, any> | null;
}

export async function logAuditEvent(params: AuditParams): Promise<void> {
  try {
    if (!isMongoConnected()) return;

    // Sanitize metadata to never store passwords or sensitive secrets
    const sanitizedMetadata = params.metadata ? { ...params.metadata } : {};
    const sensitiveKeys = ["password", "passwordHash", "token", "jwt", "secret", "cvv", "creditCard"];
    for (const key of Object.keys(sanitizedMetadata)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        sanitizedMetadata[key] = "[REDACTED]";
      }
    }

    await AuditLog.create({
      userId: params.userId || null,
      action: params.action,
      module: params.module,
      recordId: params.recordId || null,
      timestamp: new Date(),
      metadata: Object.keys(sanitizedMetadata).length > 0 ? sanitizedMetadata : null,
    });
  } catch (err: any) {
    // Non-blocking: audit log errors should not crash user transactions
    console.warn(`[AuditLog] Failed to record event ${params.action}:`, err.message);
  }
}

