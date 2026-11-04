import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBuyerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  companyName?: string;
  businessType?: string;
  country: string;
  state?: string;
  city?: string;
  address?: string;
  phone?: string;
  businessDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BuyerProfileSchema = new Schema<IBuyerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    businessType: {
      type: String,
      trim: true,
      default: "Commercial Procurement",
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    businessDescription: {
      type: String,
      trim: true,
    },
  },
  {
    collection: "buyerprofiles",
    timestamps: true,
  }
);

export const BuyerProfile: Model<IBuyerProfile> =
  mongoose.models.BuyerProfile ||
  mongoose.model<IBuyerProfile>("BuyerProfile", BuyerProfileSchema);
