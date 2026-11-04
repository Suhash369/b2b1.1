import mongoose, { Schema, Document, Model } from "mongoose";

export interface INetworkConnection extends Document {
  id?: string;
  requesterId?: mongoose.Types.ObjectId | number | string | null;
  requesterName: string;
  requesterCompany: string;
  targetCompany: string;
  leadType: string;
  message: string;
  status: "pending" | "connected" | "declined";
  createdAt: Date;
}

const NetworkConnectionSchema = new Schema<INetworkConnection>(
  {
    id: {
      type: String,
      index: true,
      sparse: true,
    },
    requesterId: {
      type: Schema.Types.Mixed,
      default: null,
      index: true,
    },
    requesterName: {
      type: String,
      required: true,
      trim: true,
    },
    requesterCompany: {
      type: String,
      required: true,
      trim: true,
    },
    targetCompany: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    leadType: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "connected", "declined"],
      default: "pending",
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "networkconnections",
    timestamps: false,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret.id || ret._id?.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const NetworkConnection: Model<INetworkConnection> =
  mongoose.models.NetworkConnection ||
  mongoose.model<INetworkConnection>("NetworkConnection", NetworkConnectionSchema);
