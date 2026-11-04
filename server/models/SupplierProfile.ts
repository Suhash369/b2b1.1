import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupplierProfile extends Document {
  userId: mongoose.Types.ObjectId;
  companyName?: string;
  companyType?: string;
  businessDescription?: string;
  country: string;
  state?: string;
  city?: string;
  address?: string;
  contactDetails?: {
    phone?: string;
    email?: string;
    representativeName?: string;
    website?: string;
  };
  productCategories: string[];
  verificationStatus: "pending" | "verified" | "rejected";
  verificationDocuments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SupplierProfileSchema = new Schema<ISupplierProfile>(
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
    companyType: {
      type: String,
      trim: true,
      default: "OEM Manufacturer & Supplier",
    },
    businessDescription: {
      type: String,
      trim: true,
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
    contactDetails: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      representativeName: { type: String, trim: true },
      website: { type: String, trim: true },
    },
    productCategories: {
      type: [String],
      default: [],
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    verificationDocuments: {
      type: [String],
      default: [],
    },
  },
  {
    collection: "supplierprofiles",
    timestamps: true,
  }
);

export const SupplierProfile: Model<ISupplierProfile> =
  mongoose.models.SupplierProfile ||
  mongoose.model<ISupplierProfile>("SupplierProfile", SupplierProfileSchema);
