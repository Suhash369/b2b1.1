import mongoose, { Schema, Document, Model } from "mongoose";

export interface IServiceEnquiry extends Document {
  id?: string;
  serviceName: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  companyName: string;
  message: string;
  status: "submitted" | "contacted" | "in_review" | "connected" | "resolved";
  createdAt: Date;
}

const ServiceEnquirySchema = new Schema<IServiceEnquiry>(
  {
    id: {
      type: String,
      index: true,
      sparse: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
    },
    userPhone: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
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
      enum: ["submitted", "contacted", "in_review", "connected", "resolved"],
      default: "submitted",
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "serviceenquiries",
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

export const ServiceEnquiry: Model<IServiceEnquiry> =
  mongoose.models.ServiceEnquiry ||
  mongoose.model<IServiceEnquiry>("ServiceEnquiry", ServiceEnquirySchema);
