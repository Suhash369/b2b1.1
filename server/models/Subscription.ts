import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubscription extends Document {
  id?: string;
  userId: mongoose.Types.ObjectId | number | string;
  planName: "basic" | "premium" | "elite";
  startDate: Date;
  endDate: Date;
  status: "active" | "cancelled" | "expired";
  features?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    id: {
      type: String,
      index: true,
      sparse: true,
    },
    userId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    planName: {
      type: String,
      enum: ["basic", "premium", "elite"],
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired"],
      default: "active",
      index: true,
    },
    features: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    collection: "subscriptions",
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret.id || ret._id?.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

SubscriptionSchema.index({ userId: 1, status: 1 });

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
