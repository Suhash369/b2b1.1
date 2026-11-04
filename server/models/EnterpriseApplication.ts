import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEnterpriseApplication extends Document {
  id?: string;
  enterpriseCategory: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  businessStage: string;
  employeeCount?: string | null;
  annualTurnover?: string | null;
  needs: string;
  status: "pending" | "reviewing" | "under_review" | "empanelled" | "approved" | "submitted" | "rejected";
  createdAt: Date;
}

const EnterpriseApplicationSchema = new Schema<IEnterpriseApplication>(
  {
    id: {
      type: String,
      index: true,
      sparse: true,
    },
    enterpriseCategory: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    businessStage: {
      type: String,
      required: true,
      trim: true,
    },
    employeeCount: {
      type: String,
      default: null,
    },
    annualTurnover: {
      type: String,
      default: null,
    },
    needs: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewing", "under_review", "empanelled", "approved", "submitted", "rejected"],
      default: "submitted",
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "enterpriseapplications",
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

export const EnterpriseApplication: Model<IEnterpriseApplication> =
  mongoose.models.EnterpriseApplication ||
  mongoose.model<IEnterpriseApplication>("EnterpriseApplication", EnterpriseApplicationSchema);
