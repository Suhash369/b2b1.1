import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId | number | string | null;
  action: string;
  module: string;
  recordId?: string | null;
  timestamp: Date;
  metadata?: Record<string, any> | null;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.Mixed,
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    module: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    recordId: {
      type: String,
      default: null,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    collection: "auditlogs",
    timestamps: false,
  }
);

AuditLogSchema.index({ module: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

